import { useState } from 'react';
import { useFriends } from '../hooks/useFriends.ts';
import { usePlayers } from '../hooks/usePlayers.ts';
import { useAuthContext } from '../context/AuthContext.tsx';
import { FriendsList } from '../components/players/PlayerList.tsx';
import { PlayerSearch } from '../components/players/PlayerSearch.tsx';
import { InviteForm } from '../components/players/InviteForm.tsx';

export function PlayersPage() {
  const { user } = useAuthContext();
  const { profiles, updateName } = usePlayers();
  const { friends, loading, addFriend, removeFriend, searchProfiles, inviteByEmail } = useFriends();
  const [editingName, setEditingName] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');

  const currentProfile = profiles.find((p) => p.id === user?.id);

  function startEdit() {
    if (!currentProfile) return;
    setFirstName(currentProfile.first_name);
    setLastName(currentProfile.last_name);
    setEditingName(true);
  }

  function saveEdit() {
    if (!currentProfile || !firstName.trim() || !lastName.trim()) return;
    updateName(currentProfile.id, firstName, lastName);
    setEditingName(false);
  }

  const [friendsOpen, setFriendsOpen] = useState(true);

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">Friends</h2>

      {/* Own profile */}
      {currentProfile && (
        <div className="p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
          {editingName ? (
            <form onSubmit={(e) => { e.preventDefault(); saveEdit(); }} className="space-y-2">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="First"
                  maxLength={20}
                  autoFocus
                  className="min-w-0 flex-1 px-3 py-2 rounded-lg bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Last"
                  maxLength={20}
                  className="min-w-0 flex-1 px-3 py-2 rounded-lg bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>
              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setEditingName(false)}
                  className="px-3 py-2 rounded-lg bg-slate-200 dark:bg-slate-700 text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!firstName.trim() || !lastName.trim()}
                  className="px-4 py-2 rounded-lg bg-blue-500 text-white text-sm font-medium disabled:opacity-40"
                >
                  Save
                </button>
              </div>
            </form>
          ) : (
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <span className="font-medium">{currentProfile.display_name}</span>
                <span className="ml-2 text-xs text-blue-500">(you)</span>
              </div>
              <button
                onClick={startEdit}
                className="px-3 py-1.5 text-sm rounded-lg bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
              >
                Edit
              </button>
            </div>
          )}
        </div>
      )}

      {/* Search for existing users */}
      <PlayerSearch onSearch={searchProfiles} onAdd={addFriend} />

      {/* Invite by email */}
      <InviteForm onInvite={inviteByEmail} />

      {/* Friends list (collapsible) */}
      <div>
        <button
          type="button"
          onClick={() => setFriendsOpen(!friendsOpen)}
          className="flex items-center gap-2 w-full text-left"
        >
          <span className={['text-xs text-slate-400 transition-transform', friendsOpen ? 'rotate-90' : ''].join(' ')}>
            &#9654;
          </span>
          <h3 className="text-sm font-medium text-slate-600 dark:text-slate-400">
            Your Friends ({friends.length})
          </h3>
        </button>
        {friendsOpen && (
          <div className="mt-2">
            {loading ? (
              <p className="text-sm text-slate-500 dark:text-slate-400">Loading...</p>
            ) : (
              <FriendsList friends={friends} onRemove={removeFriend} />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
