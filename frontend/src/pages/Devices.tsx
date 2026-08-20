import { useEffect, useState } from 'react';
import api from '../api/api';

type Organization = {
  id: string;
  name: string;
};

type User = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  organization: {
    id: string;
    name: string;
  };
};

type Device = {
  id: string;
  hostname: string;
  ipAddress?: string;
  macAddress?: string;
  osName?: string;
  osVersion?: string;
  deviceType:
    | 'LAPTOP'
    | 'DESKTOP'
    | 'SERVER'
    | 'WORKSTATION'
    | 'CLOUD_VM'
    | 'NETWORK_DEVICE'
    | 'OTHER';
  status: 'ACTIVE' | 'INACTIVE' | 'RETIRED';
  organization: {
    id: string;
    name: string;
  };
  assignedUser?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  } | null;
};

type DeviceForm = {
  hostname: string;
  ipAddress: string;
  macAddress: string;
  osName: string;
  osVersion: string;
  deviceType:
    | 'LAPTOP'
    | 'DESKTOP'
    | 'SERVER'
    | 'WORKSTATION'
    | 'CLOUD_VM'
    | 'NETWORK_DEVICE'
    | 'OTHER';
  status: 'ACTIVE' | 'INACTIVE' | 'RETIRED';
  organizationId: string;
  assignedUserId: string;
};

const deviceTypes = [
  'LAPTOP',
  'DESKTOP',
  'SERVER',
  'WORKSTATION',
  'CLOUD_VM',
  'NETWORK_DEVICE',
  'OTHER',
] as const;

const emptyForm: DeviceForm = {
  hostname: '',
  ipAddress: '',
  macAddress: '',
  osName: '',
  osVersion: '',
  deviceType: 'LAPTOP',
  status: 'ACTIVE',
  organizationId: '',
  assignedUserId: '',
};

