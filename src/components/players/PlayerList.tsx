import { useState } from 'react';
import { usePlayers } from '../../hooks/usePlayers.ts';
import { useAuthContext } from '../../context/AuthContext.tsx';
import { PlayerForm } from './PlayerForm.tsx';

export function ProfileList() {
  const { profiles, updateDisplayName } = usePlayers();
  const { user } = useAuthContext();
  const [editingId, setEditingId] = useState<string | null>(null);

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-500 dark:text-slate-400">
        Players are user accounts. You can edit your own display name below.
      </p>

      <div className="space-y-2">
        {profiles.map((profile) => {
          const isCurrentUser = profile.id === user?.id;
          return (
            <div
              key={profile.id}
              className="flex items-center gap-3 p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
            >
              {editingId === profile.id ? (
                <PlayerForm
                  initialName={profile.display_name}
                  submitLabel="Save"
                  onSubmit={(name) => {
                    updateDisplayName(profile.id, name);
                    setEditingId(null);
                  }}
                  onCancel={() => setEditingId(null)}
                />
              ) : (
                <>
                  <span className="flex-1 font-medium">
                    {profile.display_name}
                    {isCurrentUser && (
                      <span className="ml-2 text-xs text-blue-500">(you)</span>
                    )}
                  </span>
                  {isCurrentUser && (
                    <button
                      onClick={() => setEditingId(profile.id)}
                      className="px-3 py-1.5 text-sm rounded-lg bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                    >
                      Edit
                    </button>
                  )}
                </>
              )}
            </div>
          );
        })}

        {profiles.length === 0 && (
          <p className="text-center text-slate-500 dark:text-slate-400 py-8">
            No players yet. Invite friends to sign up!
          </p>
        )}
      </div>
    </div>
  );
}
