import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import type { Game, Player } from '../../types/index.ts';
import { getHandSizePerformance } from '../../lib/stats.ts';

interface PerformanceByRoundProps {
  games: Game[];
  players: Player[];
  userId: string;
  userName: string;
}

export function PerformanceByRound({ games, players, userId, userName }: PerformanceByRoundProps) {
  const userPerf = getHandSizePerformance(games, userId);

  if (userPerf.length === 0) return null;

  // Compute average across all other players who have appeared in the user's games
  const otherPlayers = players.filter((p) =>
    p.id !== userId && games.some((g) => g.status === 'completed' && g.playerIds.includes(p.id)),
  );

  const avgBySize = new Map<number, { total: number; count: number }>();
  for (const p of otherPlayers) {
    const perf = getHandSizePerformance(games, p.id);
    for (const entry of perf) {
      const agg = avgBySize.get(entry.handSize) ?? { total: 0, count: 0 };
      agg.total += entry.avgScore;
      agg.count++;
      avgBySize.set(entry.handSize, agg);
    }
  }

  const allSizes = new Set(userPerf.map((p) => p.handSize));
  for (const hs of avgBySize.keys()) allSizes.add(hs);

  const data = Array.from(allSizes)
    .sort((a, b) => a - b)
    .map((hs) => {
      const userEntry = userPerf.find((p) => p.handSize === hs);
      const avgEntry = avgBySize.get(hs);
      return {
        handSize: hs,
        [userName]: userEntry ? Math.round(userEntry.avgScore * 10) / 10 : undefined,
        Average: avgEntry ? Math.round((avgEntry.total / avgEntry.count) * 10) / 10 : undefined,
      };
    });

  return (
    <div className="p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
      <h3 className="font-bold mb-3">Performance by Hand Size</h3>
      <ResponsiveContainer width="100%" height={250}>
        <LineChart data={data}>
          <XAxis dataKey="handSize" tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip />
          <Legend />
          <Line
            type="monotone"
            dataKey={userName}
            stroke="#3b82f6"
            strokeWidth={2}
            dot={{ r: 3 }}
            connectNulls
          />
          <Line
            type="monotone"
            dataKey="Average"
            stroke="#94a3b8"
            strokeWidth={2}
            strokeDasharray="5 5"
            dot={false}
            connectNulls
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