function Devices() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [form, setForm] = useState<DeviceForm>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const filteredUsers = users.filter(
    (user) => user.organization.id === form.organizationId,
  );

  const fetchDevices = async () => {
    try {
      setLoading(true);
      const response = await api.get('/devices');
      setDevices(response.data.devices);
    } catch {
      setError('Failed to fetch devices');
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

  const fetchUsers = async () => {
    const response = await api.get('/users');
    setUsers(response.data.users);
  };

  useEffect(() => {
    fetchDevices();
    fetchOrganizations();
    fetchUsers();
  }, []);

  const handleChange = (field: keyof DeviceForm, value: string) => {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  const resetForm = () => {
    setForm({
      ...emptyForm,
      organizationId: organizations[0]?.id || '',
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
        hostname: form.hostname,
        ipAddress: form.ipAddress || undefined,
        macAddress: form.macAddress || undefined,
        osName: form.osName || undefined,
        osVersion: form.osVersion || undefined,
        deviceType: form.deviceType,
        status: editingId ? form.status : undefined,
        organizationId: form.organizationId,
        assignedUserId: form.assignedUserId || undefined,
      };

      if (editingId) {
        await api.patch(`/devices/${editingId}`, payload);
        setMessage('Device updated successfully');
      } else {
        await api.post('/devices', payload);
        setMessage('Device created successfully');
      }

      resetForm();
      fetchDevices();
    } catch {
      setError('Failed to save device. Please check the details.');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (device: Device) => {
    setEditingId(device.id);

    setForm({
      hostname: device.hostname || '',
      ipAddress: device.ipAddress || '',
      macAddress: device.macAddress || '',
      osName: device.osName || '',
      osVersion: device.osVersion || '',
      deviceType: device.deviceType,
      status: device.status,
      organizationId: device.organization.id,
      assignedUserId: device.assignedUser?.id || '',
    });

    setMessage('');
    setError('');
  };

  const handleRetire = async (id: string) => {
    const confirmed = window.confirm(
      'Are you sure you want to retire this device?',
    );

    if (!confirmed) return;

    try {
      setLoading(true);
      setMessage('');
      setError('');

      await api.delete(`/devices/${id}`);

      setMessage('Device retired successfully');
      fetchDevices();
    } catch {
      setError('Failed to retire device');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Devices</h1>
        <p className="text-slate-400 mt-1">
          Manage device and asset inventory.
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-1 bg-slate-900 border border-slate-800 rounded-xl p-6">
          <h2 className="text-lg font-bold mb-4">
            {editingId ? 'Update Device' : 'Create Device'}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
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
                Hostname
              </label>
              <input
                className="w-full rounded-lg bg-slate-950 border border-slate-700 px-4 py-3 text-white outline-none focus:border-cyan-500"
                value={form.hostname}
                onChange={(event) =>
                  handleChange('hostname', event.target.value)
                }
                required
              />
            </div>

            <div>
              <label className="block text-sm text-slate-300 mb-2">
                IP Address
              </label>
              <input
                className="w-full rounded-lg bg-slate-950 border border-slate-700 px-4 py-3 text-white outline-none focus:border-cyan-500"
                value={form.ipAddress}
                onChange={(event) =>
                  handleChange('ipAddress', event.target.value)
                }
                placeholder="192.168.1.10"
              />
            </div>

            <div>
              <label className="block text-sm text-slate-300 mb-2">
                MAC Address
              </label>
              <input
                className="w-full rounded-lg bg-slate-950 border border-slate-700 px-4 py-3 text-white outline-none focus:border-cyan-500"
                value={form.macAddress}
                onChange={(event) =>
                  handleChange('macAddress', event.target.value)
                }
                placeholder="00:1A:2B:3C:4D:5E"
              />
            </div>

            <div>
              <label className="block text-sm text-slate-300 mb-2">
                OS Name
              </label>
              <input
                className="w-full rounded-lg bg-slate-950 border border-slate-700 px-4 py-3 text-white outline-none focus:border-cyan-500"
                value={form.osName}
                onChange={(event) => handleChange('osName', event.target.value)}
                placeholder="Windows"
              />
            </div>

            <div>
              <label className="block text-sm text-slate-300 mb-2">
                OS Version
              </label>
              <input
                className="w-full rounded-lg bg-slate-950 border border-slate-700 px-4 py-3 text-white outline-none focus:border-cyan-500"
                value={form.osVersion}
                onChange={(event) =>
                  handleChange('osVersion', event.target.value)
                }
                placeholder="Windows 11 Pro"
              />
            </div>

            <div>
              <label className="block text-sm text-slate-300 mb-2">
                Device Type
              </label>
              <select
                className="w-full rounded-lg bg-slate-950 border border-slate-700 px-4 py-3 text-white outline-none focus:border-cyan-500"
                value={form.deviceType}
                onChange={(event) =>
                  handleChange(
                    'deviceType',
                    event.target.value as DeviceForm['deviceType'],
                  )
                }
              >
                {deviceTypes.map((deviceType) => (
                  <option key={deviceType} value={deviceType}>
                    {deviceType}
                  </option>
                ))}
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
                      event.target.value as DeviceForm['status'],
                    )
                  }
                >
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="INACTIVE">INACTIVE</option>
                  <option value="RETIRED">RETIRED</option>
                </select>
              </div>
            )}

            <div>
              <label className="block text-sm text-slate-300 mb-2">
                Assigned User
              </label>
              <select
                className="w-full rounded-lg bg-slate-950 border border-slate-700 px-4 py-3 text-white outline-none focus:border-cyan-500"
                value={form.assignedUserId}
                onChange={(event) =>
                  handleChange('assignedUserId', event.target.value)
                }
              >
                <option value="">Not assigned</option>
                {filteredUsers.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.firstName} {user.lastName} - {user.email}
                  </option>
                ))}
              </select>
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
            <h2 className="text-lg font-bold">Device List</h2>
            <button
              onClick={fetchDevices}
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
                  <th className="py-3 pr-4">Hostname</th>
                  <th className="py-3 pr-4">IP Address</th>
                  <th className="py-3 pr-4">OS</th>
                  <th className="py-3 pr-4">Type</th>
                  <th className="py-3 pr-4">Organization</th>
                  <th className="py-3 pr-4">Assigned User</th>
                  <th className="py-3 pr-4">Status</th>
                  <th className="py-3 pr-4">Actions</th>
                </tr>
              </thead>

              <tbody>
                {devices.map((device) => (
                  <tr
                    key={device.id}
                    className="border-b border-slate-800 text-slate-200"
                  >
                    <td className="py-4 pr-4 font-medium">
                      {device.hostname}
                    </td>
                    <td className="py-4 pr-4">{device.ipAddress || '-'}</td>
                    <td className="py-4 pr-4">
                      {device.osName || '-'} {device.osVersion || ''}
                    </td>
                    <td className="py-4 pr-4">{device.deviceType}</td>
                    <td className="py-4 pr-4">{device.organization?.name}</td>
                    <td className="py-4 pr-4">
                      {device.assignedUser
                        ? `${device.assignedUser.firstName} ${device.assignedUser.lastName}`
                        : '-'}
                    </td>
                    <td className="py-4 pr-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          device.status === 'ACTIVE'
                            ? 'bg-green-950 text-green-400 border border-green-800'
                            : device.status === 'RETIRED'
                              ? 'bg-red-950 text-red-400 border border-red-800'
                              : 'bg-yellow-950 text-yellow-400 border border-yellow-800'
                        }`}
                      >
                        {device.status}
                      </span>
                    </td>
                    <td className="py-4 pr-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(device)}
                          className="bg-blue-500 hover:bg-blue-400 text-white px-3 py-2 rounded-lg text-xs font-semibold"
                        >
                          Edit
                        </button>

                        <button
                          onClick={() => handleRetire(device.id)}
                          className="bg-red-500 hover:bg-red-400 text-white px-3 py-2 rounded-lg text-xs font-semibold"
                        >
                          Retire
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {devices.length === 0 && !loading && (
                  <tr>
                    <td
                      colSpan={8}
                      className="py-8 text-center text-slate-400"
                    >
                      No devices found.
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

export default Devices;