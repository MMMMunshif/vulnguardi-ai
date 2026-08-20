import { useEffect, useState } from 'react';
import api from '../api/api';

type Organization = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  website?: string;
  industry?: string;
  country?: string;
  status: 'ACTIVE' | 'SUSPENDED';
  createdAt: string;
  updatedAt?: string;
  _count?: {
    users: number;
    departments: number;
  };
};

type OrganizationForm = {
  name: string;
  email: string;
  phone: string;
  website: string;
  industry: string;
  country: string;
};

const emptyForm: OrganizationForm = {
  name: '',
  email: '',
  phone: '',
  website: '',
  industry: '',
  country: '',
};

function Organizations() {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [form, setForm] = useState<OrganizationForm>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const fetchOrganizations = async () => {
    try {
      setLoading(true);
      const response = await api.get('/organizations');
      setOrganizations(response.data.organizations);
    } catch {
      setError('Failed to fetch organizations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrganizations();
  }, []);

  const handleChange = (field: keyof OrganizationForm, value: string) => {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
    setError('');
    setMessage('');
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    try {
      setLoading(true);
      setError('');
      setMessage('');

      if (editingId) {
        await api.patch(`/organizations/${editingId}`, form);
        setMessage('Organization updated successfully');
      } else {
        await api.post('/organizations', form);
        setMessage('Organization created successfully');
      }

      resetForm();
      fetchOrganizations();
    } catch {
      setError('Failed to save organization. Please check the details.');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (organization: Organization) => {
    setEditingId(organization.id);
    setForm({
      name: organization.name || '',
      email: organization.email || '',
      phone: organization.phone || '',
      website: organization.website || '',
      industry: organization.industry || '',
      country: organization.country || '',
    });
    setMessage('');
    setError('');
  };

  const handleSuspend = async (id: string) => {
    const confirmed = window.confirm(
      'Are you sure you want to suspend this organization?',
    );

    if (!confirmed) return;

    try {
      setLoading(true);
      setError('');
      setMessage('');

      await api.delete(`/organizations/${id}`);

      setMessage('Organization suspended successfully');
      fetchOrganizations();
    } catch {
      setError('Failed to suspend organization');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Organizations</h1>
        <p className="text-slate-400 mt-1">
          Manage organization profiles and status.
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-1 bg-slate-900 border border-slate-800 rounded-xl p-6">
          <h2 className="text-lg font-bold mb-4">
            {editingId ? 'Update Organization' : 'Create Organization'}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-slate-300 mb-2">
                Name
              </label>
              <input
                className="w-full rounded-lg bg-slate-950 border border-slate-700 px-4 py-3 text-white outline-none focus:border-cyan-500"
                value={form.name}
                onChange={(event) => handleChange('name', event.target.value)}
                required
              />
            </div>

            <div>
              <label className="block text-sm text-slate-300 mb-2">
                Email
              </label>
              <input
                type="email"
                className="w-full rounded-lg bg-slate-950 border border-slate-700 px-4 py-3 text-white outline-none focus:border-cyan-500"
                value={form.email}
                onChange={(event) => handleChange('email', event.target.value)}
                required
              />
            </div>

            <div>
              <label className="block text-sm text-slate-300 mb-2">
                Phone
              </label>
              <input
                className="w-full rounded-lg bg-slate-950 border border-slate-700 px-4 py-3 text-white outline-none focus:border-cyan-500"
                value={form.phone}
                onChange={(event) => handleChange('phone', event.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm text-slate-300 mb-2">
                Website
              </label>
              <input
                className="w-full rounded-lg bg-slate-950 border border-slate-700 px-4 py-3 text-white outline-none focus:border-cyan-500"
                value={form.website}
                onChange={(event) =>
                  handleChange('website', event.target.value)
                }
              />
            </div>

            <div>
              <label className="block text-sm text-slate-300 mb-2">
                Industry
              </label>
              <input
                className="w-full rounded-lg bg-slate-950 border border-slate-700 px-4 py-3 text-white outline-none focus:border-cyan-500"
                value={form.industry}
                onChange={(event) =>
                  handleChange('industry', event.target.value)
                }
              />
            </div>

            <div>
              <label className="block text-sm text-slate-300 mb-2">
                Country
              </label>
              <input
                className="w-full rounded-lg bg-slate-950 border border-slate-700 px-4 py-3 text-white outline-none focus:border-cyan-500"
                value={form.country}
                onChange={(event) =>
                  handleChange('country', event.target.value)
                }
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
            <h2 className="text-lg font-bold">Organization List</h2>
            <button
              onClick={fetchOrganizations}
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
                  <th className="py-3 pr-4">Name</th>
                  <th className="py-3 pr-4">Email</th>
                  <th className="py-3 pr-4">Country</th>
                  <th className="py-3 pr-4">Status</th>
                  <th className="py-3 pr-4">Users</th>
                  <th className="py-3 pr-4">Departments</th>
                  <th className="py-3 pr-4">Actions</th>
                </tr>
              </thead>

              <tbody>
                {organizations.map((organization) => (
                  <tr
                    key={organization.id}
                    className="border-b border-slate-800 text-slate-200"
                  >
                    <td className="py-4 pr-4 font-medium">
                      {organization.name}
                    </td>
                    <td className="py-4 pr-4">{organization.email}</td>
                    <td className="py-4 pr-4">
                      {organization.country || '-'}
                    </td>
                    <td className="py-4 pr-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          organization.status === 'ACTIVE'
                            ? 'bg-green-950 text-green-400 border border-green-800'
                            : 'bg-red-950 text-red-400 border border-red-800'
                        }`}
                      >
                        {organization.status}
                      </span>
                    </td>
                    <td className="py-4 pr-4">
                      {organization._count?.users ?? 0}
                    </td>
                    <td className="py-4 pr-4">
                      {organization._count?.departments ?? 0}
                    </td>
                    <td className="py-4 pr-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(organization)}
                          className="bg-blue-500 hover:bg-blue-400 text-white px-3 py-2 rounded-lg text-xs font-semibold"
                        >
                          Edit
                        </button>

                        <button
                          onClick={() => handleSuspend(organization.id)}
                          className="bg-red-500 hover:bg-red-400 text-white px-3 py-2 rounded-lg text-xs font-semibold"
                        >
                          Suspend
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {organizations.length === 0 && !loading && (
                  <tr>
                    <td
                      colSpan={7}
                      className="py-8 text-center text-slate-400"
                    >
                      No organizations found.
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

export default Organizations;