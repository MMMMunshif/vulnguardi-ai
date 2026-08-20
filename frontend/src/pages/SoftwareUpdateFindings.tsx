import { useEffect, useState } from 'react';
import api from '../api/api';

type SoftwareRecord = {
  id: string;
  softwareName: string;
  publisher?: string;
  installedVersion?: string;
  status: string;
  device: {
    id: string;
    hostname: string;
  };
  organization: {
    id: string;
    name: string;
  };
};

type SoftwareUpdateFinding = {
  id: string;
  installedVersion?: string;
  latestVersion?: string;
  updateAvailable: boolean;
  status: 'UP_TO_DATE' | 'OUTDATED' | 'UNKNOWN';
  source: 'MANUAL' | 'WINGET' | 'SYSTEM_SCAN' | 'IMPORTED';
  checkedAt: string;
  notes?: string;
  softwareInventory: {
    id: string;
    softwareName: string;
    publisher?: string;
    installedVersion?: string;
    status: string;
  };
  device: {
    id: string;
    hostname: string;
    ipAddress?: string;
    osName?: string;
    osVersion?: string;
  };
  organization: {
    id: string;
    name: string;
  };
};

type UpdateFindingForm = {
  installedVersion: string;
  latestVersion: string;
  updateAvailable: boolean;
  status: 'UP_TO_DATE' | 'OUTDATED' | 'UNKNOWN';
  source: 'MANUAL' | 'WINGET' | 'SYSTEM_SCAN' | 'IMPORTED';
  notes: string;
  softwareInventoryId: string;
};

const emptyForm: UpdateFindingForm = {
  installedVersion: '',
  latestVersion: '',
  updateAvailable: true,
  status: 'OUTDATED',
  source: 'MANUAL',
  notes: '',
  softwareInventoryId: '',
};

