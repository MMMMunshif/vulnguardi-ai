import { useEffect, useMemo, useState } from 'react';
import api from '../api/api';

type Organization = {
  id: string;
  name: string;
};

type Department = {
  id: string;
  name: string;
  organization: {
    id: string;
    name: string;
  };
};

type User = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  status: 'ACTIVE' | 'INACTIVE';
  organization: {
    id: string;
    name: string;
  };
  department: {
    id: string;
    name: string;
  };
  role: {
    id: string;
    roleName: string;
  };
};

type UserForm = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone: string;
  organizationId: string;
  departmentId: string;
  roleName: string;
  status: 'ACTIVE' | 'INACTIVE';
};

const roleNames = [
  'Super Admin',
  'Organization Admin',
  'Security Analyst',
  'IT Technician',
];

const emptyForm: UserForm = {
  firstName: '',
  lastName: '',
  email: '',
  password: '',
  phone: '',
  organizationId: '',
  departmentId: '',
  roleName: 'Security Analyst',
  status: 'ACTIVE',
};

function Users() {
  const [users, setUsers] = useState<User[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [form, setForm] = useState<UserForm>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const filteredDepartments = useMemo(() => {
    return departments.filter(
      (department) => department.organization.id === form.organizationId,
    );
  }, [departments, form.organizationId]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await api.get('/users');
      setUsers(response.data.users);
    } catch {
      setError('Failed to fetch users');
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

  const fetchDepartments = async () => {
    const response = await api.get('/departments');
    setDepartments(response.data.departments);
  };

  useEffect(() => {
    // eslint-disable-next-line react/set-state-in-effect -- Fetches external data after mount.
    fetchUsers();
    fetchOrganizations();
    fetchDepartments();
  }, []);

  useEffect(() => {
    if (!form.organizationId) return;

    const validDepartment = departments.find(
      (department) =>
        department.id === form.departmentId &&
        department.organization.id === form.organizationId,
    );

    if (!validDepartment) {
      const firstDepartment = departments.find(
        (department) => department.organization.id === form.organizationId,
      );

      // eslint-disable-next-line react/set-state-in-effect -- Keeps the dependent selection valid.
      setForm((previous) => ({
        ...previous,
        departmentId: firstDepartment?.id || '',
      }));
    }
  }, [form.organizationId, form.departmentId, departments]);

  const handleChange = (field: keyof UserForm, value: string) => {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  const resetForm = () => {
    setForm({
      ...emptyForm,
      organizationId: organizations[0]?.id || '',
      departmentId:
        departments.find(
          (department) => department.organization.id === organizations[0]?.id,
        )?.id || '',
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

      const payload: {
        firstName: string;
        lastName: string;
        email: string;
        phone?: string;
        organizationId: string;
        departmentId: string;
        roleName: string;
        status?: 'ACTIVE' | 'INACTIVE';
        password?: string;
      } = {
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        phone: form.phone || undefined,
        organizationId: form.organizationId,
        departmentId: form.departmentId,
        roleName: form.roleName,
      };

      if (form.password) {
        payload.password = form.password;
      }

      if (editingId) {
        payload.status = form.status;
        await api.patch(`/users/${editingId}`, payload);
        setMessage('User updated successfully');
      } else {
        if (!form.password) {
          setError('Password is required when creating a user');
          return;
        }

        await api.post('/users', payload);
        setMessage('User created successfully');
      }

      resetForm();
      fetchUsers();
    } catch {
      setError('Failed to save user. Please check the details.');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (user: User) => {
    setEditingId(user.id);

    setForm({
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      email: user.email || '',
      password: '',
      phone: user.phone || '',
      organizationId: user.organization.id,
      departmentId: user.department.id,
      roleName: user.role.roleName,
      status: user.status,
    });

    setMessage('');
    setError('');
  };

  const handleDeactivate = async (id: string) => {
    const confirmed = window.confirm(
      'Are you sure you want to deactivate this user?',
    );

    if (!confirmed) return;

    try {
      setLoading(true);
      setMessage('');
      setError('');

      await api.delete(`/users/${id}`);

      setMessage('User deactivated successfully');
      fetchUsers();
    } catch {
      setError('Failed to deactivate user');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Users</h1>
        <p className="text-slate-400 mt-1">
          Manage users, roles, departments, and account status.
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-1 bg-slate-900 border border-slate-800 rounded-xl p-6">
          <h2 className="text-lg font-bold mb-4">
            {editingId ? 'Update User' : 'Create User'}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-1 gap-4">
              <div>
                <label className="block text-sm text-slate-300 mb-2">
                  First Name
                </label>
                <input
                  className="w-full rounded-lg bg-slate-950 border border-slate-700 px-4 py-3 text-white outline-none focus:border-cyan-500"
                  value={form.firstName}
                  onChange={(event) =>
                    handleChange('firstName', event.target.value)
                  }
                  required
                />
              </div>

              <div>
                <label className="block text-sm text-slate-300 mb-2">
                  Last Name
                </label>
                <input
                  className="w-full rounded-lg bg-slate-950 border border-slate-700 px-4 py-3 text-white outline-none focus:border-cyan-500"
                  value={form.lastName}
                  onChange={(event) =>
                    handleChange('lastName', event.target.value)
                  }
                  required
                />
              </div>
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
                Password {editingId && '(leave empty if not changing)'}
              </label>
              <input
                type="password"
                className="w-full rounded-lg bg-slate-950 border border-slate-700 px-4 py-3 text-white outline-none focus:border-cyan-500"
                value={form.password}
                onChange={(event) =>
                  handleChange('password', event.target.value)
                }
                required={!editingId}
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
                Department
              </label>
              <select
                className="w-full rounded-lg bg-slate-950 border border-slate-700 px-4 py-3 text-white outline-none focus:border-cyan-500"
                value={form.departmentId}
                onChange={(event) =>
                  handleChange('departmentId', event.target.value)
                }
                required
              >
                <option value="">Select department</option>
                {filteredDepartments.map((department) => (
                  <option key={department.id} value={department.id}>
                    {department.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm text-slate-300 mb-2">
                Role
              </label>
              <select
                className="w-full rounded-lg bg-slate-950 border border-slate-700 px-4 py-3 text-white outline-none focus:border-cyan-500"
                value={form.roleName}
                onChange={(event) =>
                  handleChange('roleName', event.target.value)
                }
                required
              >
                {roleNames.map((roleName) => (
                  <option key={roleName} value={roleName}>
                    {roleName}
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
                      event.target.value as 'ACTIVE' | 'INACTIVE',
                    )
                  }
                >
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="INACTIVE">INACTIVE</option>
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
            <h2 className="text-lg font-bold">User List</h2>
            <button
              onClick={fetchUsers}
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
                  <th className="py-3 pr-4">Role</th>
                  <th className="py-3 pr-4">Department</th>
                  <th className="py-3 pr-4">Organization</th>
                  <th className="py-3 pr-4">Status</th>
                  <th className="py-3 pr-4">Actions</th>
                </tr>
              </thead>

              <tbody>
                {users.map((user) => (
                  <tr
                    key={user.id}
                    className="border-b border-slate-800 text-slate-200"
                  >
                    <td className="py-4 pr-4 font-medium">
                      {user.firstName} {user.lastName}
                    </td>
                    <td className="py-4 pr-4">{user.email}</td>
                    <td className="py-4 pr-4">{user.role?.roleName}</td>
                    <td className="py-4 pr-4">{user.department?.name}</td>
                    <td className="py-4 pr-4">{user.organization?.name}</td>
                    <td className="py-4 pr-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          user.status === 'ACTIVE'
                            ? 'bg-green-950 text-green-400 border border-green-800'
                            : 'bg-red-950 text-red-400 border border-red-800'
                        }`}
                      >
                        {user.status}
                      </span>
                    </td>
                    <td className="py-4 pr-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(user)}
                          className="bg-blue-500 hover:bg-blue-400 text-white px-3 py-2 rounded-lg text-xs font-semibold"
                        >
                          Edit
                        </button>

                        <button
                          onClick={() => handleDeactivate(user.id)}
                          className="bg-red-500 hover:bg-red-400 text-white px-3 py-2 rounded-lg text-xs font-semibold"
                        >
                          Deactivate
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {users.length === 0 && !loading && (
                  <tr>
                    <td
                      colSpan={7}
                      className="py-8 text-center text-slate-400"
                    >
                      No users found.
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

export default Users;
