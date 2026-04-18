import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  GeoVector,
  RotateVector,
  Rotation_EQJ_ECL,
  SphereFromVector,
  EclipticLongitude,
  Illumination,
  Elongation,
} from 'astronomy-engine';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import {
  Heart,
  Briefcase,
  Coins,
  Moon,
  Flame,
  Sparkles,
  ShieldAlert,
  CalendarDays,
  ChevronRight,
  Eye,
  Target,
  Menu,
  X,
  Orbit,
} from 'lucide-react';

const STORAGE_KEY = 'celestial-dashboard-nate-vercel-v1';
const BODIES = ['Sun', 'Moon', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Pluto'];
const ZODIAC = ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'];

const sections = [
  { id: 'overview', label: 'Overview', glyph: '✦' },
  { id: 'natal', label: 'Natal Chart', glyph: '♈' },
  { id: 'personality', label: 'Personality', glyph: '◈' },
  { id: 'shadow', label: 'Shadow', glyph: '🌑' },
  { id: 'horoscope', label: '2026', glyph: '🌟' },
  { id: 'outlook', label: '5-Year', glyph: '🔭' },
  { id: 'romance', label: 'Romance', glyph: '❤️' },
  { id: 'finance', label: 'Finance', glyph: '💰' },
  { id: 'career', label: 'Career', glyph: '📈' },
  { id: 'live', label: 'Live Sky', glyph: '🪐' },
  { id: 'convergence', label: 'Convergence', glyph: '⚡' },
  { id: 'journal', label: 'Tracker', glyph: '✍️' },
];

const birthProfile = {
  name: 'Nate',
  birth: 'April 8, 1988 · 7:00 AM · Somerville, NJ',
  western: 'Aries Sun',
  vedic: 'Mula Nakshatra',
  chinese: 'Earth Dragon',
};

const natalLongitudes = {
  Sun: 18.8,
  Moon: 245.2,
  Mercury: 10.1,
  Venus: 32.4,
  Mars: 292.3,
  Jupiter: 37.5,
  Saturn: 270.8,
};

const natalPoints = [
  { body: 'Sun', sign: 'Aries', degree: 18.8, note: 'Core identity, leadership, direct will' },
  { body: 'Moon', sign: 'Sagittarius', degree: 5.2, note: 'Mula moon: root-seeking, truth-seeking, restless spirit' },
  { body: 'Mercury', sign: 'Aries', degree: 10.1, note: 'Fast communication, blunt perception, decisive thought' },
  { body: 'Venus', sign: 'Taurus', degree: 2.4, note: 'Sensual values, loyalty, appetite for real stability' },
  { body: 'Mars', sign: 'Capricorn', degree: 22.3, note: 'Disciplined drive, strategic execution, endurance' },
  { body: 'Jupiter', sign: 'Taurus', degree: 7.5, note: 'Growth through grounded systems and value creation' },
  { body: 'Saturn', sign: 'Capricorn', degree: 0.8, note: 'Serious builder energy, long-cycle responsibilities' },
  { body: 'Asc', sign: 'Aries / Taurus cusp', degree: 0.0, note: 'Strong fire imprint with grounded edge' },
];

const domainCards = [
  {
    id: 'career',
    title: 'Career',
    icon: Briefcase,
    summary: '2026 rewards disciplined execution, not scattered motion. You are being pushed to build a stronger professional identity, not just win faster.',
    now: 'Strong for structural moves, pruning dead work, and stepping into higher accountability.',
    shadow: 'Overconfidence, impatience with slower collaborators, and walking away too early could cost you leverage.',
  },
  {
    id: 'finance',
    title: 'Finance',
    icon: Coins,
    summary: 'Money improves through steadier systems, better risk discipline, and choosing durable plays over ego-driven timing.',
    now: 'Focus on cash flow, runway, risk caps, and conviction backed by actual structure.',
    shadow: 'Speculative impulses and identity-based spending decisions are the trap.',
  },
  {
    id: 'romance',
    title: 'Romance',
    icon: Heart,
    summary: 'This year pushes intimacy through honesty. The right connection deepens; the wrong one exposes your avoidance patterns fast.',
    now: 'Higher magnetism, but also stronger triggers around autonomy and emotional exposure.',
    shadow: 'Cutting people off before vulnerability matures into trust.',
  },
];

const compatibility = [
  { type: 'Best western flow', value: 'Leo, Sagittarius, select Taurus' },
  { type: 'Best emotional fit', value: 'People who can handle depth without controlling you' },
  { type: 'Friction pattern', value: 'Passive-aggressive, vague, evasive personalities' },
  { type: 'Magnetic but risky', value: 'Intensity addicts, rescuers, illusion-heavy partners' },
];

const bestWorstDates = {
  romance: { best: ['Apr 20–24', 'Aug 29–Sep 4', 'Nov 8–12'], caution: ['Jul 22–30', 'Oct 14–18'] },
  finance: { best: ['May 11–19', 'Aug 28–Sep 6', 'Dec 10–18'], caution: ['Jun 21–27', 'Jul 26–Aug 2'] },
  career: { best: ['Apr 16–22', 'Aug 25–Sep 5', 'Dec 12–20'], caution: ['Feb 18–24', 'Jul 24–31'] },
};

const fiveYear = [
  { year: '2026', theme: 'Identity deconstruction', level: 92 },
  { year: '2027', theme: 'Structural commitment', level: 88 },
  { year: '2028', theme: 'Power consolidation', level: 82 },
  { year: '2029', theme: 'Expansion with discernment', level: 76 },
  { year: '2030', theme: 'Stabilized authority', level: 73 },
];

const defaultState = {
  darkMode: true,
  dailyCheck: { energy: 6, mood: 6, clarity: 5, discipline: 5 },
  habits: { journal: false, movement: false, deepWork: false, meditation: false, noImpulseSpend: false },
  notes: '',
  activeSection: 'overview',
  activeTab: {},
};

function cn(...classes) {
  return classes.filter(Boolean).join(' ');
}

function normalizeAngle(angle) {
  let a = angle % 360;
  if (a < 0) a += 360;
  return a;
}

function angularDistance(a, b) {
  const diff = Math.abs(normalizeAngle(a) - normalizeAngle(b));
  return Math.min(diff, 360 - diff);
}

function signedAngleDelta(a, b) {
  let diff = normalizeAngle(a) - normalizeAngle(b);
  if (diff > 180) diff -= 360;
  if (diff < -180) diff += 360;
  return diff;
}

function getSignName(longitude) {
  return ZODIAC[Math.floor(normalizeAngle(longitude) / 30) % 12];
}

function getSignDegree(longitude) {
  return normalizeAngle(longitude) % 30;
}

function formatLongitude(longitude) {
  const sign = getSignName(longitude);
  const deg = getSignDegree(longitude);
  const whole = Math.floor(deg);
  const minutes = Math.round((deg - whole) * 60);
  return `${whole}° ${String(minutes).padStart(2, '0')}′ ${sign}`;
}

function zodiacGlyph(sign) {
  const map = {
    Aries: '♈', Taurus: '♉', Gemini: '♊', Cancer: '♋', Leo: '♌', Virgo: '♍',
    Libra: '♎', Scorpio: '♏', Sagittarius: '♐', Capricorn: '♑', Aquarius: '♒', Pisces: '♓',
  };
  return map[sign] || '✦';
}

function geocentricLongitude(body, date) {
  if (body === 'Sun') {
    const earthLon = EclipticLongitude('Earth', date);
    return normalizeAngle(earthLon + 180);
  }
  const vector = GeoVector(body, date, true);
  const eclVec = RotateVector(Rotation_EQJ_ECL(), vector);
  return normalizeAngle(SphereFromVector(eclVec).lon);
}

function getRetrograde(body, date) {
  if (body === 'Sun' || body === 'Moon') return false;
  const nowLon = geocentricLongitude(body, date);
  const prevLon = geocentricLongitude(body, new Date(date.getTime() - 24 * 3600 * 1000));
  return signedAngleDelta(nowLon, prevLon) < 0;
}

function aspectLabel(diff) {
  const aspects = [
    { name: 'Conjunction', angle: 0, orb: 8 },
    { name: 'Sextile', angle: 60, orb: 4 },
    { name: 'Square', angle: 90, orb: 6 },
    { name: 'Trine', angle: 120, orb: 6 },
    { name: 'Opposition', angle: 180, orb: 8 },
  ];
  return aspects
    .map((a) => ({ ...a, delta: Math.abs(diff - a.angle) }))
    .filter((a) => a.delta <= a.orb)
    .sort((a, b) => a.delta - b.delta)[0] || null;
}

function deriveTone(transits) {
  const names = transits.slice(0, 3).map((t) => `${t.planet} ${t.aspect.toLowerCase()} natal ${t.natal}`).join(' · ');
  if (!names) return 'The sky is comparatively quiet; today favors steady follow-through over dramatic pivots.';
  return `Strongest active pattern: ${names}. Move with intention and avoid reactive overreach.`;
}

function usePersistedState() {
  const [state, setState] = useState(defaultState);
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setState({ ...defaultState, ...JSON.parse(raw) });
    } catch {}
  }, []);
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {}
  }, [state]);
  return [state, setState];
}

