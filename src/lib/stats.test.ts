import { describe, it, expect } from 'vitest';
import { computePlayerStats, getFinalScore, getHeadToHead, getScoreTrends } from './stats.ts';
import type { Game, Player } from '../types/index.ts';
import { ROUND_HAND_SIZES } from './constants.ts';

function makePlayer(id: string, name: string): Player {
  const parts = name.split(' ');
  return { id, name, firstName: parts[0] ?? '', lastName: parts.slice(1).join(' ') ?? '', createdAt: 0 };
}

function makeCompletedGame(
  playerIds: string[],
  finalScores: number[],
): Game {
  const rounds = ROUND_HAND_SIZES.map((handSize, roundIndex) => ({
    roundIndex,
    handSize,
    trumpSuit: 'hearts' as const,
    dealerPlayerId: playerIds[roundIndex % playerIds.length],
    playerRounds: playerIds.map((pid, i) => ({
      playerId: pid,
      bid: 1,
      boardLevel: 0,
      tricksTaken: 1,
      rainbow: false,
      jobo: false,
      score: roundIndex === 19 ? finalScores[i] : 0,
      cumulativeScore: roundIndex === 19 ? finalScores[i] : 0,
    })),
    bidsEntered: true,
    isComplete: true,
  }));

  return {
    id: `game-${Math.random()}`,
    createdBy: playerIds[0],
    createdAt: Date.now(),
    completedAt: Date.now(),
    status: 'completed',
    playerIds,
    startingDealerIndex: 0,
    rounds,
    currentRoundIndex: 19,
  };
}

describe('getFinalScore', () => {
  it('returns the cumulative score from the last complete round', () => {
    const game = makeCompletedGame(['a', 'b', 'c', 'd', 'e'], [100, 80, 60, 40, 20]);
    expect(getFinalScore(game, 'a')).toBe(100);
    expect(getFinalScore(game, 'e')).toBe(20);
  });
});

describe('computePlayerStats', () => {
  it('computes wins correctly', () => {
    const players = ['a', 'b', 'c', 'd', 'e'].map((id) => makePlayer(id, id));
    const games = [
      makeCompletedGame(['a', 'b', 'c', 'd', 'e'], [100, 80, 60, 40, 20]),
      makeCompletedGame(['a', 'b', 'c', 'd', 'e'], [50, 110, 60, 40, 20]),
    ];
    const stats = computePlayerStats(games, players);
    expect(stats.get('a')!.wins).toBe(1);
    expect(stats.get('b')!.wins).toBe(1);
    expect(stats.get('c')!.wins).toBe(0);
  });

  it('returns empty stats for player with no games', () => {
    const players = [makePlayer('x', 'X')];
    const stats = computePlayerStats([], players);
    expect(stats.get('x')!.gamesPlayed).toBe(0);
    expect(stats.get('x')!.winRate).toBe(0);
  });
});

describe('getHeadToHead', () => {
  it('tracks wins between two players', () => {
    const games = [
      makeCompletedGame(['a', 'b', 'c', 'd', 'e'], [100, 80, 60, 40, 20]),
      makeCompletedGame(['a', 'b', 'c', 'd', 'e'], [50, 110, 60, 40, 20]),
    ];
    const h2h = getHeadToHead(games, 'a', 'b');
    expect(h2h.player1Wins).toBe(1);
    expect(h2h.player2Wins).toBe(1);
  });
});

describe('getScoreTrends', () => {
  it('computes rolling average', () => {
    const games = [
      makeCompletedGame(['a', 'b', 'c', 'd', 'e'], [100, 0, 0, 0, 0]),
      makeCompletedGame(['a', 'b', 'c', 'd', 'e'], [200, 0, 0, 0, 0]),
    ];
    const trends = getScoreTrends(games, 'a', 2);
    expect(trends).toHaveLength(2);
    expect(trends[0].score).toBe(100);
    expect(trends[0].rollingAvg).toBe(100);
    expect(trends[1].score).toBe(200);
    expect(trends[1].rollingAvg).toBe(150);
  });
});