function SoftwareUpdateFindings() {
  const [findings, setFindings] = useState<SoftwareUpdateFinding[]>([]);
  const [softwareInventory, setSoftwareInventory] = useState<SoftwareRecord[]>(
    [],
  );
  const [form, setForm] = useState<UpdateFindingForm>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const fetchFindings = async () => {
    try {
      setLoading(true);
      const response = await api.get('/software-update-findings');
      setFindings(response.data.findings);
    } catch {
      setError('Failed to fetch software update findings');
    } finally {
      setLoading(false);
    }
  };

  const fetchSoftwareInventory = async () => {
    try {
      const response = await api.get('/software-inventory');
      setSoftwareInventory(response.data.softwareInventory);

      if (response.data.softwareInventory.length > 0) {
        const firstSoftware = response.data.softwareInventory[0];

        setForm((previous) => ({
          ...previous,
          softwareInventoryId:
            previous.softwareInventoryId || firstSoftware.id,
          installedVersion:
            previous.installedVersion || firstSoftware.installedVersion || '',
        }));
      }
    } catch {
      setError('Failed to fetch software inventory');
    }
  };

  useEffect(() => {
    fetchFindings();
    fetchSoftwareInventory();
  }, []);

  const handleChange = (
    field: keyof UpdateFindingForm,
    value: string | boolean,
  ) => {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  const handleSoftwareChange = (softwareInventoryId: string) => {
    const selectedSoftware = softwareInventory.find(
      (software) => software.id === softwareInventoryId,
    );

    setForm((previous) => ({
      ...previous,
      softwareInventoryId,
      installedVersion: selectedSoftware?.installedVersion || '',
    }));
  };

  const resetForm = () => {
    const firstSoftware = softwareInventory[0];

    setForm({
      ...emptyForm,
      softwareInventoryId: firstSoftware?.id || '',
      installedVersion: firstSoftware?.installedVersion || '',
    });

    setEditingId(null);
    setMessage('');
    setError('');
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    try {
      setLoading(true);
      setMessage('');
      setError('');

      const payload = {
        installedVersion: form.installedVersion || undefined,
        latestVersion: form.latestVersion || undefined,
        updateAvailable: form.updateAvailable,
        status: form.status,
        source: form.source,
        notes: form.notes || undefined,
      };

      if (editingId) {
        await api.patch(`/software-update-findings/${editingId}`, payload);
        setMessage('Software update finding updated successfully');
      } else {
        await api.post('/software-update-findings', {
          ...payload,
          softwareInventoryId: form.softwareInventoryId,
        });
        setMessage('Software update finding created successfully');
      }

      resetForm();
      fetchFindings();
    } catch {
      setError('Failed to save update finding. Please check the details.');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (finding: SoftwareUpdateFinding) => {
    setEditingId(finding.id);

    setForm({
      installedVersion: finding.installedVersion || '',
      latestVersion: finding.latestVersion || '',
      updateAvailable: finding.updateAvailable,
      status: finding.status,
      source: finding.source,
      notes: finding.notes || '',
      softwareInventoryId: finding.softwareInventory.id,
    });

    setMessage('');
    setError('');
  };

  const handleDelete = async (id: string) => {
    const confirmed = window.confirm(
      'Are you sure you want to delete this update finding?',
    );

    if (!confirmed) return;

    try {
      setLoading(true);
      setMessage('');
      setError('');

      await api.delete(`/software-update-findings/${id}`);

      setMessage('Software update finding deleted successfully');
      fetchFindings();
    } catch {
      setError('Failed to delete update finding');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Software Update Findings</h1>
        <p className="text-slate-400 mt-1">
          Track outdated software, latest versions, and update status.
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-1 bg-slate-900 border border-slate-800 rounded-xl p-6">
          <h2 className="text-lg font-bold mb-4">
            {editingId ? 'Update Finding' : 'Create Update Finding'}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!editingId && (
              <div>
                <label className="block text-sm text-slate-300 mb-2">
                  Software
                </label>
                <select
                  className="w-full rounded-lg bg-slate-950 border border-slate-700 px-4 py-3 text-white outline-none focus:border-cyan-500"
                  value={form.softwareInventoryId}
                  onChange={(event) => handleSoftwareChange(event.target.value)}
                  required
                >
                  <option value="">Select software</option>
                  {softwareInventory.map((software) => (
                    <option key={software.id} value={software.id}>
                      {software.softwareName} - {software.device.hostname}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {editingId && (
              <div className="bg-slate-950 border border-slate-800 rounded-lg p-4 text-sm text-slate-400">
                Software record cannot be changed while editing. Create a new
                update finding if it belongs to another software record.
              </div>
            )}

            <div>
              <label className="block text-sm text-slate-300 mb-2">
                Installed Version
              </label>
              <input
                className="w-full rounded-lg bg-slate-950 border border-slate-700 px-4 py-3 text-white outline-none focus:border-cyan-500"
                value={form.installedVersion}
                onChange={(event) =>
                  handleChange('installedVersion', event.target.value)
                }
                placeholder="126.0.6478.127"
              />
            </div>

            <div>
              <label className="block text-sm text-slate-300 mb-2">
                Latest Version
              </label>
              <input
                className="w-full rounded-lg bg-slate-950 border border-slate-700 px-4 py-3 text-white outline-none focus:border-cyan-500"
                value={form.latestVersion}
                onChange={(event) =>
                  handleChange('latestVersion', event.target.value)
                }
                placeholder="127.0.6533.100"
              />
            </div>

            <div className="flex items-center gap-3 bg-slate-950 border border-slate-800 rounded-lg p-4">
              <input
                type="checkbox"
                checked={form.updateAvailable}
                onChange={(event) =>
                  handleChange('updateAvailable', event.target.checked)
                }
                className="h-4 w-4"
              />
              <label className="text-sm text-slate-300">
                Update available
              </label>
            </div>

            <div>
              <label className="block text-sm text-slate-300 mb-2">
                Status
              </label>
              <select
                className="w-full rounded-lg bg-slate-950 border border-slate-700 px-4 py-3 text-white outline-none focus:border-cyan-500"
                value={form.status}
                onChange={(event) =>
                  handleChange(
                    'status',
                    event.target.value as UpdateFindingForm['status'],
                  )
                }
              >
                <option value="OUTDATED">OUTDATED</option>
                <option value="UP_TO_DATE">UP_TO_DATE</option>
                <option value="UNKNOWN">UNKNOWN</option>
              </select>
            </div>

            <div>
              <label className="block text-sm text-slate-300 mb-2">
                Source
              </label>
              <select
                className="w-full rounded-lg bg-slate-950 border border-slate-700 px-4 py-3 text-white outline-none focus:border-cyan-500"
                value={form.source}
                onChange={(event) =>
                  handleChange(
                    'source',
                    event.target.value as UpdateFindingForm['source'],
                  )
                }
              >
                <option value="MANUAL">MANUAL</option>
                <option value="WINGET">WINGET</option>
                <option value="SYSTEM_SCAN">SYSTEM_SCAN</option>
                <option value="IMPORTED">IMPORTED</option>
              </select>
            </div>

            <div>
              <label className="block text-sm text-slate-300 mb-2">
                Notes
              </label>
              <textarea
                rows={4}
                className="w-full rounded-lg bg-slate-950 border border-slate-700 px-4 py-3 text-white outline-none focus:border-cyan-500 resize-none"
                value={form.notes}
                onChange={(event) => handleChange('notes', event.target.value)}
                placeholder="New version available from vendor website"
              />
            </div>

            {message && (
              <p className="text-sm text-green-400 bg-green-950 border border-green-800 rounded-lg px-4 py-2">
                {message}
              </p>
            )}

            {error && (
              <p className="text-sm text-red-400 bg-red-950 border border-red-800 rounded-lg px-4 py-2">
                {error}
              </p>
            )}

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold py-3 rounded-lg transition disabled:opacity-60"
              >
                {editingId ? 'Update' : 'Create'}
              </button>

              {editingId && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-semibold py-3 rounded-lg transition"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>

        <div className="xl:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold">Update Findings List</h2>
            <button
              onClick={fetchFindings}
              className="bg-slate-800 hover:bg-slate-700 text-sm px-4 py-2 rounded-lg"
            >
              Refresh
            </button>
          </div>

          {loading && <p className="text-slate-400">Loading...</p>}

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-400 border-b border-slate-800">
                  <th className="py-3 pr-4">Software</th>
                  <th className="py-3 pr-4">Device</th>
                  <th className="py-3 pr-4">Installed</th>
                  <th className="py-3 pr-4">Latest</th>
                  <th className="py-3 pr-4">Update</th>
                  <th className="py-3 pr-4">Status</th>
                  <th className="py-3 pr-4">Source</th>
                  <th className="py-3 pr-4">Actions</th>
                </tr>
              </thead>

              <tbody>
                {findings.map((finding) => (
                  <tr
                    key={finding.id}
                    className="border-b border-slate-800 text-slate-200"
                  >
                    <td className="py-4 pr-4 font-medium">
                      {finding.softwareInventory?.softwareName}
                    </td>
                    <td className="py-4 pr-4">
                      {finding.device?.hostname || '-'}
                    </td>
                    <td className="py-4 pr-4">
                      {finding.installedVersion || '-'}
                    </td>
                    <td className="py-4 pr-4">
                      {finding.latestVersion || '-'}
                    </td>
                    <td className="py-4 pr-4">
                      {finding.updateAvailable ? 'YES' : 'NO'}
                    </td>
                    <td className="py-4 pr-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          finding.status === 'OUTDATED'
                            ? 'bg-red-950 text-red-400 border border-red-800'
                            : finding.status === 'UP_TO_DATE'
                              ? 'bg-green-950 text-green-400 border border-green-800'
                              : 'bg-yellow-950 text-yellow-400 border border-yellow-800'
                        }`}
                      >
                        {finding.status}
                      </span>
                    </td>
                    <td className="py-4 pr-4">{finding.source}</td>
                    <td className="py-4 pr-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(finding)}
                          className="bg-blue-500 hover:bg-blue-400 text-white px-3 py-2 rounded-lg text-xs font-semibold"
                        >
                          Edit
                        </button>

                        <button
                          onClick={() => handleDelete(finding.id)}
                          className="bg-red-500 hover:bg-red-400 text-white px-3 py-2 rounded-lg text-xs font-semibold"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {findings.length === 0 && !loading && (
                  <tr>
                    <td
                      colSpan={8}
                      className="py-8 text-center text-slate-400"
                    >
                      No software update findings found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SoftwareUpdateFindings;