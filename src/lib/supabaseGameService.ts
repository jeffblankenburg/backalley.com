import { supabase } from './supabase.ts';
import type { Game, Round, PlayerRound, Suit } from '../types/index.ts';
import { ROUND_HAND_SIZES } from './constants.ts';
import { calculateScore } from './scoring.ts';

// ── Types for Supabase row shapes ──────────────────────────────

interface GameRow {
  id: string;
  status: string;
  starting_dealer_index: number;
  current_round_index: number;
  created_by: string;
  created_at: string;
  completed_at: string | null;
  game_players: GamePlayerRow[];
  rounds: RoundRow[];
}

interface GamePlayerRow {
  user_id: string;
  seat_position: number;
}

interface RoundRow {
  id: string;
  round_index: number;
  hand_size: number;
  trump_suit: string | null;
  dealer_user_id: string;
  bids_entered: boolean;
  is_complete: boolean;
  player_rounds: PlayerRoundRow[];
}

interface PlayerRoundRow {
  id: string;
  user_id: string;
  bid: number;
  board_level: number;
  tricks_taken: number;
  rainbow: boolean;
  jobo: boolean;
  score: number;
  cumulative_score: number;
}

// ── Assemblers ─────────────────────────────────────────────────

function assembleGame(row: GameRow): { game: Game; roundIdMap: Map<number, string>; playerRoundIdMap: Map<string, string> } {
  const playerIds = row.game_players
    .sort((a, b) => a.seat_position - b.seat_position)
    .map((gp) => gp.user_id);

  const roundIdMap = new Map<number, string>();
  const playerRoundIdMap = new Map<string, string>(); // `${roundIndex}:${userId}` → uuid

  const sortedRounds = [...row.rounds].sort((a, b) => a.round_index - b.round_index);

  const rounds: Round[] = sortedRounds.map((r) => {
    roundIdMap.set(r.round_index, r.id);

    const playerRounds: PlayerRound[] = playerIds.map((pid) => {
      const pr = r.player_rounds.find((p) => p.user_id === pid);
      if (pr) {
        playerRoundIdMap.set(`${r.round_index}:${pid}`, pr.id);
      }
      return {
        playerId: pid,
        bid: pr?.bid ?? 0,
        boardLevel: pr?.board_level ?? 0,
        tricksTaken: pr?.tricks_taken ?? 0,
        rainbow: pr?.rainbow ?? false,
        jobo: pr?.jobo ?? false,
        score: pr?.score ?? 0,
        cumulativeScore: pr?.cumulative_score ?? 0,
      };
    });

    return {
      roundIndex: r.round_index,
      handSize: r.hand_size,
      trumpSuit: r.trump_suit as Suit | null,
      dealerPlayerId: r.dealer_user_id,
      playerRounds,
      bidsEntered: r.bids_entered,
      isComplete: r.is_complete,
    };
  });

  const game: Game = {
    id: row.id,
    createdBy: row.created_by,
    createdAt: new Date(row.created_at).getTime(),
    completedAt: row.completed_at ? new Date(row.completed_at).getTime() : undefined,
    status: row.status as Game['status'],
    playerIds,
    startingDealerIndex: row.starting_dealer_index,
    rounds,
    currentRoundIndex: row.current_round_index,
  };

  return { game, roundIdMap, playerRoundIdMap };
}

// ── CRUD ───────────────────────────────────────────────────────

