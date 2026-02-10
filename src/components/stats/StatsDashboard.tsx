import { useMemo } from 'react';
import type { Game, Player } from '../../types/index.ts';
import type { PlayerStats } from '../../lib/stats.ts';
import { computePlayerStats } from '../../lib/stats.ts';
import { PlayerStatsCard } from './PlayerStatsCard.tsx';
import { PerformanceByRound } from './PerformanceByRound.tsx';
import { TrendsChart } from './TrendsChart.tsx';

interface StatsDashboardProps {
  games: Game[];
  players: Player[];
  userId: string;
}

function averageStats(statsMap: Map<string, PlayerStats>, excludeId: string): PlayerStats {
  const others = Array.from(statsMap.values()).filter(
    (s) => s.playerId !== excludeId && s.gamesPlayed > 0,
  );

  if (others.length === 0) {
    return {
      playerId: 'avg',
      gamesPlayed: 0,
      wins: 0,
      winRate: 0,
      avgFinalScore: 0,
      bestScore: 0,
      worstScore: 0,
      bidAccuracy: 0,
      perfectBidRate: 0,
      zeroBidCleanRate: 0,
      boardAttempts: 0,
      boardSuccesses: 0,
      boardSuccessRate: 0,
      boardPointsNet: 0,
      rainbowCount: 0,
      rainbowPoints: 0,
      avgScoreAsDealer: 0,
      avgScoreNotDealer: 0,
    };
  }

  const n = others.length;
  const sum = (fn: (s: PlayerStats) => number) => others.reduce((acc, s) => acc + fn(s), 0) / n;

  return {
    playerId: 'avg',
    gamesPlayed: sum((s) => s.gamesPlayed),
    wins: sum((s) => s.wins),
    winRate: sum((s) => s.winRate),
    avgFinalScore: sum((s) => s.avgFinalScore),
    bestScore: sum((s) => s.bestScore),
    worstScore: sum((s) => s.worstScore),
    bidAccuracy: sum((s) => s.bidAccuracy),
    perfectBidRate: sum((s) => s.perfectBidRate),
    zeroBidCleanRate: sum((s) => s.zeroBidCleanRate),
    boardAttempts: sum((s) => s.boardAttempts),
    boardSuccesses: sum((s) => s.boardSuccesses),
    boardSuccessRate: sum((s) => s.boardSuccessRate),
    boardPointsNet: sum((s) => s.boardPointsNet),
    rainbowCount: sum((s) => s.rainbowCount),
    rainbowPoints: sum((s) => s.rainbowPoints),
    avgScoreAsDealer: sum((s) => s.avgScoreAsDealer),
    avgScoreNotDealer: sum((s) => s.avgScoreNotDealer),
  };
}

export function StatsDashboard({ games, players, userId }: StatsDashboardProps) {
  const statsMap = useMemo(() => computePlayerStats(games, players), [games, players]);
  const completedGames = games.filter((g) => g.status === 'completed');

  const userStats = statsMap.get(userId);
  const avgStats = useMemo(() => averageStats(statsMap, userId), [statsMap, userId]);

  if (completedGames.length === 0 || !userStats || userStats.gamesPlayed === 0) {
    return (
      <p className="text-center text-slate-500 dark:text-slate-400 py-12">
        Complete a game to see statistics!
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <PlayerStatsCard userStats={userStats} avgStats={avgStats} />
      <TrendsChart games={games} userId={userId} userName="You" />
      <PerformanceByRound games={games} players={players} userId={userId} userName="You" />
    </div>
  );
}
