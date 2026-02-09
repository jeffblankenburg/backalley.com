import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthContext } from '../context/AuthContext.tsx';

export function LoginPage() {
  const { user, signInWithMagicLink } = useAuthContext();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Already logged in — skip to app
  if (user) {
    return <Navigate to="/" replace />;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setSubmitting(true);
    setError(null);
    const { error } = await signInWithMagicLink(email.trim());
    setSubmitting(false);
    if (error) {
      setError(error.message);
    } else {
      setSent(true);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 dark:bg-slate-950 px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">Back Alley</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Card Game Scorekeeper</p>
        </div>

        {sent ? (
          <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 text-center space-y-2">
            <p className="font-medium text-emerald-700 dark:text-emerald-300">Check your email!</p>
            <p className="text-sm text-emerald-600 dark:text-emerald-400">
              We sent a sign-in link to <strong>{email}</strong>
            </p>
            <p className="text-xs text-emerald-600/70 dark:text-emerald-400/70">
              Click the link in your email to continue.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1.5">
                Email address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@email.com"
                required
                autoFocus
                className="w-full px-4 py-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-slate-100"
              />
            </div>
            {error && (
              <p className="text-sm text-red-500">{error}</p>
            )}
            <button
              type="submit"
              disabled={submitting || !email.trim()}
              className="w-full py-3 rounded-xl bg-blue-500 text-white font-bold text-lg disabled:opacity-40 transition-colors hover:bg-blue-600"
            >
              {submitting ? 'Sending...' : 'Continue with Email'}
            </button>
            <p className="text-xs text-center text-slate-400 dark:text-slate-500">
              We'll send you a sign-in link. No password needed.
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