export async function createGameInSupabase(
  playerIds: string[],
  startingDealerIndex: number,
  createdBy: string,
): Promise<string> {
  // 1. Insert game
  const { data: gameData, error: gameError } = await supabase
    .from('games')
    .insert({
      status: 'in_progress',
      starting_dealer_index: startingDealerIndex,
      current_round_index: 0,
      created_by: createdBy,
    })
    .select('id')
    .single();

  if (gameError || !gameData) throw new Error(gameError?.message ?? 'Failed to create game');
  const gameId = gameData.id;

  // 2. Insert game_players
  const gamePlayers = playerIds.map((userId, i) => ({
    game_id: gameId,
    user_id: userId,
    seat_position: i,
  }));
  const { error: gpError } = await supabase.from('game_players').insert(gamePlayers);
  if (gpError) throw new Error(gpError.message);

  // 3. Insert rounds
  const roundInserts = ROUND_HAND_SIZES.map((handSize, ri) => ({
    game_id: gameId,
    round_index: ri,
    hand_size: handSize,
    dealer_user_id: playerIds[(startingDealerIndex + ri) % playerIds.length],
    bids_entered: false,
    is_complete: false,
  }));
  const { data: roundData, error: roundError } = await supabase
    .from('rounds')
    .insert(roundInserts)
    .select('id, round_index');
  if (roundError || !roundData) throw new Error(roundError?.message ?? 'Failed to create rounds');

  // 4. Insert player_rounds
  const playerRoundInserts: {
    round_id: string;
    user_id: string;
    bid: number;
    board_level: number;
    tricks_taken: number;
    rainbow: boolean;
    jobo: boolean;
    score: number;
    cumulative_score: number;
  }[] = [];

  for (const round of roundData) {
    for (const userId of playerIds) {
      playerRoundInserts.push({
        round_id: round.id,
        user_id: userId,
        bid: 0,
        board_level: 0,
        tricks_taken: 0,
        rainbow: false,
        jobo: false,
        score: 0,
        cumulative_score: 0,
      });
    }
  }
  const { error: prError } = await supabase.from('player_rounds').insert(playerRoundInserts);
  if (prError) throw new Error(prError.message);

  return gameId;
}

export async function loadGameFromSupabase(
  gameId: string,
): Promise<{ game: Game; roundIdMap: Map<number, string>; playerRoundIdMap: Map<string, string> } | null> {
  const { data, error } = await supabase
    .from('games')
    .select(`
      id, status, starting_dealer_index, current_round_index, created_by, created_at, completed_at,
      game_players ( user_id, seat_position ),
      rounds ( id, round_index, hand_size, trump_suit, dealer_user_id, bids_entered, is_complete,
        player_rounds ( id, user_id, bid, board_level, tricks_taken, rainbow, jobo, score, cumulative_score )
      )
    `)
    .eq('id', gameId)
    .single();

  if (error || !data) return null;
  return assembleGame(data as unknown as GameRow);
}

export async function fetchAllGamesForUser(
  userId: string,
): Promise<Game[]> {
  // Get all game_ids for this user
  const { data: gpData, error: gpError } = await supabase
    .from('game_players')
    .select('game_id')
    .eq('user_id', userId);

  if (gpError || !gpData || gpData.length === 0) return [];

  const gameIds = gpData.map((gp) => gp.game_id);

  const { data, error } = await supabase
    .from('games')
    .select(`
      id, status, starting_dealer_index, current_round_index, created_by, created_at, completed_at,
      game_players ( user_id, seat_position ),
      rounds ( id, round_index, hand_size, trump_suit, dealer_user_id, bids_entered, is_complete,
        player_rounds ( id, user_id, bid, board_level, tricks_taken, rainbow, jobo, score, cumulative_score )
      )
    `)
    .in('id', gameIds)
    .order('created_at', { ascending: false });

  if (error || !data) return [];
  return (data as unknown as GameRow[]).map((row) => assembleGame(row).game);
}

export async function deleteGameFromSupabase(gameId: string): Promise<void> {
  const { error } = await supabase.from('games').delete().eq('id', gameId);
  if (error) throw new Error(error.message);
}

// ── Targeted save helpers ──────────────────────────────────────

export async function updateGameRow(
  gameId: string,
  fields: { status?: string; current_round_index?: number; completed_at?: string | null },
): Promise<void> {
  const { error } = await supabase.from('games').update(fields).eq('id', gameId);
  if (error) throw new Error(error.message);
}

export async function updateRoundRow(
  roundId: string,
  fields: { trump_suit?: string | null; bids_entered?: boolean; is_complete?: boolean },
): Promise<void> {
  const { error } = await supabase.from('rounds').update(fields).eq('id', roundId);
  if (error) throw new Error(error.message);
}

export async function updatePlayerRoundRow(
  playerRoundId: string,
  fields: {
    bid?: number;
    board_level?: number;
    tricks_taken?: number;
    rainbow?: boolean;
    jobo?: boolean;
    score?: number;
    cumulative_score?: number;
  },
): Promise<void> {
  const { error } = await supabase.from('player_rounds').update(fields).eq('id', playerRoundId);
  if (error) throw new Error(error.message);
}

// ── Bulk insert for simulation ─────────────────────────────────

// ── Recalc scores helper (same as gameStore) ───────────────────

export function recalcScores(game: Game): void {
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
