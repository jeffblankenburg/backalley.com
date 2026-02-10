export type Suit = 'hearts' | 'diamonds' | 'clubs' | 'spades';
export type GameStatus = 'setup' | 'in_progress' | 'completed';

export const MAX_BOARD_LEVEL = 5;
export const BOARD_LABELS: Record<number, string> = {
  0: '',
  1: 'Board',
  2: 'Dbl Board',
  3: 'Trpl Board',
  4: 'Quad Board',
  5: 'Quint Board',
};

export interface Profile {
  id: string;
  display_name: string;
  first_name: string;
  last_name: string;
  email: string | null;
  is_admin: boolean;
  disabled: boolean;
  created_at: string;
}

export interface Player {
  id: string;
  name: string;
  firstName: string;
  lastName: string;
  createdAt: number;
}

export function profileToPlayer(profile: Profile): Player {
  return {
    id: profile.id,
    name: profile.display_name,
    firstName: profile.first_name,
    lastName: profile.last_name,
    createdAt: new Date(profile.created_at).getTime(),
  };
}

/** Compute unique initials for a set of players. */
export function getInitials(player: Player, allPlayers: Player[]): string {
  const first = player.firstName || player.name.split(' ')[0] || '';
  const last = player.lastName || player.name.split(' ').slice(1).join(' ') || '';

  const short = (first[0] ?? '').toUpperCase() + (last[0] ?? '').toUpperCase();

  // Check for duplicates
  const hasDuplicate = allPlayers.some(
    (p) =>
      p.id !== player.id &&
      ((p.firstName || p.name.split(' ')[0] || '')[0] ?? '').toUpperCase() === (first[0] ?? '').toUpperCase() &&
      ((p.lastName || p.name.split(' ').slice(1).join(' ') || '')[0] ?? '').toUpperCase() === (last[0] ?? '').toUpperCase(),
  );

  if (!hasDuplicate) return short;

  // Use first two letters of each
  return (
    first.slice(0, 2).charAt(0).toUpperCase() + first.slice(1, 2).toLowerCase() +
    last.slice(0, 2).charAt(0).toUpperCase() + last.slice(1, 2).toLowerCase()
  );
}

export interface PlayerRound {
  playerId: string;
  bid: number;
  boardLevel: number; // 0 = normal, 1-5 = board tiers
  tricksTaken: number;
  rainbow: boolean;
  jobo: boolean;
  score: number;
  cumulativeScore: number;
}

export interface Round {
  roundIndex: number;
  handSize: number;
  trumpSuit: Suit | null;
  dealerPlayerId: string;
  playerRounds: PlayerRound[];
  bidsEntered: boolean;
  isComplete: boolean;
}

export interface Game {
  id: string;
  createdBy: string;
  createdAt: number;
  completedAt?: number;
  status: GameStatus;
  playerIds: string[];
  startingDealerIndex: number;
  rounds: Round[];
  currentRoundIndex: number;
}
