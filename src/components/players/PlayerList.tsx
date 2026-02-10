import type { Profile } from '../../types/index.ts';

interface FriendsListProps {
  friends: Profile[];
  onRemove: (friendId: string) => void;
}

export function FriendsList({ friends, onRemove }: FriendsListProps) {
  if (friends.length === 0) {
    return (
      <p className="text-center text-slate-500 dark:text-slate-400 py-4">
        No friends added yet. Search for players or invite them by email below.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {friends.map((friend) => (
        <div
          key={friend.id}
          className="flex items-center gap-3 p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
        >
          <div className="flex-1 min-w-0">
            <span className="font-medium truncate block">{friend.display_name}</span>
          </div>
          <button
            onClick={() => onRemove(friend.id)}
            className="px-3 py-1.5 text-sm rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
          >
            Remove
          </button>
        </div>
      ))}
    </div>
  );
}
