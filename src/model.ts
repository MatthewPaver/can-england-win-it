export type FinalOpponent = 'Auto' | 'France' | 'Spain';

export type ScenarioSettings = {
  form: number;
  finishing: number;
  midfield: number;
  nerve: number;
  finalOpponent: FinalOpponent;
};

export type SimulationResult = {
  semiWin: number;
  finalWin: number;
  trophy: number;
  finalOpponentShares: { France: number; Spain: number };
  ratingBoost: number;
  trials: number;
};

export const DEFAULT_SETTINGS: ScenarioSettings = {
  form: 74,
  finishing: 67,
  midfield: 72,
  nerve: 65,
  finalOpponent: 'Auto',
};

const RATINGS = {
  England: 1918,
  Argentina: 1946,
  France: 1961,
  Spain: 1970,
};

const seededRandom = (seed: number) => {
  let value = seed >>> 0;
  return () => {
    value += 0x6d2b79f5;
    let t = value;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

export const calculateRatingBoost = (settings: ScenarioSettings) =>
  (settings.form - 50) * 0.62 +
  (settings.finishing - 50) * 0.48 +
  (settings.midfield - 50) * 0.42 +
  (settings.nerve - 50) * 0.44;

export const knockoutWinProbability = (teamRating: number, opponentRating: number) =>
  1 / (1 + 10 ** ((opponentRating - teamRating) / 330));

export function simulateScenario(
  settings: ScenarioSettings,
  trials = 10_000,
  seed = 1966,
): SimulationResult {
  const random = seededRandom(seed);
  const boost = calculateRatingBoost(settings);
  const englandRating = RATINGS.England + boost;
  const semiProbability = knockoutWinProbability(englandRating, RATINGS.Argentina);
  const franceOverSpain = knockoutWinProbability(RATINGS.France, RATINGS.Spain);

  let semiWins = 0;
  let trophyWins = 0;
  let franceFinals = 0;
  let spainFinals = 0;

  for (let index = 0; index < trials; index += 1) {
    let finalist: 'France' | 'Spain';
    if (settings.finalOpponent === 'Auto') {
      finalist = random() < franceOverSpain ? 'France' : 'Spain';
    } else {
      finalist = settings.finalOpponent;
    }

    if (finalist === 'France') franceFinals += 1;
    else spainFinals += 1;

    if (random() < semiProbability) {
      semiWins += 1;
      const finalProbability = knockoutWinProbability(englandRating, RATINGS[finalist]);
      if (random() < finalProbability) trophyWins += 1;
    }
  }

  return {
    semiWin: (semiWins / trials) * 100,
    finalWin: semiWins ? (trophyWins / semiWins) * 100 : 0,
    trophy: (trophyWins / trials) * 100,
    finalOpponentShares: {
      France: (franceFinals / trials) * 100,
      Spain: (spainFinals / trials) * 100,
    },
    ratingBoost: boost,
    trials,
  };
}

export const describeProbability = (probability: number) => {
  if (probability >= 50) return 'Favourites in your scenario';
  if (probability >= 35) return 'A serious shot at history';
  if (probability >= 20) return 'Right in the fight';
  if (probability >= 10) return 'Possible, but the margins are brutal';
  return 'It would take something extraordinary';
};

export const formatOneIn = (probability: number) =>
  probability <= 0 ? '—' : `1 in ${Math.max(2, Math.round(100 / probability))}`;
