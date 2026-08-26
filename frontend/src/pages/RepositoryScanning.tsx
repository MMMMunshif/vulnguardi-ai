import { useState } from 'react';
import { AlertTriangle, CheckCircle2, Download, GitBranch, Loader2, Search } from 'lucide-react';
import api from '../api/api';
import { downloadCsv } from '../utils/csv';

type ScanFinding = {
  name: string;
  version: string;
  ecosystem: 'npm' | 'PyPI';
  manifest: string;
  vulnerabilities: Array<{ id: string; modified?: string }>;
};

type ScanResult = {
  repository: { provider: 'github' | 'gitlab'; url: string; project: string; branch: string };
  scannedAt: string;
  summary: {
    manifests: number;
    dependencies: number;
    vulnerableDependencies: number;
    vulnerabilities: number;
  };
  manifests: string[];
  findings: ScanFinding[];
  attribution: string;
};

function RepositoryScanning() {
  const [repositoryUrl, setRepositoryUrl] = useState('');
  const [branch, setBranch] = useState('');
  const [result, setResult] = useState<ScanResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const scanRepository = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      setLoading(true);
      setError('');
      setResult(null);
      const response = await api.post<ScanResult>('/repository-scans', {
        repositoryUrl: repositoryUrl.trim(),
        branch: branch.trim() || undefined,
      });
      setResult(response.data);
    } catch (scanError: any) {
      setError(
        scanError.response?.data?.message ||
          'Repository scan failed. Confirm that the repository is public and contains a supported lock file.',
      );
    } finally {
      setLoading(false);
    }
  };

  const exportFindings = () => {
    if (!result) return;
    downloadCsv(`repository-scan-${result.repository.project.replaceAll('/', '-')}.csv`, [
      ['Repository', 'Branch', 'Manifest', 'Ecosystem', 'Package', 'Version', 'Vulnerability ID', 'Modified'],
      ...result.findings.flatMap((finding) =>
        finding.vulnerabilities.map((vulnerability) => [
          result.repository.url,
          result.repository.branch,
          finding.manifest,
          finding.ecosystem,
          finding.name,
          finding.version,
          vulnerability.id,
          vulnerability.modified || '',
        ]),
      ),
    ]);
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="flex items-center gap-3 text-2xl font-bold">
          <GitBranch className="h-6 w-6 text-cyan-400" />
          Repository & Dependency Scanning
        </h1>
        <p className="mt-1 text-sm text-slate-400">
          Scan public GitHub or GitLab dependency manifests against OSV.dev.
        </p>
      </div>

      <form onSubmit={scanRepository} className="mb-6 rounded-xl border border-slate-800 bg-slate-900 p-6">
        <div className="grid gap-4 lg:grid-cols-[1fr_220px_auto] lg:items-end">
          <div>
            <label className="mb-2 block text-sm text-slate-300">Repository URL</label>
            <input
              type="url"
              required
              value={repositoryUrl}
              onChange={(event) => setRepositoryUrl(event.target.value)}
              placeholder="https://github.com/owner/repository"
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-cyan-500"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm text-slate-300">Branch (optional)</label>
            <input
              value={branch}
              onChange={(event) => setBranch(event.target.value)}
              placeholder="Default branch"
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-cyan-500"
            />
          </div>
          <button
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-cyan-500 px-5 py-3 font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:opacity-60"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            {loading ? 'Scanning...' : 'Scan Repository'}
          </button>
        </div>
        <p className="mt-3 text-xs text-slate-500">
          Supported manifests: nested package-lock.json and pinned requirements.txt (up to 10 manifests / 500 dependencies).
        </p>
      </form>

      {error && (
        <div className="mb-6 flex gap-3 rounded-xl border border-red-800 bg-red-950/50 p-4 text-sm text-red-300">
          <AlertTriangle className="h-5 w-5 shrink-0" /> {error}
        </div>
      )}

      {result && (
        <div className="space-y-6">
          <section className="rounded-xl border border-slate-800 bg-slate-900 p-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-cyan-400">
                  {result.repository.provider} · {result.repository.branch}
                </p>
                <a href={result.repository.url} target="_blank" rel="noreferrer" className="mt-1 block text-lg font-semibold hover:text-cyan-300">
                  {result.repository.project}
                </a>
                <p className="mt-1 text-xs text-slate-500">Scanned {new Date(result.scannedAt).toLocaleString()}</p>
              </div>
              <button onClick={exportFindings} disabled={!result.findings.length} className="inline-flex items-center gap-2 rounded-lg border border-slate-700 px-4 py-2 text-sm font-semibold hover:border-cyan-700 hover:text-cyan-300 disabled:opacity-40">
                <Download className="h-4 w-4" /> Export CSV
              </button>
            </div>
            <div className="mt-5 grid grid-cols-2 gap-4 lg:grid-cols-4">
              {[
                ['Manifests', result.summary.manifests],
                ['Dependencies', result.summary.dependencies],
                ['Vulnerable Packages', result.summary.vulnerableDependencies],
                ['Vulnerabilities', result.summary.vulnerabilities],
              ].map(([label, value]) => (
                <div key={label} className="rounded-lg border border-slate-800 bg-slate-950 p-4">
                  <p className="text-xs text-slate-500">{label}</p>
                  <p className="mt-1 text-2xl font-bold">{value}</p>
                </div>
              ))}
            </div>
          </section>

          {result.findings.length === 0 ? (
            <div className="flex items-center gap-3 rounded-xl border border-emerald-800 bg-emerald-950/30 p-5 text-emerald-300">
              <CheckCircle2 className="h-6 w-6" /> No known vulnerabilities were returned for the exact dependency versions scanned.
            </div>
          ) : (
            <section className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900">
              <div className="border-b border-slate-800 px-5 py-4">
                <h2 className="font-semibold">Dependency Findings</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="bg-slate-950 text-xs uppercase text-slate-500">
                    <tr>
                      <th className="px-5 py-3">Package</th><th className="px-5 py-3">Version</th><th className="px-5 py-3">Manifest</th><th className="px-5 py-3">Advisories</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {result.findings.map((finding) => (
                      <tr key={`${finding.ecosystem}:${finding.name}:${finding.version}`}>
                        <td className="px-5 py-4"><p className="font-semibold">{finding.name}</p><p className="text-xs text-slate-500">{finding.ecosystem}</p></td>
                        <td className="px-5 py-4 font-mono text-xs">{finding.version}</td>
                        <td className="px-5 py-4 text-xs text-slate-400">{finding.manifest}</td>
                        <td className="px-5 py-4"><div className="flex flex-wrap gap-2">{finding.vulnerabilities.map((vulnerability) => (
                          <a key={vulnerability.id} href={`https://osv.dev/vulnerability/${encodeURIComponent(vulnerability.id)}`} target="_blank" rel="noreferrer" className="rounded border border-red-800 bg-red-950 px-2 py-1 text-xs font-semibold text-red-300 hover:bg-red-900">{vulnerability.id}</a>
                        ))}</div></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}
          <p className="text-xs text-slate-500">{result.attribution}</p>
        </div>
      )}
    </div>
  );
}

export default RepositoryScanning;
