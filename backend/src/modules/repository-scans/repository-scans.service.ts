import {
  BadGatewayException,
  BadRequestException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ScanRepositoryDto } from './dto/scan-repository.dto';

type Provider = 'github' | 'gitlab';
type Dependency = { name: string; version: string; ecosystem: 'npm' | 'PyPI'; manifest: string };
type RepositoryTarget = { provider: Provider; project: string; repositoryUrl: string };

@Injectable()
export class RepositoryScansService {
  async scan(dto: ScanRepositoryDto) {
    const target = this.parseRepositoryUrl(dto.repositoryUrl);
    const metadata = await this.getRepositoryMetadata(target);
    const branch = dto.branch?.trim() || metadata.defaultBranch;
    const manifestPaths = await this.getManifestPaths(target, branch);
    if (manifestPaths.length === 0) {
      throw new NotFoundException(
        'No supported package-lock.json or requirements.txt manifest was found',
      );
    }

    const manifests = await Promise.all(
      manifestPaths.slice(0, 10).map(async (path) => ({
        path,
        content: await this.getRawFile(target, branch, path),
      })),
    );
    const dependencies = this.deduplicateDependencies(
      manifests.flatMap(({ path, content }) =>
        path.endsWith('package-lock.json')
          ? this.parsePackageLock(content, path)
          : this.parseRequirements(content, path),
      ),
    ).slice(0, 500);
    if (dependencies.length === 0) {
      throw new BadRequestException(
        'Supported manifests were found but contained no exact dependency versions',
      );
    }

    const findings = await this.queryOsv(dependencies);
    return {
      repository: {
        provider: target.provider,
        url: target.repositoryUrl,
        project: target.project,
        branch,
      },
      scannedAt: new Date().toISOString(),
      summary: {
        manifests: manifests.length,
        dependencies: dependencies.length,
        vulnerableDependencies: findings.length,
        vulnerabilities: findings.reduce(
          (total, finding) => total + finding.vulnerabilities.length,
          0,
        ),
      },
      manifests: manifests.map(({ path }) => path),
      findings,
      attribution:
        'Dependency vulnerability results are provided by the OSV.dev API and should be reviewed before remediation.',
    };
  }

  parseRepositoryUrl(repositoryUrl: string): RepositoryTarget {
    let url: URL;
    try {
      url = new URL(repositoryUrl);
    } catch {
      throw new BadRequestException('Repository URL is invalid');
    }
    if (url.protocol !== 'https:' || !['github.com', 'gitlab.com'].includes(url.hostname)) {
      throw new BadRequestException('Only HTTPS GitHub and GitLab repository URLs are supported');
    }
    const segments = url.pathname.split('/').filter(Boolean);
    if (segments.length < 2) throw new BadRequestException('Repository URL must include an owner and project');
    const projectSegments = url.hostname === 'github.com' ? segments.slice(0, 2) : segments;
    projectSegments[projectSegments.length - 1] = projectSegments.at(-1)!.replace(/\.git$/, '');
    if (projectSegments.some((segment) => !/^[\w.-]+$/.test(segment))) {
      throw new BadRequestException('Repository path contains unsupported characters');
    }
    return {
      provider: url.hostname === 'github.com' ? 'github' : 'gitlab',
      project: projectSegments.join('/'),
      repositoryUrl: `https://${url.hostname}/${projectSegments.join('/')}`,
    };
  }

  parsePackageLock(content: string, manifest: string): Dependency[] {
    let lock: { packages?: Record<string, { name?: string; version?: string }> };
    try {
      lock = JSON.parse(content) as typeof lock;
    } catch {
      throw new BadRequestException(`${manifest} contains invalid JSON`);
    }
    return Object.entries(lock.packages || {})
      .filter(([path, value]) => path.includes('node_modules/') && value.version)
      .map(([path, value]) => ({
        name: value.name || this.packageNameFromPath(path),
        version: value.version as string,
        ecosystem: 'npm' as const,
        manifest,
      }))
      .filter((item) => item.name && item.version);
  }

