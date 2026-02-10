import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import type { Game } from '../../types/index.ts';
import { getScoreTrends } from '../../lib/stats.ts';

interface TrendsChartProps {
  games: Game[];
  userId: string;
  userName: string;
}

export function TrendsChart({ games, userId, userName }: TrendsChartProps) {
  const trends = getScoreTrends(games, userId);

  if (trends.length === 0) return null;

  const data = trends.map((t) => ({
    game: t.gameIndex,
    Score: t.score,
    'Rolling Avg': Math.round(t.rollingAvg),
  }));

  return (
    <div className="p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
      <h3 className="font-bold mb-3">Score Trend — {userName}</h3>
      <ResponsiveContainer width="100%" height={250}>
        <LineChart data={data}>
          <XAxis dataKey="game" tick={{ fontSize: 12 }} label={{ value: 'Game #', position: 'bottom', fontSize: 12 }} />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip />
          <Line
            type="monotone"
            dataKey="Score"
            stroke="#94a3b8"
            strokeWidth={1}
            dot={{ r: 3, fill: '#3b82f6' }}
            connectNulls
          />
          <Line
            type="monotone"
            dataKey="Rolling Avg"
            stroke="#3b82f6"
            strokeWidth={2}
            dot={false}
            connectNulls
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
