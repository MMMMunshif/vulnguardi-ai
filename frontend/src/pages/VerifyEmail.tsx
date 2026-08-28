import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../api/api';

export default function VerifyEmail() {
  const [params] = useSearchParams();
  const token = params.get('token');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) return;
    const timer = window.setTimeout(() => {
      void api.post('/auth/verify-email', { token })
        .then((response) => setMessage(response.data.message))
        .catch((requestError) => setError(requestError.response?.data?.message || 'Unable to verify email.'));
    }, 0);
    return () => window.clearTimeout(timer);
  }, [token]);

  const resend = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    try {
      const response = await api.post('/auth/resend-verification', { email });
      setMessage(response.data.message);
    } catch {
      setError('Unable to send a verification link.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-8">
        <h1 className="text-center text-3xl font-bold">Verify email</h1>
        {token && !message && !error && <p className="mt-6 text-center text-slate-400">Verifying your secure link...</p>}
        {message && <p className="mt-6 rounded-lg border border-green-800 bg-green-950 p-3 text-green-300">{message}</p>}
        {error && <p className="mt-6 rounded-lg border border-red-800 bg-red-950 p-3 text-red-300">{error}</p>}
        {!token && (
          <form onSubmit={resend} className="mt-6 space-y-4">
            <p className="text-sm text-slate-400">Enter your email to receive a new verification link.</p>
            <input type="email" required value={email} onChange={(event) => setEmail(event.target.value)} className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-cyan-500" placeholder="Email address" />
            <button className="w-full rounded-lg bg-cyan-500 py-3 font-semibold text-slate-950">Resend verification link</button>
          </form>
        )}
        <Link to="/" className="mt-5 block text-center text-sm text-cyan-400">Back to login</Link>
      </div>
    </div>
  );
}
