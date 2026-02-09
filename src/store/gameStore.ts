import { create } from 'zustand';
import type { Game, Suit } from '../types/index.ts';
import { TOTAL_ROUNDS } from '../lib/constants.ts';
import {
  createGameInSupabase,
  loadGameFromSupabase,
  deleteGameFromSupabase,
  updateGameRow,
  updateRoundRow,
  updatePlayerRoundRow,
  recalcScores,
} from '../lib/supabaseGameService.ts';

interface GameState {
  game: Game | null;
  _roundIdMap: Map<number, string>;
  _playerRoundIdMap: Map<string, string>;
  _dirtyRoundIndexes: Set<number>;
  loadGame: (id: string) => Promise<void>;
  createGame: (playerIds: string[], startingDealerIndex: number, createdBy: string) => Promise<string>;
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

let saveTimeout: ReturnType<typeof setTimeout> | null = null;

export const useGameStore = create<GameState>()((set, get) => ({
  game: null,
  _roundIdMap: new Map(),
  _playerRoundIdMap: new Map(),
  _dirtyRoundIndexes: new Set(),

  loadGame: async (id: string) => {
    const result = await loadGameFromSupabase(id);
    if (result) {
      set({
        game: result.game,
        _roundIdMap: result.roundIdMap,
        _playerRoundIdMap: result.playerRoundIdMap,
        _dirtyRoundIndexes: new Set(),
      });
    }
  },

  createGame: async (playerIds: string[], startingDealerIndex: number, createdBy: string) => {
    const gameId = await createGameInSupabase(playerIds, startingDealerIndex, createdBy);
    await get().loadGame(gameId);
    return gameId;
  },

  setTrumpSuit: (roundIndex, suit) => {
    const game = get().game;
    if (!game || game.rounds[roundIndex].isComplete) return;
    game.rounds[roundIndex].trumpSuit = suit;
    get()._dirtyRoundIndexes.add(roundIndex);
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
    if (wasBoard && boardLevel === 0) {
      for (const other of round.playerRounds) {
        if (other.playerId !== playerId) {
          other.boardLevel = 0;
        }
      }
    }
    recalcScores(game);
    get()._dirtyRoundIndexes.add(roundIndex);
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
    get()._dirtyRoundIndexes.add(roundIndex);
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
    get()._dirtyRoundIndexes.add(roundIndex);
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
    get()._dirtyRoundIndexes.add(roundIndex);
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
    get()._dirtyRoundIndexes.add(roundIndex);
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
    get()._dirtyRoundIndexes.add(roundIndex);
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
    get()._dirtyRoundIndexes.add(roundIndex);
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

    get()._dirtyRoundIndexes.add(roundIndex);
    set({ game: { ...game } });
    get()._save();
  },

  abandonGame: async () => {
    const game = get().game;
    if (!game) return;
    await deleteGameFromSupabase(game.id);
    set({ game: null, _roundIdMap: new Map(), _playerRoundIdMap: new Map(), _dirtyRoundIndexes: new Set() });
  },

  _save: async () => {
    if (saveTimeout) clearTimeout(saveTimeout);
    saveTimeout = setTimeout(async () => {
      const { game, _roundIdMap, _playerRoundIdMap, _dirtyRoundIndexes } = get();
      if (!game) return;

      const dirtyIndexes = [..._dirtyRoundIndexes];
      set({ _dirtyRoundIndexes: new Set() });

      const promises: Promise<void>[] = [];

      // Always update the game row
      promises.push(
        updateGameRow(game.id, {
          status: game.status,
          current_round_index: game.currentRoundIndex,
          completed_at: game.completedAt ? new Date(game.completedAt).toISOString() : null,
        }),
      );

      // Update dirty rounds and their player_rounds
      for (const ri of dirtyIndexes) {
        const round = game.rounds[ri];
        const roundId = _roundIdMap.get(ri);
        if (!roundId) continue;

        promises.push(
          updateRoundRow(roundId, {
            trump_suit: round.trumpSuit,
            bids_entered: round.bidsEntered,
            is_complete: round.isComplete,
          }),
        );

        for (const pr of round.playerRounds) {
          const prId = _playerRoundIdMap.get(`${ri}:${pr.playerId}`);
          if (!prId) continue;
          promises.push(
            updatePlayerRoundRow(prId, {
              bid: pr.bid,
              board_level: pr.boardLevel,
              tricks_taken: pr.tricksTaken,
              rainbow: pr.rainbow,
              jobo: pr.jobo,
              score: pr.score,
              cumulative_score: pr.cumulativeScore,
            }),
          );
        }
      }

      await Promise.all(promises);
    }, 300);
  },
}));
