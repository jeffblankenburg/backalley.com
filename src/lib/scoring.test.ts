import { describe, it, expect } from 'vitest';
import { calculateScore, boardMultiplier } from './scoring.ts';

describe('boardMultiplier', () => {
  it('level 1 → 6', () => expect(boardMultiplier(1)).toBe(6));
  it('level 2 → 12', () => expect(boardMultiplier(2)).toBe(12));
  it('level 3 → 18', () => expect(boardMultiplier(3)).toBe(18));
  it('level 4 → 24', () => expect(boardMultiplier(4)).toBe(24));
  it('level 5 → 30', () => expect(boardMultiplier(5)).toBe(30));
});

describe('calculateScore', () => {
  describe('normal bids (boardLevel 0)', () => {
    it('bid 0, take 0 → 0 pts', () => {
      expect(calculateScore(0, 0, 0, 5, false)).toBe(0);
    });

    it('bid 0, take 2 → +2 pts', () => {
      expect(calculateScore(0, 0, 2, 5, false)).toBe(2);
    });

    it('bid 0, take 1 → +1 pt', () => {
      expect(calculateScore(0, 0, 1, 10, false)).toBe(1);
    });

    it('bid 3, take 3 → +9 pts (exact)', () => {
      expect(calculateScore(3, 0, 3, 10, false)).toBe(9);
    });

    it('bid 2, take 4 → +8 pts (overtricks)', () => {
      expect(calculateScore(2, 0, 4, 10, false)).toBe(8);
    });

    it('bid 3, take 2 → -9 pts (missed)', () => {
      expect(calculateScore(3, 0, 2, 10, false)).toBe(-9);
    });

    it('bid 1, take 0 → -3 pts', () => {
      expect(calculateScore(1, 0, 0, 5, false)).toBe(-3);
    });

    it('bid 5, take 5 → +15 pts', () => {
      expect(calculateScore(5, 0, 5, 10, false)).toBe(15);
    });

    it('bid 5, take 7 → +17 pts', () => {
      expect(calculateScore(5, 0, 7, 10, false)).toBe(17);
    });

    it('bid 1, take 1 → +3 pts (1-card round)', () => {
      expect(calculateScore(1, 0, 1, 1, false)).toBe(3);
    });
  });

  describe('single board (level 1, 6x)', () => {
    it('board on 10, take 10 → +60 pts', () => {
      expect(calculateScore(10, 1, 10, 10, false)).toBe(60);
    });

    it('board on 10, take 9 → -60 pts', () => {
      expect(calculateScore(10, 1, 9, 10, false)).toBe(-60);
    });

    it('board on 1, take 1 → +6 pts', () => {
      expect(calculateScore(1, 1, 1, 1, false)).toBe(6);
    });

    it('board on 1, take 0 → -6 pts', () => {
      expect(calculateScore(1, 1, 0, 1, false)).toBe(-6);
    });

    it('board on 5, take 5 → +30 pts', () => {
      expect(calculateScore(5, 1, 5, 5, false)).toBe(30);
    });

    it('board on 5, take 3 → -30 pts', () => {
      expect(calculateScore(5, 1, 3, 5, false)).toBe(-30);
    });

    it('board on 4, take 4 → +24 pts', () => {
      expect(calculateScore(4, 1, 4, 4, false)).toBe(24);
    });
  });

  describe('double board (level 2, 12x)', () => {
    it('double board on 5, make → +60', () => {
      expect(calculateScore(5, 2, 5, 5, false)).toBe(60);
    });

    it('double board on 5, miss → -60', () => {
      expect(calculateScore(5, 2, 3, 5, false)).toBe(-60);
    });

    it('double board on 1, make → +12', () => {
      expect(calculateScore(1, 2, 1, 1, false)).toBe(12);
    });
  });

  describe('triple board (level 3, 18x)', () => {
    it('triple board on 5, make → +90', () => {
      expect(calculateScore(5, 3, 5, 5, false)).toBe(90);
    });

    it('triple board on 5, miss → -90', () => {
      expect(calculateScore(5, 3, 4, 5, false)).toBe(-90);
    });
  });

  describe('quad board (level 4, 24x)', () => {
    it('quad board on 5, make → +120', () => {
      expect(calculateScore(5, 4, 5, 5, false)).toBe(120);
    });

    it('quad board on 5, miss → -120', () => {
      expect(calculateScore(5, 4, 2, 5, false)).toBe(-120);
    });
  });

  describe('quintuple board (level 5, 30x)', () => {
    it('quint board on 5, make → +150', () => {
      expect(calculateScore(5, 5, 5, 5, false)).toBe(150);
    });

    it('quint board on 5, miss → -150', () => {
      expect(calculateScore(5, 5, 0, 5, false)).toBe(-150);
    });

    it('quint board on 10, make → +300', () => {
      expect(calculateScore(10, 5, 10, 10, false)).toBe(300);
    });
  });

  describe('rainbow bonus', () => {
    it('rainbow on 4-card round with normal bid adds +8', () => {
      expect(calculateScore(2, 0, 2, 4, true)).toBe(14);
    });

    it('rainbow on 4-card round with bid 0 take 0 adds +8', () => {
      expect(calculateScore(0, 0, 0, 4, true)).toBe(8);
    });

    it('rainbow on non-4-card round does NOT add bonus', () => {
      expect(calculateScore(2, 0, 2, 5, true)).toBe(6);
    });

    it('rainbow on 4-card board make adds +8', () => {
      expect(calculateScore(4, 1, 4, 4, true)).toBe(32);
    });

    it('rainbow on 4-card board miss still adds +8', () => {
      expect(calculateScore(4, 1, 3, 4, true)).toBe(-16);
    });

    it('rainbow on double board make adds +8', () => {
      expect(calculateScore(4, 2, 4, 4, true)).toBe(56); // 12*4 + 8
    });

    it('no rainbow flag means no bonus on 4-card round', () => {
      expect(calculateScore(2, 0, 2, 4, false)).toBe(6);
    });
  });
});
