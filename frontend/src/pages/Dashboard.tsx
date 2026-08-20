import { useEffect, useState } from 'react';
import {
  Building2,
  Users,
  Monitor,
  Boxes,
  RefreshCcw,
  ShieldAlert,
  Wrench,
  Activity,
  AlertTriangle,
  CheckCircle2,
  Inbox,
  Clock,
} from 'lucide-react';
import api from '../api/api';

type Summary = {
  organizations?: number;
  users?: number;
  devices?: number;
  softwareInventory?: number;
  softwareUpdates?: number;
  vulnerabilities?: number;
  remediationActions?: number;
};

type DeviceActivity = {
  id: string;
  hostname: string;
  status?: string;
  createdAt?: string;
};

type SoftwareActivity = {
  id: string;
  softwareName: string;
  installedVersion?: string;
  status?: string;
  device?: {
    hostname?: string;
  };
  createdAt?: string;
};

type VulnerabilityActivity = {
  id: string;
  cveId?: string;
  title: string;
  status?: string;
  softwareInventory?: {
    softwareName?: string;
  };
  createdAt?: string;
};

type RemediationActivity = {
  id: string;
  actionTitle: string;
  status?: string;
  verificationStatus?: string;
  vulnerabilityFinding?: {
    cveId?: string;
    title?: string;
  };
  createdAt?: string;
};

type RecentActivity = {
  recentDevices?: DeviceActivity[];
  recentSoftware?: SoftwareActivity[];
  recentSoftwareInventory?: SoftwareActivity[];
  recentVulnerabilities?: VulnerabilityActivity[];
  recentRemediations?: RemediationActivity[];
  recentRemediationActions?: RemediationActivity[];
};

// ---- helpers -------------------------------------------------------------
function extractNumber(value: any): number {
  if (typeof value === 'number') return value;

  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isNaN(parsed) ? 0 : parsed;
  }

  if (Array.isArray(value)) return value.length;

  if (value && typeof value === 'object') {
    return (
      value.total ??
      value.count ??
      value.value ??
      value._count ??
      value.totalCount ??
      value.active ??
      0
    );
  }

  return 0;
}

function getSummaryCount(data: any, keys: string[]): number {
  for (const key of keys) {
    if (data?.[key] !== undefined && data?.[key] !== null) {
      return extractNumber(data[key]);
    }
  }

  return 0;
}

