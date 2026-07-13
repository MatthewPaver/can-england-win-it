import type { CSSProperties } from 'react';
import { ChevronRight, Play, RotateCcw, Share2, Sparkles, Trophy, X } from 'lucide-react';
import { HEROES, HeroId, ScenarioSettings, SimulationResult } from './model';

export type MoodId = 'nervous' | 'ready' | 'unstoppable';
export type PressureId = 'wobbly' | 'steady' | 'ice-cold';
export type CinemaPhase = 'kickoff' | 'semi' | 'final' | 'result';

export const MOODS: Record<MoodId, {
  label: string;
  line: string;
  values: Pick<ScenarioSettings, 'form' | 'finishing' | 'midfield'>;
}> = {
  nervous: {
    label: 'Nervous',
    line: 'One of those nights',
    values: { form: 46, finishing: 49, midfield: 54 },
  },
  ready: {
    label: 'Ready',
    line: 'Focused & fearless',
    values: { form: 72, finishing: 67, midfield: 72 },
  },
  unstoppable: {
    label: 'Unstoppable',
    line: 'Everything clicks',
    values: { form: 90, finishing: 86, midfield: 88 },
  },
};

export const PRESSURES: Record<PressureId, { label: string; line: string; nerve: number }> = {
  wobbly: { label: 'Wobbly', line: 'Please, not penalties', nerve: 39 },
  steady: { label: 'Steady', line: 'Trust the process', nerve: 66 },
  'ice-cold': { label: 'Ice cold', line: 'No fear. No panic.', nerve: 91 },
};

const heroIds = Object.keys(HEROES) as HeroId[];

