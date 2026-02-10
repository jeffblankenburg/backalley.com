import type { Game, Player } from '../../types/index.ts';
import { announceScores } from '../../lib/standings.ts';

interface GameCompleteModalProps {
  open: boolean;
  game: Game;
  players: Player[];
  onViewSummary: () => void;
  onPlayAgain: () => void;
}

export function GameCompleteModal({ open, game, players, onViewSummary, onPlayAgain }: GameCompleteModalProps) {
  if (!open) return null;

  const lastRound = game.rounds[game.rounds.length - 1];
  const standings = game.playerIds
    .map((pid) => {
      const pr = lastRound.playerRounds.find((p) => p.playerId === pid);
      const player = players.find((p) => p.id === pid);
      return { name: player?.firstName || (player?.name ?? '?'), score: pr?.cumulativeScore ?? 0 };
    })
    .sort((a, b) => b.score - a.score);

  function handleAnnounce() {
    announceScores(standings.map((s, i) => ({ ...s, position: i + 1 })));
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" />
      <div className="relative bg-white dark:bg-slate-800 rounded-2xl p-6 w-full max-w-sm shadow-xl text-center">
        <div className="text-4xl mb-2">🏆</div>
        <h2 className="text-2xl font-bold mb-1">Game Over!</h2>
        <p className="text-lg text-emerald-500 dark:text-emerald-400 font-bold mb-4">
          {standings[0].name} wins with {standings[0].score} points!
        </p>
        <div className="space-y-2 mb-6">
          {standings.map((s, i) => (
            <div
              key={i}
              className={`flex justify-between p-2 rounded-lg ${i === 0 ? 'bg-emerald-50 dark:bg-emerald-900/20' : ''}`}
            >
              <span>
                {i + 1}. {s.name}
              </span>
              <span className="font-mono font-bold">{s.score}</span>
            </div>
          ))}
        </div>
        <div className="space-y-2">
          <button
            onClick={handleAnnounce}
            className="w-full py-3 rounded-xl bg-slate-200 dark:bg-slate-700 font-bold transition-colors hover:bg-slate-300 dark:hover:bg-slate-600 flex items-center justify-center gap-2"
          >
            <span className="text-xl">🔊</span>
            <span>Announce Standings</span>
          </button>
          <button
            onClick={onPlayAgain}
            className="w-full py-3 rounded-xl bg-emerald-500 text-white font-bold transition-colors hover:bg-emerald-600"
          >
            Play Again
          </button>
          <button
            onClick={onViewSummary}
            className="w-full py-3 rounded-xl bg-blue-500 text-white font-bold transition-colors hover:bg-blue-600"
          >
            View Summary
          </button>
        </div>
      </div>
    </div>
  );
}
