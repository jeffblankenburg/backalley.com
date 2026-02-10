import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAdmin } from '../hooks/useAdmin.ts';
import { useAuthContext } from '../context/AuthContext.tsx';
import { formatDateTime } from '../lib/utils.ts';
import type { Profile } from '../types/index.ts';

export function AdminPage() {
  const { user } = useAuthContext();
  const { profiles, isAdmin, loading, updateProfile } = useAdmin();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editFirst, setEditFirst] = useState('');
  const [editLast, setEditLast] = useState('');
  const [editIsAdmin, setEditIsAdmin] = useState(false);
  const [editDisabled, setEditDisabled] = useState(false);
  const [tab, setTab] = useState<'active' | 'disabled'>('active');

  if (loading) {
    return <p className="text-center py-12 text-slate-500">Loading...</p>;
  }

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  function startEdit(profile: Profile) {
    setEditingId(profile.id);
    setEditFirst(profile.first_name);
    setEditLast(profile.last_name);
    setEditIsAdmin(profile.is_admin);
    setEditDisabled(profile.disabled);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditFirst('');
    setEditLast('');
    setEditIsAdmin(false);
    setEditDisabled(false);
  }

  async function saveEdit(id: string) {
    if (editFirst.trim() && editLast.trim()) {
      const displayName = `${editFirst.trim()} ${editLast.trim()}`;
      const isCurrentUser = id === user?.id;
      await updateProfile(id, {
        display_name: displayName,
        first_name: editFirst.trim(),
        last_name: editLast.trim(),
        ...(!isCurrentUser && { is_admin: editIsAdmin, disabled: editDisabled }),
      });
    }
    cancelEdit();
  }

  const activeProfiles = profiles.filter((p) => !p.disabled);
  const disabledProfiles = profiles.filter((p) => p.disabled);
  const visibleProfiles = tab === 'active' ? activeProfiles : disabledProfiles;

  function renderProfile(profile: Profile) {
    const isCurrentUser = profile.id === user?.id;
    const isEditing = editingId === profile.id;

    return (
      <div
        key={profile.id}
        className={[
          'p-3 rounded-xl border space-y-2',
          profile.disabled
            ? 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 opacity-60'
            : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700',
        ].join(' ')}
      >
        <div className="flex items-center gap-2">
          {isEditing ? (
            <form
              onSubmit={(e) => { e.preventDefault(); saveEdit(profile.id); }}
              className="min-w-0 flex-1 space-y-2"
            >
              <div className="flex gap-2">
                <input
                  type="text"
                  value={editFirst}
                  onChange={(e) => setEditFirst(e.target.value)}
                  placeholder="First"
                  maxLength={20}
                  autoFocus
                  className="min-w-0 flex-1 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
                <input
                  type="text"
                  value={editLast}
                  onChange={(e) => setEditLast(e.target.value)}
                  placeholder="Last"
                  maxLength={20}
                  className="min-w-0 flex-1 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>
              {!isCurrentUser && (
                <div className="flex gap-4 text-sm">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editIsAdmin}
                      onChange={(e) => setEditIsAdmin(e.target.checked)}
                      className="rounded"
                    />
                    <span className="text-slate-600 dark:text-slate-400">Admin</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editDisabled}
                      onChange={(e) => setEditDisabled(e.target.checked)}
                      className="rounded"
                    />
                    <span className="text-red-500">Disabled</span>
                  </label>
                </div>
              )}
              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={cancelEdit}
                  className="px-3 py-1.5 text-sm rounded-lg bg-slate-200 dark:bg-slate-600 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 text-sm rounded-lg bg-blue-500 text-white font-medium"
                >
                  Save
                </button>
              </div>
            </form>
          ) : (
            <>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium truncate">{profile.display_name}</span>
                  {profile.is_admin && (
                    <span className="text-xs px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 font-medium">
                      Admin
                    </span>
                  )}
                  {!profile.confirmed && (
                    <span className="text-xs px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 font-medium">
                      Invited
                    </span>
                  )}
                  {isCurrentUser && (
                    <span className="text-xs text-blue-500">(you)</span>
                  )}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                  {profile.email ?? 'No email'}
                </p>
                <p className="text-xs text-slate-400 dark:text-slate-500">
                  Joined {formatDateTime(new Date(profile.created_at).getTime())}
                </p>
              </div>

              <button
                onClick={() => startEdit(profile)}
                className="px-2.5 py-1.5 text-xs rounded-lg bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
              >
                Edit
              </button>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">Admin: User Accounts</h2>

      <div className="flex gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-800">
        <button
          onClick={() => setTab('active')}
          className={[
            'flex-1 py-2 text-sm font-medium rounded-lg transition-colors',
            tab === 'active'
              ? 'bg-white dark:bg-slate-700 shadow-sm'
              : 'text-slate-500 dark:text-slate-400',
          ].join(' ')}
        >
          Active ({activeProfiles.length})
        </button>
        <button
          onClick={() => setTab('disabled')}
          className={[
            'flex-1 py-2 text-sm font-medium rounded-lg transition-colors',
            tab === 'disabled'
              ? 'bg-white dark:bg-slate-700 shadow-sm'
              : 'text-slate-500 dark:text-slate-400',
          ].join(' ')}
        >
          Disabled ({disabledProfiles.length})
        </button>
      </div>

      <div className="space-y-2">
        {visibleProfiles.length === 0 ? (
          <p className="text-center text-slate-500 dark:text-slate-400 py-8">
            {tab === 'active' ? 'No active accounts.' : 'No disabled accounts.'}
          </p>
        ) : (
          visibleProfiles.map(renderProfile)
        )}
      </div>

    </div>
  );
}
