import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAdmin } from '../hooks/useAdmin.ts';
import { useAuthContext } from '../context/AuthContext.tsx';
import { ConfirmDialog } from '../components/common/ConfirmDialog.tsx';
import { formatDateTime } from '../lib/utils.ts';
import type { Profile } from '../types/index.ts';

export function AdminPage() {
  const { user } = useAuthContext();
  const { profiles, isAdmin, loading, updateProfile } = useAdmin();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editFirst, setEditFirst] = useState('');
  const [editLast, setEditLast] = useState('');
  const [disablingId, setDisablingId] = useState<string | null>(null);
  const [tab, setTab] = useState<'active' | 'disabled'>('active');

  if (loading) {
    return <p className="text-center py-12 text-slate-500">Loading...</p>;
  }

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  function startEdit(id: string, first: string, last: string) {
    setEditingId(id);
    setEditFirst(first);
    setEditLast(last);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditFirst('');
    setEditLast('');
  }

  async function saveEdit(id: string) {
    if (editFirst.trim() && editLast.trim()) {
      const displayName = `${editFirst.trim()} ${editLast.trim()}`;
      await updateProfile(id, { display_name: displayName, first_name: editFirst.trim(), last_name: editLast.trim() });
    }
    cancelEdit();
  }

  async function toggleAdmin(id: string, currentValue: boolean) {
    if (id === user?.id) return;
    await updateProfile(id, { is_admin: !currentValue });
  }

  const disablingProfile = profiles.find((p) => p.id === disablingId);

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
              className="flex-1 space-y-2"
            >
              <div className="flex gap-2">
                <input
                  type="text"
                  value={editFirst}
                  onChange={(e) => setEditFirst(e.target.value)}
                  placeholder="First"
                  maxLength={20}
                  autoFocus
                  className="flex-1 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
                <input
                  type="text"
                  value={editLast}
                  onChange={(e) => setEditLast(e.target.value)}
                  placeholder="Last"
                  maxLength={20}
                  className="flex-1 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>
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

              <div className="flex gap-1.5 flex-wrap justify-end">
                <button
                  onClick={() => startEdit(profile.id, profile.first_name, profile.last_name)}
                  className="px-2.5 py-1.5 text-xs rounded-lg bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                >
                  Edit
                </button>
                {!isCurrentUser && (
                  <button
                    onClick={() => toggleAdmin(profile.id, profile.is_admin)}
                    className={[
                      'px-2.5 py-1.5 text-xs rounded-lg transition-colors',
                      profile.is_admin
                        ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 hover:bg-amber-200 dark:hover:bg-amber-900/50'
                        : 'bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600',
                    ].join(' ')}
                  >
                    {profile.is_admin ? 'Remove Admin' : 'Make Admin'}
                  </button>
                )}
                {!isCurrentUser && (
                  <button
                    onClick={() => {
                      if (profile.disabled) {
                        updateProfile(profile.id, { disabled: false });
                      } else {
                        setDisablingId(profile.id);
                      }
                    }}
                    className={[
                      'px-2.5 py-1.5 text-xs rounded-lg transition-colors',
                      profile.disabled
                        ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-200 dark:hover:bg-emerald-900/50'
                        : 'text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20',
                    ].join(' ')}
                  >
                    {profile.disabled ? 'Enable' : 'Disable'}
                  </button>
                )}
              </div>
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

      <ConfirmDialog
        open={!!disablingId}
        title="Disable Account"
        message={`Disable ${disablingProfile?.display_name ?? 'this user'}? They won't be able to sign in or appear in player lists. Their game history will be preserved. This can be reversed.`}
        confirmLabel="Disable Account"
        onConfirm={async () => {
          if (disablingId) {
            await updateProfile(disablingId, { disabled: true });
          }
          setDisablingId(null);
        }}
        onCancel={() => setDisablingId(null)}
      />
    </div>
  );
}
