export type FinalOpponent = 'Auto' | 'France' | 'Spain';
export type HeroId = 'Bellingham' | 'Kane' | 'Saka' | 'Pickford';

export const HEROES: Record<HeroId, {
  name: string;
  number: number;
  role: string;
  flavour: string;
  context: string;
  boost: number;
}> = {
  Bellingham: {
    name: 'Jude Bellingham',
    number: 10,
    role: 'The scriptwriter',
    flavour: 'Big moments & midfield drive',
    context: '6 tournament goals',
    boost: 12,
  },
  Kane: {
    name: 'Harry Kane',
    number: 9,
    role: 'The finisher',
    flavour: 'Chances become goals',
    context: '6 goals · captain',
    boost: 11,
  },
  Saka: {
    name: 'Bukayo Saka',
    number: 7,
    role: 'The spark',
    flavour: 'Width, invention & chaos',
    context: 'Right-side threat',
    boost: 8,
  },
  Pickford: {
    name: 'Jordan Pickford',
    number: 1,
    role: 'The wall',
    flavour: 'Saves when margins vanish',
    context: 'Pressure specialist',
    boost: 7,
  },
};

export type ScenarioSettings = {
  form: number;
  finishing: number;
  midfield: number;
  nerve: number;
  finalOpponent: FinalOpponent;
  hero: HeroId;
};

export type SimulationResult = {
  semiWin: number;
  finalWin: number;
  trophy: number;
  finalOpponentShares: { France: number; Spain: number };
  ratingBoost: number;
  performanceBoost: number;
  heroBoost: number;
  uncertainty: { low: number; high: number };
  trials: number;
};

export const DEFAULT_SETTINGS: ScenarioSettings = {
  form: 74,
  finishing: 67,
  midfield: 72,
  nerve: 65,
  finalOpponent: 'Auto',
  hero: 'Bellingham',
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

export const calculatePerformanceBoost = (settings: ScenarioSettings) =>
  (settings.form - 50) * 0.62 +
  (settings.finishing - 50) * 0.48 +
  (settings.midfield - 50) * 0.42 +
  (settings.nerve - 50) * 0.44;

export const calculateRatingBoost = (settings: ScenarioSettings) =>
  calculatePerformanceBoost(settings) + HEROES[settings.hero].boost;

export const knockoutWinProbability = (teamRating: number, opponentRating: number) =>
  1 / (1 + 10 ** ((opponentRating - teamRating) / 330));

export function simulateScenario(
  settings: ScenarioSettings,
  trials = 10_000,
  seed = 1966,
): SimulationResult {
  const random = seededRandom(seed);
  const performanceBoost = calculatePerformanceBoost(settings);
  const heroBoost = HEROES[settings.hero].boost;
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

  const trophy = (trophyWins / trials) * 100;
  const uncertaintyWidth = Math.max(4.5, trophy * 0.2);

  return {
    semiWin: (semiWins / trials) * 100,
    finalWin: semiWins ? (trophyWins / semiWins) * 100 : 0,
    trophy,
    finalOpponentShares: {
      France: (franceFinals / trials) * 100,
      Spain: (spainFinals / trials) * 100,
    },
    ratingBoost: boost,
    performanceBoost,
    heroBoost,
    uncertainty: {
      low: Math.max(0, trophy - uncertaintyWidth),
      high: Math.min(100, trophy + uncertaintyWidth),
    },
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
