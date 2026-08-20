import { useEffect, useState } from 'react';
import api from '../api/api';

type VulnerabilityFinding = {
  id: string;
  cveId?: string;
  title: string;
  status: string;
  fixAvailability: string;
  softwareInventory: {
    id: string;
    softwareName: string;
    installedVersion?: string;
  };
  device: {
    id: string;
    hostname: string;
  };
};

type User = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
};

type RemediationAction = {
  id: string;
  actionTitle: string;
  actionDescription?: string;
  recommendedFix?: string;
  actionType:
    | 'UPDATE_SOFTWARE'
    | 'CONFIGURATION_CHANGE'
    | 'REMOVE_SOFTWARE'
    | 'ACCEPT_RISK'
    | 'VERIFY_PATCH'
    | 'OTHER';
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  verificationStatus: 'NOT_VERIFIED' | 'VERIFIED' | 'FAILED';
  dueDate?: string;
  startedAt?: string;
  completedAt?: string;
  verificationNotes?: string;
  notes?: string;
  vulnerabilityFinding: {
    id: string;
    cveId?: string;
    title: string;
    status: string;
    fixAvailability: string;
  };
  softwareInventory: {
    id: string;
    softwareName: string;
    installedVersion?: string;
  };
  device: {
    id: string;
    hostname: string;
  };
  assignedUser?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  } | null;
};

type RemediationForm = {
  actionTitle: string;
  actionDescription: string;
  recommendedFix: string;
  actionType:
    | 'UPDATE_SOFTWARE'
    | 'CONFIGURATION_CHANGE'
    | 'REMOVE_SOFTWARE'
    | 'ACCEPT_RISK'
    | 'VERIFY_PATCH'
    | 'OTHER';
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  verificationStatus: 'NOT_VERIFIED' | 'VERIFIED' | 'FAILED';
  dueDate: string;
  startedAt: string;
  completedAt: string;
  verificationNotes: string;
  notes: string;
  vulnerabilityFindingId: string;
  assignedUserId: string;
};

const emptyForm: RemediationForm = {
  actionTitle: '',
  actionDescription: '',
  recommendedFix: '',
  actionType: 'UPDATE_SOFTWARE',
  status: 'PENDING',
  verificationStatus: 'NOT_VERIFIED',
  dueDate: '',
  startedAt: '',
  completedAt: '',
  verificationNotes: '',
  notes: '',
  vulnerabilityFindingId: '',
  assignedUserId: '',
};

