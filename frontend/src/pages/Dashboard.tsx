import { useEffect, useState } from 'react';
import api from '../api/api';

type DashboardSummary = {
  organizations: { total: number; active: number; suspended: number };
  users: { total: number; active: number; inactive: number };
  devices: { total: number; active: number; retired: number };
  softwareInventory: { total: number; installed: number; removed: number };
  softwareUpdates: { total: number; outdated: number; upToDate: number };
  vulnerabilities: {
    total: number;
    open: number;
    inProgress: number;
    resolved: number;
  };
  remediationActions: {
    total: number;
    pending: number;
    inProgress: number;
    completed: number;
    cancelled: number;
  };
};

function Dashboard() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);

  useEffect(() => {
    const fetchSummary = async () => {
      const response = await api.get('/dashboard/summary');
      setSummary(response.data.summary);
    };

    fetchSummary();
  }, []);

  if (!summary) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        Loading dashboard...
      </div>
    );
  }

  const cards = [
    { title: 'Organizations', value: summary.organizations.total },
    { title: 'Users', value: summary.users.total },
    { title: 'Devices', value: summary.devices.total },
    { title: 'Software Records', value: summary.softwareInventory.total },
    { title: 'Outdated Software', value: summary.softwareUpdates.outdated },
    { title: 'Open Vulnerabilities', value: summary.vulnerabilities.open },
    { title: 'Pending Remediation', value: summary.remediationActions.pending },
    { title: 'Completed Remediation', value: summary.remediationActions.completed },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <header className="border-b border-slate-800 px-8 py-5">
        <h1 className="text-2xl font-bold">VulnGuard AI Dashboard</h1>
        <p className="text-slate-400 mt-1">
          Security overview and remediation status
        </p>
      </header>

      <main className="p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          {cards.map((card) => (
            <div
              key={card.title}
              className="bg-slate-900 border border-slate-800 rounded-xl p-6"
            >
              <p className="text-slate-400 text-sm">{card.title}</p>
              <h2 className="text-3xl font-bold mt-3">{card.value}</h2>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

export default Dashboard;