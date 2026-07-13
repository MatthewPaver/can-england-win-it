import { describe, expect, it } from 'vitest';
import {
  DEFAULT_SETTINGS,
  calculateRatingBoost,
  knockoutWinProbability,
  simulateScenario,
} from './model';

describe('tournament model', () => {
  it('returns repeatable results for the same seed', () => {
    expect(simulateScenario(DEFAULT_SETTINGS, 10_000, 1966)).toEqual(
      simulateScenario(DEFAULT_SETTINGS, 10_000, 1966),
    );
  });

  it('keeps every probability between zero and one hundred', () => {
    const result = simulateScenario(DEFAULT_SETTINGS);
    expect(result.semiWin).toBeGreaterThanOrEqual(0);
    expect(result.semiWin).toBeLessThanOrEqual(100);
    expect(result.finalWin).toBeGreaterThanOrEqual(0);
    expect(result.finalWin).toBeLessThanOrEqual(100);
    expect(result.trophy).toBeGreaterThanOrEqual(0);
    expect(result.trophy).toBeLessThanOrEqual(100);
  });

  it('rewards stronger assumptions', () => {
    const pessimistic = simulateScenario({
      form: 20,
      finishing: 20,
      midfield: 20,
      nerve: 20,
      finalOpponent: 'Auto',
    });
    const optimistic = simulateScenario({
      form: 90,
      finishing: 90,
      midfield: 90,
      nerve: 90,
      finalOpponent: 'Auto',
    });
    expect(optimistic.trophy).toBeGreaterThan(pessimistic.trophy);
    expect(calculateRatingBoost({ ...DEFAULT_SETTINGS, form: 90 })).toBeGreaterThan(
      calculateRatingBoost({ ...DEFAULT_SETTINGS, form: 10 }),
    );
  });

  it('is symmetrical at equal ratings', () => {
    expect(knockoutWinProbability(1900, 1900)).toBe(0.5);
  });
});
