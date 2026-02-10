import { useGames } from '../hooks/useGames.ts';
import { usePlayers } from '../hooks/usePlayers.ts';
import { GameList } from '../components/history/GameList.tsx';

export function HistoryPage() {
  const { games, loading: gamesLoading } = useGames();
  const { players, loading: playersLoading } = usePlayers();

  if (gamesLoading || playersLoading) {
    return <p className="text-center py-12 text-slate-500 dark:text-slate-400">Loading...</p>;
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">Game History</h2>
      <GameList games={games} players={players} />
    </div>
  );
}
