import { RAINBOW_HAND_SIZE, RAINBOW_BONUS } from './constants.ts';

/**
 * Board multiplier per trick by level:
 *   Level 1: 6, Level 2: 12, Level 3: 18, Level 4: 24, Level 5: 30
 */
export function boardMultiplier(boardLevel: number): number {
  return 6 * boardLevel;
}

export function calculateScore(
  bid: number,
  boardLevel: number,
  tricksTaken: number,
  handSize: number,
  rainbow: boolean,
): number {
  let score = 0;

  if (boardLevel > 0) {
    const mult = boardMultiplier(boardLevel);
    if (tricksTaken === handSize) {
      score = mult * handSize;
    } else {
      score = -mult * handSize;
    }
  } else if (bid === 0) {
    if (tricksTaken === 0) {
      score = 0;
    } else {
      score = tricksTaken;
    }
  } else {
    if (tricksTaken >= bid) {
      score = 3 * bid + (tricksTaken - bid);
    } else {
      score = -3 * bid;
    }
  }

  if (rainbow && handSize === RAINBOW_HAND_SIZE) {
    score += RAINBOW_BONUS;
  }

  return score;
}
