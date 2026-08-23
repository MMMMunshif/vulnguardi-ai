import { useEffect, useState } from 'react';
import api from '../api/api';

type Organization = {
  id: string;
  name: string;
};

type Department = {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt?: string;
  organization: {
    id: string;
    name: string;
  };
  _count?: {
    users: number;
  };
};

type DepartmentForm = {
  name: string;
  description: string;
  organizationId: string;
};

const emptyForm: DepartmentForm = {
  name: '',
  description: '',
  organizationId: '',
};

function Departments() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [form, setForm] = useState<DepartmentForm>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const fetchDepartments = async () => {
    try {
      setLoading(true);
      const response = await api.get('/departments');
      setDepartments(response.data.departments);
    } catch {
      setError('Failed to fetch departments');
    } finally {
      setLoading(false);
    }
  };

  const fetchOrganizations = async () => {
    try {
      const response = await api.get('/organizations');
      setOrganizations(response.data.organizations);

      if (response.data.organizations.length > 0) {
        setForm((previous) => ({
          ...previous,
          organizationId: previous.organizationId || response.data.organizations[0].id,
        }));
      }
    } catch {
      setError('Failed to fetch organizations');
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react/set-state-in-effect -- Fetches external data after mount.
    fetchDepartments();
    fetchOrganizations();
  }, []);

  const handleChange = (field: keyof DepartmentForm, value: string) => {
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

      if (editingId) {
        await api.patch(`/departments/${editingId}`, {
          name: form.name,
          description: form.description,
        });

        setMessage('Department updated successfully');
      } else {
        await api.post('/departments', form);
        setMessage('Department created successfully');
      }

      resetForm();
      fetchDepartments();
    } catch {
      setError('Failed to save department. Please check the details.');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (department: Department) => {
    setEditingId(department.id);
    setForm({
      name: department.name || '',
      description: department.description || '',
      organizationId: department.organization.id,
    });
    setMessage('');
    setError('');
  };

  const handleDelete = async (id: string) => {
    const confirmed = window.confirm(
      'Are you sure you want to delete this department?',
    );

    if (!confirmed) return;

    try {
      setLoading(true);
      setMessage('');
      setError('');

      await api.delete(`/departments/${id}`);

      setMessage('Department deleted successfully');
      fetchDepartments();
    } catch {
      setError(
        'Failed to delete department. If users are assigned to this department, it cannot be deleted.',
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Departments</h1>
        <p className="text-slate-400 mt-1">
          Manage departments inside organizations.
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-1 bg-slate-900 border border-slate-800 rounded-xl p-6">
          <h2 className="text-lg font-bold mb-4">
            {editingId ? 'Update Department' : 'Create Department'}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!editingId && (
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
            )}

            <div>
              <label className="block text-sm text-slate-300 mb-2">
                Department Name
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
                Description
              </label>
              <textarea
                rows={4}
                className="w-full rounded-lg bg-slate-950 border border-slate-700 px-4 py-3 text-white outline-none focus:border-cyan-500 resize-none"
                value={form.description}
                onChange={(event) =>
                  handleChange('description', event.target.value)
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
            <h2 className="text-lg font-bold">Department List</h2>
            <button
              onClick={fetchDepartments}
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
                  <th className="py-3 pr-4">Department</th>
                  <th className="py-3 pr-4">Description</th>
                  <th className="py-3 pr-4">Organization</th>
                  <th className="py-3 pr-4">Users</th>
                  <th className="py-3 pr-4">Actions</th>
                </tr>
              </thead>

              <tbody>
                {departments.map((department) => (
                  <tr
                    key={department.id}
                    className="border-b border-slate-800 text-slate-200"
                  >
                    <td className="py-4 pr-4 font-medium">
                      {department.name}
                    </td>
                    <td className="py-4 pr-4">
                      {department.description || '-'}
                    </td>
                    <td className="py-4 pr-4">
                      {department.organization?.name}
                    </td>
                    <td className="py-4 pr-4">
                      {department._count?.users ?? 0}
                    </td>
                    <td className="py-4 pr-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(department)}
                          className="bg-blue-500 hover:bg-blue-400 text-white px-3 py-2 rounded-lg text-xs font-semibold"
                        >
                          Edit
                        </button>

                        <button
                          onClick={() => handleDelete(department.id)}
                          className="bg-red-500 hover:bg-red-400 text-white px-3 py-2 rounded-lg text-xs font-semibold"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {departments.length === 0 && !loading && (
                  <tr>
                    <td
                      colSpan={5}
                      className="py-8 text-center text-slate-400"
                    >
                      No departments found.
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

export default Departments;