function Card({ className = '', children }) {
  return <div className={className}>{children}</div>;
}

function CardHeader({ className = '', children }) {
  return <div className={cn('p-5 pb-3', className)}>{children}</div>;
}

function CardTitle({ className = '', children }) {
  return <h3 className={cn('text-lg font-semibold', className)}>{children}</h3>;
}

function CardDescription({ className = '', children }) {
  return <p className={cn('mt-1 text-sm', className)}>{children}</p>;
}

function CardContent({ className = '', children }) {
  return <div className={cn('p-5 pt-0', className)}>{children}</div>;
}

function PillButton({ children, onClick, active, className = '' }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'rounded-2xl px-3 py-2 text-sm transition',
        active ? 'bg-fuchsia-500/30 text-white ring-1 ring-fuchsia-300/50' : 'bg-white/5 text-white/80 hover:bg-white/10',
        className
      )}
    >
      {children}
    </button>
  );
}

function MiniButton({ children, onClick }) {
  return (
    <button onClick={onClick} className="rounded-xl bg-white/10 px-3 py-1.5 text-sm text-white hover:bg-white/15">
      {children}
    </button>
  );
}

function TextInput(props) {
  return <input {...props} className={cn('w-full rounded-2xl border border-white/10 bg-white/5 px-3 py-3 text-white placeholder:text-white/40 outline-none', props.className || '')} />;
}

function TextArea(props) {
  return <textarea {...props} className={cn('w-full rounded-2xl border border-white/10 bg-white/5 px-3 py-3 text-white placeholder:text-white/35 outline-none', props.className || '')} />;
}

function Toggle({ checked, onChange }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={cn('relative inline-flex h-7 w-12 items-center rounded-full transition', checked ? 'bg-fuchsia-500' : 'bg-white/15')}
    >
      <span className={cn('inline-block h-5 w-5 transform rounded-full bg-white transition', checked ? 'translate-x-6' : 'translate-x-1')} />
    </button>
  );
}

function ProgressBar({ value }) {
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
      <div className="h-full rounded-full bg-gradient-to-r from-pink-400 via-fuchsia-400 to-violet-400" style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
    </div>
  );
}

function BadgePill({ children, className = '' }) {
  return <span className={cn('inline-flex rounded-full px-3 py-1 text-xs font-medium', className)}>{children}</span>;
}

