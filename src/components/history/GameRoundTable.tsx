import type { Game, Player } from '../../types/index.ts';
import { getInitials } from '../../types/index.ts';
import { ScoreBadge } from '../common/ScoreBadge.tsx';
import { SuitIcon } from '../common/SuitIcon.tsx';

interface GameRoundTableProps {
  game: Game;
  players: Player[];
}

export function GameRoundTable({ game, players }: GameRoundTableProps) {
  const gamePlayers = game.playerIds.map((id) => players.find((p) => p.id === id)).filter(Boolean) as Player[];

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr className="bg-slate-100 dark:bg-slate-800">
            <th className="p-2 text-center font-medium text-slate-500 dark:text-slate-400">#</th>
            <th className="p-2 text-center font-medium text-slate-500 dark:text-slate-400">Trump</th>
            {game.playerIds.map((pid) => {
              const player = players.find((p) => p.id === pid);
              return (
                <th key={pid} className="p-2 text-right font-medium text-slate-500 dark:text-slate-400">
                  {player ? getInitials(player, gamePlayers) : '?'}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {game.rounds.filter((r) => r.isComplete).map((round) => (
            <tr key={round.roundIndex} className="border-t border-slate-100 dark:border-slate-800">
              <td className="p-2 text-center font-mono">{round.handSize}</td>
              <td className="p-2 text-center">
                {round.trumpSuit && <SuitIcon suit={round.trumpSuit} size="sm" />}
              </td>
              {game.playerIds.map((pid) => {
                const pr = round.playerRounds.find((p) => p.playerId === pid);
                if (!pr) return <td key={pid} />;
                return (
                  <td key={pid} className="p-2 text-right">
                    <div className="flex flex-col items-end">
                      <span className="text-slate-400 dark:text-slate-500">
                        {pr.boardLevel > 0 ? `B${pr.boardLevel > 1 ? pr.boardLevel : ''}` : pr.bid}/{pr.tricksTaken}
                        {pr.rainbow ? '🌈' : ''}
                      </span>
                      <ScoreBadge score={pr.cumulativeScore} size="sm" />
                    </div>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
