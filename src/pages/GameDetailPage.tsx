import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useGameDetail } from '../hooks/useGameDetail.ts';
import { usePlayers } from '../hooks/usePlayers.ts';
import { useAuthContext } from '../context/AuthContext.tsx';
import { GameRoundTable } from '../components/history/GameRoundTable.tsx';
import { ConfirmDialog } from '../components/common/ConfirmDialog.tsx';
import { deleteGameFromSupabase } from '../lib/supabaseGameService.ts';
import { formatDateTime } from '../lib/utils.ts';

export function GameDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { game } = useGameDetail(id);
  const { players } = usePlayers();
  const { user } = useAuthContext();
  const navigate = useNavigate();
  const [showDelete, setShowDelete] = useState(false);

  if (!game) {
    return <p className="text-center py-12 text-slate-500">Loading...</p>;
  }

  const isCreator = user?.id === game.createdBy;

  const lastRound = game.rounds[game.rounds.length - 1];
  const standings = game.playerIds
    .map((pid) => {
      const pr = lastRound?.playerRounds.find((p) => p.playerId === pid);
      const player = players.find((p) => p.id === pid);
      return { name: player?.name ?? '?', score: pr?.cumulativeScore ?? 0 };
    })
    .sort((a, b) => b.score - a.score);

  async function handleDelete() {
    if (!id) return;
    await deleteGameFromSupabase(id);
    navigate('/history');
  }

  return (
    <div className="space-y-4">
      <Link to="/history" className="text-blue-500 text-sm hover:underline">
        &larr; Back to History
      </Link>

      <div>
        <h2 className="text-xl font-bold">Game Detail</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">{formatDateTime(game.createdAt)}</p>
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

      {isCreator && (
        <button
          onClick={() => setShowDelete(true)}
          className="w-full py-2.5 rounded-xl text-red-500 border border-red-300 dark:border-red-800 text-sm font-medium transition-colors hover:bg-red-50 dark:hover:bg-red-900/20"
        >
          Delete Game
        </button>
      )}

      <ConfirmDialog
        open={showDelete}
        title="Delete Game"
        message="This will permanently remove this game and all its data from the system. This cannot be undone."
        confirmLabel="Delete"
        onConfirm={handleDelete}
        onCancel={() => setShowDelete(false)}
      />
    </div>
  );
}