function timeAgo(dateString?: string) {
  if (!dateString) return '';
  const diffMs = Date.now() - new Date(dateString).getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

type Tone = 'indigo' | 'sky' | 'blue' | 'violet' | 'cyan' | 'rose' | 'amber';

const toneClasses: Record<Tone, { icon: string; bg: string; ring: string; bar: string }> = {
  indigo: { icon: 'text-indigo-400', bg: 'bg-indigo-500/10', ring: 'ring-indigo-500/20', bar: 'bg-indigo-500' },
  sky: { icon: 'text-sky-400', bg: 'bg-sky-500/10', ring: 'ring-sky-500/20', bar: 'bg-sky-500' },
  blue: { icon: 'text-blue-400', bg: 'bg-blue-500/10', ring: 'ring-blue-500/20', bar: 'bg-blue-500' },
  violet: { icon: 'text-violet-400', bg: 'bg-violet-500/10', ring: 'ring-violet-500/20', bar: 'bg-violet-500' },
  cyan: { icon: 'text-cyan-400', bg: 'bg-cyan-500/10', ring: 'ring-cyan-500/20', bar: 'bg-cyan-500' },
  rose: { icon: 'text-rose-400', bg: 'bg-rose-500/10', ring: 'ring-rose-500/20', bar: 'bg-rose-500' },
  amber: { icon: 'text-amber-400', bg: 'bg-amber-500/10', ring: 'ring-amber-500/20', bar: 'bg-amber-500' },
};

function StatusDot({ tone }: { tone: 'green' | 'red' | 'yellow' | 'slate' }) {
  const map = {
    green: 'bg-emerald-400 shadow-[0_0_6px_1px_rgba(52,211,153,0.6)]',
    red: 'bg-rose-400 shadow-[0_0_6px_1px_rgba(251,113,133,0.6)]',
    yellow: 'bg-amber-400 shadow-[0_0_6px_1px_rgba(251,191,36,0.6)]',
    slate: 'bg-slate-500',
  };
  return <span className={`inline-block h-1.5 w-1.5 rounded-full ${map[tone]}`} />;
}

function vulnTone(status?: string): 'green' | 'red' {
  return status === 'RESOLVED' ? 'green' : 'red';
}

function remediationTone(status?: string): 'green' | 'red' | 'yellow' | 'slate' {
  if (status === 'COMPLETED') return 'green';
  if (status === 'IN_PROGRESS') return 'yellow';
  if (status === 'PENDING' || !status) return 'slate';
  return 'red';
}

function EmptyRow({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
      <div className="rounded-full bg-slate-900 border border-slate-800 p-3">
        <Inbox className="h-5 w-5 text-slate-600" />
      </div>
      <p className="text-sm text-slate-500">{label}</p>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 animate-pulse">
      <div className="h-3 w-20 bg-slate-800 rounded" />
      <div className="h-7 w-14 bg-slate-800 rounded mt-3" />
      <div className="h-2 w-28 bg-slate-800 rounded mt-4" />
    </div>
  );
}

// ---- component ------------------------------------------------------------

function Dashboard() {
  const [summary, setSummary] = useState<Summary>({});
  const [recentActivity, setRecentActivity] = useState<RecentActivity>({});
  const [loading, setLoading] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);
  const [error, setError] = useState('');
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError('');
  
      const [summaryResponse, recentActivityResponse] = await Promise.all([
        api.get('/dashboard/summary'),
        api.get('/dashboard/recent-activity'),
      ]);
  
      console.log('Dashboard summary response:', summaryResponse.data);
      console.log('Dashboard recent activity response:', recentActivityResponse.data);
  
      const data =
        summaryResponse.data?.summary ||
        summaryResponse.data?.data ||
        summaryResponse.data;
        setSummary({
          organizations: getSummaryCount(data, [
            'organizations',
            'totalOrganizations',
            'organizationCount',
          ]),
        
          users: getSummaryCount(data, [
            'users',
            'totalUsers',
            'userCount',
          ]),
        
          devices: getSummaryCount(data, [
            'devices',
            'totalDevices',
            'deviceCount',
          ]),
        
          softwareInventory: getSummaryCount(data, [
            'softwareInventory',
            'softwareRecords',
            'totalSoftwareInventory',
            'totalSoftwareRecords',
            'softwareInventoryCount',
          ]),
        
          softwareUpdates: getSummaryCount(data, [
            'softwareUpdates',
            'updateFindings',
            'softwareUpdateFindings',
            'totalSoftwareUpdates',
            'totalSoftwareUpdateFindings',
            'updateFindingsCount',
          ]),
        
          vulnerabilities: getSummaryCount(data, [
            'vulnerabilities',
            'vulnerabilityFindings',
            'totalVulnerabilities',
            'totalVulnerabilityFindings',
            'vulnerabilityFindingsCount',
          ]),
        
          remediationActions: getSummaryCount(data, [
            'remediationActions',
            'totalRemediationActions',
            'remediationActionCount',
          ]),
        });
  
      const recentData =
        recentActivityResponse.data?.recentActivity ||
        recentActivityResponse.data?.data ||
        recentActivityResponse.data;
  
      setRecentActivity(recentData);
      setLastUpdated(new Date());
    } catch (err: any) {
      console.error('Dashboard error:', err.response?.data || err);
      setError(
        err.response?.data?.message ||
          'Failed to load dashboard data. Try refreshing.',
      );
    } finally {
      setLoading(false);
      setInitialLoad(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const softwareList =
    recentActivity.recentSoftware ||
    recentActivity.recentSoftwareInventory ||
    [];

  const remediationList =
    recentActivity.recentRemediations ||
    recentActivity.recentRemediationActions ||
    [];

  const cards: { title: string; value: number; icon: typeof Building2; description: string; tone: Tone }[] = [
    {
      title: 'Organizations',
      value: summary.organizations ?? 0,
      icon: Building2,
      description: 'Registered organizations',
      tone: 'indigo',
    },
    {
      title: 'Users',
      value: summary.users ?? 0,
      icon: Users,
      description: 'System users',
      tone: 'sky',
    },
    {
      title: 'Devices',
      value: summary.devices ?? 0,
      icon: Monitor,
      description: 'Tracked assets',
      tone: 'blue',
    },
    {
      title: 'Software Records',
      value: summary.softwareInventory ?? 0,
      icon: Boxes,
      description: 'Installed software',
      tone: 'violet',
    },
    {
      title: 'Update Findings',
      value: summary.softwareUpdates ?? 0,
      icon: RefreshCcw,
      description: 'Version checks',
      tone: 'cyan',
    },
    {
      title: 'Vulnerabilities',
      value: summary.vulnerabilities ?? 0,
      icon: ShieldAlert,
      description: 'Security findings',
      tone: 'rose',
    },
    {
      title: 'Remediation Actions',
      value: summary.remediationActions ?? 0,
      icon: Wrench,
      description: 'Fixing tasks',
      tone: 'amber',
    },
  ];

  const totalAssets = (summary.devices ?? 0) + (summary.softwareInventory ?? 0);
  const securityWorkload = (summary.vulnerabilities ?? 0) + (summary.remediationActions ?? 0);
  const openVulnRatio = summary.vulnerabilities
    ? Math.round(((summary.remediationActions ?? 0) / (summary.vulnerabilities || 1)) * 100)
    : 0;

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          <div className="rounded-xl bg-cyan-500/10 ring-1 ring-cyan-500/20 p-3 hidden sm:flex">
            <Activity className="h-6 w-6 text-cyan-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-slate-400 mt-1 text-sm">
              Overview of assets, vulnerabilities, updates, and remediation tasks.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {lastUpdated && !loading && (
            <span className="hidden sm:flex items-center gap-1.5 text-xs text-slate-500">
              <Clock className="h-3.5 w-3.5" />
              Updated {timeAgo(lastUpdated.toISOString())}
            </span>
          )}
          <button
            onClick={fetchDashboardData}
            disabled={loading}
            className="inline-flex items-center gap-2 bg-cyan-500 hover:bg-cyan-400 active:bg-cyan-500 text-slate-950 font-semibold px-5 py-2.5 rounded-lg transition disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <RefreshCcw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Refreshing…' : 'Refresh'}
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 flex items-center gap-3 bg-red-950/60 border border-red-800/60 text-red-300 rounded-xl p-4 text-sm">
          <AlertTriangle className="h-4 w-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5 mb-6">
        {initialLoad
          ? Array.from({ length: 7 }).map((_, i) => <SkeletonCard key={i} />)
          : cards.map((card) => {
              const Icon = card.icon;
              const tone = toneClasses[card.tone];

              return (
                <div
                  key={card.title}
                  className="group relative overflow-hidden bg-slate-900 border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition"
                >
                  <span className={`absolute inset-x-0 top-0 h-0.5 ${tone.bar} opacity-70`} />
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-slate-400">{card.title}</p>
                      <h2 className="text-3xl font-bold mt-2 tabular-nums tracking-tight">
                        {card.value.toLocaleString()}
                      </h2>
                    </div>

                    <div className={`rounded-xl p-3 ring-1 ${tone.bg} ${tone.ring}`}>
                      <Icon className={`h-6 w-6 ${tone.icon}`} />
                    </div>
                  </div>

                  <p className="text-xs text-slate-500 mt-4">{card.description}</p>
                </div>
              );
            })}
      </div>

      {/* Insight cards */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-6">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="rounded-lg bg-cyan-500/10 ring-1 ring-cyan-500/20 p-2">
              <Activity className="h-5 w-5 text-cyan-400" />
            </div>
            <h2 className="text-base font-semibold text-slate-200">Asset Coverage</h2>
          </div>

          <p className="text-4xl font-bold tabular-nums">{totalAssets.toLocaleString()}</p>
          <p className="text-slate-400 text-sm mt-2 leading-relaxed">
            Total devices and software records currently tracked in the system.
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="rounded-lg bg-amber-500/10 ring-1 ring-amber-500/20 p-2">
              <AlertTriangle className="h-5 w-5 text-amber-400" />
            </div>
            <h2 className="text-base font-semibold text-slate-200">Security Workload</h2>
          </div>

          <p className="text-4xl font-bold tabular-nums">{securityWorkload.toLocaleString()}</p>
          <p className="text-slate-400 text-sm mt-2 leading-relaxed">
            Vulnerability findings and remediation actions needing security attention.
          </p>
          {summary.vulnerabilities ? (
            <div className="mt-4">
              <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-400 rounded-full transition-all"
                  style={{ width: `${Math.min(openVulnRatio, 100)}%` }}
                />
              </div>
              <p className="text-[11px] text-slate-500 mt-1.5">
                {openVulnRatio}% of vulnerabilities have a remediation action in flight
              </p>
            </div>
          ) : null}
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="rounded-lg bg-emerald-500/10 ring-1 ring-emerald-500/20 p-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-400" />
            </div>
            <h2 className="text-base font-semibold text-slate-200">Workflow Status</h2>
          </div>

          <p className="text-4xl font-bold flex items-center gap-2">
            <StatusDot tone="green" />
            Active
          </p>
          <p className="text-slate-400 text-sm mt-2 leading-relaxed">
            Organization → Device → Software → Vulnerability → Remediation flow is connected.
          </p>
        </div>
      </div>

      {/* Activity lists */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-slate-200">Recent Devices</h2>
            <Monitor className="h-4 w-4 text-slate-600" />
          </div>

          <div className="space-y-2.5">
            {(recentActivity.recentDevices || []).map((device) => (
              <div
                key={device.id}
                className="bg-slate-950 border border-slate-800 rounded-lg p-4 hover:border-slate-700 transition"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium font-mono text-sm truncate">{device.hostname}</p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Device asset record{device.createdAt ? ` · ${timeAgo(device.createdAt)}` : ''}
                    </p>
                  </div>

                  <span className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-slate-300 bg-slate-800/80 border border-slate-700 px-2.5 py-1 rounded-full flex-shrink-0">
                    <StatusDot tone="green" />
                    {device.status || 'ACTIVE'}
                  </span>
                </div>
              </div>
            ))}

            {(recentActivity.recentDevices || []).length === 0 && (
              <EmptyRow label="No recent devices found." />
            )}
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-slate-200">Recent Software</h2>
            <Boxes className="h-4 w-4 text-slate-600" />
          </div>

          <div className="space-y-2.5">
            {softwareList.map((software) => (
              <div
                key={software.id}
                className="bg-slate-950 border border-slate-800 rounded-lg p-4 hover:border-slate-700 transition"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium text-sm truncate">{software.softwareName}</p>
                    <p className="text-xs text-slate-500 mt-0.5 font-mono truncate">
                      {software.installedVersion || 'No version'}
                      {software.device?.hostname ? ` · ${software.device.hostname}` : ''}
                    </p>
                  </div>

                  <span className="text-[11px] font-medium uppercase tracking-wide text-slate-300 bg-slate-800/80 border border-slate-700 px-2.5 py-1 rounded-full flex-shrink-0">
                    {software.status || 'INSTALLED'}
                  </span>
                </div>
              </div>
            ))}

            {softwareList.length === 0 && <EmptyRow label="No recent software records found." />}
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-slate-200">Recent Vulnerabilities</h2>
            <ShieldAlert className="h-4 w-4 text-slate-600" />
          </div>

          <div className="space-y-2.5">
            {(recentActivity.recentVulnerabilities || []).map((vulnerability) => (
              <div
                key={vulnerability.id}
                className="bg-slate-950 border border-slate-800 rounded-lg p-4 hover:border-slate-700 transition"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium text-sm truncate">
                      <span className="font-mono text-slate-300">
                        {vulnerability.cveId || 'No CVE'}
                      </span>{' '}
                      — {vulnerability.title}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5 truncate">
                      {vulnerability.softwareInventory?.softwareName || 'Software not available'}
                    </p>
                  </div>

                  <span
                    className={`flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide px-2.5 py-1 rounded-full border flex-shrink-0 ${
                      vulnerability.status === 'RESOLVED'
                        ? 'bg-emerald-950/60 text-emerald-400 border-emerald-800/60'
                        : 'bg-rose-950/60 text-rose-400 border-rose-800/60'
                    }`}
                  >
                    <StatusDot tone={vulnTone(vulnerability.status)} />
                    {vulnerability.status || 'OPEN'}
                  </span>
                </div>
              </div>
            ))}

            {(recentActivity.recentVulnerabilities || []).length === 0 && (
              <EmptyRow label="No recent vulnerabilities found." />
            )}
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-slate-200">Recent Remediation Actions</h2>
            <Wrench className="h-4 w-4 text-slate-600" />
          </div>

          <div className="space-y-2.5">
            {remediationList.map((action) => (
              <div
                key={action.id}
                className="bg-slate-950 border border-slate-800 rounded-lg p-4 hover:border-slate-700 transition"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium text-sm truncate">{action.actionTitle}</p>
                    <p className="text-xs text-slate-500 mt-0.5 font-mono truncate">
                      {action.vulnerabilityFinding?.cveId ||
                        action.vulnerabilityFinding?.title ||
                        'Vulnerability not available'}
                    </p>
                  </div>

                  <span
                    className={`flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide px-2.5 py-1 rounded-full border flex-shrink-0 ${
                      action.status === 'COMPLETED'
                        ? 'bg-emerald-950/60 text-emerald-400 border-emerald-800/60'
                        : action.status === 'IN_PROGRESS'
                          ? 'bg-amber-950/60 text-amber-400 border-amber-800/60'
                          : 'bg-slate-800/80 text-slate-300 border-slate-700'
                    }`}
                  >
                    <StatusDot tone={remediationTone(action.status)} />
                    {action.status || 'PENDING'}
                  </span>
                </div>
              </div>
            ))}

            {remediationList.length === 0 && (
              <EmptyRow label="No recent remediation actions found." />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;