function Section({ id, title, subtitle, darkMode, children }) {
  return (
    <section id={id} className="scroll-mt-24">
      <div className="mb-4">
        <h2 className={cn('text-2xl font-semibold tracking-tight md:text-3xl', darkMode ? 'text-white' : 'text-slate-900')}>{title}</h2>
        {subtitle ? <p className={cn('mt-1 text-sm md:text-base', darkMode ? 'text-white/70' : 'text-slate-600')}>{subtitle}</p> : null}
      </div>
      {children}
    </section>
  );
}

function TinyStat({ label, value, icon: Icon, darkMode }) {
  return (
    <div className={cn('rounded-2xl border p-4 backdrop-blur-sm', darkMode ? 'border-white/10 bg-white/5' : 'border-slate-200 bg-white/80')}>
      <div className={cn('flex items-center gap-2', darkMode ? 'text-white/70' : 'text-slate-600')}>
        <Icon className="h-4 w-4" />
        <span className="text-xs uppercase tracking-[0.2em]">{label}</span>
      </div>
      <div className={cn('mt-2 text-xl font-semibold', darkMode ? 'text-white' : 'text-slate-900')}>{value}</div>
    </div>
  );
}

function Gauge({ label, value, darkMode }) {
  return (
    <div>
      <div className={cn('mb-2 flex items-center justify-between text-sm', darkMode ? 'text-white/80' : 'text-slate-700')}>
        <span className="capitalize">{label}</span>
        <span>{value}/10</span>
      </div>
      <ProgressBar value={value * 10} />
    </div>
  );
}

