import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { DateTime } from 'luxon';
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
  Globe,
} from 'lucide-react';

const APP_NAME = 'Astrology Me';
const STORAGE_KEY = 'astrology-me-v3';
const BODIES = ['Sun', 'Moon', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Pluto'];
const ZODIAC = ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'];
const NAKSHATRAS = [
  'Ashwini', 'Bharani', 'Krittika', 'Rohini', 'Mrigashira', 'Ardra', 'Punarvasu', 'Pushya', 'Ashlesha',
  'Magha', 'Purva Phalguni', 'Uttara Phalguni', 'Hasta', 'Chitra', 'Swati', 'Vishakha', 'Anuradha', 'Jyeshtha',
  'Mula', 'Purva Ashadha', 'Uttara Ashadha', 'Shravana', 'Dhanishta', 'Shatabhisha', 'Purva Bhadrapada', 'Uttara Bhadrapada', 'Revati'
];

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

function julianDay(date) {
  return date.getTime() / 86400000 + 2440587.5;
}

function approximateAyanamsha(date) {
  const jd = julianDay(date);
  const t = (jd - 2451545.0) / 36525.0;
  return 24.0 + (0.01397 * (t * 100));
}

function siderealLongitude(tropicalLongitude, date) {
  return normalizeAngle(tropicalLongitude - approximateAyanamsha(date));
}

function getNakshatra(moonLongitude, date) {
  const siderealMoon = siderealLongitude(moonLongitude, date);
  const segment = 360 / 27;
  const index = Math.floor(siderealMoon / segment);
  const pada = Math.floor((siderealMoon % segment) / (segment / 4)) + 1;
  return {
    name: NAKSHATRAS[index] || 'Unknown',
    pada,
    siderealLongitude: siderealMoon,
  };
}

function getChineseZodiac(date) {
  const approxYear = (date.month < 2 || (date.month === 2 && date.day < 4)) ? date.year - 1 : date.year;
  const animals = ['Rat', 'Ox', 'Tiger', 'Rabbit', 'Dragon', 'Snake', 'Horse', 'Goat', 'Monkey', 'Rooster', 'Dog', 'Pig'];
  const elements = ['Wood', 'Wood', 'Fire', 'Fire', 'Earth', 'Earth', 'Metal', 'Metal', 'Water', 'Water'];
  const animal = animals[(approxYear - 4) % 12];
  const element = elements[(approxYear - 4) % 10];
  return `${element} ${animal}`;
}

async function resolveLocation(query) {
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=1&language=en&format=json`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Could not reach location service.');
  const data = await res.json();
  if (!data?.results?.length) throw new Error('Location not found. Try a city and country, like "Mumbai, India" or "Somerville, NJ, USA".');
  const place = data.results[0];
  return {
    label: [place.name, place.admin1, place.country].filter(Boolean).join(', '),
    latitude: place.latitude,
    longitude: place.longitude,
    timezone: place.timezone,
    country: place.country,
  };
}

async function searchLocations(query) {
  if (!query || query.trim().length < 2) return [];
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=8&language=en&format=json`;
  const res = await fetch(url);
  if (!res.ok) return [];
  const data = await res.json();
  if (!data?.results?.length) return [];

  return data.results.map((place) => ({
    label: [place.name, place.admin1, place.country].filter(Boolean).join(', '),
    latitude: place.latitude,
    longitude: place.longitude,
    timezone: place.timezone,
    country: place.country,
    name: place.name,
    admin1: place.admin1,
  }));
}

function birthDateTimeFromProfile(profile) {
  if (!profile?.birthDate || !profile?.birthTime || !profile?.timezone) return null;
  const [year, month, day] = profile.birthDate.split('-').map(Number);
  const [hour, minute] = profile.birthTime.split(':').map(Number);
  const dt = DateTime.fromObject(
    { year, month, day, hour, minute },
    { zone: profile.timezone }
  );
  if (!dt.isValid) return null;
  return dt;
}

function generateNatalProfile(profile) {
  const localBirth = birthDateTimeFromProfile(profile);
  if (!localBirth) return null;

  const birthUTC = localBirth.toUTC().toJSDate();
  const bodies = ['Sun', 'Moon', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn'];
  const placements = bodies.map((body) => {
    const longitude = geocentricLongitude(body, birthUTC);
    return {
      body,
      longitude,
      sign: getSignName(longitude),
      degree: Number(getSignDegree(longitude).toFixed(1)),
      formatted: formatLongitude(longitude),
    };
  });

  const placementMap = Object.fromEntries(placements.map((p) => [p.body, p]));
  const elements = placements.reduce((acc, p) => {
    const el = elementForSign(p.sign);
    acc[el] = (acc[el] || 0) + 1;
    return acc;
  }, {});

  const dominantElement = Object.entries(elements).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Fire';
  const sun = placementMap.Sun;
  const moon = placementMap.Moon;
  const mercury = placementMap.Mercury;
  const nakshatra = getNakshatra(moon.longitude, birthUTC);
  const chineseZodiac = getChineseZodiac(localBirth);

  return {
    birthUTC,
    localBirth,
    placements,
    placementMap,
    sunSign: sun.sign,
    moonSign: moon.sign,
    mercurySign: mercury.sign,
    dominantElement,
    dominantQuality: qualityForSign(sun.sign),
    nakshatra,
    chineseZodiac,
    accuracy: 'Time and location were used together. Rising sign and houses are still not calculated in this version.',
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

  const nakshatraRead = `Moon in ${natal.nakshatra.name} pada ${natal.nakshatra.pada} adds a Vedic layer focused on instinct, karmic patterning, and emotional style.`;
  const chineseRead = `${natal.chineseZodiac} adds a broader cultural archetype layer around temperament, cycle, and style of ambition.`;

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
    personality: `${personalityTight[sun.sign]} Emotionally, ${moonReads[moon.sign]} Dominant element: ${natal.dominantElement}. Dominant quality: ${natal.dominantQuality}. ${nakshatraRead} ${chineseRead}`,
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

function Landing({ onSubmit }) {
  const [form, setForm] = useState({
    name: '',
    birthDate: '',
    birthTime: '',
    location: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(null);

  const update = (key, value) => {
    setForm((f) => ({ ...f, [key]: value }));
    if (key === 'location') {
      setSelectedLocation(null);
    }
  };

  useEffect(() => {
    const query = form.location?.trim();
    if (!query || query.length < 2) {
      setSuggestions([]);
      setSuggestionsOpen(false);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const results = await searchLocations(query);
        setSuggestions(results);
        setSuggestionsOpen(true);
      } catch {
        setSuggestions([]);
        setSuggestionsOpen(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [form.location]);

  const chooseSuggestion = (place) => {
    setForm((f) => ({ ...f, location: place.label }));
    setSelectedLocation(place);
    setSuggestions([]);
    setSuggestionsOpen(false);
    setError('');
  };

  const handleSubmit = async () => {
    setError('');
    setLoading(true);

    try {
      let resolved = selectedLocation;

      if (!resolved) {
        resolved = await resolveLocation(form.location);
      }

      onSubmit({
        ...form,
        location: resolved.label,
        locationLabel: resolved.label,
        latitude: resolved.latitude,
        longitude: resolved.longitude,
        timezone: resolved.timezone,
        country: resolved.country,
      });
    } catch (e) {
      setError(e.message || 'Could not resolve location.');
    } finally {
      setLoading(false);
    }
  };

  const disabled = !form.birthDate || !form.birthTime || !form.location;

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(208,90,255,0.20),_transparent_30%),radial-gradient(circle_at_80%_20%,_rgba(255,185,91,0.22),_transparent_25%),linear-gradient(180deg,#100523_0%,#150a2f_35%,#0b1225_100%)] px-4 py-8 text-white">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8">
          <BadgePill className="bg-fuchsia-500/20 text-fuchsia-200">{APP_NAME}</BadgePill>
          <h1 className="mt-4 max-w-3xl text-4xl font-semibold leading-tight md:text-6xl">
            Enter a birth profile and generate a personal astrology dashboard.
          </h1>
          <p className="mt-4 max-w-2xl text-white/70 md:text-lg">
            Birth time and location are required in this version so the app can resolve the local birth moment correctly for international users.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.05fr_.95fr]">
          <Card className="rounded-[2rem] border border-white/10 bg-white/5 backdrop-blur-md">
            <CardHeader>
              <CardTitle>Start your chart</CardTitle>
              <CardDescription className="text-white/70">
                This version resolves timezone from the entered location before calculating the chart.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              <div>
                <label className="mb-2 block text-sm text-white/80">Name or nickname</label>
                <Input
                  placeholder="Nate"
                  value={form.name}
                  onChange={(e) => update('name', e.target.value)}
                />
              </div>

              <div>
                <label className="mb-2 block text-sm text-white/80">Birth date</label>
                <Input
                  type="date"
                  value={form.birthDate}
                  onChange={(e) => update('birthDate', e.target.value)}
                />
              </div>

              <div>
                <label className="mb-2 block text-sm text-white/80">Birth time</label>
                <Input
                  type="time"
                  value={form.birthTime}
                  onChange={(e) => update('birthTime', e.target.value)}
                />
              </div>

              <div className="relative">
                <label className="mb-2 block text-sm text-white/80">Birth location</label>
                <Input
                  placeholder="Mumbai, India"
                  value={form.location}
                  onChange={(e) => update('location', e.target.value)}
                  onFocus={() => {
                    if (suggestions.length) setSuggestionsOpen(true);
                  }}
                />

                {suggestionsOpen && suggestions.length > 0 && (
                  <div className="absolute z-20 mt-2 max-h-72 w-full overflow-y-auto rounded-2xl border border-white/10 bg-slate-950/95 shadow-2xl backdrop-blur-md">
                    {suggestions.map((place, idx) => (
                      <button
                        key={`${place.label}-${idx}`}
                        type="button"
                        onClick={() => chooseSuggestion(place)}
                        className="block w-full border-b border-white/5 px-4 py-3 text-left text-sm text-white/90 hover:bg-white/10 last:border-b-0"
                      >
                        <div className="font-medium">{place.label}</div>
                        <div className="mt-1 text-xs text-white/50">{place.timezone}</div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {selectedLocation && (
                <div className="rounded-2xl border border-emerald-300/20 bg-emerald-500/10 p-3 text-sm text-emerald-100">
                  Using: <strong>{selectedLocation.label}</strong>
                  <div className="mt-1 text-xs text-emerald-200/80">
                    Timezone: {selectedLocation.timezone}
                  </div>
                </div>
              )}

              {error ? (
                <div className="rounded-2xl border border-rose-300/20 bg-rose-500/10 p-3 text-sm text-rose-100">
                  {error}
                </div>
              ) : null}

              <button
                onClick={handleSubmit}
                disabled={disabled || loading}
                className="w-full rounded-2xl bg-gradient-to-r from-pink-500 via-fuchsia-500 to-violet-500 px-4 py-3 font-medium text-white disabled:opacity-50"
              >
                {loading ? 'Resolving location...' : 'Generate dashboard'}
              </button>
            </CardContent>
          </Card>

          <div className="grid gap-4">
            <Card className="rounded-[2rem] border border-white/10 bg-white/5 backdrop-blur-md">
              <CardContent className="p-5">
                <div className="flex items-center gap-3 text-lg font-semibold">
                  <Globe className="h-5 w-5 text-cyan-300" /> International-ready input
                </div>
                <p className="mt-2 text-sm leading-6 text-white/70">
                  The entered birth time is treated as local time for the entered place, then converted using that place’s timezone.
                </p>
              </CardContent>
            </Card>

            <Card className="rounded-[2rem] border border-white/10 bg-white/5 backdrop-blur-md">
              <CardContent className="p-5">
                <div className="flex items-center gap-3 text-lg font-semibold">
                  <Moon className="h-5 w-5 text-violet-300" /> Nakshatra restored
                </div>
                <p className="mt-2 text-sm leading-6 text-white/70">
                  This version adds back a Vedic Moon nakshatra layer alongside the Western chart layer.
                </p>
              </CardContent>
            </Card>

            <Card className="rounded-[2rem] border border-white/10 bg-white/5 backdrop-blur-md">
              <CardContent className="p-5">
                <div className="flex items-center gap-3 text-lg font-semibold">
                  <WandSparkles className="h-5 w-5 text-fuchsia-300" /> Chinese zodiac restored
                </div>
                <p className="mt-2 text-sm leading-6 text-white/70">
                  This version also restores Chinese zodiac archetype reading as a parallel symbolic layer.
                </p>
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
  const setTab = (group, value) => setState((s) => ({ ...s, ui: { ...s.ui, activeDomainTab: { ...s.ui.activeDomainTab, [group]: value } } }));

  if (!state.profile) {
    return <Landing onSubmit={(profile) => setState((s) => ({ ...s, profile }))} />;
  }

  return (
    <div className={cn('min-h-screen transition-colors duration-300', themeShell)}>
      <div className="mx-auto max-w-7xl px-4 py-4 md:px-6 md:py-6">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <BadgePill className="bg-fuchsia-500/20 text-fuchsia-200">{APP_NAME}</BadgePill>
            <h1 className="mt-3 text-3xl font-semibold md:text-5xl">{state.profile.name || 'Your chart'}</h1>
            <div className={cn('mt-2 flex flex-wrap gap-2 text-sm', textMuted)}>
              <span className="inline-flex items-center gap-1"><CalendarDays className="h-4 w-4" /> {state.profile.birthDate}</span>
              <span className="inline-flex items-center gap-1"><Clock3 className="h-4 w-4" /> {state.profile.birthTime}</span>
              <span className="inline-flex items-center gap-1"><MapPin className="h-4 w-4" /> {state.profile.locationLabel}</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => setState((s) => ({ ...s, profile: null }))} className="rounded-2xl bg-white/10 px-4 py-2 text-sm text-white hover:bg-white/15">New chart</button>
            <Toggle checked={state.ui.darkMode} onChange={(v) => setState((s) => ({ ...s, ui: { ...s.ui, darkMode: v } }))} />
          </div>
        </div>

        <motion.section initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} className="rounded-[2rem] border border-white/10 p-6 md:p-8">
          <div className="grid gap-6 lg:grid-cols-[1.35fr_.9fr]">
            <div>
              <h2 className="max-w-3xl text-3xl font-semibold leading-tight md:text-5xl">A personal dashboard built from birth date, local birth time, and location.</h2>
              <p className={cn('mt-4 max-w-2xl text-base md:text-lg', textMuted)}>{interpretations.overview}</p>
              <div className="mt-6 flex flex-wrap gap-3">
                <BadgePill className="bg-rose-500/20 text-rose-200">{natal.sunSign} Sun</BadgePill>
                <BadgePill className="bg-violet-500/20 text-violet-200">{natal.moonSign} Moon</BadgePill>
                <BadgePill className="bg-cyan-500/20 text-cyan-100">{natal.nakshatra.name}</BadgePill>
                <BadgePill className="bg-amber-500/20 text-amber-100">{natal.chineseZodiac}</BadgePill>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
              <TinyStat label="Moon" value={liveData.cosmicWeather.moon} icon={Moon} darkMode={state.ui.darkMode} />
              <TinyStat label="Phase" value={liveData.cosmicWeather.phase} icon={Sparkles} darkMode={state.ui.darkMode} />
              <TinyStat label="Dominant Transit" value={liveData.cosmicWeather.dominant} icon={Orbit} darkMode={state.ui.darkMode} />
              <TinyStat label="Timezone" value={state.profile.timezone} icon={Globe} darkMode={state.ui.darkMode} />
            </div>
          </div>
        </motion.section>

        <div className="mt-8 grid gap-10">
          <Section id="overview" title="Overview" subtitle="High-signal reading of the chart and what to do with it." darkMode={state.ui.darkMode}>
            <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
              <Card className={cardBase}>
                <CardHeader>
                  <CardTitle>Personality brief</CardTitle>
                  <CardDescription className={textMuted}>Western, Vedic, and Chinese layers combined.</CardDescription>
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
                  <CardTitle>System layers</CardTitle>
                  <CardDescription className={textMuted}>What the app is reading from each tradition.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm"><strong>Western:</strong> {natal.sunSign} Sun, {natal.moonSign} Moon, {natal.mercurySign} Mercury.</div>
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm"><strong>Vedic:</strong> {natal.nakshatra.name} nakshatra, pada {natal.nakshatra.pada}.</div>
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm"><strong>Chinese:</strong> {natal.chineseZodiac}.</div>
                  <div className={cn('text-sm leading-7', textMuted)}>{interpretations.sourcedNote}</div>
                </CardContent>
              </Card>
            </div>
          </Section>

          <Section id="natal" title="Natal Snapshot" subtitle="Calculated from entered birth date, local birth time, and resolved timezone." darkMode={state.ui.darkMode}>
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
                      {natal.nakshatra.name}
                      <br />
                      {natal.chineseZodiac.split(' ').pop()}
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
                <Card className={cardBase}>
                  <CardContent className="p-4">
                    <div className="text-lg font-semibold">Nakshatra</div>
                    <p className={cn('mt-1 text-sm', textMuted)}>{natal.nakshatra.name} · Pada {natal.nakshatra.pada}</p>
                  </CardContent>
                </Card>
                <Card className={cardBase}>
                  <CardContent className="p-4">
                    <div className="text-lg font-semibold">Chinese zodiac</div>
                    <p className={cn('mt-1 text-sm', textMuted)}>{natal.chineseZodiac}</p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </Section>

          <Section id="personality" title="Personality" subtitle="Focused synthesis instead of loose generic sign text." darkMode={state.ui.darkMode}>
            <div className="grid gap-4 md:grid-cols-3">
              <Card className={cardBase}><CardContent className="p-5"><Flame className="mb-3 h-5 w-5 text-rose-300" /><h3 className="text-lg font-semibold">{natal.sunSign} Sun</h3><p className={cn('mt-2 text-sm leading-6', textMuted)}>Core identity, self-direction, style of action, ego strength, and how life force gets expressed.</p></CardContent></Card>
              <Card className={cardBase}><CardContent className="p-5"><Moon className="mb-3 h-5 w-5 text-violet-300" /><h3 className="text-lg font-semibold">{natal.moonSign} Moon</h3><p className={cn('mt-2 text-sm leading-6', textMuted)}>Emotional needs, instinctive reactions, regulation style, and the deeper private self.</p></CardContent></Card>
              <Card className={cardBase}><CardContent className="p-5"><Eye className="mb-3 h-5 w-5 text-cyan-300" /><h3 className="text-lg font-semibold">{natal.nakshatra.name}</h3><p className={cn('mt-2 text-sm leading-6', textMuted)}>Vedic Moon-lunar patterning layer, including instinct and karmic flavor.</p></CardContent></Card>
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
                <Card className={cardBase}><CardContent className="p-5"><div className="flex items-center gap-2 text-lg font-semibold"><ShieldAlert className="h-5 w-5" /> Accuracy</div><p className={cn('mt-2 text-sm leading-6', textMuted)}>{natal.accuracy}</p></CardContent></Card>
              </div>
            </div>
          </Section>

          {['love', 'money', 'career'].map((domain) => {
            const sectionTitle = domain === 'money' ? 'Money' : domain[0].toUpperCase() + domain.slice(1);
            const active = state.ui.activeDomainTab[domain] || 'now';
            const iconMap = { love: Heart, money: Coins, career: Briefcase };
            const Icon = iconMap[domain];

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
                  <Card className={cardBase}>
                    <CardContent className="p-6">
                      <div className="flex items-center gap-3 text-2xl font-semibold"><Icon className="h-6 w-6" /> {sectionTitle} pulse</div>
                      <p className={cn('mt-4 leading-7', textMuted)}>{interpretations.domains[domain].now}</p>
                    </CardContent>
                  </Card>
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
        </div>
      </div>
    </div>
  );
}