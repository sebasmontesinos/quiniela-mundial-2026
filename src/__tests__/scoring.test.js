import { describe, it, expect } from 'vitest';
import { deriveWinner, calculatePoints } from '../services/scoring';

describe('deriveWinner', () => {
  it('returns home when homeScore > awayScore', () => {
    expect(deriveWinner(3, 1)).toBe('home');
    expect(deriveWinner(1, 0)).toBe('home');
  });

  it('returns away when awayScore > homeScore', () => {
    expect(deriveWinner(1, 2)).toBe('away');
    expect(deriveWinner(0, 5)).toBe('away');
  });

  it('returns draw when scores are equal', () => {
    expect(deriveWinner(0, 0)).toBe('draw');
    expect(deriveWinner(2, 2)).toBe('draw');
  });
});

describe('calculatePoints', () => {
  it('returns null if match scores are null', () => {
    expect(calculatePoints({}, { homeScore: null, awayScore: null })).toBeNull();
    expect(calculatePoints({}, { homeScore: 2, awayScore: null })).toBeNull();
  });

  it('returns 3 for exact score match', () => {
    const prediction = { predictedHomeScore: 2, predictedAwayScore: 1 };
    const match = { homeScore: 2, awayScore: 1 };
    expect(calculatePoints(prediction, match)).toBe(3);
  });

  it('returns 1 for correct winner (home)', () => {
    const prediction = { predictedHomeScore: 3, predictedAwayScore: 0 };
    const match = { homeScore: 1, awayScore: 0 };
    expect(calculatePoints(prediction, match)).toBe(1);
  });

  it('returns 1 for correct winner (away)', () => {
    const prediction = { predictedHomeScore: 0, predictedAwayScore: 2 };
    const match = { homeScore: 1, awayScore: 3 };
    expect(calculatePoints(prediction, match)).toBe(1);
  });

  it('returns 1 for correct draw', () => {
    const prediction = { predictedHomeScore: 1, predictedAwayScore: 1 };
    const match = { homeScore: 0, awayScore: 0 };
    expect(calculatePoints(prediction, match)).toBe(1);
  });

  it('returns 0 for wrong result', () => {
    const prediction = { predictedHomeScore: 2, predictedAwayScore: 1 };
    const match = { homeScore: 0, awayScore: 2 };
    expect(calculatePoints(prediction, match)).toBe(0);
  });
});
