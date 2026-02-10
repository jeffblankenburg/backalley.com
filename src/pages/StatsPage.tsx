import { useGames } from '../hooks/useGames.ts';
import { usePlayers } from '../hooks/usePlayers.ts';
import { useAuthContext } from '../context/AuthContext.tsx';
import { StatsDashboard } from '../components/stats/StatsDashboard.tsx';

export function StatsPage() {
  const { games, loading: gamesLoading } = useGames();
  const { players, loading: playersLoading } = usePlayers();
  const { user } = useAuthContext();

  if (!user) return null;

  if (gamesLoading || playersLoading) {
    return <p className="text-center py-12 text-slate-500 dark:text-slate-400">Loading...</p>;
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">Statistics</h2>
      <StatsDashboard games={games} players={players} userId={user.id} />
    </div>
  );
}
