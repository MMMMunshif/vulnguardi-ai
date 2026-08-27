import { useEffect, useMemo, useState } from 'react';
import { ClipboardList, Download, RefreshCw, Search } from 'lucide-react';
import api from '../api/api';
import { downloadCsv } from '../utils/csv';

type AuditLog = {
  id: string;
  action: string;
  resource: string;
  resourceId?: string;
  method: string;
  path: string;
  statusCode: number;
  actorEmail: string;
  message?: string;
  createdAt: string;
  organization: { id: string; name: string };
};

function AuditLogs() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [search, setSearch] = useState('');
  const [action, setAction] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadLogs = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await api.get<{ logs: AuditLog[] }>('/audit-logs?limit=500');
      setLogs(response.data.logs);
    } catch (requestError: any) {
      setError(requestError.response?.data?.message || 'Unable to load audit logs.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = window.setTimeout(() => void loadLogs(), 0);
    return () => window.clearTimeout(timer);
  }, []);

  const filteredLogs = useMemo(() => {
    const query = search.trim().toLowerCase();
    return logs.filter((log) => {
      const matchesAction = action === 'ALL' || log.action === action;
      const matchesSearch =
        !query ||
        [log.actorEmail, log.resource, log.resourceId, log.message, log.organization.name]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(query));
      return matchesAction && matchesSearch;
    });
  }, [action, logs, search]);

  const exportLogs = () => {
    downloadCsv('vulnguard-audit-logs.csv', [
      ['Time', 'Organization', 'Actor', 'Action', 'Resource', 'Resource ID', 'Status', 'Message'],
      ...filteredLogs.map((log) => [
        new Date(log.createdAt).toISOString(),
        log.organization.name,
        log.actorEmail,
        log.action,
        log.resource,
        log.resourceId || '',
        log.statusCode,
        log.message || '',
      ]),
    ]);
  };

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-3 text-2xl font-bold">
            <ClipboardList className="text-cyan-400" /> Audit Logs
          </h1>
          <p className="mt-2 text-slate-400">Review security-sensitive user and system activity.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={exportLogs} disabled={!filteredLogs.length} className="inline-flex items-center gap-2 rounded-lg border border-cyan-800 bg-cyan-950 px-4 py-2 text-sm font-semibold text-cyan-300 disabled:opacity-50">
            <Download size={16} /> Export CSV
          </button>
          <button onClick={() => void loadLogs()} className="inline-flex items-center gap-2 rounded-lg bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950">
            <RefreshCw size={16} /> Refresh
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
        <div className="mb-5 grid gap-3 sm:grid-cols-3">
          <label className="relative sm:col-span-2">
            <Search className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search actor, organization, resource, or message" className="w-full rounded-lg border border-slate-700 bg-slate-950 py-2.5 pl-10 pr-3 text-sm outline-none focus:border-cyan-500" />
          </label>
          <select value={action} onChange={(event) => setAction(event.target.value)} className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm outline-none focus:border-cyan-500">
            <option value="ALL">All actions</option>
            <option value="LOGIN">LOGIN</option>
            <option value="CREATE">CREATE</option>
            <option value="UPDATE">UPDATE</option>
            <option value="DELETE">DELETE</option>
          </select>
        </div>

        {error && <p className="mb-4 rounded-lg border border-red-800 bg-red-950 p-3 text-sm text-red-300">{error}</p>}

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-700 text-slate-400">
              <tr><th className="py-3 pr-4">Time</th><th className="py-3 pr-4">Actor</th><th className="py-3 pr-4">Action</th><th className="py-3 pr-4">Resource</th><th className="py-3 pr-4">Organization</th><th className="py-3">Result</th></tr>
            </thead>
            <tbody>
              {filteredLogs.map((log) => (
                <tr key={log.id} className="border-b border-slate-800">
                  <td className="whitespace-nowrap py-4 pr-4 text-slate-400">{new Date(log.createdAt).toLocaleString()}</td>
                  <td className="py-4 pr-4">{log.actorEmail}</td>
                  <td className="py-4 pr-4"><span className="rounded-full border border-violet-800 bg-violet-950 px-2 py-1 text-xs text-violet-300">{log.action}</span></td>
                  <td className="py-4 pr-4"><p className="font-medium">{log.resource}</p><p className="max-w-xs truncate text-xs text-slate-500">{log.resourceId || log.path}</p></td>
                  <td className="py-4 pr-4">{log.organization.name}</td>
                  <td className="py-4"><span className="text-green-400">{log.statusCode}</span><p className="max-w-xs truncate text-xs text-slate-500">{log.message || '-'}</p></td>
                </tr>
              ))}
            </tbody>
          </table>
          {!loading && !filteredLogs.length && <p className="py-8 text-center text-slate-400">No audit events match these filters.</p>}
          {loading && <p className="py-8 text-center text-slate-400">Loading audit logs...</p>}
        </div>
      </div>
    </div>
  );
}

export default AuditLogs;
