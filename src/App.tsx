import { useEffect, useMemo, useState } from 'react';
import {
  ArrowDown,
  ArrowUpRight,
  Check,
  ChevronRight,
  Copy,
  Info,
  RotateCcw,
  Share2,
  Shield,
  Sparkles,
  Trophy,
} from 'lucide-react';
import {
  DEFAULT_SETTINGS,
  FinalOpponent,
  ScenarioSettings,
  describeProbability,
  formatOneIn,
  simulateScenario,
} from './model';

const MATCH_DATE = new Date('2026-07-15T19:00:00Z');

const clamp = (value: number) => Math.min(100, Math.max(0, value));

const readInitialSettings = (): ScenarioSettings => {
  const params = new URLSearchParams(window.location.search);
  const opponent = params.get('final');
  return {
    form: clamp(Number(params.get('form')) || DEFAULT_SETTINGS.form),
    finishing: clamp(Number(params.get('finishing')) || DEFAULT_SETTINGS.finishing),
    midfield: clamp(Number(params.get('midfield')) || DEFAULT_SETTINGS.midfield),
    nerve: clamp(Number(params.get('nerve')) || DEFAULT_SETTINGS.nerve),
    finalOpponent:
      opponent === 'France' || opponent === 'Spain' ? opponent : DEFAULT_SETTINGS.finalOpponent,
  };
};

const sliderLabels: Record<keyof Omit<ScenarioSettings, 'finalOpponent'>, [string, string]> = {
  form: ['Running on fumes', 'Flying'],
  finishing: ['Wasteful', 'Clinical'],
  midfield: ['Overrun', 'In control'],
  nerve: ['Heavy legs', 'Ice cold'],
};

const scenarioCopy: Record<keyof Omit<ScenarioSettings, 'finalOpponent'>, string> = {
  form: 'Recent performance and physical momentum',
  finishing: 'How efficiently England convert their chances',
  midfield: 'Ability to dictate territory and possession',
  nerve: 'Resilience in extra time and high-pressure moments',
};

function useCountdown() {
  const calculate = () => Math.max(0, MATCH_DATE.getTime() - Date.now());
  const [difference, setDifference] = useState(calculate);

  useEffect(() => {
    const timer = window.setInterval(() => setDifference(calculate()), 60_000);
    return () => window.clearInterval(timer);
  }, []);

  const totalMinutes = Math.floor(difference / 60_000);
  return {
    days: Math.floor(totalMinutes / 1_440),
    hours: Math.floor((totalMinutes % 1_440) / 60),
    minutes: totalMinutes % 60,
  };
}

function ProbabilityDial({ value, running }: { value: number; running: boolean }) {
  const radius = 124;
  const circumference = 2 * Math.PI * radius;
  const dash = circumference * (value / 100);

  return (
    <div className={`probability-dial ${running ? 'is-running' : ''}`} aria-label={`${value.toFixed(1)} per cent chance of winning`}>
      <svg viewBox="0 0 300 300" aria-hidden="true">
        <circle className="dial-track" cx="150" cy="150" r={radius} />
        <circle
          className="dial-value"
          cx="150"
          cy="150"
          r={radius}
          strokeDasharray={`${dash} ${circumference - dash}`}
        />
        <path className="dial-cross" d="M 150 18 V 282 M 18 150 H 282" />
        <circle className="dial-spot" cx="150" cy="150" r="3" />
      </svg>
      <div className="dial-copy">
        <span className="eyebrow">Lift the trophy</span>
        <strong>{value.toFixed(1)}<small>%</small></strong>
        <span className="one-in">{formatOneIn(value)} chance</span>
      </div>
    </div>
  );
}

