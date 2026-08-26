import { BadRequestException, NotFoundException } from '@nestjs/common';
import { RepositoryScansService } from './repository-scans.service';

describe('RepositoryScansService', () => {
  const service = new RepositoryScansService();
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  it('allows only well-formed GitHub and GitLab HTTPS URLs', () => {
    expect(service.parseRepositoryUrl('https://github.com/openai/example.git')).toEqual({
      provider: 'github',
      project: 'openai/example',
      repositoryUrl: 'https://github.com/openai/example',
    });
    expect(service.parseRepositoryUrl('https://gitlab.com/group/team/project')).toMatchObject({
      provider: 'gitlab',
      project: 'group/team/project',
    });
    expect(() => service.parseRepositoryUrl('http://github.com/a/b')).toThrow(
      BadRequestException,
    );
    expect(() => service.parseRepositoryUrl('https://example.com/a/b')).toThrow(
      BadRequestException,
    );
  });

  it('parses exact npm and Python dependency versions', () => {
    expect(
      service.parsePackageLock(
        JSON.stringify({
          packages: {
            '': { name: 'app', version: '1.0.0' },
            'node_modules/axios': { version: '1.0.0' },
            'node_modules/@scope/tool': { version: '2.0.0' },
          },
        }),
        'package-lock.json',
      ),
    ).toEqual([
      { name: 'axios', version: '1.0.0', ecosystem: 'npm', manifest: 'package-lock.json' },
      { name: '@scope/tool', version: '2.0.0', ecosystem: 'npm', manifest: 'package-lock.json' },
    ]);
    expect(
      service.parseRequirements(
        '# comment\nDjango==4.2.1\nrequests>=2\nflask==3.0.0; python_version>="3.9"',
        'requirements.txt',
      ),
    ).toEqual([
      { name: 'Django', version: '4.2.1', ecosystem: 'PyPI', manifest: 'requirements.txt' },
      { name: 'flask', version: '3.0.0', ecosystem: 'PyPI', manifest: 'requirements.txt' },
    ]);
    expect(() => service.parsePackageLock('{bad', 'package-lock.json')).toThrow(
      BadRequestException,
    );
  });

  it('scans nested GitHub manifests and maps OSV results', async () => {
    global.fetch = jest.fn(async (input: string | URL | Request) => {
      const url = String(input);
      if (url === 'https://api.github.com/repos/acme/app') {
        return new Response(JSON.stringify({ default_branch: 'main' }), { status: 200 });
      }
      if (url.includes('/git/trees/main')) {
        return new Response(
          JSON.stringify({
            tree: [
              { type: 'blob', path: 'frontend/package-lock.json' },
              { type: 'blob', path: 'README.md' },
            ],
          }),
          { status: 200 },
        );
      }
      if (url.includes('/contents/frontend/package-lock.json')) {
        return new Response(
          JSON.stringify({
            packages: { 'node_modules/example': { version: '1.0.0' } },
          }),
          { status: 200 },
        );
      }
      if (url === 'https://api.osv.dev/v1/querybatch') {
        return new Response(
          JSON.stringify({
            results: [{ vulns: [{ id: 'GHSA-test-1234', modified: '2026-01-01' }] }],
          }),
          { status: 200 },
        );
      }
      return new Response('', { status: 404 });
    }) as jest.Mock;

    await expect(
      service.scan({ repositoryUrl: 'https://github.com/acme/app' }),
    ).resolves.toMatchObject({
      repository: { provider: 'github', branch: 'main' },
      summary: { manifests: 1, dependencies: 1, vulnerableDependencies: 1, vulnerabilities: 1 },
      findings: [
        {
          name: 'example',
          version: '1.0.0',
          vulnerabilities: [{ id: 'GHSA-test-1234' }],
        },
      ],
    });
  });

  it('reports repositories without supported manifests', async () => {
    global.fetch = jest
      .fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ default_branch: 'main' }), { status: 200 }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ tree: [{ type: 'blob', path: 'README.md' }] }), {
          status: 200,
        }),
      );

    await expect(
      service.scan({ repositoryUrl: 'https://github.com/acme/empty' }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
