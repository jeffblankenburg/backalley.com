import { useState, useCallback } from 'react';
import type { Profile } from '../../types/index.ts';

interface PlayerSearchProps {
  onSearch: (query: string) => Promise<Profile[]>;
  onAdd: (friendId: string) => void;
}

export function PlayerSearch({ onSearch, onAdd }: PlayerSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Profile[]>([]);
  const [searching, setSearching] = useState(false);

  const handleSearch = useCallback(async (value: string) => {
    setQuery(value);
    if (value.trim().length < 2) {
      setResults([]);
      return;
    }
    setSearching(true);
    const profiles = await onSearch(value);
    setResults(profiles);
    setSearching(false);
  }, [onSearch]);

  function handleAdd(id: string) {
    onAdd(id);
    setResults((prev) => prev.filter((p) => p.id !== id));
  }

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-slate-600 dark:text-slate-400">
        Find Players
      </label>
      <input
        type="text"
        value={query}
        onChange={(e) => handleSearch(e.target.value)}
        placeholder="Search by name..."
        className="w-full px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
      />

      {searching && (
        <p className="text-sm text-slate-500 dark:text-slate-400">Searching...</p>
      )}

      {results.length > 0 && (
        <div className="space-y-1">
          {results.map((profile) => (
            <div
              key={profile.id}
              className="flex items-center gap-3 p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
            >
              <div className="flex-1 min-w-0">
                <span className="font-medium truncate block">{profile.display_name}</span>
              </div>
              <button
                onClick={() => handleAdd(profile.id)}
                className="px-3 py-1.5 text-sm rounded-lg bg-blue-500 text-white font-medium transition-colors hover:bg-blue-600"
              >
                Add
              </button>
            </div>
          ))}
        </div>
      )}

      {query.trim().length >= 2 && !searching && results.length === 0 && (
        <p className="text-sm text-slate-500 dark:text-slate-400">
          No players found. Use the invite section below to invite them by email.
        </p>
      )}
    </div>
  );
}