export default function App() {
  const [state, setState] = usePersistedState();
  const [menuOpen, setMenuOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(t);
  }, []);

  const liveData = useMemo(() => {
    const planets = BODIES.map((body) => {
      const longitude = geocentricLongitude(body, now);
      const sign = getSignName(longitude);
      const retrograde = getRetrograde(body, now);
      const illumination = body === 'Sun' ? null : Illumination(body, now);
      const elongation = body === 'Sun' ? null : Elongation(body, now);
      return {
        body,
        longitude,
        sign,
        formatted: formatLongitude(longitude),
        retrograde,
        phase: illumination ? illumination.phase_fraction : null,
        elongation: elongation ? elongation.elongation : null,
      };
    });

    const moon = planets.find((p) => p.body === 'Moon');

    const transits = planets
      .flatMap((planet) => Object.entries(natalLongitudes).map(([natal, natalLon]) => {
        const diff = angularDistance(planet.longitude, natalLon);
        const aspect = aspectLabel(diff);
        if (!aspect) return null;
        return { planet: planet.body, natal, aspect: aspect.name, orb: Number(aspect.delta.toFixed(2)) };
      }))
      .filter(Boolean)
      .sort((a, b) => a.orb - b.orb);

    const strongest = transits.slice(0, 6);
    const saturnSun = angularDistance(planets.find((p) => p.body === 'Saturn').longitude, natalLongitudes.Sun);
    const neptuneSun = angularDistance(planets.find((p) => p.body === 'Neptune').longitude, natalLongitudes.Sun);
    const marsMercury = angularDistance(planets.find((p) => p.body === 'Mars').longitude, natalLongitudes.Mercury);
    const jupiterMoon = angularDistance(planets.find((p) => p.body === 'Jupiter').longitude, natalLongitudes.Moon);

    const orbMeters = [
      { name: 'Saturn → Sun', value: Math.round(Math.max(0, 100 - saturnSun * 4)), note: 'Real-time geocentric orb against natal Sun' },
      { name: 'Neptune → Sun', value: Math.round(Math.max(0, 100 - neptuneSun * 4)), note: 'Current Neptune pressure on identity themes' },
      { name: 'Mars → Mercury', value: Math.round(Math.max(0, 100 - marsMercury * 4)), note: 'Current drive hitting thought / speech pattern' },
      { name: 'Jupiter → Moon', value: Math.round(Math.max(0, 100 - jupiterMoon * 4)), note: 'Expansion vs emotional instinct' },
    ];

    const shadowRadar = [
      { trait: 'Self-sabotage', value: Math.min(95, Math.round((orbMeters[0].value + orbMeters[1].value) / 2)) },
      { trait: 'Rage / reactivity', value: Math.min(95, Math.round(orbMeters[2].value * 0.92)) },
      { trait: 'Control armor', value: Math.min(95, Math.round((orbMeters[0].value + 70) / 2)) },
      { trait: 'Rootlessness', value: Math.min(95, Math.round((orbMeters[1].value + orbMeters[3].value) / 2)) },
      { trait: 'Truth as weapon', value: Math.min(95, Math.round((orbMeters[2].value + 64) / 2)) },
    ];

    const monthSeeds = [48, 53, 60, 72, 68, 59, 54, 73, 76, 69, 61, 66];
    const yearHeat = monthSeeds.map((seed, idx) => ({
      month: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][idx],
      love: Math.min(98, Math.round(seed + orbMeters[3].value * 0.12 + (idx === 3 ? 12 : 0))),
      finance: Math.min(98, Math.round(seed + 8 + orbMeters[0].value * 0.08 + ((idx === 7 || idx === 8) ? 10 : 0))),
      career: Math.min(99, Math.round(seed + 14 + (100 - saturnSun) * 0.06 + (idx === 3 ? 8 : 0))),
      health: Math.min(95, Math.round(seed - 4 + marsMercury * 0.08)),
      identity: Math.min(99, Math.round(seed + 18 + (100 - neptuneSun) * 0.12 + (idx === 3 ? 14 : 0))),
    }));

    const cosmicWeather = {
      date: now.toLocaleString(),
      moon: `${moon.sign} Moon`,
      phase: moon.phase != null ? `${Math.round(moon.phase * 100)}% illuminated` : 'Phase unavailable',
      dominant: strongest[0] ? `${strongest[0].planet} ${strongest[0].aspect} natal ${strongest[0].natal}` : 'Moderate sky',
      briefing: deriveTone(strongest),
    };

    return { planets, strongest, orbMeters, shadowRadar, yearHeat, cosmicWeather };
  }, [now]);

  const themeShell = state.darkMode
    ? 'bg-[radial-gradient(circle_at_top,_rgba(208,90,255,0.20),_transparent_30%),radial-gradient(circle_at_80%_20%,_rgba(255,185,91,0.22),_transparent_25%),linear-gradient(180deg,#100523_0%,#150a2f_35%,#0b1225_100%)] text-white'
    : 'bg-[radial-gradient(circle_at_top,_rgba(255,190,221,0.35),_transparent_32%),radial-gradient(circle_at_80%_20%,_rgba(255,219,147,0.35),_transparent_25%),linear-gradient(180deg,#fffaf4_0%,#f7f1ff_45%,#eef6ff_100%)] text-slate-900';

  const cardBase = state.darkMode ? 'rounded-[2rem] border border-white/10 bg-white/5 text-white backdrop-blur-md' : 'rounded-[2rem] border border-slate-200/70 bg-white/80 text-slate-900 backdrop-blur-md';
  const textMuted = state.darkMode ? 'text-white/70' : 'text-slate-600';

  const filteredSections = useMemo(() => {
    if (!search.trim()) return sections;
    return sections.filter((s) => s.label.toLowerCase().includes(search.toLowerCase()));
  }, [search]);

  const updateHabit = (key, value) => setState((s) => ({ ...s, habits: { ...s.habits, [key]: value } }));
  const updateCheck = (key, delta) => setState((s) => ({ ...s, dailyCheck: { ...s.dailyCheck, [key]: Math.max(1, Math.min(10, s.dailyCheck[key] + delta)) } }));
  const setTab = (group, value) => setState((s) => ({ ...s, activeTab: { ...s.activeTab, [group]: value } }));

  const jumpTo = (id) => {
    setState((s) => ({ ...s, activeSection: id }));
    setMenuOpen(false);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className={cn('min-h-screen transition-colors duration-300', themeShell)}>
      <style>{`
        html { scroll-behavior: smooth; }
        .starfield::before {
          content: '';
          position: absolute;
          inset: 0;
          background-image:
            radial-gradient(circle at 12% 18%, rgba(255,255,255,.7) 0 1px, transparent 1px),
            radial-gradient(circle at 82% 30%, rgba(255,255,255,.5) 0 1px, transparent 1px),
            radial-gradient(circle at 50% 60%, rgba(255,255,255,.4) 0 1px, transparent 1px),
            radial-gradient(circle at 22% 72%, rgba(255,255,255,.6) 0 1px, transparent 1px),
            radial-gradient(circle at 68% 80%, rgba(255,255,255,.45) 0 1px, transparent 1px);
          pointer-events: none;
          opacity: .55;
        }
      `}</style>

      <header className="sticky top-0 z-40 border-b border-white/10 bg-black/20 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 md:px-6">
          <div className="flex items-center gap-3">
            <button className="rounded-xl p-2 hover:bg-white/10 md:hidden" onClick={() => setMenuOpen((v) => !v)}>
              {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
            <div>
              <div className="text-xs uppercase tracking-[0.3em] text-white/60">Cosmic Weather</div>
              <div className="text-sm font-medium md:text-base">{liveData.cosmicWeather.briefing}</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-white/70 sm:inline">Mystic Mode</span>
            <Toggle checked={state.darkMode} onChange={(v) => setState((s) => ({ ...s, darkMode: v }))} />
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-7xl gap-6 px-4 py-4 md:px-6 md:py-6">
        <aside className={cn('fixed inset-y-0 left-0 z-30 w-72 border-r border-white/10 p-4 pt-20 transition-transform duration-300 md:sticky md:top-24 md:block md:h-[calc(100vh-7rem)] md:translate-x-0 md:rounded-3xl', state.darkMode ? 'bg-slate-950/85' : 'bg-white/90', menuOpen ? 'translate-x-0' : '-translate-x-full')}>
          <div className="mb-4">
            <div className="text-xs uppercase tracking-[0.3em] text-fuchsia-300">Celestial Blueprint</div>
            <h1 className={cn('mt-2 text-xl font-semibold', state.darkMode ? 'text-white' : 'text-slate-900')}>{birthProfile.name}</h1>
            <p className={cn('mt-1 text-sm', textMuted)}>{birthProfile.birth}</p>
          </div>
          <TextInput value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Jump to a section" />
          <div className="mt-4 space-y-2 overflow-y-auto pr-1">
            {filteredSections.map((item) => (
              <button
                key={item.id}
                onClick={() => jumpTo(item.id)}
                className={cn(
                  'flex w-full items-center justify-between rounded-2xl px-3 py-3 text-left transition',
                  state.activeSection === item.id ? 'bg-fuchsia-500/20 text-white ring-1 ring-fuchsia-300/40' : state.darkMode ? 'bg-white/5 text-white/80 hover:bg-white/10' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                )}
              >
                <span className="flex items-center gap-3"><span>{item.glyph}</span><span>{item.label}</span></span>
                <ChevronRight className="h-4 w-4 opacity-70" />
              </button>
            ))}
          </div>
        </aside>

        <main className="min-w-0 flex-1 space-y-10 pb-20">
          <motion.section id="overview" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} className="starfield relative overflow-hidden rounded-[2rem] border border-white/10 p-6 md:p-8">
            <div className="relative z-10 grid gap-6 lg:grid-cols-[1.35fr_.9fr]">
              <div>
                <BadgePill className="mb-4 bg-fuchsia-500/20 text-fuchsia-200">Now using real transit math</BadgePill>
                <h1 className="max-w-3xl text-4xl font-semibold leading-tight md:text-6xl">Your celestial dashboard, now running on live planetary calculations.</h1>
                <p className={cn('mt-4 max-w-2xl text-base md:text-lg', textMuted)}>
                  The live sky, current signs, retrogrades, orb meters, and strongest transits are calculated in-browser. The deeper horoscope sections preserve the interpretive framework you liked.
                </p>
                <div className="mt-6 flex flex-wrap gap-3">
                  <BadgePill className="bg-rose-500/20 text-rose-200">Aries Sun</BadgePill>
                  <BadgePill className="bg-violet-500/20 text-violet-200">Mula Nakshatra</BadgePill>
                  <BadgePill className="bg-amber-500/20 text-amber-100">Earth Dragon</BadgePill>
                  <BadgePill className="bg-cyan-500/20 text-cyan-100">{liveData.cosmicWeather.date}</BadgePill>
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                <TinyStat label="Moon" value={liveData.cosmicWeather.moon} icon={Moon} darkMode={state.darkMode} />
                <TinyStat label="Phase" value={liveData.cosmicWeather.phase} icon={Sparkles} darkMode={state.darkMode} />
                <TinyStat label="Dominant Transit" value={liveData.cosmicWeather.dominant} icon={Orbit} darkMode={state.darkMode} />
                <TinyStat label="Core Theme" value="Identity rebuild" icon={ShieldAlert} darkMode={state.darkMode} />
              </div>
            </div>
          </motion.section>

          <Section id="natal" title="Natal Chart" subtitle="Birth placements held constant, with current sky overlays feeding the rest of the dashboard." darkMode={state.darkMode}>
            <div className="grid gap-6 lg:grid-cols-[1.05fr_.95fr]">
              <Card className={cardBase}>
                <CardHeader>
                  <CardTitle>Natal Wheel</CardTitle>
                  <CardDescription className={textMuted}>Symbolic wheel plus current top transit markers.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="relative mx-auto aspect-square max-w-md rounded-full border border-white/10 bg-[radial-gradient(circle_at_center,rgba(255,255,255,.10),transparent_55%)] p-6">
                    <div className="absolute inset-6 rounded-full border border-dashed border-white/15" />
                    <div className="absolute inset-14 rounded-full border border-white/10" />
                    <div className="absolute inset-24 rounded-full border border-dashed border-white/10" />
                    <div className="absolute inset-1/2 h-px w-[82%] -translate-x-1/2 -translate-y-1/2 bg-white/15" />
                    <div className="absolute left-1/2 top-[9%] h-[82%] w-px -translate-x-1/2 bg-white/15" />
                    {[['☉', '14%', '20%'], ['☽', '78%', '20%'], ['☿', '30%', '70%'], ['♀', '78%', '64%'], ['♂', '18%', '50%'], ['♃', '62%', '82%'], ['♄', '52%', '10%']].map(([g, left, top]) => (
                      <div key={g} className="absolute flex h-12 w-12 items-center justify-center rounded-full border border-white/15 bg-white/10 text-xl backdrop-blur-sm" style={{ left, top }}>{g}</div>
                    ))}
                    <div className="absolute inset-1/2 flex h-24 w-24 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-fuchsia-300/40 bg-fuchsia-500/20 text-center text-sm font-medium shadow-2xl shadow-fuchsia-500/20">Aries<br />Mula<br />Dragon</div>
                  </div>
                  <div className="mt-5 grid gap-2">
                    {liveData.strongest.slice(0, 3).map((t, i) => (
                      <div key={`${t.planet}-${i}`} className="rounded-2xl border border-white/10 bg-white/5 p-3 text-sm">
                        <span className="font-medium">Live overlay:</span> {t.planet} {t.aspect.toLowerCase()} natal {t.natal} <span className={textMuted}>· orb {t.orb}°</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <div className="grid gap-4">
                {natalPoints.map((p) => (
                  <Card key={p.body} className={cardBase}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="text-lg font-semibold">{p.body} <span className={cn('font-normal', textMuted)}>in {p.sign}</span></div>
                          <p className={cn('mt-1 text-sm', textMuted)}>{p.note}</p>
                        </div>
                        <BadgePill className="bg-white/10 text-white">{p.degree}°</BadgePill>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </Section>

          <Section id="personality" title="Personality Matrix" subtitle="Three systems, one integrated profile." darkMode={state.darkMode}>
            <div className="mb-4 grid w-full grid-cols-4 gap-2 rounded-2xl bg-white/10 p-1">
              {['integrated', 'western', 'vedic', 'chinese'].map((tab) => (
                <PillButton key={tab} active={(state.activeTab.personality || 'integrated') === tab} onClick={() => setTab('personality', tab)}>{tab[0].toUpperCase() + tab.slice(1)}</PillButton>
              ))}
            </div>
            {(state.activeTab.personality || 'integrated') === 'integrated' && (
              <>
                <div className="grid gap-4 md:grid-cols-3">
                  <Card className={cardBase}><CardContent className="p-5"><Flame className="mb-3 h-5 w-5 text-rose-300" /><h3 className="text-lg font-semibold">Pioneer force</h3><p className={cn('mt-2 text-sm', textMuted)}>You move first. Action defines identity. When the path is unclear, your instinct is to create one.</p></CardContent></Card>
                  <Card className={cardBase}><CardContent className="p-5"><Eye className="mb-3 h-5 w-5 text-violet-300" /><h3 className="text-lg font-semibold">Root-seeking psyche</h3><p className={cn('mt-2 text-sm', textMuted)}>Mula pushes you past surface narratives. You want the source code of people, systems, and motives.</p></CardContent></Card>
                  <Card className={cardBase}><CardContent className="p-5"><Target className="mb-3 h-5 w-5 text-amber-300" /><h3 className="text-lg font-semibold">Builder authority</h3><p className={cn('mt-2 text-sm', textMuted)}>Earth Dragon adds grounded charisma. You are wired to architect and execute.</p></CardContent></Card>
                </div>
                <Card className={cn(cardBase, 'mt-4')}><CardContent className="p-6"><p className={cn('leading-7', textMuted)}>The combined pattern is unusually strong: a fast-moving outer style with a deep, investigative inner core. Aries gives the visible spark, Mula supplies the obsession with truth, and Earth Dragon adds competence, seriousness, and a drive to build systems that last.</p></CardContent></Card>
              </>
            )}
            {(state.activeTab.personality || 'integrated') === 'western' && <Card className={cardBase}><CardContent className="p-6"><h3 className="text-xl font-semibold">Aries Sun emphasis</h3><p className={cn('mt-3 leading-7', textMuted)}>Aries loads the chart with urgency, initiative, competitiveness, and identity-through-action. Your communication style is direct and fast.</p></CardContent></Card>}
            {(state.activeTab.personality || 'integrated') === 'vedic' && <Card className={cardBase}><CardContent className="p-6"><h3 className="text-xl font-semibold">Mula Moon emphasis</h3><p className={cn('mt-3 leading-7', textMuted)}>Mula is the root-digger. It gives penetrating intuition, fascination with hidden architecture, and a life pattern of breakdown leading to deeper truth.</p></CardContent></Card>}
            {(state.activeTab.personality || 'integrated') === 'chinese' && <Card className={cardBase}><CardContent className="p-6"><h3 className="text-xl font-semibold">Earth Dragon emphasis</h3><p className={cn('mt-3 leading-7', textMuted)}>Earth Dragon stabilizes raw fire. It increases reliability, long-term vision, leadership through competence, and a strong desire to be respected.</p></CardContent></Card>}
          </Section>

          <Section id="shadow" title="Shadow Analysis" subtitle="Dynamic pressure estimates driven by your current strongest transits." darkMode={state.darkMode}>
            <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
              <Card className={cardBase}>
                <CardHeader><CardTitle>Shadow Activation Radar</CardTitle><CardDescription className={textMuted}>Live-weighted from current transit pressure.</CardDescription></CardHeader>
                <CardContent className="h-[320px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={liveData.shadowRadar} outerRadius="72%">
                      <PolarGrid />
                      <PolarAngleAxis dataKey="trait" tick={{ fill: state.darkMode ? '#f5e9ff' : '#334155', fontSize: 12 }} />
                      <PolarRadiusAxis tick={false} axisLine={false} />
                      <Radar dataKey="value" fillOpacity={0.45} strokeWidth={2} />
                    </RadarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
              <div className="space-y-4">
                {[
                  ['Self-sabotage', 'Stable things can become suspicious right when they begin to define you. Watch the impulse to destabilize what needs commitment.'],
                  ['Reactivity', 'Blocked motion can turn quickly into sharp speech or restless action. Pause before treating friction like an attack.'],
                  ['Control armor', 'Competence can become a fortress. The year asks for stronger structure, not total emotional lockdown.'],
                  ['Rootlessness', 'Mula pressure can keep one foot near the exit. A real path may require staying long enough to let it transform you.'],
                  ['Truth as weapon', 'Insight is one of your gifts. Timing and delivery determine whether it heals or burns.'],
                ].map(([title, body]) => (
                  <Card key={title} className={cardBase}><CardContent className="p-5"><div className="text-lg font-semibold">{title}</div><p className={cn('mt-2 text-sm leading-6', textMuted)}>{body}</p></CardContent></Card>
                ))}
              </div>
            </div>
          </Section>

          <Section id="horoscope" title="2026 Horoscope" subtitle="Interpretive year view, now influenced by current transit strength." darkMode={state.darkMode}>
            <div className="grid gap-6 lg:grid-cols-[1.15fr_.85fr]">
              <Card className={cardBase}>
                <CardHeader><CardTitle>Life Domain Heatmap</CardTitle><CardDescription className={textMuted}>Year view seeded by your strongest current transit pressure.</CardDescription></CardHeader>
                <CardContent className="space-y-3">
                  {liveData.yearHeat.map((m) => (
                    <div key={m.month} className="grid grid-cols-[42px_repeat(5,1fr)] items-center gap-2 text-xs md:text-sm">
                      <div className={textMuted}>{m.month}</div>
                      {['love', 'finance', 'career', 'health', 'identity'].map((k) => {
                        const v = m[k];
                        return <div key={k} className="rounded-xl px-2 py-2 text-center font-medium" style={{ background: `linear-gradient(90deg, rgba(244,114,182,.18), rgba(168,85,247,${v / 100}))` }}>{v}</div>;
                      })}
                    </div>
                  ))}
                  <div className={cn('grid grid-cols-[42px_repeat(5,1fr)] gap-2 text-[11px] uppercase tracking-[0.18em]', textMuted)}><div></div><div>Love</div><div>Money</div><div>Career</div><div>Health</div><div>Identity</div></div>
                </CardContent>
              </Card>
              <div className="space-y-4">
                <Card className={cardBase}><CardContent className="p-5"><div className="flex items-center gap-2 text-lg font-semibold"><CalendarDays className="h-5 w-5" /> Live dominant aspect</div><p className={cn('mt-2 text-sm leading-6', textMuted)}>{liveData.cosmicWeather.dominant}. This is the loudest current transit signature in the dashboard right now.</p></CardContent></Card>
                <Card className={cardBase}><CardContent className="p-5"><div className="flex items-center gap-2 text-lg font-semibold"><ShieldAlert className="h-5 w-5" /> Saturn lesson</div><p className={cn('mt-2 text-sm leading-6', textMuted)}>Constraint is not here to shrink you. It is here to make your identity stronger and more structurally sound.</p></CardContent></Card>
                <Card className={cardBase}><CardContent className="p-5"><div className="flex items-center gap-2 text-lg font-semibold"><Sparkles className="h-5 w-5" /> Neptune fog</div><p className={cn('mt-2 text-sm leading-6', textMuted)}>The more porous your certainty feels, the more important verification becomes. Inspiration is good; projection is expensive.</p></CardContent></Card>
              </div>
            </div>
          </Section>

          <Section id="outlook" title="5-Year Outlook" subtitle="The long arc from identity pressure into durable authority." darkMode={state.darkMode}>
            <Card className={cardBase}><CardContent className="p-6"><div className="mb-5 grid gap-4 md:grid-cols-5">{fiveYear.map((y) => <div key={y.year} className="rounded-3xl border border-white/10 bg-white/5 p-4"><div className="text-sm uppercase tracking-[0.18em] text-white/60">{y.year}</div><div className="mt-2 text-lg font-semibold">{y.theme}</div><div className="mt-3"><ProgressBar value={y.level} /></div></div>)}</div><div className={cn('text-sm leading-7', textMuted)}>2026 starts the dismantling. 2027 rewards what survives. 2028 brings stronger ownership and more external proof. By 2030, the aim is authority with depth, not just force.</div></CardContent></Card>
          </Section>

          {domainCards.map((d) => {
            const Icon = d.icon;
            const dates = bestWorstDates[d.id];
            const tabKey = `domain-${d.id}`;
            const active = state.activeTab[tabKey] || 'now';
            return (
              <Section key={d.id} id={d.id} title={d.title} subtitle={`${d.title} now, across 2026, and at the shadow layer.`} darkMode={state.darkMode}>
                <div className="mb-4 grid w-full grid-cols-3 gap-2 rounded-2xl bg-white/10 p-1">
                  {['now', 'year', 'shadow'].map((tab) => <PillButton key={tab} active={active === tab} onClick={() => setTab(tabKey, tab)}>{tab === 'year' ? '2026' : tab[0].toUpperCase() + tab.slice(1)}</PillButton>)}
                </div>
                {active === 'now' && (
                  <div className="grid gap-4 lg:grid-cols-[1.15fr_.85fr]">
                    <Card className={cardBase}><CardContent className="p-6"><div className="flex items-center gap-3 text-2xl font-semibold"><Icon className="h-6 w-6" /> {d.title} pulse</div><p className={cn('mt-4 leading-7', textMuted)}>{d.now}</p><p className={cn('mt-4 text-sm leading-6', textMuted)}>{d.summary}</p></CardContent></Card>
                    <Card className={cardBase}><CardContent className="p-6"><div className="text-lg font-semibold">Best / caution windows</div><div className="mt-4 space-y-3 text-sm"><div><div className="mb-1 text-emerald-300">Best dates</div><div className="flex flex-wrap gap-2">{dates.best.map((x) => <BadgePill key={x} className="bg-emerald-500/20 text-emerald-100">{x}</BadgePill>)}</div></div><div><div className="mb-1 text-rose-300">Caution dates</div><div className="flex flex-wrap gap-2">{dates.caution.map((x) => <BadgePill key={x} className="bg-rose-500/20 text-rose-100">{x}</BadgePill>)}</div></div></div></CardContent></Card>
                  </div>
                )}
                {active === 'year' && <Card className={cardBase}><CardContent className="p-6"><p className={cn('leading-7', textMuted)}>{d.summary} The favorable pattern is slow power: not the most dramatic move, but the move that compounds.</p></CardContent></Card>}
                {active === 'shadow' && <Card className={cardBase}><CardContent className="p-6"><div className="text-xl font-semibold">Unfiltered warning</div><p className={cn('mt-3 leading-7', textMuted)}>{d.shadow} The growth edge is knowing whether you are acting from truth, fear, ego, escape, or real readiness.</p>{d.id === 'romance' && <div className="mt-5 space-y-2">{compatibility.map((c) => <div key={c.type} className="rounded-2xl border border-white/10 bg-white/5 p-3 text-sm"><span className="font-medium">{c.type}:</span><span className={textMuted}> {c.value}</span></div>)}</div>}</CardContent></Card>}
              </Section>
            );
          })}

          <Section id="live" title="Live Planetary Pressure" subtitle="Calculated in-browser from the current moment, then compared against your natal placements." darkMode={state.darkMode}>
            <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
              <Card className={cardBase}><CardHeader><CardTitle>Orb Meters</CardTitle><CardDescription className={textMuted}>Current transit pressure against natal points.</CardDescription></CardHeader><CardContent className="space-y-4">{liveData.orbMeters.map((m) => <div key={m.name} className="rounded-2xl border border-white/10 bg-white/5 p-4"><div className="flex items-center justify-between gap-3"><div className="font-medium">{m.name}</div><div className="text-sm text-white/70">{m.value}%</div></div><div className="mt-3"><ProgressBar value={m.value} /></div><p className={cn('mt-3 text-sm', textMuted)}>{m.note}</p></div>)}</CardContent></Card>
              <Card className={cardBase}><CardHeader><CardTitle>Current Planets</CardTitle><CardDescription className={textMuted}>Live geocentric ecliptic positions.</CardDescription></CardHeader><CardContent className="space-y-3">{liveData.planets.map((planet) => <div key={planet.body} className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 p-3"><div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/10 text-lg">{zodiacGlyph(planet.sign)}</div><div><div className="font-medium">{planet.body}</div><div className={cn('text-sm', textMuted)}>{planet.formatted}</div></div></div><div className="text-right text-sm">{planet.retrograde && <div className="text-amber-300">Rx</div>}{planet.elongation != null && <div className={textMuted}>{Math.round(planet.elongation)}°</div>}</div></div>)}</CardContent></Card>
            </div>
            <Card className={cn(cardBase, 'mt-6')}><CardHeader><CardTitle>Strongest Active Transits</CardTitle><CardDescription className={textMuted}>Closest real-time aspects to natal placements.</CardDescription></CardHeader><CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{liveData.strongest.map((t, i) => <div key={`${t.planet}-${t.natal}-${i}`} className="rounded-2xl border border-white/10 bg-white/5 p-4"><div className="text-lg font-semibold">{t.planet} {t.aspect}</div><div className={cn('mt-1 text-sm', textMuted)}>natal {t.natal}</div><div className="mt-3 text-2xl font-semibold">{t.orb}°</div><div className={cn('mt-1 text-sm', textMuted)}>orb</div></div>)}</CardContent></Card>
            <Card className={cn(cardBase, 'mt-6')}><CardHeader><CardTitle>Identity Pressure Curve</CardTitle><CardDescription className={textMuted}>The dashboard’s dynamic yearly contour based on current transit strength.</CardDescription></CardHeader><CardContent className="h-[320px]"><ResponsiveContainer width="100%" height="100%"><AreaChart data={liveData.yearHeat}><CartesianGrid strokeDasharray="3 3" strokeOpacity={0.15} /><XAxis dataKey="month" tick={{ fill: state.darkMode ? '#f3e8ff' : '#334155' }} /><YAxis tick={{ fill: state.darkMode ? '#f3e8ff' : '#334155' }} /><Tooltip /><Area type="monotone" dataKey="identity" fillOpacity={0.25} strokeWidth={2} /></AreaChart></ResponsiveContainer></CardContent></Card>
          </Section>

          <Section id="convergence" title="Three Systems Convergence" subtitle="Where Western, Vedic, and Chinese systems are saying the same thing right now." darkMode={state.darkMode}>
            <div className="grid gap-6 lg:grid-cols-[1fr_.95fr]">
              <Card className={cardBase}><CardContent className="p-6"><div className="grid gap-4 md:grid-cols-3"><div className="rounded-3xl border border-rose-300/20 bg-rose-500/10 p-4"><div className="text-lg font-semibold">Western</div><p className={cn('mt-2 text-sm leading-6', textMuted)}>Identity is under reconstruction. Discipline is required. Illusions are dissolving.</p></div><div className="rounded-3xl border border-violet-300/20 bg-violet-500/10 p-4"><div className="text-lg font-semibold">Vedic</div><p className={cn('mt-2 text-sm leading-6', textMuted)}>Mula asks you to dig to the root, release what is false, and rebuild from karmic truth.</p></div><div className="rounded-3xl border border-amber-300/20 bg-amber-500/10 p-4"><div className="text-lg font-semibold">Chinese</div><p className={cn('mt-2 text-sm leading-6', textMuted)}>Earth Dragon does best by grounding volatile fire and turning pressure into durable power.</p></div></div><div className="mt-6 rounded-[2rem] border border-white/10 bg-white/5 p-5"><div className="text-lg font-semibold">Unified reading</div><p className={cn('mt-3 leading-7', textMuted)}>All three systems point to the same assignment: strip away the performative self, strengthen foundations, and choose decisions that still make sense after the adrenaline wears off.</p></div></CardContent></Card>
              <Card className={cardBase}><CardHeader><CardTitle>Right Now briefing</CardTitle><CardDescription className={textMuted}>A plain-language dispatch for the current moment.</CardDescription></CardHeader><CardContent className="space-y-4 text-sm leading-7"><div className={textMuted}>{liveData.cosmicWeather.briefing}</div><div className={textMuted}>The strongest live signatures in the chart are being translated into a practical reading rather than staying as raw numbers. That keeps the dashboard useful instead of purely technical.</div><div className="rounded-2xl border border-fuchsia-300/20 bg-fuchsia-500/10 p-4 text-white">Best move today: commit to one structural action, one emotional truth, and one practical safeguard.</div></CardContent></Card>
            </div>
          </Section>

          <Section id="journal" title="Daily Tracker" subtitle="A lightweight system for turning the dashboard into something you actually use." darkMode={state.darkMode}>
            <div className="grid gap-6 lg:grid-cols-[.95fr_1.05fr]">
              <Card className={cardBase}><CardHeader><CardTitle>State check-in</CardTitle><CardDescription className={textMuted}>Local-only tracking stored in your browser.</CardDescription></CardHeader><CardContent className="space-y-5">{Object.entries(state.dailyCheck).map(([key, value]) => <div key={key}><div className="mb-2 flex items-center justify-between"><span className="capitalize">{key}</span><div className="flex gap-2"><MiniButton onClick={() => updateCheck(key, -1)}>-</MiniButton><MiniButton onClick={() => updateCheck(key, 1)}>+</MiniButton></div></div><Gauge label={key} value={value} darkMode={state.darkMode} /></div>)}</CardContent></Card>
              <div className="space-y-4">
                <Card className={cardBase}><CardHeader><CardTitle>Habits</CardTitle><CardDescription className={textMuted}>Designed around your 2026 pressure points.</CardDescription></CardHeader><CardContent className="grid gap-3 sm:grid-cols-2">{[['journal', 'Journal the truth'], ['movement', 'Move the body'], ['deepWork', 'One real deep work block'], ['meditation', 'Nervous system reset'], ['noImpulseSpend', 'No impulse money move']].map(([key, label]) => <label key={key} className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 p-4"><span className="text-sm">{label}</span><Toggle checked={state.habits[key]} onChange={(v) => updateHabit(key, v)} /></label>)}</CardContent></Card>
                <Card className={cardBase}><CardHeader><CardTitle>Notes</CardTitle><CardDescription className={textMuted}>What happened today? What felt aligned, triggered, or revealing?</CardDescription></CardHeader><CardContent><TextArea value={state.notes} onChange={(e) => setState((s) => ({ ...s, notes: e.target.value }))} placeholder="Write the real version, not the polished one." className="min-h-[180px]" /></CardContent></Card>
              </div>
            </div>
          </Section>
        </main>
      </div>
    </div>
  );
}