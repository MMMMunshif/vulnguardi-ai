import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../api/api';

export default function ResetPassword() {
  const [params] = useSearchParams();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    if (password !== confirmPassword) return setError('Passwords do not match.');
    const token = params.get('token');
    if (!token) return setError('Password reset link is invalid.');
    setLoading(true);
    try {
      const response = await api.post('/auth/reset-password', { token, password });
      setMessage(response.data.message);
    } catch (requestError: any) {
      setError(requestError.response?.data?.message || 'Unable to reset password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-8">
        <h1 className="text-center text-3xl font-bold">Reset password</h1>
        <form onSubmit={submit} className="mt-8 space-y-5">
          <input type="password" required minLength={8} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="New password" className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-cyan-500" />
          <input type="password" required minLength={8} value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} placeholder="Confirm new password" className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-cyan-500" />
          {error && <p className="rounded-lg border border-red-800 bg-red-950 p-3 text-sm text-red-300">{error}</p>}
          {message && <p className="rounded-lg border border-green-800 bg-green-950 p-3 text-sm text-green-300">{message}. You can now sign in.</p>}
          {!message && <button disabled={loading} className="w-full rounded-lg bg-cyan-500 py-3 font-semibold text-slate-950 disabled:opacity-60">{loading ? 'Resetting...' : 'Reset password'}</button>}
        </form>
        <Link to="/" className="mt-5 block text-center text-sm text-cyan-400">Back to login</Link>
      </div>
    </div>
  );
}
