import { create } from 'zustand';
import type { Game, Round, Suit } from '../types/index.ts';
import { ROUND_HAND_SIZES, TOTAL_ROUNDS } from '../lib/constants.ts';
import { calculateScore } from '../lib/scoring.ts';
import { generateId } from '../lib/utils.ts';
import { db } from '../db/index.ts';

interface GameState {
  game: Game | null;
  loadGame: (id: string) => Promise<void>;
  createGame: (playerIds: string[], startingDealerIndex: number) => Promise<string>;
  setTrumpSuit: (roundIndex: number, suit: Suit) => void;
  setBid: (roundIndex: number, playerId: string, bid: number, boardLevel: number) => void;
  setTricks: (roundIndex: number, playerId: string, tricks: number) => void;
  setRainbow: (roundIndex: number, playerId: string, rainbow: boolean) => void;
  setBidsForRound: (roundIndex: number, suit: Suit, bids: { playerId: string; bid: number; boardLevel: number }[]) => void;
  setTricksForRound: (roundIndex: number, tricks: { playerId: string; tricksTaken: number }[]) => void;
  setRainbowsForRound: (roundIndex: number, rainbows: { playerId: string; rainbow: boolean }[]) => void;
  setJobosForRound: (roundIndex: number, jobos: { playerId: string; jobo: boolean }[]) => void;
  completeRound: (roundIndex: number) => void;
  abandonGame: () => Promise<void>;
  _save: () => Promise<void>;
}

function buildRounds(playerIds: string[], startingDealerIndex: number): Round[] {
  return ROUND_HAND_SIZES.map((handSize, roundIndex) => ({
    roundIndex,
    handSize,
    trumpSuit: null,
    dealerPlayerId: playerIds[(startingDealerIndex + roundIndex) % playerIds.length],
    playerRounds: playerIds.map((playerId) => ({
      playerId,
      bid: 0,
      boardLevel: 0,
      tricksTaken: 0,
      rainbow: false,
      jobo: false,
      score: 0,
      cumulativeScore: 0,
    })),
    bidsEntered: false,
    isComplete: false,
  }));
}

function recalcScores(game: Game): void {
  for (let ri = 0; ri < game.rounds.length; ri++) {
    const round = game.rounds[ri];
    for (const pr of round.playerRounds) {
      pr.score = calculateScore(pr.bid, pr.boardLevel, pr.tricksTaken, round.handSize, pr.rainbow);
      if (ri === 0) {
        pr.cumulativeScore = pr.score;
      } else {
        const prev = game.rounds[ri - 1].playerRounds.find((p) => p.playerId === pr.playerId);
        pr.cumulativeScore = (prev?.cumulativeScore ?? 0) + pr.score;
      }
    }
  }
}

let saveTimeout: ReturnType<typeof setTimeout> | null = null;

