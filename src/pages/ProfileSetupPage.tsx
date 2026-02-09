import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuthContext } from '../context/AuthContext.tsx';
import { supabase } from '../lib/supabase.ts';

export function ProfileSetupPage() {
  const { user } = useAuthContext();
  const navigate = useNavigate();
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Already completed profile — go home
  if (user?.user_metadata?.profile_complete) {
    return <Navigate to="/" replace />;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const name = displayName.trim();
    if (!name || !user) return;

    setSubmitting(true);
    setError(null);

    // Update the profiles table
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ display_name: name })
      .eq('id', user.id);

    if (profileError) {
      setError(profileError.message);
      setSubmitting(false);
      return;
    }

    // Mark profile as complete in user metadata
    const { error: authError } = await supabase.auth.updateUser({
      data: { profile_complete: true, display_name: name },
    });

    if (authError) {
      setError(authError.message);
      setSubmitting(false);
      return;
    }

    navigate('/', { replace: true });
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 dark:bg-slate-950 px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">Welcome!</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Set up your player profile to get started.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="displayName" className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1.5">
              Display name
            </label>
            <input
              id="displayName"
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="What should we call you?"
              required
              autoFocus
              maxLength={20}
              className="w-full px-4 py-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-slate-100"
            />
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
              This is the name other players will see.
            </p>
          </div>

          {error && (
            <p className="text-sm text-red-500">{error}</p>
          )}

          <button
            type="submit"
            disabled={submitting || !displayName.trim()}
            className="w-full py-3 rounded-xl bg-emerald-500 text-white font-bold text-lg disabled:opacity-40 transition-colors hover:bg-emerald-600"
          >
            {submitting ? 'Saving...' : 'Let\'s Go'}
          </button>
        </form>
      </div>
    </div>
  );
}