function RemediationActions() {
  const [actions, setActions] = useState<RemediationAction[]>([]);
  const [vulnerabilities, setVulnerabilities] = useState<VulnerabilityFinding[]>(
    [],
  );
  const [users, setUsers] = useState<User[]>([]);
  const [form, setForm] = useState<RemediationForm>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const fetchActions = async () => {
    try {
      setLoading(true);
      const response = await api.get('/remediation-actions');
      setActions(response.data.actions);
    } catch {
      setError('Failed to fetch remediation actions');
    } finally {
      setLoading(false);
    }
  };

  const fetchVulnerabilities = async () => {
    const response = await api.get('/vulnerability-findings');
    setVulnerabilities(response.data.findings);

    if (response.data.findings.length > 0) {
      setForm((previous) => ({
        ...previous,
        vulnerabilityFindingId:
          previous.vulnerabilityFindingId || response.data.findings[0].id,
      }));
    }
  };

  const fetchUsers = async () => {
    const response = await api.get('/users');
    setUsers(response.data.users);
  };

  useEffect(() => {
    fetchActions();
    fetchVulnerabilities();
    fetchUsers();
  }, []);

  const handleChange = (field: keyof RemediationForm, value: string) => {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  const resetForm = () => {
    setForm({
      ...emptyForm,
      vulnerabilityFindingId: vulnerabilities[0]?.id || '',
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
        await api.patch(`/remediation-actions/${editingId}`, {
          actionTitle: form.actionTitle,
          actionDescription: form.actionDescription || undefined,
          recommendedFix: form.recommendedFix || undefined,
          actionType: form.actionType,
          status: form.status,
          verificationStatus: form.verificationStatus,
          dueDate: toISOStringOrUndefined(form.dueDate),
          startedAt: toISOStringOrUndefined(form.startedAt),
          completedAt: toISOStringOrUndefined(form.completedAt),
          verificationNotes: form.verificationNotes || undefined,
          notes: form.notes || undefined,
          assignedUserId: form.assignedUserId || undefined,
        });

        setMessage('Remediation action updated successfully');
      } else {
        await api.post('/remediation-actions', {
          actionTitle: form.actionTitle,
          actionDescription: form.actionDescription || undefined,
          recommendedFix: form.recommendedFix || undefined,
          actionType: form.actionType,
          status: form.status,
          verificationStatus: form.verificationStatus,
          dueDate: toISOStringOrUndefined(form.dueDate),
          notes: form.notes || undefined,
          vulnerabilityFindingId: form.vulnerabilityFindingId,
          assignedUserId: form.assignedUserId || undefined,
        });

        setMessage('Remediation action created successfully');
      }

      resetForm();
      fetchActions();
    } catch {
      setError('Failed to save remediation action. Please check the details.');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (action: RemediationAction) => {
    setEditingId(action.id);

    setForm({
      actionTitle: action.actionTitle || '',
      actionDescription: action.actionDescription || '',
      recommendedFix: action.recommendedFix || '',
      actionType: action.actionType,
      status: action.status,
      verificationStatus: action.verificationStatus,
      dueDate: toDateTimeValue(action.dueDate),
      startedAt: toDateTimeValue(action.startedAt),
      completedAt: toDateTimeValue(action.completedAt),
      verificationNotes: action.verificationNotes || '',
      notes: action.notes || '',
      vulnerabilityFindingId: action.vulnerabilityFinding.id,
      assignedUserId: action.assignedUser?.id || '',
    });

    setMessage('');
    setError('');
  };

  const handleDelete = async (id: string) => {
    const confirmed = window.confirm(
      'Are you sure you want to delete this remediation action?',
    );

    if (!confirmed) return;

    try {
      setLoading(true);
      setMessage('');
      setError('');

      await api.delete(`/remediation-actions/${id}`);

      setMessage('Remediation action deleted successfully');
      fetchActions();
    } catch {
      setError('Failed to delete remediation action');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Remediation Actions</h1>
        <p className="text-slate-400 mt-1">
          Track remediation tasks, assigned users, and verification status.
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-1 bg-slate-900 border border-slate-800 rounded-xl p-6">
          <h2 className="text-lg font-bold mb-4">
            {editingId ? 'Update Remediation' : 'Create Remediation'}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!editingId && (
              <div>
                <label className="block text-sm text-slate-300 mb-2">
                  Vulnerability Finding
                </label>
                <select
                  className="w-full rounded-lg bg-slate-950 border border-slate-700 px-4 py-3 text-white outline-none focus:border-cyan-500"
                  value={form.vulnerabilityFindingId}
                  onChange={(event) =>
                    handleChange('vulnerabilityFindingId', event.target.value)
                  }
                  required
                >
                  <option value="">Select vulnerability</option>
                  {vulnerabilities.map((vulnerability) => (
                    <option key={vulnerability.id} value={vulnerability.id}>
                      {vulnerability.cveId || 'No CVE'} - {vulnerability.title}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {editingId && (
              <div className="bg-slate-950 border border-slate-800 rounded-lg p-4 text-sm text-slate-400">
                Vulnerability finding cannot be changed while editing. Create a
                new remediation action if it belongs to another vulnerability.
              </div>
            )}

            <div>
              <label className="block text-sm text-slate-300 mb-2">
                Action Title
              </label>
              <input
                className="w-full rounded-lg bg-slate-950 border border-slate-700 px-4 py-3 text-white outline-none focus:border-cyan-500"
                value={form.actionTitle}
                onChange={(event) =>
                  handleChange('actionTitle', event.target.value)
                }
                required
                placeholder="Update Google Chrome to fixed version"
              />
            </div>

            <div>
              <label className="block text-sm text-slate-300 mb-2">
                Action Description
              </label>
              <textarea
                rows={3}
                className="w-full rounded-lg bg-slate-950 border border-slate-700 px-4 py-3 text-white outline-none focus:border-cyan-500 resize-none"
                value={form.actionDescription}
                onChange={(event) =>
                  handleChange('actionDescription', event.target.value)
                }
                placeholder="Update Chrome from affected version to latest secure version."
              />
            </div>

            <div>
              <label className="block text-sm text-slate-300 mb-2">
                Recommended Fix
              </label>
              <textarea
                rows={3}
                className="w-full rounded-lg bg-slate-950 border border-slate-700 px-4 py-3 text-white outline-none focus:border-cyan-500 resize-none"
                value={form.recommendedFix}
                onChange={(event) =>
                  handleChange('recommendedFix', event.target.value)
                }
                placeholder="Install Google Chrome version 127.0.6533.100 or later."
              />
            </div>

            <div>
              <label className="block text-sm text-slate-300 mb-2">
                Action Type
              </label>
              <select
                className="w-full rounded-lg bg-slate-950 border border-slate-700 px-4 py-3 text-white outline-none focus:border-cyan-500"
                value={form.actionType}
                onChange={(event) =>
                  handleChange('actionType', event.target.value)
                }
              >
                <option value="UPDATE_SOFTWARE">UPDATE_SOFTWARE</option>
                <option value="CONFIGURATION_CHANGE">
                  CONFIGURATION_CHANGE
                </option>
                <option value="REMOVE_SOFTWARE">REMOVE_SOFTWARE</option>
                <option value="ACCEPT_RISK">ACCEPT_RISK</option>
                <option value="VERIFY_PATCH">VERIFY_PATCH</option>
                <option value="OTHER">OTHER</option>
              </select>
            </div>

            <div>
              <label className="block text-sm text-slate-300 mb-2">
                Status
              </label>
              <select
                className="w-full rounded-lg bg-slate-950 border border-slate-700 px-4 py-3 text-white outline-none focus:border-cyan-500"
                value={form.status}
                onChange={(event) => handleChange('status', event.target.value)}
              >
                <option value="PENDING">PENDING</option>
                <option value="IN_PROGRESS">IN_PROGRESS</option>
                <option value="COMPLETED">COMPLETED</option>
                <option value="CANCELLED">CANCELLED</option>
              </select>
            </div>

            <div>
              <label className="block text-sm text-slate-300 mb-2">
                Verification Status
              </label>
              <select
                className="w-full rounded-lg bg-slate-950 border border-slate-700 px-4 py-3 text-white outline-none focus:border-cyan-500"
                value={form.verificationStatus}
                onChange={(event) =>
                  handleChange('verificationStatus', event.target.value)
                }
              >
                <option value="NOT_VERIFIED">NOT_VERIFIED</option>
                <option value="VERIFIED">VERIFIED</option>
                <option value="FAILED">FAILED</option>
              </select>
            </div>

            <div>
              <label className="block text-sm text-slate-300 mb-2">
                Assigned User Optional
              </label>
              <select
                className="w-full rounded-lg bg-slate-950 border border-slate-700 px-4 py-3 text-white outline-none focus:border-cyan-500"
                value={form.assignedUserId}
                onChange={(event) =>
                  handleChange('assignedUserId', event.target.value)
                }
              >
                <option value="">Not assigned</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.firstName} {user.lastName} - {user.email}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm text-slate-300 mb-2">
                Due Date
              </label>
              <input
                type="datetime-local"
                className="w-full rounded-lg bg-slate-950 border border-slate-700 px-4 py-3 text-white outline-none focus:border-cyan-500"
                value={form.dueDate}
                onChange={(event) => handleChange('dueDate', event.target.value)}
              />
            </div>

            {editingId && (
              <>
                <div>
                  <label className="block text-sm text-slate-300 mb-2">
                    Started At
                  </label>
                  <input
                    type="datetime-local"
                    className="w-full rounded-lg bg-slate-950 border border-slate-700 px-4 py-3 text-white outline-none focus:border-cyan-500"
                    value={form.startedAt}
                    onChange={(event) =>
                      handleChange('startedAt', event.target.value)
                    }
                  />
                </div>

                <div>
                  <label className="block text-sm text-slate-300 mb-2">
                    Completed At
                  </label>
                  <input
                    type="datetime-local"
                    className="w-full rounded-lg bg-slate-950 border border-slate-700 px-4 py-3 text-white outline-none focus:border-cyan-500"
                    value={form.completedAt}
                    onChange={(event) =>
                      handleChange('completedAt', event.target.value)
                    }
                  />
                </div>

                <div>
                  <label className="block text-sm text-slate-300 mb-2">
                    Verification Notes
                  </label>
                  <textarea
                    rows={3}
                    className="w-full rounded-lg bg-slate-950 border border-slate-700 px-4 py-3 text-white outline-none focus:border-cyan-500 resize-none"
                    value={form.verificationNotes}
                    onChange={(event) =>
                      handleChange('verificationNotes', event.target.value)
                    }
                    placeholder="Patch verified successfully."
                  />
                </div>
              </>
            )}

            <div>
              <label className="block text-sm text-slate-300 mb-2">
                Notes
              </label>
              <textarea
                rows={3}
                className="w-full rounded-lg bg-slate-950 border border-slate-700 px-4 py-3 text-white outline-none focus:border-cyan-500 resize-none"
                value={form.notes}
                onChange={(event) => handleChange('notes', event.target.value)}
                placeholder="Initial remediation task created."
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
            <h2 className="text-lg font-bold">Remediation List</h2>
            <button
              onClick={fetchActions}
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
                  <th className="py-3 pr-4">Action</th>
                  <th className="py-3 pr-4">Vulnerability</th>
                  <th className="py-3 pr-4">Software</th>
                  <th className="py-3 pr-4">Device</th>
                  <th className="py-3 pr-4">Assigned</th>
                  <th className="py-3 pr-4">Status</th>
                  <th className="py-3 pr-4">Verify</th>
                  <th className="py-3 pr-4">Actions</th>
                </tr>
              </thead>

              <tbody>
                {actions.map((action) => (
                  <tr
                    key={action.id}
                    className="border-b border-slate-800 text-slate-200"
                  >
                    <td className="py-4 pr-4 font-medium">
                      {action.actionTitle}
                    </td>
                    <td className="py-4 pr-4">
                      {action.vulnerabilityFinding?.cveId || 'No CVE'}
                    </td>
                    <td className="py-4 pr-4">
                      {action.softwareInventory?.softwareName || '-'}
                    </td>
                    <td className="py-4 pr-4">
                      {action.device?.hostname || '-'}
                    </td>
                    <td className="py-4 pr-4">
                      {action.assignedUser
                        ? `${action.assignedUser.firstName} ${action.assignedUser.lastName}`
                        : '-'}
                    </td>
                    <td className="py-4 pr-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          action.status === 'COMPLETED'
                            ? 'bg-green-950 text-green-400 border border-green-800'
                            : action.status === 'IN_PROGRESS'
                              ? 'bg-yellow-950 text-yellow-400 border border-yellow-800'
                              : action.status === 'CANCELLED'
                                ? 'bg-red-950 text-red-400 border border-red-800'
                                : 'bg-slate-800 text-slate-300 border border-slate-700'
                        }`}
                      >
                        {action.status}
                      </span>
                    </td>
                    <td className="py-4 pr-4">
                      {action.verificationStatus}
                    </td>
                    <td className="py-4 pr-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(action)}
                          className="bg-blue-500 hover:bg-blue-400 text-white px-3 py-2 rounded-lg text-xs font-semibold"
                        >
                          Edit
                        </button>

                        <button
                          onClick={() => handleDelete(action.id)}
                          className="bg-red-500 hover:bg-red-400 text-white px-3 py-2 rounded-lg text-xs font-semibold"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {actions.length === 0 && !loading && (
                  <tr>
                    <td
                      colSpan={8}
                      className="py-8 text-center text-slate-400"
                    >
                      No remediation actions found.
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

export default RemediationActions;