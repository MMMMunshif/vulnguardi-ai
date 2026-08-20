import { useEffect, useState } from 'react';
import api from '../api/api';

type Organization = {
  id: string;
  name: string;
};

type Device = {
  id: string;
  hostname: string;
  ipAddress?: string;
  osName?: string;
  osVersion?: string;
  organization: {
    id: string;
    name: string;
  };
};

type SoftwareRecord = {
  id: string;
  softwareName: string;
  publisher?: string;
  installedVersion?: string;
  installedPath?: string;
  installDate?: string;
  lastUsedAt?: string;
  source: 'MANUAL' | 'SYSTEM_SCAN' | 'IMPORTED';
  status: 'INSTALLED' | 'REMOVED' | 'UNKNOWN';
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

type SoftwareForm = {
  softwareName: string;
  publisher: string;
  installedVersion: string;
  installedPath: string;
  installDate: string;
  lastUsedAt: string;
  source: 'MANUAL' | 'SYSTEM_SCAN' | 'IMPORTED';
  status: 'INSTALLED' | 'REMOVED' | 'UNKNOWN';
  deviceId: string;
  organizationId: string;
};

const emptyForm: SoftwareForm = {
  softwareName: '',
  publisher: '',
  installedVersion: '',
  installedPath: '',
  installDate: '',
  lastUsedAt: '',
  source: 'MANUAL',
  status: 'INSTALLED',
  deviceId: '',
  organizationId: '',
};

function SoftwareInventory() {
  const [softwareInventory, setSoftwareInventory] = useState<SoftwareRecord[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);
  const [form, setForm] = useState<SoftwareForm>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const filteredDevices = devices.filter(
    (device) => device.organization.id === form.organizationId,
  );

  const fetchSoftwareInventory = async () => {
    try {
      setLoading(true);
      const response = await api.get('/software-inventory');
      setSoftwareInventory(response.data.softwareInventory);
    } catch {
      setError('Failed to fetch software inventory');
    } finally {
      setLoading(false);
    }
  };

  const fetchOrganizations = async () => {
    const response = await api.get('/organizations');
    setOrganizations(response.data.organizations);

    if (response.data.organizations.length > 0) {
      setForm((previous) => ({
        ...previous,
        organizationId:
          previous.organizationId || response.data.organizations[0].id,
      }));
    }
  };

  const fetchDevices = async () => {
    const response = await api.get('/devices');
    setDevices(response.data.devices);
  };

  useEffect(() => {
    fetchSoftwareInventory();
    fetchOrganizations();
    fetchDevices();
  }, []);

  useEffect(() => {
    if (!form.organizationId || editingId) return;

    const validDevice = devices.find(
      (device) =>
        device.id === form.deviceId &&
        device.organization.id === form.organizationId,
    );

    if (!validDevice) {
      const firstDevice = devices.find(
        (device) => device.organization.id === form.organizationId,
      );

      setForm((previous) => ({
        ...previous,
        deviceId: firstDevice?.id || '',
      }));
    }
  }, [form.organizationId, form.deviceId, devices, editingId]);

  const handleChange = (field: keyof SoftwareForm, value: string) => {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  const resetForm = () => {
    const firstOrganizationId = organizations[0]?.id || '';
    const firstDeviceId =
      devices.find((device) => device.organization.id === firstOrganizationId)
        ?.id || '';

    setForm({
      ...emptyForm,
      organizationId: firstOrganizationId,
      deviceId: firstDeviceId,
    });

    setEditingId(null);
    setMessage('');
    setError('');
  };

  const toDateTimeValue = (dateString?: string) => {
    if (!dateString) return '';
    return dateString.slice(0, 16);
  };

  const toISOStringOrUndefined = (value: string) => {
    if (!value) return undefined;
    return new Date(value).toISOString();
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    try {
      setLoading(true);
      setMessage('');
      setError('');

      if (editingId) {
        await api.patch(`/software-inventory/${editingId}`, {
          softwareName: form.softwareName,
          publisher: form.publisher || undefined,
          installedVersion: form.installedVersion || undefined,
          installedPath: form.installedPath || undefined,
          installDate: toISOStringOrUndefined(form.installDate),
          lastUsedAt: toISOStringOrUndefined(form.lastUsedAt),
          source: form.source,
          status: form.status,
        });

        setMessage('Software record updated successfully');
      } else {
        await api.post('/software-inventory', {
          softwareName: form.softwareName,
          publisher: form.publisher || undefined,
          installedVersion: form.installedVersion || undefined,
          installedPath: form.installedPath || undefined,
          installDate: toISOStringOrUndefined(form.installDate),
          lastUsedAt: toISOStringOrUndefined(form.lastUsedAt),
          source: form.source,
          status: form.status,
          deviceId: form.deviceId,
          organizationId: form.organizationId,
        });

        setMessage('Software record created successfully');
      }

      resetForm();
      fetchSoftwareInventory();
    } catch {
      setError('Failed to save software record. Please check the details.');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (software: SoftwareRecord) => {
    setEditingId(software.id);

    setForm({
      softwareName: software.softwareName || '',
      publisher: software.publisher || '',
      installedVersion: software.installedVersion || '',
      installedPath: software.installedPath || '',
      installDate: toDateTimeValue(software.installDate),
      lastUsedAt: toDateTimeValue(software.lastUsedAt),
      source: software.source,
      status: software.status,
      deviceId: software.device.id,
      organizationId: software.organization.id,
    });

    setMessage('');
    setError('');
  };

  const handleRemove = async (id: string) => {
    const confirmed = window.confirm(
      'Are you sure you want to mark this software as removed?',
    );

    if (!confirmed) return;

    try {
      setLoading(true);
      setMessage('');
      setError('');

      await api.delete(`/software-inventory/${id}`);

      setMessage('Software record marked as removed successfully');
      fetchSoftwareInventory();
    } catch {
      setError('Failed to remove software record');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Software Inventory</h1>
        <p className="text-slate-400 mt-1">
          Track installed software records for each device.
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-1 bg-slate-900 border border-slate-800 rounded-xl p-6">
          <h2 className="text-lg font-bold mb-4">
            {editingId ? 'Update Software Record' : 'Create Software Record'}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!editingId && (
              <>
                <div>
                  <label className="block text-sm text-slate-300 mb-2">
                    Organization
                  </label>
                  <select
                    className="w-full rounded-lg bg-slate-950 border border-slate-700 px-4 py-3 text-white outline-none focus:border-cyan-500"
                    value={form.organizationId}
                    onChange={(event) =>
                      handleChange('organizationId', event.target.value)
                    }
                    required
                  >
                    <option value="">Select organization</option>
                    {organizations.map((organization) => (
                      <option key={organization.id} value={organization.id}>
                        {organization.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm text-slate-300 mb-2">
                    Device
                  </label>
                  <select
                    className="w-full rounded-lg bg-slate-950 border border-slate-700 px-4 py-3 text-white outline-none focus:border-cyan-500"
                    value={form.deviceId}
                    onChange={(event) =>
                      handleChange('deviceId', event.target.value)
                    }
                    required
                  >
                    <option value="">Select device</option>
                    {filteredDevices.map((device) => (
                      <option key={device.id} value={device.id}>
                        {device.hostname}
                      </option>
                    ))}
                  </select>
                </div>
              </>
            )}

            {editingId && (
              <div className="bg-slate-950 border border-slate-800 rounded-lg p-4 text-sm text-slate-400">
                Device and organization cannot be changed while editing. Create a
                new record if the software belongs to another device.
              </div>
            )}

            <div>
              <label className="block text-sm text-slate-300 mb-2">
                Software Name
              </label>
              <input
                className="w-full rounded-lg bg-slate-950 border border-slate-700 px-4 py-3 text-white outline-none focus:border-cyan-500"
                value={form.softwareName}
                onChange={(event) =>
                  handleChange('softwareName', event.target.value)
                }
                required
              />
            </div>

            <div>
              <label className="block text-sm text-slate-300 mb-2">
                Publisher
              </label>
              <input
                className="w-full rounded-lg bg-slate-950 border border-slate-700 px-4 py-3 text-white outline-none focus:border-cyan-500"
                value={form.publisher}
                onChange={(event) =>
                  handleChange('publisher', event.target.value)
                }
                placeholder="Google LLC"
              />
            </div>

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
                Installed Path
              </label>
              <input
                className="w-full rounded-lg bg-slate-950 border border-slate-700 px-4 py-3 text-white outline-none focus:border-cyan-500"
                value={form.installedPath}
                onChange={(event) =>
                  handleChange('installedPath', event.target.value)
                }
                placeholder="C:\Program Files\Google\Chrome"
              />
            </div>

            <div>
              <label className="block text-sm text-slate-300 mb-2">
                Install Date
              </label>
              <input
                type="datetime-local"
                className="w-full rounded-lg bg-slate-950 border border-slate-700 px-4 py-3 text-white outline-none focus:border-cyan-500"
                value={form.installDate}
                onChange={(event) =>
                  handleChange('installDate', event.target.value)
                }
              />
            </div>

            <div>
              <label className="block text-sm text-slate-300 mb-2">
                Last Used At
              </label>
              <input
                type="datetime-local"
                className="w-full rounded-lg bg-slate-950 border border-slate-700 px-4 py-3 text-white outline-none focus:border-cyan-500"
                value={form.lastUsedAt}
                onChange={(event) =>
                  handleChange('lastUsedAt', event.target.value)
                }
              />
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
                    event.target.value as SoftwareForm['source'],
                  )
                }
              >
                <option value="MANUAL">MANUAL</option>
                <option value="SYSTEM_SCAN">SYSTEM_SCAN</option>
                <option value="IMPORTED">IMPORTED</option>
              </select>
            </div>

            {editingId && (
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
                      event.target.value as SoftwareForm['status'],
                    )
                  }
                >
                  <option value="INSTALLED">INSTALLED</option>
                  <option value="REMOVED">REMOVED</option>
                  <option value="UNKNOWN">UNKNOWN</option>
                </select>
              </div>
            )}

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
            <h2 className="text-lg font-bold">Software List</h2>
            <button
              onClick={fetchSoftwareInventory}
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
                  <th className="py-3 pr-4">Version</th>
                  <th className="py-3 pr-4">Publisher</th>
                  <th className="py-3 pr-4">Device</th>
                  <th className="py-3 pr-4">Source</th>
                  <th className="py-3 pr-4">Status</th>
                  <th className="py-3 pr-4">Actions</th>
                </tr>
              </thead>

              <tbody>
                {softwareInventory.map((software) => (
                  <tr
                    key={software.id}
                    className="border-b border-slate-800 text-slate-200"
                  >
                    <td className="py-4 pr-4 font-medium">
                      {software.softwareName}
                    </td>
                    <td className="py-4 pr-4">
                      {software.installedVersion || '-'}
                    </td>
                    <td className="py-4 pr-4">
                      {software.publisher || '-'}
                    </td>
                    <td className="py-4 pr-4">
                      {software.device?.hostname || '-'}
                    </td>
                    <td className="py-4 pr-4">{software.source}</td>
                    <td className="py-4 pr-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          software.status === 'INSTALLED'
                            ? 'bg-green-950 text-green-400 border border-green-800'
                            : software.status === 'REMOVED'
                              ? 'bg-red-950 text-red-400 border border-red-800'
                              : 'bg-yellow-950 text-yellow-400 border border-yellow-800'
                        }`}
                      >
                        {software.status}
                      </span>
                    </td>
                    <td className="py-4 pr-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(software)}
                          className="bg-blue-500 hover:bg-blue-400 text-white px-3 py-2 rounded-lg text-xs font-semibold"
                        >
                          Edit
                        </button>

                        <button
                          onClick={() => handleRemove(software.id)}
                          className="bg-red-500 hover:bg-red-400 text-white px-3 py-2 rounded-lg text-xs font-semibold"
                        >
                          Remove
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {softwareInventory.length === 0 && !loading && (
                  <tr>
                    <td
                      colSpan={7}
                      className="py-8 text-center text-slate-400"
                    >
                      No software records found.
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

export default SoftwareInventory;