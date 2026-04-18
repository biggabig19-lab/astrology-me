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
  Eye,
  Clock3,
  UserRound,
  WandSparkles,
  MapPin,
  Orbit,
} from 'lucide-react';

const APP_NAME = 'Astrology Me';
const STORAGE_KEY = 'astrology-me-v2';
const BODIES = ['Sun', 'Moon', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Pluto'];
const ZODIAC = ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'];

const BODY_GLYPHS = {
  Sun: '☉',
  Moon: '☽',
  Mercury: '☿',
  Venus: '♀',
  Mars: '♂',
  Jupiter: '♃',
  Saturn: '♄',
  Uranus: '♅',
  Neptune: '♆',
  Pluto: '♇',
};

const defaultState = {
  profile: null,
  ui: {
    darkMode: true,
    activeDomainTab: { love: 'now', money: 'now', career: 'now' },
  },
  tracker: {
    energy: 6,
    mood: 6,
    clarity: 5,
    discipline: 5,
    habits: {
      journal: false,
      movement: false,
      deepWork: false,
      meditation: false,
      noImpulseSpend: false,
    },
    notes: '',
  },
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

function elementForSign(sign) {
  if (['Aries', 'Leo', 'Sagittarius'].includes(sign)) return 'Fire';
  if (['Taurus', 'Virgo', 'Capricorn'].includes(sign)) return 'Earth';
  if (['Gemini', 'Libra', 'Aquarius'].includes(sign)) return 'Air';
  return 'Water';
}

function qualityForSign(sign) {
  if (['Aries', 'Cancer', 'Libra', 'Capricorn'].includes(sign)) return 'Cardinal';
  if (['Taurus', 'Leo', 'Scorpio', 'Aquarius'].includes(sign)) return 'Fixed';
  return 'Mutable';
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

function safeDateFromProfile(profile) {
  if (!profile?.birthDate) return null;
  const [year, month, day] = profile.birthDate.split('-').map(Number);
  if (!year || !month || !day) return null;
  let hour = 12;
  let minute = 0;
  if (!profile.unknownTime && profile.birthTime) {
    const [h, m] = profile.birthTime.split(':').map(Number);
    if (Number.isFinite(h)) hour = h;
    if (Number.isFinite(m)) minute = m;
  }
  return new Date(Date.UTC(year, month - 1, day, hour, minute));
}

function generateNatalProfile(profile) {
  const birthDate = safeDateFromProfile(profile);
  if (!birthDate) return null;

  const bodies = ['Sun', 'Moon', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn'];
  const placements = bodies.map((body) => {
    const longitude = geocentricLongitude(body, birthDate);
    return {
      body,
      longitude,
      sign: getSignName(longitude),
      degree: Number(getSignDegree(longitude).toFixed(1)),
      formatted: formatLongitude(longitude),
    };
  });

  const placementMap = Object.fromEntries(placements.map((p) => [p.body, p]));
  const signs = placements.map((p) => p.sign);
  const elements = signs.reduce((acc, sign) => {
    const el = elementForSign(sign);
    acc[el] = (acc[el] || 0) + 1;
    return acc;
  }, {});

  const dominantElement = Object.entries(elements).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Fire';
  const sun = placementMap.Sun;
  const moon = placementMap.Moon;
  const mercury = placementMap.Mercury;

  return {
    birthDate,
    placements,
    placementMap,
    sunSign: sun.sign,
    moonSign: moon.sign,
    mercurySign: mercury.sign,
    dominantElement,
    dominantQuality: qualityForSign(sun.sign),
    accuracy: profile.unknownTime
      ? 'Approximate chart: time unknown. Houses, rising sign, and some timing-sensitive details are intentionally softened.'
      : 'Time-specific chart using the entered birth time. Rising/houses are still not calculated in this version because timezone and location conversion are not yet enabled.',
  };
}

function generateInterpretations(profile, natal, liveData) {
  if (!profile || !natal) return null;

  const sun = natal.placementMap.Sun;
  const moon = natal.placementMap.Moon;
  const mercury = natal.placementMap.Mercury;
  const topTransit = liveData?.strongest?.[0];

  const personalityTight = {
    Aries: 'Direct, fast-moving, and identity-driven. Thrives when moving toward challenge and loses energy when trapped in passivity.',
    Taurus: 'Grounded, sensual, and steady. Builds slowly but strongly, with a preference for loyalty, comfort, and durable results.',
    Gemini: 'Quick-minded, adaptive, and curious. Needs variety, conversation, and fresh intellectual stimulation to stay engaged.',
    Cancer: 'Protective, intuitive, and emotionally responsive. Operates best with safety, closeness, and a trusted inner circle.',
    Leo: 'Expressive, proud, and heart-led. Wants life to feel meaningful, personal, and creatively alive.',
    Virgo: 'Perceptive, refining, and exacting. Sees flaws quickly and wants usefulness, order, and competence.',
    Libra: 'Relational, aesthetic, and balancing. Seeks harmony, reciprocity, and a more elegant path through conflict.',
    Scorpio: 'Intense, private, and psychologically deep. Moves by instinct, control, and truth-testing.',
    Sagittarius: 'Freedom-oriented, searching, and future-facing. Needs expansion, meaning, and movement.',
    Capricorn: 'Strategic, disciplined, and serious about long-term outcomes. Measures worth through structure and achievement.',
    Aquarius: 'Independent, cerebral, and unconventional. Needs autonomy and a point of view larger than ordinary social expectation.',
    Pisces: 'Porous, imaginative, and emotionally impressionable. Feels life symbolically and often works through intuition first.',
  };

  const moonReads = {
    Aries: 'Emotionally fast and reactive. Feels first, then thinks.',
    Taurus: 'Emotionally stabilizing and comfort-seeking. Needs steadiness and reassurance.',
    Gemini: 'Processes feeling through language, movement, and thought.',
    Cancer: 'Deeply sensitive and protective. Memory and attachment are strong.',
    Leo: 'Needs warmth, appreciation, and emotional significance.',
    Virgo: 'Feels through analysis, service, and self-correction.',
    Libra: 'Needs relational harmony to feel regulated.',
    Scorpio: 'Emotionally intense, guarded, and all-or-nothing.',
    Sagittarius: 'Needs freedom, perspective, and room to breathe emotionally.',
    Capricorn: 'Private feelings, serious burdens, and controlled emotional expression.',
    Aquarius: 'Detached style but strong internal ideals and emotional principles.',
    Pisces: 'Highly receptive, empathic, and affected by atmosphere.',
  };

  const actionGuidance = [
    `Lead with the strongest trait of ${sun.sign} — ${personalityTight[sun.sign]}`,
    `Protect the needs of the ${moon.sign} Moon — ${moonReads[moon.sign]}`,
    `Communicate like ${mercury.sign} Mercury: say the true thing, but time it better than impulse would suggest.`,
  ];

  const shadowItems = [
    {
      title: 'Identity overdrive',
      body: `${sun.sign} emphasis can turn healthy self-direction into defensiveness when challenged. The signal to watch is feeling that any delay or disagreement is a threat to selfhood.`,
    },
    {
      title: 'Emotional reflex',
      body: `${moon.sign} Moon can overreact when it does not feel safe. The work is slowing the first reaction long enough to see the real shape of the moment.`,
    },
    {
      title: 'Interpretive distortion',
      body: `${mercury.sign} Mercury can become too certain too quickly. The growth edge is checking whether a sharp conclusion is also a complete one.`,
    },
  ];

  const domainReads = {
    love: {
      now: `${sun.sign} + ${moon.sign} creates a relationship style that wants both truth and emotional permission. Attraction is stronger when the other person can handle directness without trying to control it.`,
      year: `Relationship quality improves when communication gets cleaner and emotional expectations get named earlier. People who cannot meet the emotional style of a ${moon.sign} Moon will feel vague or misaligned quickly.`,
      shadow: `The biggest romantic trap is confusing autonomy with protection. Independence is healthy; premature withdrawal is not.`,
    },
    money: {
      now: `${natal.dominantElement} emphasis suggests money decisions work best when they match temperament. ${sun.sign} strategy tends to work when decisive action is paired with structure rather than adrenaline.`,
      year: `The strongest money outcomes come from repeatable systems, not bursts of conviction. Stable plans outperform dramatic swings.`,
      shadow: `Watch identity-based spending, urgency-based risk, and using financial movement to regulate emotion.`,
    },
    career: {
      now: `${sun.sign} Sun wants a role with initiative. ${mercury.sign} Mercury wants thinking style and communication style to match the work itself.`,
      year: `Career growth comes from clearer positioning and more disciplined execution. The person who owns their strengths more precisely usually wins more cleanly.`,
      shadow: `The shadow is scorning process while secretly needing it. Structure is often the thing that turns raw talent into visible authority.`,
    },
  };

  return {
    overview: `${sun.sign} Sun gives the core identity: the way this person initiates, pursues goals, and defines selfhood. ${moon.sign} Moon colors the emotional style and instinctive needs. ${mercury.sign} Mercury shapes thinking and communication.`,
    personality: `${personalityTight[sun.sign]} Emotionally, ${moonReads[moon.sign]} Dominant element: ${natal.dominantElement}. Dominant quality: ${natal.dominantQuality}.`,
    actionGuidance,
    shadowItems,
    domains: domainReads,
    sourcedNote: 'This version is local-first. It does not scrape horoscope sites directly in the browser. A future backend/API layer can add sourced long-form interpretations and citations.',
    transitSummary: topTransit
      ? `${topTransit.planet} is currently forming a ${topTransit.aspect.toLowerCase()} to natal ${topTransit.natal} with an orb of ${topTransit.orb}°. This is the loudest live signal in the chart right now.`
      : 'Current transits are relatively moderate, so the focus is on steady movement and follow-through.',
  };
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
function MiniButton({ children, onClick }) {
  return <button onClick={onClick} className="rounded-xl bg-white/10 px-3 py-1.5 text-sm text-white hover:bg-white/15">{children}</button>;
}
function Toggle({ checked, onChange }) {
  return (
    <button type="button" onClick={() => onChange(!checked)} className={cn('relative inline-flex h-7 w-12 items-center rounded-full transition', checked ? 'bg-fuchsia-500' : 'bg-white/15')}>
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
function Input(props) {
  return <input {...props} className={cn('w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-white/40 outline-none', props.className || '')} />;
}
function TextArea(props) {
  return <textarea {...props} className={cn('w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-white/35 outline-none', props.className || '')} />;
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

function Landing({ onSubmit }) {
  const [form, setForm] = useState({
    name: '',
    birthDate: '',
    birthTime: '',
    location: '',
    unknownTime: false,
  });

  const update = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(208,90,255,0.20),_transparent_30%),radial-gradient(circle_at_80%_20%,_rgba(255,185,91,0.22),_transparent_25%),linear-gradient(180deg,#100523_0%,#150a2f_35%,#0b1225_100%)] px-4 py-8 text-white">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8">
          <BadgePill className="bg-fuchsia-500/20 text-fuchsia-200">{APP_NAME}</BadgePill>
          <h1 className="mt-4 max-w-3xl text-4xl font-semibold leading-tight md:text-6xl">Enter a birth profile and generate a personal astrology dashboard.</h1>
          <p className="mt-4 max-w-2xl text-white/70 md:text-lg">
            Mobile-first. Reusable. Personal. If birth time is unknown, the app makes a best-effort chart and clearly labels what becomes approximate.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.05fr_.95fr]">
          <Card className="rounded-[2rem] border border-white/10 bg-white/5 backdrop-blur-md">
            <CardHeader>
              <CardTitle>Start your chart</CardTitle>
              <CardDescription className="text-white/70">This version calculates planetary placements locally and generates a dashboard from the input.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="mb-2 block text-sm text-white/80">Name or nickname</label>
                <Input placeholder="Nate" value={form.name} onChange={(e) => update('name', e.target.value)} />
              </div>
              <div>
                <label className="mb-2 block text-sm text-white/80">Birth date</label>
                <Input type="date" value={form.birthDate} onChange={(e) => update('birthDate', e.target.value)} />
              </div>
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label className="block text-sm text-white/80">Birth time</label>
                  <div className="flex items-center gap-2 text-sm text-white/70">
                    <span>I don't know it</span>
                    <Toggle checked={form.unknownTime} onChange={(v) => update('unknownTime', v)} />
                  </div>
                </div>
                <Input type="time" value={form.birthTime} onChange={(e) => update('birthTime', e.target.value)} disabled={form.unknownTime} />
              </div>
              <div>
                <label className="mb-2 block text-sm text-white/80">Birth location</label>
                <Input placeholder="Somerville, NJ" value={form.location} onChange={(e) => update('location', e.target.value)} />
              </div>
              <button
                onClick={() => onSubmit(form)}
                disabled={!form.birthDate}
                className="w-full rounded-2xl bg-gradient-to-r from-pink-500 via-fuchsia-500 to-violet-500 px-4 py-3 font-medium text-white disabled:opacity-50"
              >
                Generate dashboard
              </button>
            </CardContent>
          </Card>

          <div className="grid gap-4">
            <Card className="rounded-[2rem] border border-white/10 bg-white/5 backdrop-blur-md">
              <CardContent className="p-5">
                <div className="flex items-center gap-3 text-lg font-semibold"><UserRound className="h-5 w-5 text-cyan-300" /> Personal intake</div>
                <p className="mt-2 text-sm leading-6 text-white/70">One app, many people. This version starts with a birth intake flow instead of being hardcoded to one person.</p>
              </CardContent>
            </Card>
            <Card className="rounded-[2rem] border border-white/10 bg-white/5 backdrop-blur-md">
              <CardContent className="p-5">
                <div className="flex items-center gap-3 text-lg font-semibold"><Clock3 className="h-5 w-5 text-amber-300" /> Time unknown mode</div>
                <p className="mt-2 text-sm leading-6 text-white/70">When birth time is skipped, the app uses a best guess and explicitly marks the chart as approximate rather than pretending precision.</p>
              </CardContent>
            </Card>
            <Card className="rounded-[2rem] border border-white/10 bg-white/5 backdrop-blur-md">
              <CardContent className="p-5">
                <div className="flex items-center gap-3 text-lg font-semibold"><WandSparkles className="h-5 w-5 text-fuchsia-300" /> Better interpretation layer</div>
                <p className="mt-2 text-sm leading-6 text-white/70">Interpretations are generated from actual placements and live transits, with a clear note that richer source-backed text would require a backend/API layer.</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [state, setState] = usePersistedState();
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(t);
  }, []);

  const natal = useMemo(() => generateNatalProfile(state.profile), [state.profile]);

  const liveData = useMemo(() => {
    if (!natal) return null;
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
    const natalMap = Object.fromEntries(natal.placements.map((p) => [p.body, p.longitude]));

    const transits = planets
      .flatMap((planet) =>
        Object.entries(natalMap).map(([natalBody, natalLon]) => {
          const diff = angularDistance(planet.longitude, natalLon);
          const aspect = aspectLabel(diff);
          if (!aspect) return null;
          return { planet: planet.body, natal: natalBody, aspect: aspect.name, orb: Number(aspect.delta.toFixed(2)) };
        })
      )
      .filter(Boolean)
      .sort((a, b) => a.orb - b.orb);

    const strongest = transits.slice(0, 6);

    const orbMeters = [
      { name: 'Saturn → Sun', value: Math.round(Math.max(0, 100 - angularDistance(planets.find((p) => p.body === 'Saturn').longitude, natalMap.Sun) * 4)), note: 'Current Saturn pressure on identity' },
      { name: 'Neptune → Sun', value: Math.round(Math.max(0, 100 - angularDistance(planets.find((p) => p.body === 'Neptune').longitude, natalMap.Sun) * 4)), note: 'Current Neptune pressure on certainty and self-image' },
      { name: 'Mars → Mercury', value: Math.round(Math.max(0, 100 - angularDistance(planets.find((p) => p.body === 'Mars').longitude, natalMap.Mercury) * 4)), note: 'Current drive hitting thought / speech pattern' },
      { name: 'Jupiter → Moon', value: Math.round(Math.max(0, 100 - angularDistance(planets.find((p) => p.body === 'Jupiter').longitude, natalMap.Moon) * 4)), note: 'Expansion vs emotional instinct' },
    ];

    const shadowRadar = [
      { trait: 'Self-sabotage', value: Math.min(95, Math.round((orbMeters[0].value + orbMeters[1].value) / 2)) },
      { trait: 'Reactivity', value: Math.min(95, Math.round(orbMeters[2].value * 0.92)) },
      { trait: 'Control armor', value: Math.min(95, Math.round((orbMeters[0].value + 70) / 2)) },
      { trait: 'Restlessness', value: Math.min(95, Math.round((orbMeters[1].value + orbMeters[3].value) / 2)) },
      { trait: 'Projection', value: Math.min(95, Math.round((orbMeters[2].value + 64) / 2)) },
    ];

    const monthSeeds = [48, 53, 60, 72, 68, 59, 54, 73, 76, 69, 61, 66];
    const yearHeat = monthSeeds.map((seed, idx) => ({
      month: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][idx],
      love: Math.min(98, Math.round(seed + orbMeters[3].value * 0.12 + (idx === 3 ? 12 : 0))),
      money: Math.min(98, Math.round(seed + 8 + orbMeters[0].value * 0.08 + ((idx === 7 || idx === 8) ? 10 : 0))),
      career: Math.min(99, Math.round(seed + 14 + (100 - orbMeters[0].value) * 0.06 + (idx === 3 ? 8 : 0))),
      health: Math.min(95, Math.round(seed - 4 + orbMeters[2].value * 0.08)),
      identity: Math.min(99, Math.round(seed + 18 + orbMeters[1].value * 0.12 + (idx === 3 ? 14 : 0))),
    }));

    const cosmicWeather = {
      date: now.toLocaleString(),
      moon: `${moon.sign} Moon`,
      phase: moon.phase != null ? `${Math.round(moon.phase * 100)}% illuminated` : 'Phase unavailable',
      dominant: strongest[0] ? `${strongest[0].planet} ${strongest[0].aspect} natal ${strongest[0].natal}` : 'Moderate sky',
      briefing: deriveTone(strongest),
    };

    return { planets, strongest, orbMeters, shadowRadar, yearHeat, cosmicWeather };
  }, [now, natal]);

  const interpretations = useMemo(() => generateInterpretations(state.profile, natal, liveData), [state.profile, natal, liveData]);

  const themeShell = state.ui.darkMode
    ? 'bg-[radial-gradient(circle_at_top,_rgba(208,90,255,0.20),_transparent_30%),radial-gradient(circle_at_80%_20%,_rgba(255,185,91,0.22),_transparent_25%),linear-gradient(180deg,#100523_0%,#150a2f_35%,#0b1225_100%)] text-white'
    : 'bg-[radial-gradient(circle_at_top,_rgba(255,190,221,0.35),_transparent_32%),radial-gradient(circle_at_80%_20%,_rgba(255,219,147,0.35),_transparent_25%),linear-gradient(180deg,#fffaf4_0%,#f7f1ff_45%,#eef6ff_100%)] text-slate-900';

  const cardBase = state.ui.darkMode
    ? 'rounded-[2rem] border border-white/10 bg-white/5 text-white backdrop-blur-md'
    : 'rounded-[2rem] border border-slate-200/70 bg-white/80 text-slate-900 backdrop-blur-md';

  const textMuted = state.ui.darkMode ? 'text-white/70' : 'text-slate-600';

  const updateHabit = (key, value) => setState((s) => ({ ...s, tracker: { ...s.tracker, habits: { ...s.tracker.habits, [key]: value } } }));
  const updateCheck = (key, delta) => setState((s) => ({ ...s, tracker: { ...s.tracker, [key]: Math.max(1, Math.min(10, s.tracker[key] + delta)) } }));
  const setTab = (group, value) => setState((s) => ({ ...s, ui: { ...s.ui, activeDomainTab: { ...s.ui.activeDomainTab, [group]: value } } }));

  if (!state.profile) {
    return <Landing onSubmit={(profile) => setState((s) => ({ ...s, profile }))} />;
  }

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

      <div className="mx-auto max-w-7xl px-4 py-4 md:px-6 md:py-6">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <BadgePill className="bg-fuchsia-500/20 text-fuchsia-200">{APP_NAME}</BadgePill>
            <h1 className="mt-3 text-3xl font-semibold md:text-5xl">{state.profile.name || 'Your chart'}</h1>
            <div className={cn('mt-2 flex flex-wrap gap-2 text-sm', textMuted)}>
              <span className="inline-flex items-center gap-1"><CalendarDays className="h-4 w-4" /> {state.profile.birthDate}</span>
              <span className="inline-flex items-center gap-1"><Clock3 className="h-4 w-4" /> {state.profile.unknownTime ? 'Time unknown (best guess)' : state.profile.birthTime}</span>
              <span className="inline-flex items-center gap-1"><MapPin className="h-4 w-4" /> {state.profile.location || 'Location entered but not geocoded in this version'}</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => setState((s) => ({ ...s, profile: null }))} className="rounded-2xl bg-white/10 px-4 py-2 text-sm text-white hover:bg-white/15">New chart</button>
            <Toggle checked={state.ui.darkMode} onChange={(v) => setState((s) => ({ ...s, ui: { ...s.ui, darkMode: v } }))} />
          </div>
        </div>

        <motion.section initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} className="starfield relative overflow-hidden rounded-[2rem] border border-white/10 p-6 md:p-8">
          <div className="relative z-10 grid gap-6 lg:grid-cols-[1.35fr_.9fr]">
            <div>
              <h2 className="max-w-3xl text-3xl font-semibold leading-tight md:text-5xl">Astrology that starts with real input, then builds a personalized dashboard.</h2>
              <p className={cn('mt-4 max-w-2xl text-base md:text-lg', textMuted)}>{interpretations.overview}</p>
              <div className="mt-6 flex flex-wrap gap-3">
                <BadgePill className="bg-rose-500/20 text-rose-200">{natal.sunSign} Sun</BadgePill>
                <BadgePill className="bg-violet-500/20 text-violet-200">{natal.moonSign} Moon</BadgePill>
                <BadgePill className="bg-cyan-500/20 text-cyan-100">{natal.mercurySign} Mercury</BadgePill>
                <BadgePill className="bg-amber-500/20 text-amber-100">{natal.dominantElement} dominant</BadgePill>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
              <TinyStat label="Moon" value={liveData.cosmicWeather.moon} icon={Moon} darkMode={state.ui.darkMode} />
              <TinyStat label="Phase" value={liveData.cosmicWeather.phase} icon={Sparkles} darkMode={state.ui.darkMode} />
              <TinyStat label="Dominant Transit" value={liveData.cosmicWeather.dominant} icon={Orbit} darkMode={state.ui.darkMode} />
              <TinyStat label="Accuracy" value={state.profile.unknownTime ? 'Approximate' : 'Time-specific'} icon={ShieldAlert} darkMode={state.ui.darkMode} />
            </div>
          </div>
        </motion.section>

        <div className="mt-8 grid gap-10">
          <Section id="overview" title="Overview" subtitle="High-signal reading of the chart and what to do with it." darkMode={state.ui.darkMode}>
            <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
              <Card className={cardBase}>
                <CardHeader>
                  <CardTitle>Personality brief</CardTitle>
                  <CardDescription className={textMuted}>Tighter interpretation generated from natal placements.</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className={cn('leading-7', textMuted)}>{interpretations.personality}</p>
                  <div className="mt-5 space-y-3">
                    {interpretations.actionGuidance.map((item) => (
                      <div key={item} className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm">{item}</div>
                    ))}
                  </div>
                </CardContent>
              </Card>
              <Card className={cardBase}>
                <CardHeader>
                  <CardTitle>Confidence note</CardTitle>
                  <CardDescription className={textMuted}>How precise this reading is and what is softened.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="rounded-2xl border border-amber-300/20 bg-amber-500/10 p-4 text-sm text-amber-50">{natal.accuracy}</div>
                  <div className={cn('text-sm leading-7', textMuted)}>{interpretations.sourcedNote}</div>
                </CardContent>
              </Card>
            </div>
          </Section>

          <Section id="natal" title="Natal Snapshot" subtitle="Calculated from the entered birth date and time input." darkMode={state.ui.darkMode}>
            <div className="grid gap-6 lg:grid-cols-[1.05fr_.95fr]">
              <Card className={cardBase}>
                <CardHeader>
                  <CardTitle>Symbol wheel</CardTitle>
                  <CardDescription className={textMuted}>Simplified visual mandala for quick mobile reading.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="relative mx-auto aspect-square max-w-md rounded-full border border-white/10 bg-[radial-gradient(circle_at_center,rgba(255,255,255,.10),transparent_55%)] p-6">
                    <div className="absolute inset-6 rounded-full border border-dashed border-white/15" />
                    <div className="absolute inset-14 rounded-full border border-white/10" />
                    <div className="absolute inset-24 rounded-full border border-dashed border-white/10" />
                    <div className="absolute inset-1/2 h-px w-[82%] -translate-x-1/2 -translate-y-1/2 bg-white/15" />
                    <div className="absolute left-1/2 top-[9%] h-[82%] w-px -translate-x-1/2 bg-white/15" />
                    {natal.placements.map((p, idx) => {
                      const angle = (p.longitude - 90) * (Math.PI / 180);
                      const radius = 34;
                      const left = 50 + Math.cos(angle) * radius;
                      const top = 50 + Math.sin(angle) * radius;
                      return (
                        <div
                          key={p.body}
                          className="absolute flex h-12 w-12 items-center justify-center rounded-full border border-white/15 bg-white/10 text-xl backdrop-blur-sm"
                          style={{ left: `${left}%`, top: `${top}%`, transform: 'translate(-50%, -50%)' }}
                        >
                          {BODY_GLYPHS[p.body] || idx}
                        </div>
                      );
                    })}
                    <div className="absolute inset-1/2 flex h-24 w-24 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-fuchsia-300/40 bg-fuchsia-500/20 text-center text-sm font-medium shadow-2xl shadow-fuchsia-500/20">
                      {natal.sunSign}
                      <br />
                      {natal.moonSign}
                      <br />
                      {natal.dominantElement}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="grid gap-4">
                {natal.placements.map((p) => (
                  <Card key={p.body} className={cardBase}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="text-lg font-semibold">{p.body} <span className={cn('font-normal', textMuted)}>in {p.sign}</span></div>
                          <p className={cn('mt-1 text-sm', textMuted)}>{p.formatted}</p>
                        </div>
                        <BadgePill className="bg-white/10 text-white">{p.degree}°</BadgePill>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </Section>

          <Section id="personality" title="Personality" subtitle="Focused synthesis instead of loose generic sign text." darkMode={state.ui.darkMode}>
            <div className="grid gap-4 md:grid-cols-3">
              <Card className={cardBase}><CardContent className="p-5"><Flame className="mb-3 h-5 w-5 text-rose-300" /><h3 className="text-lg font-semibold">{natal.sunSign} Sun</h3><p className={cn('mt-2 text-sm leading-6', textMuted)}>Core identity, self-direction, style of action, ego strength, and how life force gets expressed.</p></CardContent></Card>
              <Card className={cardBase}><CardContent className="p-5"><Moon className="mb-3 h-5 w-5 text-violet-300" /><h3 className="text-lg font-semibold">{natal.moonSign} Moon</h3><p className={cn('mt-2 text-sm leading-6', textMuted)}>Emotional needs, instinctive reactions, regulation style, and the deeper private self.</p></CardContent></Card>
              <Card className={cardBase}><CardContent className="p-5"><Eye className="mb-3 h-5 w-5 text-cyan-300" /><h3 className="text-lg font-semibold">{natal.mercurySign} Mercury</h3><p className={cn('mt-2 text-sm leading-6', textMuted)}>Thinking speed, narrative style, learning behavior, and how interpretation gets formed and communicated.</p></CardContent></Card>
            </div>
            <Card className={cn(cardBase, 'mt-4')}>
              <CardContent className="p-6">
                <p className={cn('leading-7', textMuted)}>{interpretations.personality}</p>
              </CardContent>
            </Card>
          </Section>

          <Section id="shadow" title="Shadow Patterns" subtitle="The patterns most likely to create friction under pressure." darkMode={state.ui.darkMode}>
            <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
              <Card className={cardBase}>
                <CardHeader>
                  <CardTitle>Shadow activation radar</CardTitle>
                  <CardDescription className={textMuted}>Weighted by the strongest current transit pressure.</CardDescription>
                </CardHeader>
                <CardContent className="h-[320px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={liveData.shadowRadar} outerRadius="72%">
                      <PolarGrid />
                      <PolarAngleAxis dataKey="trait" tick={{ fill: state.ui.darkMode ? '#f5e9ff' : '#334155', fontSize: 12 }} />
                      <PolarRadiusAxis tick={false} axisLine={false} />
                      <Radar dataKey="value" fillOpacity={0.45} strokeWidth={2} />
                    </RadarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
              <div className="space-y-4">
                {interpretations.shadowItems.map((item) => (
                  <Card key={item.title} className={cardBase}>
                    <CardContent className="p-5">
                      <div className="text-lg font-semibold">{item.title}</div>
                      <p className={cn('mt-2 text-sm leading-6', textMuted)}>{item.body}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </Section>

          <Section id="forecast" title="Forecast" subtitle="Tighter yearly contour plus current transit emphasis." darkMode={state.ui.darkMode}>
            <div className="grid gap-6 lg:grid-cols-[1.15fr_.85fr]">
              <Card className={cardBase}>
                <CardHeader>
                  <CardTitle>Year contour</CardTitle>
                  <CardDescription className={textMuted}>Generated from current transit strength and domain weighting.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {liveData.yearHeat.map((m) => (
                    <div key={m.month} className="grid grid-cols-[42px_repeat(5,1fr)] items-center gap-2 text-xs md:text-sm">
                      <div className={textMuted}>{m.month}</div>
                      {['love', 'money', 'career', 'health', 'identity'].map((k) => {
                        const v = m[k];
                        return <div key={k} className="rounded-xl px-2 py-2 text-center font-medium" style={{ background: `linear-gradient(90deg, rgba(244,114,182,.18), rgba(168,85,247,${v / 100}))` }}>{v}</div>;
                      })}
                    </div>
                  ))}
                  <div className={cn('grid grid-cols-[42px_repeat(5,1fr)] gap-2 text-[11px] uppercase tracking-[0.18em]', textMuted)}><div></div><div>Love</div><div>Money</div><div>Career</div><div>Health</div><div>Identity</div></div>
                </CardContent>
              </Card>
              <div className="space-y-4">
                <Card className={cardBase}><CardContent className="p-5"><div className="flex items-center gap-2 text-lg font-semibold"><CalendarDays className="h-5 w-5" /> Live dominant aspect</div><p className={cn('mt-2 text-sm leading-6', textMuted)}>{interpretations.transitSummary}</p></CardContent></Card>
                <Card className={cardBase}><CardContent className="p-5"><div className="flex items-center gap-2 text-lg font-semibold"><ShieldAlert className="h-5 w-5" /> Guidance</div><p className={cn('mt-2 text-sm leading-6', textMuted)}>This dashboard is now dynamic and reusable. The next upgrade is a backend/API layer for timezone resolution, rising sign, houses, and sourced interpretive enrichment.</p></CardContent></Card>
              </div>
            </div>
          </Section>

          {['love', 'money', 'career'].map((domain) => {
            const sectionTitle = domain === 'money' ? 'Money' : domain[0].toUpperCase() + domain.slice(1);
            const active = state.ui.activeDomainTab[domain] || 'now';
            const iconMap = { love: Heart, money: Coins, career: Briefcase };
            const Icon = iconMap[domain];
            const dates = domain === 'money'
              ? { best: ['May 11–19', 'Aug 28–Sep 6', 'Dec 10–18'], caution: ['Jun 21–27', 'Jul 26–Aug 2'] }
              : domain === 'love'
              ? { best: ['Apr 20–24', 'Aug 29–Sep 4', 'Nov 8–12'], caution: ['Jul 22–30', 'Oct 14–18'] }
              : { best: ['Apr 16–22', 'Aug 25–Sep 5', 'Dec 12–20'], caution: ['Feb 18–24', 'Jul 24–31'] };

            return (
              <Section key={domain} id={domain} title={sectionTitle} subtitle={`${sectionTitle} now, across the year, and in shadow mode.`} darkMode={state.ui.darkMode}>
                <div className="mb-4 grid w-full grid-cols-3 gap-2 rounded-2xl bg-white/10 p-1">
                  {['now', 'year', 'shadow'].map((tab) => (
                    <button key={tab} onClick={() => setTab(domain, tab)} className={cn('rounded-2xl px-3 py-2 text-sm transition', active === tab ? 'bg-fuchsia-500/30 text-white ring-1 ring-fuchsia-300/50' : 'bg-white/5 text-white/80 hover:bg-white/10')}>
                      {tab === 'year' ? 'Year' : tab[0].toUpperCase() + tab.slice(1)}
                    </button>
                  ))}
                </div>
                {active === 'now' && (
                  <div className="grid gap-4 lg:grid-cols-[1.15fr_.85fr]">
                    <Card className={cardBase}><CardContent className="p-6"><div className="flex items-center gap-3 text-2xl font-semibold"><Icon className="h-6 w-6" /> {sectionTitle} pulse</div><p className={cn('mt-4 leading-7', textMuted)}>{interpretations.domains[domain].now}</p></CardContent></Card>
                    <Card className={cardBase}><CardContent className="p-6"><div className="text-lg font-semibold">Best / caution windows</div><div className="mt-4 space-y-3 text-sm"><div><div className="mb-1 text-emerald-300">Best dates</div><div className="flex flex-wrap gap-2">{dates.best.map((x) => <BadgePill key={x} className="bg-emerald-500/20 text-emerald-100">{x}</BadgePill>)}</div></div><div><div className="mb-1 text-rose-300">Caution dates</div><div className="flex flex-wrap gap-2">{dates.caution.map((x) => <BadgePill key={x} className="bg-rose-500/20 text-rose-100">{x}</BadgePill>)}</div></div></div></CardContent></Card>
                  </div>
                )}
                {active === 'year' && <Card className={cardBase}><CardContent className="p-6"><p className={cn('leading-7', textMuted)}>{interpretations.domains[domain].year}</p></CardContent></Card>}
                {active === 'shadow' && <Card className={cardBase}><CardContent className="p-6"><div className="text-xl font-semibold">Unfiltered warning</div><p className={cn('mt-3 leading-7', textMuted)}>{interpretations.domains[domain].shadow}</p></CardContent></Card>}
              </Section>
            );
          })}

          <Section id="transits" title="Current Transits" subtitle="Calculated live and compared against natal placements." darkMode={state.ui.darkMode}>
            <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
              <Card className={cardBase}>
                <CardHeader>
                  <CardTitle>Orb meters</CardTitle>
                  <CardDescription className={textMuted}>Current transit pressure against natal points.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {liveData.orbMeters.map((m) => (
                    <div key={m.name} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                      <div className="flex items-center justify-between gap-3"><div className="font-medium">{m.name}</div><div className="text-sm text-white/70">{m.value}%</div></div>
                      <div className="mt-3"><ProgressBar value={m.value} /></div>
                      <p className={cn('mt-3 text-sm', textMuted)}>{m.note}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card className={cardBase}>
                <CardHeader>
                  <CardTitle>Current planets</CardTitle>
                  <CardDescription className={textMuted}>Live geocentric ecliptic positions.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {liveData.planets.map((planet) => (
                    <div key={planet.body} className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 p-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/10 text-lg">{zodiacGlyph(planet.sign)}</div>
                        <div>
                          <div className="font-medium">{planet.body}</div>
                          <div className={cn('text-sm', textMuted)}>{planet.formatted}</div>
                        </div>
                      </div>
                      <div className="text-right text-sm">
                        {planet.retrograde && <div className="text-amber-300">Rx</div>}
                        {planet.elongation != null && <div className={textMuted}>{Math.round(planet.elongation)}°</div>}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            <Card className={cn(cardBase, 'mt-6')}>
              <CardHeader>
                <CardTitle>Strongest active transits</CardTitle>
                <CardDescription className={textMuted}>Closest real-time aspects to natal placements.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {liveData.strongest.map((t, i) => (
                  <div key={`${t.planet}-${t.natal}-${i}`} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <div className="text-lg font-semibold">{t.planet} {t.aspect}</div>
                    <div className={cn('mt-1 text-sm', textMuted)}>natal {t.natal}</div>
                    <div className="mt-3 text-2xl font-semibold">{t.orb}°</div>
                    <div className={cn('mt-1 text-sm', textMuted)}>orb</div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className={cn(cardBase, 'mt-6')}>
              <CardHeader>
                <CardTitle>Identity pressure curve</CardTitle>
                <CardDescription className={textMuted}>The dashboard’s dynamic yearly contour based on current transit strength.</CardDescription>
              </CardHeader>
              <CardContent className="h-[320px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={liveData.yearHeat}>
                    <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.15} />
                    <XAxis dataKey="month" tick={{ fill: state.ui.darkMode ? '#f3e8ff' : '#334155' }} />
                    <YAxis tick={{ fill: state.ui.darkMode ? '#f3e8ff' : '#334155' }} />
                    <Tooltip />
                    <Area type="monotone" dataKey="identity" fillOpacity={0.25} strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Section>

          <Section id="tracker" title="Tracker" subtitle="A lightweight system for turning interpretation into practice." darkMode={state.ui.darkMode}>
            <div className="grid gap-6 lg:grid-cols-[.95fr_1.05fr]">
              <Card className={cardBase}>
                <CardHeader>
                  <CardTitle>State check-in</CardTitle>
                  <CardDescription className={textMuted}>Local-only tracking stored in your browser.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-5">
                  {['energy', 'mood', 'clarity', 'discipline'].map((key) => (
                    <div key={key}>
                      <div className="mb-2 flex items-center justify-between">
                        <span className="capitalize">{key}</span>
                        <div className="flex gap-2">
                          <MiniButton onClick={() => updateCheck(key, -1)}>-</MiniButton>
                          <MiniButton onClick={() => updateCheck(key, 1)}>+</MiniButton>
                        </div>
                      </div>
                      <Gauge label={key} value={state.tracker[key]} darkMode={state.ui.darkMode} />
                    </div>
                  ))}
                </CardContent>
              </Card>

              <div className="space-y-4">
                <Card className={cardBase}>
                  <CardHeader>
                    <CardTitle>Habits</CardTitle>
                    <CardDescription className={textMuted}>Designed around the interpretation layer.</CardDescription>
                  </CardHeader>
                  <CardContent className="grid gap-3 sm:grid-cols-2">
                    {[
                      ['journal', 'Journal the truth'],
                      ['movement', 'Move the body'],
                      ['deepWork', 'One real deep work block'],
                      ['meditation', 'Nervous system reset'],
                      ['noImpulseSpend', 'No impulse money move'],
                    ].map(([key, label]) => (
                      <label key={key} className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 p-4">
                        <span className="text-sm">{label}</span>
                        <Toggle checked={state.tracker.habits[key]} onChange={(v) => updateHabit(key, v)} />
                      </label>
                    ))}
                  </CardContent>
                </Card>
                <Card className={cardBase}>
                  <CardHeader>
                    <CardTitle>Notes</CardTitle>
                    <CardDescription className={textMuted}>What happened today? What felt aligned, triggered, or revealing?</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <TextArea
                      value={state.tracker.notes}
                      onChange={(e) => setState((s) => ({ ...s, tracker: { ...s.tracker, notes: e.target.value } }))}
                      placeholder="Write the real version, not the polished one."
                      className="min-h-[180px]"
                    />
                  </CardContent>
                </Card>
              </div>
            </div>
          </Section>
        </div>
      </div>
    </div>
  );
}