export const useGameStore = create<GameState>()((set, get) => ({
  game: null,

  loadGame: async (id: string) => {
    const game = await db.games.get(id);
    if (game) {
      // Migrate old games that used bidType instead of boardLevel
      for (const round of game.rounds) {
        for (const pr of round.playerRounds) {
          if (pr.boardLevel === undefined) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const legacy = pr as any;
            pr.boardLevel = legacy.bidType === 'board' ? 1 : 0;
            delete legacy.bidType;
          }
        }
        // Migrate old games missing bidsEntered
        if (round.bidsEntered === undefined) {
          round.bidsEntered = round.isComplete || round.trumpSuit !== null;
        }
        // Migrate old games missing jobo
        for (const pr of round.playerRounds) {
          if (pr.jobo === undefined) {
            pr.jobo = false;
          }
        }
      }
      set({ game });
    }
  },

  createGame: async (playerIds: string[], startingDealerIndex: number) => {
    const id = generateId();
    const game: Game = {
      id,
      createdAt: Date.now(),
      status: 'in_progress',
      playerIds,
      startingDealerIndex,
      rounds: buildRounds(playerIds, startingDealerIndex),
      currentRoundIndex: 0,
    };
    await db.games.add(game);
    set({ game });
    return id;
  },

  setTrumpSuit: (roundIndex, suit) => {
    const game = get().game;
    if (!game || game.rounds[roundIndex].isComplete) return;
    game.rounds[roundIndex].trumpSuit = suit;
    set({ game: { ...game } });
    get()._save();
  },

  setBid: (roundIndex, playerId, bid, boardLevel) => {
    const game = get().game;
    if (!game || game.rounds[roundIndex].isComplete) return;
    const round = game.rounds[roundIndex];
    const pr = round.playerRounds.find((p) => p.playerId === playerId);
    if (!pr) return;
    const wasBoard = (pr.boardLevel ?? 0) > 0;
    pr.bid = bid;
    pr.boardLevel = boardLevel;
    // If a player unchecks their board, reset all other boards in the round
    if (wasBoard && boardLevel === 0) {
      for (const other of round.playerRounds) {
        if (other.playerId !== playerId) {
          other.boardLevel = 0;
        }
      }
    }
    recalcScores(game);
    set({ game: { ...game } });
    get()._save();
  },

  setTricks: (roundIndex, playerId, tricks) => {
    const game = get().game;
    if (!game || game.rounds[roundIndex].isComplete) return;
    const pr = game.rounds[roundIndex].playerRounds.find((p) => p.playerId === playerId);
    if (!pr) return;
    pr.tricksTaken = tricks;
    recalcScores(game);
    set({ game: { ...game } });
    get()._save();
  },

  setRainbow: (roundIndex, playerId, rainbow) => {
    const game = get().game;
    if (!game || game.rounds[roundIndex].isComplete) return;
    const pr = game.rounds[roundIndex].playerRounds.find((p) => p.playerId === playerId);
    if (!pr) return;
    pr.rainbow = rainbow;
    recalcScores(game);
    set({ game: { ...game } });
    get()._save();
  },

  setBidsForRound: (roundIndex, suit, bids) => {
    const game = get().game;
    if (!game || game.rounds[roundIndex].isComplete) return;
    const round = game.rounds[roundIndex];
    round.trumpSuit = suit;
    for (const b of bids) {
      const pr = round.playerRounds.find((p) => p.playerId === b.playerId);
      if (pr) {
        pr.bid = b.bid;
        pr.boardLevel = b.boardLevel;
      }
    }
    round.bidsEntered = true;
    recalcScores(game);
    set({ game: { ...game } });
    get()._save();
  },

  setTricksForRound: (roundIndex, tricks) => {
    const game = get().game;
    if (!game || game.rounds[roundIndex].isComplete) return;
    const round = game.rounds[roundIndex];
    for (const t of tricks) {
      const pr = round.playerRounds.find((p) => p.playerId === t.playerId);
      if (pr) {
        pr.tricksTaken = t.tricksTaken;
      }
    }
    recalcScores(game);
    set({ game: { ...game } });
    get()._save();
  },

  setRainbowsForRound: (roundIndex, rainbows) => {
    const game = get().game;
    if (!game || game.rounds[roundIndex].isComplete) return;
    const round = game.rounds[roundIndex];
    for (const r of rainbows) {
      const pr = round.playerRounds.find((p) => p.playerId === r.playerId);
      if (pr) {
        pr.rainbow = r.rainbow;
      }
    }
    recalcScores(game);
    set({ game: { ...game } });
    get()._save();
  },

  setJobosForRound: (roundIndex, jobos) => {
    const game = get().game;
    if (!game || game.rounds[roundIndex].isComplete) return;
    const round = game.rounds[roundIndex];
    for (const j of jobos) {
      const pr = round.playerRounds.find((p) => p.playerId === j.playerId);
      if (pr) {
        pr.jobo = j.jobo;
      }
    }
    set({ game: { ...game } });
    get()._save();
  },

  completeRound: (roundIndex) => {
    const game = get().game;
    if (!game) return;
    game.rounds[roundIndex].isComplete = true;
    recalcScores(game);

    if (roundIndex < TOTAL_ROUNDS - 1) {
      game.currentRoundIndex = roundIndex + 1;
    } else {
      game.status = 'completed';
      game.completedAt = Date.now();
    }

    set({ game: { ...game } });
    get()._save();
  },

  abandonGame: async () => {
    const game = get().game;
    if (!game) return;
    await db.games.delete(game.id);
    set({ game: null });
  },

  _save: async () => {
    if (saveTimeout) clearTimeout(saveTimeout);
    saveTimeout = setTimeout(async () => {
      const game = get().game;
      if (game) {
        await db.games.put(game);
      }
    }, 300);
  },
}));
