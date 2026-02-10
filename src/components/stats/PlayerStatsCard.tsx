import type { PlayerStats } from '../../lib/stats.ts';

interface PlayerStatsCardProps {
  userStats: PlayerStats;
  avgStats: PlayerStats;
}

function pct(v: number): string {
  return `${(v * 100).toFixed(0)}%`;
}

function fmt(v: number, decimals = 0): string {
  return v.toFixed(decimals);
}

type StatRowProps = {
  label: string;
  userVal: string;
  avgVal: string;
  higherIsBetter?: boolean;
  userRaw: number;
  avgRaw: number;
};

function StatRow({ label, userVal, avgVal, higherIsBetter = true, userRaw, avgRaw }: StatRowProps) {
  const diff = userRaw - avgRaw;
  const isAbove = higherIsBetter ? diff > 0 : diff < 0;
  const isEqual = Math.abs(diff) < 0.005;
  const color = isEqual
    ? 'text-slate-400 dark:text-slate-500'
    : isAbove
      ? 'text-emerald-500'
      : 'text-red-500';
  const arrow = isEqual ? '' : isAbove ? '\u25B2' : '\u25BC';

  return (
    <div className="grid grid-cols-[1fr_4rem_4rem_2rem] items-center py-1.5 border-b border-slate-100 dark:border-slate-700/50 last:border-0">
      <div className="text-sm text-slate-600 dark:text-slate-300">{label}</div>
      <div className="text-right font-mono text-sm font-bold">{userVal}</div>
      <div className="text-right font-mono text-sm text-slate-400 dark:text-slate-500">{avgVal}</div>
      <div className={`text-right text-xs ${color}`}>{arrow}</div>
    </div>
  );
}

export function PlayerStatsCard({ userStats, avgStats }: PlayerStatsCardProps) {
  return (
    <div className="p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
      <div className="grid grid-cols-[1fr_4rem_4rem_2rem] items-center mb-2 pb-2 border-b border-slate-200 dark:border-slate-600">
        <h3 className="font-bold text-lg">Your Stats</h3>
        <div className="text-right text-xs font-semibold text-slate-500 dark:text-slate-400">You</div>
        <div className="text-right text-xs font-semibold text-slate-500 dark:text-slate-400">Avg</div>
        <div />
      </div>

      <StatRow label="Games" userVal={String(userStats.gamesPlayed)} avgVal={fmt(avgStats.gamesPlayed)} userRaw={userStats.gamesPlayed} avgRaw={avgStats.gamesPlayed} />
      <StatRow label="Wins" userVal={String(userStats.wins)} avgVal={fmt(avgStats.wins)} userRaw={userStats.wins} avgRaw={avgStats.wins} />
      <StatRow label="Win Rate" userVal={pct(userStats.winRate)} avgVal={pct(avgStats.winRate)} userRaw={userStats.winRate} avgRaw={avgStats.winRate} />

      <div className="h-2" />

      <StatRow label="Avg Score" userVal={fmt(userStats.avgFinalScore)} avgVal={fmt(avgStats.avgFinalScore)} userRaw={userStats.avgFinalScore} avgRaw={avgStats.avgFinalScore} />
      <StatRow label="Best" userVal={String(userStats.bestScore)} avgVal={fmt(avgStats.bestScore)} userRaw={userStats.bestScore} avgRaw={avgStats.bestScore} />
      <StatRow label="Worst" userVal={String(userStats.worstScore)} avgVal={fmt(avgStats.worstScore)} userRaw={userStats.worstScore} avgRaw={avgStats.worstScore} higherIsBetter={false} />

      <div className="h-2" />

      <StatRow label="Bid Accuracy" userVal={pct(userStats.bidAccuracy)} avgVal={pct(avgStats.bidAccuracy)} userRaw={userStats.bidAccuracy} avgRaw={avgStats.bidAccuracy} />
      <StatRow label="Perfect Bid Rate" userVal={pct(userStats.perfectBidRate)} avgVal={pct(avgStats.perfectBidRate)} userRaw={userStats.perfectBidRate} avgRaw={avgStats.perfectBidRate} />
      <StatRow label="0-Bid Clean Rate" userVal={pct(userStats.zeroBidCleanRate)} avgVal={pct(avgStats.zeroBidCleanRate)} userRaw={userStats.zeroBidCleanRate} avgRaw={avgStats.zeroBidCleanRate} />

      {(userStats.boardAttempts > 0 || avgStats.boardAttempts > 0) && (
        <>
          <div className="h-2" />
          <StatRow label="Board Success" userVal={pct(userStats.boardSuccessRate)} avgVal={pct(avgStats.boardSuccessRate)} userRaw={userStats.boardSuccessRate} avgRaw={avgStats.boardSuccessRate} />
        </>
      )}

      <div className="h-2" />

      <StatRow label="Rainbows" userVal={String(userStats.rainbowCount)} avgVal={fmt(avgStats.rainbowCount)} userRaw={userStats.rainbowCount} avgRaw={avgStats.rainbowCount} />
    </div>
  );
}
