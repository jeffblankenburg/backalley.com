import { useParams, Link, useNavigate } from 'react-router-dom';
import { useGameDetail } from '../hooks/useGameDetail.ts';
import { usePlayers } from '../hooks/usePlayers.ts';
import { useGameStore } from '../store/gameStore.ts';
import { useAuthContext } from '../context/AuthContext.tsx';
import { GameRoundTable } from '../components/history/GameRoundTable.tsx';
import { AnnounceScoresButton } from '../components/game/AnnounceScoresButton.tsx';

export function GameSummaryPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { game } = useGameDetail(id);
  const { players } = usePlayers();
  const createGame = useGameStore((s) => s.createGame);
  const { user } = useAuthContext();

  if (!game) {
    return <p className="text-center py-12 text-slate-500">Loading...</p>;
  }

  const lastRound = game.rounds[game.rounds.length - 1];
  const standings = game.playerIds
    .map((pid) => {
      const pr = lastRound?.playerRounds.find((p) => p.playerId === pid);
      const player = players.find((p) => p.id === pid);
      return { name: player?.name ?? '?', score: pr?.cumulativeScore ?? 0 };
    })
    .sort((a, b) => b.score - a.score);

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="text-4xl mb-2">🏆</div>
        <h2 className="text-2xl font-bold">Game Summary</h2>
      </div>

      <div className="space-y-2">
        {standings.map((s, i) => (
          <div
            key={i}
            className={`flex justify-between p-3 rounded-xl border ${
              i === 0
                ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800'
                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'
            }`}
          >
            <span className={`font-medium ${i === 0 ? 'text-emerald-600 dark:text-emerald-400' : ''}`}>
              {i + 1}. {s.name}
            </span>
            <span className="font-mono font-bold">{s.score}</span>
          </div>
        ))}
      </div>

      <GameRoundTable game={game} players={players} />

      <AnnounceScoresButton game={game} players={players} currentRoundIndex={game.rounds.length - 1} />

      <button
        onClick={async () => {
          if (!user) return;
          const nextDealer = (game.startingDealerIndex + 1) % game.playerIds.length;
          const newId = await createGame(game.playerIds, nextDealer, user.id);
          navigate(`/game/${newId}`);
        }}
        className="w-full py-3 rounded-xl bg-emerald-500 text-white font-bold transition-colors hover:bg-emerald-600"
      >
        Play Again
      </button>

      <Link
        to="/"
        className="block w-full py-3 rounded-xl bg-blue-500 text-white font-bold text-center transition-colors hover:bg-blue-600"
      >
        Back to Home
      </Link>
    </div>
  );
}