function ScenarioSlider({
  name,
  value,
  onChange,
}: {
  name: keyof Omit<ScenarioSettings, 'finalOpponent'>;
  value: number;
  onChange: (value: number) => void;
}) {
  const title = name === 'form' ? 'Current form' : name === 'nerve' ? 'Big-game nerve' : name[0].toUpperCase() + name.slice(1);
  return (
    <div className="slider-block">
      <div className="slider-heading">
        <div>
          <label htmlFor={name}>{title}</label>
          <span className="slider-description">{scenarioCopy[name]}</span>
        </div>
        <output htmlFor={name}>{value}</output>
      </div>
      <input
        id={name}
        type="range"
        min="0"
        max="100"
        value={value}
        style={{ '--range-progress': `${value}%` } as React.CSSProperties}
        onChange={(event) => onChange(Number(event.target.value))}
      />
      <div className="slider-ends" aria-hidden="true">
        <span>{sliderLabels[name][0]}</span>
        <span>{sliderLabels[name][1]}</span>
      </div>
    </div>
  );
}

function TeamMark({ team, small = false }: { team: 'England' | 'Argentina' | 'France' | 'Spain'; small?: boolean }) {
  const flags = { England: 'ENG', Argentina: 'ARG', France: 'FRA', Spain: 'ESP' };
  return <span className={`team-mark team-${team.toLowerCase()} ${small ? 'is-small' : ''}`}>{flags[team]}</span>;
}

