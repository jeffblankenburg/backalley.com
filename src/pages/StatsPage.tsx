import { useState } from 'react';
import { useGames } from '../hooks/useGames.ts';
import { usePlayers } from '../hooks/usePlayers.ts';
import { useAuthContext } from '../context/AuthContext.tsx';
import { StatsDashboard } from '../components/stats/StatsDashboard.tsx';
import { simulateGame } from '../lib/simulate.ts';
import { createCompletedGameInSupabase } from '../lib/supabaseGameService.ts';
import { PLAYER_COUNT } from '../lib/constants.ts';

export function StatsPage() {
  const { games, refetch } = useGames();
  const { players } = usePlayers();
  const { user } = useAuthContext();
  const [simulating, setSimulating] = useState(false);

  async function handleSimulate(count: number) {
    if (players.length < PLAYER_COUNT || !user) return;
    setSimulating(true);
    try {
      for (let i = 0; i < count; i++) {
        const shuffled = [...players].sort(() => Math.random() - 0.5);
        const selected = shuffled.slice(0, PLAYER_COUNT).map((p) => p.id);
        const dealerIndex = Math.floor(Math.random() * PLAYER_COUNT);
        const game = simulateGame(selected, dealerIndex);
        await createCompletedGameInSupabase(game, user.id);
      }
      await refetch();
    } finally {
      setSimulating(false);
    }
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">Statistics</h2>

      {players.length >= PLAYER_COUNT && (
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => handleSimulate(1)}
            disabled={simulating}
            className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-700 text-sm font-medium disabled:opacity-40 transition-colors hover:bg-slate-300 dark:hover:bg-slate-600"
          >
            {simulating ? 'Simulating...' : 'Simulate 1 Game'}
          </button>
          <button
            onClick={() => handleSimulate(5)}
            disabled={simulating}
            className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-700 text-sm font-medium disabled:opacity-40 transition-colors hover:bg-slate-300 dark:hover:bg-slate-600"
          >
            Simulate 5
          </button>
          <button
            onClick={() => handleSimulate(20)}
            disabled={simulating}
            className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-700 text-sm font-medium disabled:opacity-40 transition-colors hover:bg-slate-300 dark:hover:bg-slate-600"
          >
            Simulate 20
          </button>
        </div>
      )}

      {players.length < PLAYER_COUNT && (
        <p className="text-sm text-amber-500 dark:text-amber-400">
          Add at least {PLAYER_COUNT} players to simulate games.
        </p>
      )}

      <StatsDashboard games={games} players={players} />
    </div>
  );
}