export function MatchdayControls({
  settings,
  mood,
  pressure,
  running,
  onMood,
  onPressure,
  onHero,
  onRun,
}: {
  settings: ScenarioSettings;
  mood: MoodId;
  pressure: PressureId;
  running: boolean;
  onMood: (mood: MoodId) => void;
  onPressure: (pressure: PressureId) => void;
  onHero: (hero: HeroId) => void;
  onRun: () => void;
}) {
  return (
    <div className="matchday-mode">
      <div className="matchday-mode-head">
        <div>
          <span className="mode-kicker"><Sparkles size={14} /> Matchday mode</span>
          <h3>MAKE 3 CALLS.<br />THEN KICK OFF.</h3>
        </div>
        <p>No spreadsheets required. Pick the mood, back a player and let 10,000 possible tournaments play out.</p>
      </div>

      <div className="quick-question">
        <div className="question-copy">
          <span>01</span>
          <div><strong>Which England turns up?</strong><small>Set the team’s overall level</small></div>
        </div>
        <div className="choice-grid mood-grid">
          {(Object.keys(MOODS) as MoodId[]).map((id) => (
            <button key={id} type="button" className={mood === id ? 'is-selected' : ''} aria-pressed={mood === id} onClick={() => onMood(id)}>
              <strong>{MOODS[id].label}</strong><span>{MOODS[id].line}</span>
              <i aria-hidden="true">{id === 'nervous' ? '😬' : id === 'ready' ? '🫡' : '🔥'}</i>
            </button>
          ))}
        </div>
      </div>

      <div className="quick-question">
        <div className="question-copy">
          <span>02</span>
          <div><strong>How are the nerves?</strong><small>Extra time. Penalties. The lot.</small></div>
        </div>
        <div className="choice-grid pressure-grid">
          {(Object.keys(PRESSURES) as PressureId[]).map((id) => (
            <button key={id} type="button" className={pressure === id ? 'is-selected' : ''} aria-pressed={pressure === id} onClick={() => onPressure(id)}>
              <strong>{PRESSURES[id].label}</strong><span>{PRESSURES[id].line}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="quick-question hero-question">
        <div className="question-copy">
          <span>03</span>
          <div><strong>Pick your hero</strong><small>Who writes the next chapter?</small></div>
        </div>
        <div className="player-deck">
          {heroIds.map((id) => {
            const hero = HEROES[id];
            const selected = settings.hero === id;
            return (
              <button key={id} type="button" className={`player-card player-${id.toLowerCase()} ${selected ? 'is-selected' : ''}`} aria-pressed={selected} onClick={() => onHero(id)}>
                <span className="player-art" aria-hidden="true">
                  <span className="player-orbit" />
                  <span className="player-head" />
                  <span className="player-body"><b>{hero.number}</b></span>
                  <span className="player-surname">{id.toUpperCase()}</span>
                </span>
                <span className="player-info">
                  <span className="player-role">{hero.role}</span>
                  <strong>{hero.name}</strong>
                  <small>{hero.context}</small>
                  <em>+{hero.boost} scenario pts</em>
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <button className="kickoff-button" type="button" onClick={onRun} disabled={running}>
        <span className="kickoff-icon"><Play size={22} fill="currentColor" /></span>
        <span><small>Your calls are locked</small><strong>{running ? 'Playing 10,000 futures…' : 'Play the tournament'}</strong></span>
        <ChevronRight size={25} />
      </button>
    </div>
  );
}

const phaseCopy: Record<CinemaPhase, { kicker: string; title: string; sub: string }> = {
  kickoff: { kicker: 'Kick-off', title: '10,000 FUTURES', sub: 'Every possibility starts here.' },
  semi: { kicker: 'Semi-final · Atlanta', title: 'ENGLAND v ARGENTINA', sub: 'Pressure rising. Margins disappearing.' },
  final: { kicker: 'Final · New York / New Jersey', title: 'ONE MATCH FROM HISTORY', sub: 'France or Spain await.' },
  result: { kicker: 'Simulation complete', title: 'THE DREAM IS ALIVE', sub: 'Your verdict is in.' },
};

export function MatchdayCinema({
  open,
  phase,
  result,
  hero,
  onClose,
  onShare,
  onRerun,
}: {
  open: boolean;
  phase: CinemaPhase;
  result: SimulationResult;
  hero: HeroId;
  onClose: () => void;
  onShare: () => void;
  onRerun: () => void;
}) {
  if (!open) return null;
  const heroData = HEROES[hero];
  const headline = result.trophy >= 35
    ? 'START BELIEVING'
    : result.trophy >= 20
      ? 'THE DREAM IS ALIVE'
      : result.trophy >= 10
        ? 'KEEP THE FAITH'
        : 'A VERY LONG SHOT';
  const copy = phase === 'result' ? { ...phaseCopy.result, title: headline } : phaseCopy[phase];

  return (
    <div className={`matchday-cinema phase-${phase}`} role="dialog" aria-modal="true" aria-labelledby="cinema-title">
      <button className="cinema-close" type="button" aria-label="Close simulation" onClick={onClose}><X size={20} /></button>
      <div className="cinema-topline">
        <span>PROJECT 1966</span><span className="cinema-live"><i /> LIVE MODEL</span><span>RUNNING 10,000</span>
      </div>

      <div className="cinema-stage">
        <div className="cinema-pitch" aria-hidden="true">
          <div className="pitch-half" /><div className="pitch-circle" /><div className="pitch-box left" /><div className="pitch-box right" />
          <span className="cinema-ball" />
          <div className="simulation-trails">
            {Array.from({ length: 42 }, (_, index) => (
              <i key={index} style={{ '--trail-index': index } as CSSProperties} />
            ))}
          </div>
        </div>

        <div className="cinema-hero-card" aria-label={`Your hero is ${heroData.name}`}>
          <span className="cinema-shirt"><b>{heroData.number}</b><em>{hero.toUpperCase()}</em></span>
          <div><small>Your wildcard</small><strong>{heroData.name}</strong><span>{heroData.flavour}</span></div>
        </div>

        <div className="cinema-copy" aria-live="polite">
          <span className="cinema-kicker">{copy.kicker}</span>
          <h2 id="cinema-title">{copy.title}</h2>
          <p>{copy.sub}</p>
        </div>

        {phase === 'result' && (
          <div className="cinema-result">
            <div className="cinema-probability">
              <span>Central estimate</span>
              <strong>{result.trophy.toFixed(1)}<small>%</small></strong>
              <em>{result.uncertainty.low.toFixed(0)}–{result.uncertainty.high.toFixed(0)}% model range</em>
            </div>
            <div className="cinema-wins"><Trophy size={24} /><strong>{Math.round(result.trophy * 100)}</strong><span>of 10,000 futures<br />end with the trophy</span></div>
            <div className="cinema-actions">
              <button type="button" onClick={onShare}><Share2 size={17} /> Share this verdict</button>
              <button type="button" onClick={onRerun}><RotateCcw size={17} /> Run it again</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