function App() {
  const [settings, setSettings] = useState<ScenarioSettings>(readInitialSettings);
  const [seed, setSeed] = useState(1966);
  const [running, setRunning] = useState(false);
  const [copied, setCopied] = useState(false);
  const countdown = useCountdown();
  const result = useMemo(() => simulateScenario(settings, 10_000, seed), [settings, seed]);

  useEffect(() => {
    const params = new URLSearchParams();
    params.set('form', String(settings.form));
    params.set('finishing', String(settings.finishing));
    params.set('midfield', String(settings.midfield));
    params.set('nerve', String(settings.nerve));
    if (settings.finalOpponent !== 'Auto') params.set('final', settings.finalOpponent);
    window.history.replaceState({}, '', `${window.location.pathname}?${params.toString()}`);
  }, [settings]);

  const setSetting = <K extends keyof ScenarioSettings>(key: K, value: ScenarioSettings[K]) => {
    setSettings((current) => ({ ...current, [key]: value }));
  };

  const runSimulation = () => {
    setRunning(true);
    setSeed(Date.now());
    window.setTimeout(() => setRunning(false), 850);
  };

  const reset = () => {
    setSettings(DEFAULT_SETTINGS);
    setSeed(1966);
  };

  const shareText = `My model gives England a ${result.trophy.toFixed(1)}% chance of winning the World Cup. Try your own scenario:`;

  const share = async () => {
    try {
      if (navigator.share) {
        await navigator.share({ title: 'Can England Win It?', text: shareText, url: window.location.href });
      } else {
        await navigator.clipboard.writeText(`${shareText} ${window.location.href}`);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 2_000);
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return;
    }
  };

  const copyLink = async () => {
    await navigator.clipboard.writeText(`${shareText} ${window.location.href}`);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2_000);
  };

  const semiExit = 100 - result.semiWin;
  const finalExit = result.semiWin - result.trophy;

  return (
    <div className="site-shell">
      <a className="skip-link" href="#simulator">Skip to simulator</a>
      <div className="ticker" role="status">
        <div className="ticker-inner">
          <span className="live-dot" />
          <strong>Project 1966</strong>
          <span>10,000 possible futures</span>
          <span className="ticker-score">NOR 1–2 ENG <em>AET</em></span>
          <span>Next: England v Argentina</span>
          <span className="desktop-only">Wed 15 July · 20:00 BST</span>
        </div>
      </div>

      <header className="masthead">
        <a className="wordmark" href="#top" aria-label="Project 1966 home">
          <span className="crest"><Shield size={19} strokeWidth={1.8} /></span>
          PROJECT <b>1966</b>
        </a>
        <nav aria-label="Page navigation">
          <a href="#route">The route</a>
          <a href="#method">The model</a>
          <button className="nav-share" type="button" onClick={share}><Share2 size={16} /> Share</button>
        </nav>
      </header>

      <main id="top">
        <section className="hero" aria-labelledby="hero-title">
          <div className="hero-grid-lines" aria-hidden="true" />
          <div className="hero-copy">
            <div className="edition-line">
              <span>World Cup 2026</span>
              <span>Model update 13.07.26</span>
            </div>
            <h1 id="hero-title">CAN<br /><span>ENGLAND</span><br />WIN IT?</h1>
            <p className="hero-intro">Two matches. Four teams. One question the whole country is asking. Tune the assumptions, run the numbers and see if football is coming home.</p>
            <a className="down-link" href="#simulator">Build your scenario <ArrowDown size={18} /></a>
          </div>

          <div className="hero-result">
            <div className="hero-result-top">
              <span className="eyebrow">Your current scenario</span>
              <span className="model-chip"><Sparkles size={13} /> Elo-inspired model</span>
            </div>
            <ProbabilityDial value={result.trophy} running={running} />
            <div className="verdict">
              <span className="verdict-number">{Math.round(result.trophy * 100)}</span>
              <div><strong>wins</strong><br />from 10,000 simulations</div>
            </div>
            <p className="verdict-line">{describeProbability(result.trophy)}.</p>
          </div>

          <aside className="match-card" aria-label="Next match countdown">
            <div className="match-card-head">
              <span>Semi-final · Match 102</span>
              <span>15 Jul</span>
            </div>
            <div className="match-teams">
              <div><TeamMark team="England" /><strong>England</strong></div>
              <span>v</span>
              <div><TeamMark team="Argentina" /><strong>Argentina</strong></div>
            </div>
            <div className="countdown">
              <div><strong>{String(countdown.days).padStart(2, '0')}</strong><span>days</span></div>
              <i>:</i>
              <div><strong>{String(countdown.hours).padStart(2, '0')}</strong><span>hours</span></div>
              <i>:</i>
              <div><strong>{String(countdown.minutes).padStart(2, '0')}</strong><span>mins</span></div>
            </div>
            <span className="venue">Atlanta · 20:00 BST</span>
          </aside>
        </section>

        <section className="simulator-section" id="simulator" aria-labelledby="simulator-title">
          <div className="section-label"><span>01</span> Set the conditions</div>
          <div className="simulator-heading">
            <div>
              <h2 id="simulator-title">YOU’RE THE<br />OPTIMIST-IN-CHIEF.</h2>
            </div>
            <p>Football isn’t played on a spreadsheet. Tell the model which England turns up. Every control changes all 10,000 tournament runs.</p>
          </div>

          <div className="control-board">
            <div className="sliders-panel">
              {(Object.keys(sliderLabels) as Array<keyof Omit<ScenarioSettings, 'finalOpponent'>>).map((name) => (
                <ScenarioSlider key={name} name={name} value={settings[name]} onChange={(value) => setSetting(name, value)} />
              ))}

              <fieldset className="opponent-fieldset">
                <legend>Potential final opponent</legend>
                <p>Let the other semi-final play out, or force a matchup.</p>
                <div className="segmented-control">
                  {(['Auto', 'France', 'Spain'] as FinalOpponent[]).map((opponent) => (
                    <button
                      key={opponent}
                      type="button"
                      className={settings.finalOpponent === opponent ? 'is-active' : ''}
                      aria-pressed={settings.finalOpponent === opponent}
                      onClick={() => setSetting('finalOpponent', opponent)}
                    >
                      {opponent === 'Auto' ? 'Simulate it' : opponent}
                    </button>
                  ))}
                </div>
              </fieldset>

              <div className="control-actions">
                <button className="run-button" type="button" onClick={runSimulation} disabled={running}>
                  <span>{running ? 'Running 10,000 futures…' : 'Run the tournament'}</span>
                  <ChevronRight size={21} />
                </button>
                <button className="reset-button" type="button" onClick={reset}><RotateCcw size={16} /> Reset</button>
              </div>
            </div>

            <div className="results-panel" aria-live="polite">
              <div className="results-header">
                <div>
                  <span className="eyebrow">Simulation report</span>
                  <strong>England’s route</strong>
                </div>
                <span className="run-id">RUN / {String(seed).slice(-6)}</span>
              </div>

              <div className="stage-probabilities">
                <div>
                  <span>Beat Argentina</span>
                  <strong>{result.semiWin.toFixed(1)}%</strong>
                  <div className="meter"><i style={{ width: `${result.semiWin}%` }} /></div>
                </div>
                <div>
                  <span>Win the final <em>if reached</em></span>
                  <strong>{result.finalWin.toFixed(1)}%</strong>
                  <div className="meter"><i style={{ width: `${result.finalWin}%` }} /></div>
                </div>
                <div className="trophy-row">
                  <span>Become world champions</span>
                  <strong>{result.trophy.toFixed(1)}%</strong>
                  <Trophy aria-hidden="true" />
                </div>
              </div>

              <div className="outcome-block">
                <div className="outcome-title"><span>Where the 10,000 runs end</span><span>100%</span></div>
                <div className="outcome-bar" aria-label={`${semiExit.toFixed(1)}% semi-final exit, ${finalExit.toFixed(1)}% final exit, ${result.trophy.toFixed(1)}% champions`}>
                  <i className="outcome-semi" style={{ width: `${semiExit}%` }} />
                  <i className="outcome-final" style={{ width: `${finalExit}%` }} />
                  <i className="outcome-win" style={{ width: `${result.trophy}%` }} />
                </div>
                <div className="outcome-legend">
                  <span><i className="legend-semi" /> Semi-final {semiExit.toFixed(0)}%</span>
                  <span><i className="legend-final" /> Runners-up {finalExit.toFixed(0)}%</span>
                  <span><i className="legend-win" /> Champions {result.trophy.toFixed(0)}%</span>
                </div>
              </div>

              <div className="model-note">
                <Info size={18} />
                <p>Your assumptions add <strong>{result.ratingBoost >= 0 ? '+' : ''}{result.ratingBoost.toFixed(0)} rating points</strong> to England’s neutral baseline. The model then simulates both semi-finals and the final.</p>
              </div>

              <div className="share-actions">
                <button type="button" onClick={share}><Share2 size={17} /> Share my result</button>
                <button type="button" onClick={copyLink}>{copied ? <Check size={17} /> : <Copy size={17} />} {copied ? 'Copied' : 'Copy scenario'}</button>
              </div>
            </div>
          </div>
        </section>

        <section className="route-section" id="route" aria-labelledby="route-title">
          <div className="section-label light"><span>02</span> The last four</div>
          <div className="route-heading">
            <h2 id="route-title">TWO WINS<br />FROM FOREVER.</h2>
            <p>England are in their fourth men’s World Cup semi-final. The model begins here—everything before it is already written.</p>
          </div>

          <div className="bracket" aria-label="World Cup semi-final bracket">
            <div className="bracket-round">
              <span className="round-label">Semi-final · 14 July</span>
              <div className="fixture-card compact">
                <div><TeamMark team="France" small /><span>France</span></div>
                <div><TeamMark team="Spain" small /><span>Spain</span></div>
                <em>Dallas</em>
              </div>
              <span className="round-label second">Semi-final · 15 July</span>
              <div className="fixture-card featured">
                <div><TeamMark team="England" small /><span>England</span><b>{result.semiWin.toFixed(0)}%</b></div>
                <div><TeamMark team="Argentina" small /><span>Argentina</span><b>{(100 - result.semiWin).toFixed(0)}%</b></div>
                <em>Atlanta</em>
              </div>
            </div>
            <div className="bracket-connectors" aria-hidden="true"><i /><i /></div>
            <div className="bracket-round final-round">
              <span className="round-label">Final · 19 July</span>
              <div className="fixture-card final-card">
                <div className="unknown-team">
                  <span className="mini-marks"><TeamMark team="France" small /><TeamMark team="Spain" small /></span>
                  <span>{settings.finalOpponent === 'Auto' ? 'FRA / ESP' : settings.finalOpponent}</span>
                </div>
                <div><TeamMark team="England" small /><span>England</span><b>{result.trophy.toFixed(0)}%</b></div>
                <em>New York / New Jersey</em>
              </div>
              <div className="trophy-target"><Trophy size={34} /><span>World champions?</span></div>
            </div>
          </div>

          <div className="results-ribbon" aria-label="England's route to the semi-final">
            <div><span>Group L</span><strong>4–2</strong><em>Croatia</em></div>
            <div><span>Round of 32</span><strong>2–1</strong><em>Congo DR</em></div>
            <div><span>Round of 16</span><strong>3–2</strong><em>Mexico</em></div>
            <div><span>Quarter-final</span><strong>2–1</strong><em>Norway · AET</em></div>
          </div>
        </section>

        <section className="method-section" id="method" aria-labelledby="method-title">
          <div className="section-label"><span>03</span> Behind the number</div>
          <div className="method-grid">
            <div className="method-heading">
              <h2 id="method-title">NO CRYSTAL BALL.<br />JUST 10,000<br /><span>COIN FLIPS.</span></h2>
            </div>
            <div className="method-copy">
              <p className="lead">This is an explainable scenario model—not a forecast, betting product or claim to know the future.</p>
              <div className="method-steps">
                <div><span>01</span><p><strong>Start with team strength.</strong> Each semi-finalist receives an illustrative Elo-style rating based on recent international strength.</p></div>
                <div><span>02</span><p><strong>Add your assumptions.</strong> Form, finishing, midfield control and nerve adjust England’s rating up or down.</p></div>
                <div><span>03</span><p><strong>Play both matches 10,000 times.</strong> A seeded Monte Carlo simulation determines every semi-final and final.</p></div>
              </div>
              <div className="method-links">
                <a href="https://www.fifa.com/en/tournaments/mens/worldcup/canadamexicousa2026/" target="_blank" rel="noreferrer">Tournament source <ArrowUpRight size={15} /></a>
                <a href="https://github.com/MatthewPaver/can-england-win-it" target="_blank" rel="noreferrer">View the code <ArrowUpRight size={15} /></a>
              </div>
            </div>
            <aside className="formula-card">
              <span className="eyebrow">The engine</span>
              <code>P(win) = 1 / (1 + 10<sup>ΔR / 330</sup>)</code>
              <p>The gap between team ratings becomes a match probability. Your controls change England’s side of that equation.</p>
              <div className="quality-stamp"><Check size={17} /> Deterministic & tested</div>
            </aside>
          </div>
        </section>

        <section className="final-cta">
          <span className="giant-number">1966</span>
          <div>
            <span className="eyebrow">Your verdict</span>
            <h2>{result.trophy >= 30 ? 'START BELIEVING.' : 'KEEP THE FAITH.'}</h2>
            <p>Your scenario gives England a <strong>{result.trophy.toFixed(1)}% chance</strong> of lifting the trophy.</p>
            <button type="button" onClick={share}><Share2 size={18} /> Put your prediction on the record</button>
          </div>
        </section>
      </main>

      <footer>
        <a className="wordmark footer-mark" href="#top"><span className="crest"><Shield size={18} /></span> PROJECT <b>1966</b></a>
        <p>Built by Matthew Paver as an independent data experiment. Not affiliated with FIFA or The FA. No betting, no odds, no nonsense.</p>
        <span>Updated 13 July 2026 · v1.0</span>
      </footer>

      <div className={`toast ${copied ? 'is-visible' : ''}`} role="status"><Check size={16} /> Scenario copied to clipboard</div>
    </div>
  );
}

export default App;
