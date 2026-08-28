import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/api';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    try {
      const response = await api.post('/auth/forgot-password', { email });
      setMessage(response.data.message);
    } catch {
      setMessage('Unable to process the request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-8">
        <h1 className="text-center text-3xl font-bold">Forgot password</h1>
        <p className="mt-2 text-center text-slate-400">Enter your account email to receive a secure reset link.</p>
        <form onSubmit={submit} className="mt-8 space-y-5">
          <input type="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Email address" className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-cyan-500" />
          {message && <p className="rounded-lg border border-cyan-800 bg-cyan-950 p-3 text-sm text-cyan-200">{message}</p>}
          <button disabled={loading} className="w-full rounded-lg bg-cyan-500 py-3 font-semibold text-slate-950 disabled:opacity-60">{loading ? 'Sending...' : 'Send reset link'}</button>
        </form>
        <Link to="/" className="mt-5 block text-center text-sm text-cyan-400">Back to login</Link>
      </div>
    </div>
  );
}