  parseRequirements(content: string, manifest: string): Dependency[] {
    return content
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith('#'))
      .map((line) => line.match(/^([A-Za-z0-9_.-]+)==([^\s;#]+)/))
      .filter((match): match is RegExpMatchArray => Boolean(match))
      .map((match) => ({
        name: match[1],
        version: match[2],
        ecosystem: 'PyPI' as const,
        manifest,
      }));
  }

  private async getRepositoryMetadata(target: RepositoryTarget) {
    const url = target.provider === 'github'
      ? `https://api.github.com/repos/${target.project}`
      : `https://gitlab.com/api/v4/projects/${encodeURIComponent(target.project)}`;
    const response = await this.externalFetch(url, this.providerHeaders(target.provider));
    if (response.status === 404) throw new NotFoundException('Repository was not found or is not publicly accessible');
    if (!response.ok) throw new BadGatewayException(`${target.provider} returned status ${response.status}`);
    const data = (await response.json()) as { default_branch?: string };
    return { defaultBranch: data.default_branch || 'main' };
  }

  private async getManifestPaths(target: RepositoryTarget, branch: string) {
    const url = target.provider === 'github'
      ? `https://api.github.com/repos/${target.project}/git/trees/${encodeURIComponent(branch)}?recursive=1`
      : `https://gitlab.com/api/v4/projects/${encodeURIComponent(target.project)}/repository/tree?ref=${encodeURIComponent(branch)}&recursive=true&per_page=100`;
    const response = await this.externalFetch(url, this.providerHeaders(target.provider));
    if (!response.ok) throw new BadGatewayException(`Unable to read repository tree (${response.status})`);
    const data = (await response.json()) as
      | { tree?: Array<{ path?: string; type?: string }> }
      | Array<{ path?: string; type?: string }>;
    const entries = Array.isArray(data) ? data : data.tree || [];
    return entries
      .filter((entry) => entry.type === 'blob' && this.isSupportedManifest(entry.path || ''))
      .map((entry) => entry.path as string);
  }

  private async getRawFile(target: RepositoryTarget, branch: string, path: string) {
    const url = target.provider === 'github'
      ? `https://api.github.com/repos/${target.project}/contents/${path.split('/').map(encodeURIComponent).join('/')}?ref=${encodeURIComponent(branch)}`
      : `https://gitlab.com/api/v4/projects/${encodeURIComponent(target.project)}/repository/files/${encodeURIComponent(path)}/raw?ref=${encodeURIComponent(branch)}`;
    const headers = this.providerHeaders(target.provider);
    if (target.provider === 'github') headers.Accept = 'application/vnd.github.raw+json';
    const response = await this.externalFetch(url, headers);
    if (!response.ok) throw new BadGatewayException(`Unable to read ${path}`);
    const content = await response.text();
    if (content.length > 5_000_000) throw new BadRequestException(`${path} exceeds the 5 MB scan limit`);
    return content;
  }

  private async queryOsv(dependencies: Dependency[]) {
    const response = await this.externalFetch('https://api.osv.dev/v1/querybatch', {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    }, {
      method: 'POST',
      body: JSON.stringify({
        queries: dependencies.map((dependency) => ({
          version: dependency.version,
          package: { name: dependency.name, ecosystem: dependency.ecosystem },
        })),
      }),
    });
    if (!response.ok) throw new BadGatewayException(`OSV API returned status ${response.status}`);
    const payload = (await response.json()) as {
      results?: Array<{ vulns?: Array<{ id: string; modified?: string }> }>;
    };
    return dependencies.flatMap((dependency, index) => {
      const vulnerabilities = payload.results?.[index]?.vulns || [];
      return vulnerabilities.length ? [{ ...dependency, vulnerabilities }] : [];
    });
  }

  private async externalFetch(url: string, headers: Record<string, string>, init: RequestInit = {}) {
    try {
      return await fetch(url, {
        ...init,
        headers: { ...headers, ...(init.headers || {}) },
        signal: AbortSignal.timeout(20_000),
      });
    } catch {
      throw new ServiceUnavailableException('External scanning service is temporarily unavailable');
    }
  }

  private providerHeaders(provider: Provider) {
    const headers: Record<string, string> = { Accept: 'application/json', 'User-Agent': 'VulnGuard-AI/1.0' };
    const token = provider === 'github' ? process.env.GITHUB_TOKEN : process.env.GITLAB_TOKEN;
    if (token) headers.Authorization = provider === 'github' ? `Bearer ${token}` : `Bearer ${token}`;
    if (provider === 'github') headers['X-GitHub-Api-Version'] = '2022-11-28';
    return headers;
  }

  private isSupportedManifest(path: string) {
    return path.endsWith('package-lock.json') || path.endsWith('requirements.txt');
  }

  private packageNameFromPath(path: string) {
    const parts = path.split('node_modules/').at(-1)?.split('/') || [];
    return parts[0]?.startsWith('@') ? `${parts[0]}/${parts[1] || ''}` : parts[0] || '';
  }

  private deduplicateDependencies(dependencies: Dependency[]) {
    return [...new Map(dependencies.map((item) => [`${item.ecosystem}:${item.name}:${item.version}`, item])).values()];
  }
}
