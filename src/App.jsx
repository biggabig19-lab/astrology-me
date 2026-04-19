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
  ScrollText,
  Gem,
} from 'lucide-react';

const APP_NAME = 'Astrology Me';
const STORAGE_KEY = 'astrology-me-v5';
const MOBILE_SECTIONS = [
  { id: 'overview', label: 'Overview' },
  { id: 'identity', label: 'Identity' },
  { id: 'shadow', label: 'Shadow' },
  { id: 'forecast', label: 'Forecast' },
  { id: 'dates', label: 'Dates' },
  { id: 'transits', label: 'Transits' },
];

const BODIES = ['Sun', 'Moon', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Pluto'];
const ZODIAC = ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'];
const NAKSHATRAS = [
  'Ashwini', 'Bharani', 'Krittika', 'Rohini', 'Mrigashira', 'Ardra', 'Punarvasu', 'Pushya', 'Ashlesha',
  'Magha', 'Purva Phalguni', 'Uttara Phalguni', 'Hasta', 'Chitra', 'Swati', 'Vishakha', 'Anuradha', 'Jyeshtha',
  'Mula', 'Purva Ashadha', 'Uttara Ashadha', 'Shravana', 'Dhanishta', 'Shatabhisha', 'Purva Bhadrapada', 'Uttara Bhadrapada', 'Revati'
];
const ZODIAC_EMOJI = {
  Aries: '🐏', Taurus: '🐂', Gemini: '👯', Cancer: '🦀', Leo: '🦁', Virgo: '🌾',
  Libra: '⚖️', Scorpio: '🦂', Sagittarius: '🏹', Capricorn: '🐐', Aquarius: '🏺', Pisces: '🐟',
};
const NAKSHATRA_EMOJI = {
  Ashwini: '🐎', Bharani: '🐘', Krittika: '🔥', Rohini: '🌸', Mrigashira: '🦌', Ardra: '⛈️',
  Punarvasu: '🏹', Pushya: '🌼', Ashlesha: '🐍', Magha: '👑', 'Purva Phalguni': '🎨', 'Uttara Phalguni': '🌞',
  Hasta: '✋', Chitra: '💎', Swati: '🌬️', Vishakha: '🌿', Anuradha: '🤝', Jyeshtha: '🛡️',
  Mula: '🌱', 'Purva Ashadha': '💧', 'Uttara Ashadha': '🏔️', Shravana: '👂', Dhanishta: '🥁', Shatabhisha: '🌌',
  'Purva Bhadrapada': '⚡', 'Uttara Bhadrapada': '🐠', Revati: '🛶',
};
const CHINESE_ANIMAL_EMOJI = {
  Rat: '🐀', Ox: '🐂', Tiger: '🐅', Rabbit: '🐇', Dragon: '🐉', Snake: '🐍',
  Horse: '🐎', Goat: '🐐', Monkey: '🐒', Rooster: '🐓', Dog: '🐕', Pig: '🐖',
};

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
  const totalMinutes = Math.round(normalizeAngle(longitude) * 60);
  const roundedLongitude = normalizeAngle(totalMinutes / 60);
  const sign = getSignName(roundedLongitude);
  const deg = getSignDegree(roundedLongitude);
  const normalizedMinutes = ((Math.round(deg * 60) % (30 * 60)) + (30 * 60)) % (30 * 60);
  const whole = Math.floor(normalizedMinutes / 60);
  const minutes = normalizedMinutes % 60;
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
  const dt = DateTime.fromObject({ year, month, day, hour, minute }, { zone: profile.timezone });
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

function getLongPersonality(sign) {
  const text = {
    Aries: 'This person learns through action. Identity is built by movement, challenge, and direct engagement with life. Aries energy does not want to wait around for permission; it wants to test, initiate, and discover by doing. At its best, this creates courage, candor, and clean forward motion. At its worst, it can make patience feel like suffocation.',
    Taurus: 'This person builds through steadiness. Taurus energy values continuity, sensual reality, and systems that can be trusted over time. At its best, it creates loyalty, resilience, and real-world staying power. At its worst, it can become too resistant to necessary disruption.',
    Gemini: 'This person builds through curiosity and movement of mind. Gemini energy needs stimulation, language, exchange, and a feeling that life is alive with possibility. At its best, it is versatile, witty, and mentally agile. At its worst, it becomes scattered or too mentally detached.',
    Cancer: 'This person builds through emotional memory and protection. Cancer energy is sensitive to atmosphere, trust, and belonging. At its best, it creates devotion, intuition, and emotional intelligence. At its worst, it can become defensive or over-identified with old hurt.',
    Leo: 'This person builds through heart, expression, and visible creative force. Leo energy needs meaning, pride, and a sense of noble selfhood. At its best, it brings generosity, courage, and charisma. At its worst, it can become rigid around image or recognition.',
    Virgo: 'This person builds through refinement, discernment, and useful structure. Virgo energy improves what it touches. At its best, it creates precision, competence, and healing intelligence. At its worst, it can become overcritical or overly burdened by imperfection.',
    Libra: 'This person builds through relationship, harmony, and balance. Libra energy seeks proportion, grace, and mutuality. At its best, it creates diplomacy, beauty, and cooperation. At its worst, it can lose clarity by over-prioritizing peace.',
    Scorpio: 'This person builds through intensity, depth, and truth-testing. Scorpio energy wants what is real beneath appearances. At its best, it creates depth, resilience, and psychological courage. At its worst, it can become suspicious, controlling, or fixated.',
    Sagittarius: 'This person builds through freedom, meaning, and future direction. Sagittarius energy wants growth, perspective, and room to breathe. At its best, it creates hope, candor, and adventurous intelligence. At its worst, it can become restless or hard to anchor.',
    Capricorn: 'This person builds through discipline, realism, and earned authority. Capricorn energy wants structure that survives contact with reality. At its best, it creates mastery, endurance, and serious capability. At its worst, it can become too burdened or defended.',
    Aquarius: 'This person builds through originality, autonomy, and larger systems of meaning. Aquarius energy needs room to think differently. At its best, it creates vision, innovation, and independence. At its worst, it can become overly detached or oppositional.',
    Pisces: 'This person builds through intuition, feeling, and porous imagination. Pisces energy is highly receptive and tuned to subtle atmosphere. At its best, it creates compassion, symbolic intelligence, and creativity. At its worst, it can blur boundaries too easily.',
  };
  return text[sign] || '';
}

function getMoonDepth(sign) {
  const text = {
    Aries: 'Emotionally, this person responds quickly and intensely. Feelings arrive as impulses. Anger or urgency often appears before vulnerability is fully processed.',
    Taurus: 'Emotionally, this person needs stability, comfort, and predictability. Safety and calm are regulating forces.',
    Gemini: 'Emotionally, this person processes by talking, thinking, moving, and reframing. Feeling and thinking are tightly linked.',
    Cancer: 'Emotionally, this person is deeply impressionable and protective. Attachment, memory, and inner life run strong.',
    Leo: 'Emotionally, this person wants warmth, acknowledgment, and a sense that their feelings matter and are seen.',
    Virgo: 'Emotionally, this person often processes by analyzing, editing, and trying to make life more manageable.',
    Libra: 'Emotionally, this person needs relational equilibrium. Discord in close bonds can disrupt internal balance quickly.',
    Scorpio: 'Emotionally, this person feels with depth, secrecy, and totality. Trust is not casual.',
    Sagittarius: 'Emotionally, this person needs perspective, movement, and freedom from emotional claustrophobia.',
    Capricorn: 'Emotionally, this person may carry a great deal privately and reveal it selectively. Endurance is high, softness is earned.',
    Aquarius: 'Emotionally, this person often regulates through mental distance, ideals, or independence.',
    Pisces: 'Emotionally, this person is highly absorbent. Atmosphere matters, and emotional boundaries need care.',
  };
  return text[sign] || '';
}

function getNakshatraDepth(name) {
  const text = {
    Bharani: 'Bharani adds themes of intensity, capacity, moral weight, and the ability to carry or endure more than other people realize. It often brings seriousness beneath the surface and a strong relationship to creation, containment, and pressure.',
    Mula: 'Mula adds root-seeking force. It wants the bedrock truth underneath appearances. That can make the person insightful, psychologically penetrating, and constitutionally unable to tolerate falseness for long.',
    Ashwini: 'Ashwini adds speed, instinct, and a pioneering healing impulse. It often gives a fast response style and an urge to begin.',
    Rohini: 'Rohini adds magnetism, sensuality, growth energy, and a love of beauty, fertility, or cultivation.',
    Swati: 'Swati adds independence, mobility, and the desire to develop in one’s own wind and rhythm.',
    Revati: 'Revati adds softness, protection, intuition, and a longing to guide or complete with grace.',
  };
  return text[name] || `${name} adds a Vedic layer focused on emotional patterning, instinctive style, and karmic themes connected to the Moon.`;
}

function getChineseDepth(zodiac) {
  const animal = zodiac.split(' ').pop();
  const text = {
    Dragon: 'Dragon energy adds presence, force, charisma, and a sense that life should be lived at consequential scale. It often creates natural command, strong self-definition, and a refusal to think small.',
    Rabbit: 'Rabbit energy adds refinement, sensitivity, diplomacy, and a subtle way of shaping environments.',
    Tiger: 'Tiger energy adds intensity, daring, independence, and a willingness to move before certainty arrives.',
    Snake: 'Snake energy adds strategy, patience, instinct, and a more private relationship to power.',
    Horse: 'Horse energy adds motion, self-direction, speed, and a strong need for freedom.',
    Goat: 'Goat energy adds sensitivity, artistry, softness, and emotional texture.',
    Monkey: 'Monkey energy adds wit, adaptability, tactical intelligence, and improvisational cleverness.',
    Rooster: 'Rooster energy adds clarity, precision, visibility, and a sharpened sense of presentation.',
    Dog: 'Dog energy adds loyalty, protection, conscience, and ethical seriousness.',
    Pig: 'Pig energy adds warmth, sensuality, trust, and a strong instinct for comfort and sincerity.',
    Rat: 'Rat energy adds resourcefulness, pattern-recognition, social intelligence, and strategic opportunism.',
    Ox: 'Ox energy adds endurance, steadiness, work ethic, and seriousness of purpose.',
  };
  return text[animal] || `${zodiac} adds a broader symbolic layer around temperament, style of power, and social expression.`;
}

function findBestTransitDate(year, transitBody, natalBody, natalLongitude) {
  let best = null;
  for (let month = 1; month <= 12; month++) {
    const days = DateTime.utc(year, month).daysInMonth;
    for (let day = 1; day <= days; day++) {
      const date = new Date(Date.UTC(year, month - 1, day, 12, 0));
      const transitLon = geocentricLongitude(transitBody, date);
      const diff = angularDistance(transitLon, natalLongitude);
      const aspect = aspectLabel(diff);
      const score = aspect ? aspect.delta : diff + 10;
      if (!best || score < best.score) {
        best = { date, transitBody, natalBody, diff, aspect, score };
      }
    }
  }
  return best;
}

function computeKeyDates(natal, forecastYear) {
  const saturnSun = findBestTransitDate(forecastYear, 'Saturn', 'Sun', natal.placementMap.Sun.longitude);
  const neptuneSun = findBestTransitDate(forecastYear, 'Neptune', 'Sun', natal.placementMap.Sun.longitude);
  const jupiterMoon = findBestTransitDate(forecastYear, 'Jupiter', 'Moon', natal.placementMap.Moon.longitude);
  const marsMercury = findBestTransitDate(forecastYear, 'Mars', 'Mercury', natal.placementMap.Mercury.longitude);

  const birthday = natal.localBirth.set({ year: forecastYear });
  const birthdayPlusWeek = birthday.plus({ days: 8 });

  return [
    { date: birthday.toFormat('MMM d'), meaning: 'Birthday / solar reset — a personal turning point that tends to reveal what identity is becoming.' },
    { date: birthdayPlusWeek.toFormat('MMM d'), meaning: 'Post-birthday ignition window — themes started near the birthday often become more visible and active.' },
    { date: DateTime.fromJSDate(saturnSun.date).toFormat('MMM d'), meaning: 'Saturn closest to natal Sun — structure, limits, responsibility, and maturity come to the forefront.' },
    { date: DateTime.fromJSDate(neptuneSun.date).toFormat('MMM d'), meaning: 'Neptune strongest on natal Sun themes — heightened intuition, but also a need to verify what is real.' },
    { date: DateTime.fromJSDate(jupiterMoon.date).toFormat('MMM d'), meaning: 'Jupiter strongest on the Moon — emotional expansion, broader perspective, and opportunities through inner honesty.' },
    { date: DateTime.fromJSDate(marsMercury.date).toFormat('MMM d'), meaning: 'Mars strongest on Mercury — sharp speech, decisive thought, and the need to avoid overreactive communication.' },
  ];
}

function generateInterpretations(profile, natal, liveData, keyDates, forecastYear) {
  if (!profile || !natal) return null;

  const sun = natal.placementMap.Sun;
  const moon = natal.placementMap.Moon;
  const mercury = natal.placementMap.Mercury;
  const topTransit = liveData?.strongest?.[0];

  const personalityIntro = `${getLongPersonality(sun.sign)} ${getMoonDepth(moon.sign)} ${getNakshatraDepth(natal.nakshatra.name)} ${getChineseDepth(natal.chineseZodiac)}`;

  const convergence = [
    {
      title: 'The truth-compulsion',
      body: `${sun.sign} wants directness, ${natal.nakshatra.name} seeks what lies beneath the surface, and ${natal.chineseZodiac} adds a strong instinct around what is real versus what is merely postured. This can make the person unusually honest internally, even when life around them is vague or performative.`,
    },
    {
      title: 'The builder–breaker paradox',
      body: `There is a pattern here of both initiating and dismantling. This is not random instability. It is often the personality trying to remove what no longer feels alive, workable, or true. The higher expression is conscious rebuilding instead of reflexive disruption.`,
    },
    {
      title: 'Intensity that changes with proximity',
      body: `At a distance, the personality may read as charismatic, self-directed, or composed. Up close, there is often much more depth, vigilance, emotional complexity, and psychological force than people first assume.`,
    },
    {
      title: 'A fast front, a deeper interior',
      body: `${sun.sign} and ${mercury.sign} can make the outer rhythm look fast. ${moon.sign} and ${natal.nakshatra.name} often make the inner process much deeper, slower, and more layered. Part of growth is learning when to trust instinct and when to let the deeper process finish.`,
    },
  ];

  const shadowItems = [
    {
      title: 'Self-sabotage through disruption',
      body: `One recurring shadow is damaging something just as it begins to become real, stable, or demanding. The underlying issue is often not failure, but what full success would require emotionally.`,
    },
    {
      title: 'Anger as second-order emotion',
      body: `The visible reaction may be irritation, speed, sharpness, or dismissal. Underneath that there is often a more vulnerable state: hurt pride, fear of being constrained, fear of being misunderstood, or fear of losing leverage.`,
    },
    {
      title: 'Truth used too hard',
      body: `The instinct to see clearly is a gift. The shadow is delivering clarity with so much force that it lands like judgment or attack. Timing matters as much as accuracy.`,
    },
    {
      title: 'Control as protection',
      body: `When life feels uncertain, control can become emotional armor. The person may rely on competence, precision, independence, or distance rather than vulnerability.`,
    },
    {
      title: 'Difficulty trusting soft structures',
      body: `There can be more trust in intensity, challenge, or friction than in ease. This may make gentler forms of support or intimacy feel harder to believe in at first.`,
    },
  ];

  const highestExpression = [
    'Becoming someone who can move fast without outrunning truth.',
    'Using intensity to create depth and precision instead of collateral damage.',
    'Letting honesty become medicine rather than a blade.',
    'Building structures strong enough to hold both ambition and vulnerability.',
  ];

  const actionGuidance = [
    `Lead with the best of ${sun.sign}: courage, initiative, and clean self-honesty.`,
    `Protect the needs of the ${moon.sign} Moon instead of only managing them.`,
    `Let ${mercury.sign} Mercury sharpen communication without turning certainty into rigidity.`,
    `Use ${natal.nakshatra.name} as insight, not just as a reason to dismantle.`,
    `Let ${natal.chineseZodiac} become a style of grounded power rather than defensive intensity.`,
  ];

  const domainReads = {
    love: {
      now: `${sun.sign} + ${moon.sign} creates a relationship style that wants both truth and emotional permission. Attraction tends to deepen with people who can handle honesty without trying to dominate it.`,
      year: `Love gets better when the person names needs earlier and stops assuming the other person should infer them. The quality of relationship depends on whether intensity becomes trust or becomes testing.`,
      shadow: `The romantic trap is confusing self-protection with discernment. Withdrawal can feel wise when it is really fear dressed as standards.`,
    },
    money: {
      now: `${natal.dominantElement} emphasis suggests money works best when decisions match temperament. The strongest results usually come from structure, patience, and knowing when urgency is real versus emotional.`,
      year: `The financial lesson is usually about building more durable systems. Reserves, pacing, and realistic risk boundaries matter more than dramatic conviction.`,
      shadow: `The money shadow is acting to relieve pressure rather than acting from clear strategy.`,
    },
    career: {
      now: `${sun.sign} wants a role with initiative. ${mercury.sign} wants thinking and speaking to matter. The person does best where autonomy and real competence are both rewarded.`,
      year: `Career growth improves through cleaner positioning and stronger structure. The real opportunity is becoming more exact about what role, authority, and responsibility actually fit.`,
      shadow: `The career shadow is impatience with process while secretly needing the right process to support bigger ambition.`,
    },
  };

  return {
    overview: `${sun.sign} Sun gives the core identity: the way this person initiates, pursues goals, and defines selfhood. ${moon.sign} Moon colors emotional style and instinctive needs. ${mercury.sign} Mercury shapes thinking and communication. ${natal.nakshatra.name} adds a deeper Vedic instinct pattern, while ${natal.chineseZodiac} adds a broader archetypal temperament layer.`,
    personality: personalityIntro,
    convergence,
    actionGuidance,
    shadowItems,
    highestExpression,
    domains: domainReads,
    sourcedNote: 'This version is local-first. It does not scrape horoscope sites directly in the browser. A future backend/API layer can add sourced long-form interpretations and citations.',
    transitSummary: topTransit ? `${topTransit.planet} is currently forming a ${topTransit.aspect.toLowerCase()} to natal ${topTransit.natal} with an orb of ${topTransit.orb}°. This is the loudest live signal in the chart right now.` : 'Current transits are relatively moderate, so the focus is on steady movement and follow-through.',
    keyDates,
    identityForecast: `The near-term developmental pressure in ${forecastYear} is about becoming more structurally honest. Whatever is built on habit, drift, fantasy, or avoidance gets challenged. Whatever is aligned, real, and consciously chosen gets stronger.`,
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

function formatBirthDateInput(value) {
  const digits = value.replace(/\D/g, '').slice(0, 8);
  const month = digits.slice(0, 2);
  const day = digits.slice(2, 4);
  const year = digits.slice(4, 8);
  if (digits.length <= 2) return month;
  if (digits.length <= 4) return `${month}/${day}`;
  return `${month}/${day}/${year}`;
}

function parseBirthDateToISO(value) {
  const m = value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!m) return null;
  const month = Number(m[1]);
  const day = Number(m[2]);
  const year = Number(m[3]);
  if (month < 1 || month > 12) return null;
  if (day < 1 || day > 31) return null;
  const dt = DateTime.fromObject({ year, month, day });
  if (!dt.isValid) return null;
  return dt.toFormat('yyyy-LL-dd');
}

function formatBirthTimeInput(value) {
  const normalized = value.toUpperCase().replace(/[^0-9APM]/g, '');
  const digits = normalized.replace(/[APM]/g, '').slice(0, 4);
  const suffixRaw = normalized.replace(/[0-9]/g, '').slice(0, 2);
  const hour = digits.slice(0, 2);
  const minute = digits.slice(2, 4);
  const suffix = suffixRaw.startsWith('A') ? 'AM' : suffixRaw.startsWith('P') ? 'PM' : suffixRaw;
  let output = hour;
  if (digits.length > 2) output += `:${minute}`;
  if (suffix) output += ` ${suffix}`;
  return output;
}

function parseBirthTimeTo24h(value) {
  const m = value.match(/^(\d{1,2}):(\d{2})\s?(AM|PM)$/i);
  if (!m) return null;
  let hour = Number(m[1]);
  const minute = Number(m[2]);
  const ampm = m[3].toUpperCase();
  if (hour < 1 || hour > 12 || minute < 0 || minute > 59) return null;
  if (ampm === 'PM' && hour !== 12) hour += 12;
  if (ampm === 'AM' && hour === 12) hour = 0;
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}

function toggleBirthTimePeriod(value) {
  if (/AM$/i.test(value)) return value.replace(/AM$/i, 'PM');
  if (/PM$/i.test(value)) return value.replace(/PM$/i, 'AM');
  if (/^\d{1,2}:\d{2}$/i.test(value.trim())) return `${value.trim()} AM`;
  return value;
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
function Section({ id, title, subtitle, darkMode, children, collapsibleMobile = false, isOpen = true, onToggle = null }) {
  return (
    <section id={id} className="scroll-mt-32 md:scroll-mt-24">
      <div className="mb-4">
        <div className="flex items-start justify-between gap-3">
          <h2 className={cn('text-2xl font-semibold tracking-tight md:text-3xl', darkMode ? 'text-white' : 'text-slate-900')}>{title}</h2>
          {collapsibleMobile && onToggle ? (
            <button
              type="button"
              onClick={onToggle}
              className={cn('rounded-xl px-3 py-2 text-sm font-medium md:hidden', darkMode ? 'bg-white/10 text-white/90' : 'bg-slate-900/10 text-slate-700')}
            >
              {isOpen ? 'Collapse' : 'Expand'}
            </button>
          ) : null}
        </div>
        {subtitle ? <p className={cn('mt-1 text-sm md:text-base', darkMode ? 'text-white/70' : 'text-slate-600')}>{subtitle}</p> : null}
      </div>
      <div className={cn(collapsibleMobile && !isOpen ? 'hidden md:block' : '')}>
        {children}
      </div>
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

function ExpandableBlock({ title, children, darkMode = true }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={cn('rounded-2xl border p-4', darkMode ? 'border-white/10 bg-white/5' : 'border-slate-200/80 bg-white')}>
      <div className="flex items-center justify-between gap-3">
        <div className="font-medium">{title}</div>
        <button onClick={() => setOpen(!open)} className={cn('rounded-xl px-3 py-1 text-sm', darkMode ? 'bg-white/10 hover:bg-white/15' : 'bg-slate-100 hover:bg-slate-200')}>
          {open ? 'Show less' : 'Show more'}
        </button>
      </div>
      {open ? <div className={cn('mt-3 text-sm leading-7', darkMode ? 'text-white/75' : 'text-slate-600')}>{children}</div> : null}
    </div>
  );
}

function identityEmoji(type, label) {
  if (type === 'sun') return ZODIAC_EMOJI[label] || '✨';
  if (type === 'nakshatra') return NAKSHATRA_EMOJI[label] || '✨';
  if (type === 'chinese') {
    const animal = label.split(' ').pop();
    return CHINESE_ANIMAL_EMOJI[animal] || '✨';
  }
  return '✨';
}

function Sticker({ emoji, label }) {
  const common = 'h-24 w-24 rounded-[2rem] border border-white/20 bg-white/10 backdrop-blur-sm shadow-xl flex items-center justify-center';
  return <div className={common}><div className="text-5xl">{emoji || '✨'}</div><div className="sr-only">{label}</div></div>;
}

function IdentityCard({ title, subtitle, stickerEmoji, label, darkMode = true }) {
  return (
    <Card className={cn('rounded-[2rem] border backdrop-blur-md', darkMode ? 'border-white/10 bg-white/5 text-white' : 'border-slate-200/80 bg-white text-slate-900')}>
      <CardContent className="p-5">
        <div className="flex items-center gap-4">
          <Sticker emoji={stickerEmoji} label={label} />
          <div>
            <div className="text-lg font-semibold">{title}</div>
            <div className={cn('mt-1 text-sm', darkMode ? 'text-white/70' : 'text-slate-600')}>{subtitle}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function Landing({ onSubmit }) {
  const [form, setForm] = useState({ name: '', birthDate: '', birthTime: '', location: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(null);

  const update = (key, value) => {
    setForm((f) => ({ ...f, [key]: value }));
    if (key === 'location') setSelectedLocation(null);
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
      const normalizedBirthDate = parseBirthDateToISO(form.birthDate);
      if (!normalizedBirthDate) throw new Error('Use birth date format MM/DD/YYYY.');
      const normalizedBirthTime = parseBirthTimeTo24h(form.birthTime);
      if (!normalizedBirthTime) throw new Error('Use birth time format HH:MM AM or HH:MM PM.');

      let resolved = selectedLocation;
      if (!resolved) resolved = await resolveLocation(form.location);
      onSubmit({
        ...form,
        birthDate: normalizedBirthDate,
        birthTime: normalizedBirthTime,
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

  const disabled = !parseBirthDateToISO(form.birthDate) || !parseBirthTimeTo24h(form.birthTime) || !form.location;

  return (
    <div
      style={{
        position: 'relative',
        minHeight: '100vh',
        backgroundImage: "url('/114673.jpeg'), radial-gradient(circle at 15% 10%, rgba(255,186,120,0.45), transparent 34%), radial-gradient(circle at 85% 20%, rgba(255,125,93,0.35), transparent 30%), radial-gradient(circle at 50% 110%, rgba(255,84,143,0.2), transparent 45%), linear-gradient(180deg, #20062f 0%, #311047 42%, #1a1238 100%)",
        backgroundSize: 'cover',
        backgroundPosition: 'center top',
        backgroundRepeat: 'no-repeat',
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(to bottom, rgba(8,2,18,0.12) 0%, rgba(8,2,18,0.28) 50%, rgba(8,2,18,0.48) 100%)',
          zIndex: 0,
          pointerEvents: 'none',
        }}
      />
      <div
        className="landing-content"
        style={{
          position: 'relative',
          zIndex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          minHeight: '100vh',
          paddingBottom: '40px',
          maxWidth: '560px',
          margin: '0 auto',
          padding: '0 16px',
        }}
      >
        <style>{`
          input::placeholder { color: rgba(255,255,255,0.35) !important; }
          @keyframes pulseGlow {
            0%, 100% { box-shadow: 0 4px 20px rgba(200,130,10,0.3); }
            50% { box-shadow: 0 4px 32px rgba(200,130,10,0.65); }
          }
          .landing-heading {
            max-width: 560px;
            letter-spacing: 0.01em;
          }
          .landing-subtitle {
            max-width: 540px;
          }
          .landing-form-card {
            max-width: 500px;
            width: 100%;
            margin-top: 22px;
          }
          @media (max-width: 640px) {
            .landing-heading {
              max-width: 100%;
            }
            .landing-subtitle,
            .landing-form-card {
              max-width: 100%;
            }
          }
        `}</style>
        <div
          style={{
            marginTop: '32px',
            alignSelf: 'center',
            background: 'rgba(20,10,40,0.7)',
            border: '1px solid rgba(255,255,255,0.2)',
            borderRadius: '999px',
            padding: '6px 18px',
            fontSize: '13px',
            color: 'white',
            backdropFilter: 'blur(8px)',
            fontFamily: "'Cinzel', Georgia, serif",
          }}
        >
          {APP_NAME}
        </div>
        <h1
          className="landing-heading"
          style={{
            textAlign: 'center',
            color: 'white',
            fontWeight: 700,
            fontSize: 'clamp(22px, 3.2vw, 44px)',
            lineHeight: 1.2,
            marginTop: '12px',
            fontFamily: "'Cinzel', Georgia, serif",
            whiteSpace: 'nowrap',
          }}
        >
          Build your cosmic profile
        </h1>
        <div
          className="landing-form-card"
          style={{
            background: 'rgba(10,5,30,0.28)',
            border: '1px solid rgba(255,255,255,0.24)',
            borderRadius: '20px',
            padding: '18px 16px',
            backdropFilter: 'blur(10px)',
            boxShadow: '0 8px 40px rgba(0,0,0,0.5)',
          }}
        >
          <div style={{ position: 'relative', marginBottom: '8px' }}>
            <UserRound style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.45)', width: 16, height: 16, pointerEvents: 'none' }} />
            <input
              type="text"
              placeholder="Name or Nickname"
              value={form.name}
              onChange={(e) => update('name', e.target.value)}
              style={{ width: '100%', height: '46px', background: 'rgba(255,255,255,0.055)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '12px', padding: '0 16px 0 44px', color: 'white', fontSize: '14px', outline: 'none' }}
              onFocus={(e) => {
                e.currentTarget.style.border = '1px solid rgba(232,160,32,0.5)';
                e.currentTarget.style.boxShadow = '0 0 0 3px rgba(232,160,32,0.15)';
              }}
              onBlur={(e) => {
                e.currentTarget.style.border = '1px solid rgba(255,255,255,0.12)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            />
          </div>
          <div style={{ position: 'relative', marginBottom: '8px' }}>
            <CalendarDays style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.45)', width: 16, height: 16, pointerEvents: 'none' }} />
            <input
              type="text"
              inputMode="numeric"
              placeholder="MM/DD/YYYY"
              value={form.birthDate}
              onChange={(e) => update('birthDate', formatBirthDateInput(e.target.value))}
              style={{ width: '100%', height: '46px', background: 'rgba(255,255,255,0.055)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '12px', padding: '0 16px 0 44px', color: 'white', fontSize: '14px', outline: 'none' }}
              onFocus={(e) => {
                e.currentTarget.style.border = '1px solid rgba(232,160,32,0.5)';
                e.currentTarget.style.boxShadow = '0 0 0 3px rgba(232,160,32,0.15)';
              }}
              onBlur={(e) => {
                e.currentTarget.style.border = '1px solid rgba(255,255,255,0.12)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            />
          </div>
          <div style={{ position: 'relative', marginBottom: '8px' }}>
            <Clock3 style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.45)', width: 16, height: 16, pointerEvents: 'none' }} />
            <input
              type="text"
              inputMode="text"
              placeholder="HH:MM AM"
              value={form.birthTime}
              onChange={(e) => update('birthTime', formatBirthTimeInput(e.target.value))}
              onKeyDown={(e) => {
                if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
                  e.preventDefault();
                  update('birthTime', toggleBirthTimePeriod(form.birthTime));
                }
              }}
              style={{ width: '100%', height: '46px', background: 'rgba(255,255,255,0.055)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '12px', padding: '0 16px 0 44px', color: 'white', fontSize: '14px', outline: 'none' }}
              onFocus={(e) => {
                e.currentTarget.style.border = '1px solid rgba(232,160,32,0.5)';
                e.currentTarget.style.boxShadow = '0 0 0 3px rgba(232,160,32,0.15)';
              }}
              onBlur={(e) => {
                e.currentTarget.style.border = '1px solid rgba(255,255,255,0.12)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            />
          </div>
          <div style={{ position: 'relative', marginBottom: '8px' }}>
            <MapPin style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.45)', width: 16, height: 16, pointerEvents: 'none' }} />
            <input
              type="text"
              placeholder="Birth location"
              value={form.location}
              onChange={(e) => update('location', e.target.value)}
              onFocus={(e) => {
                if (suggestions.length) setSuggestionsOpen(true);
                e.currentTarget.style.border = '1px solid rgba(232,160,32,0.5)';
                e.currentTarget.style.boxShadow = '0 0 0 3px rgba(232,160,32,0.15)';
              }}
              style={{ width: '100%', height: '46px', background: 'rgba(255,255,255,0.055)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '12px', padding: '0 16px 0 44px', color: 'white', fontSize: '14px', outline: 'none' }}
              onBlur={(e) => {
                e.currentTarget.style.border = '1px solid rgba(255,255,255,0.12)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            />
            {suggestionsOpen && suggestions.length > 0 && (
              <div className="absolute z-20 mt-2 max-h-72 w-full overflow-y-auto rounded-2xl border border-white/10 bg-slate-950/95 shadow-2xl backdrop-blur-md">
                {suggestions.map((place, idx) => (
                  <button key={`${place.label}-${idx}`} type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => chooseSuggestion(place)} className="block w-full border-b border-white/5 px-4 py-3 text-left text-sm text-white/90 hover:bg-white/10 last:border-b-0">
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
              <div className="mt-1 text-xs text-emerald-200/80">Timezone: {selectedLocation.timezone}</div>
            </div>
          )}
          {error ? <div className="rounded-2xl border border-rose-300/20 bg-rose-500/10 p-3 text-sm text-rose-100">{error}</div> : null}
          <button
            onClick={handleSubmit}
            disabled={disabled || loading}
            style={{
              width: '100%',
              height: '52px',
              background: 'linear-gradient(135deg, #b8720a 0%, #e8a020 50%, #c8860a 100%)',
              border: 'none',
              borderRadius: '30px',
              fontSize: '16px',
              fontWeight: 700,
              color: '#1a0a00',
              fontFamily: "'Cinzel', Georgia, serif",
              cursor: 'pointer',
              marginTop: '4px',
              opacity: disabled || loading ? 0.6 : 1,
            }}
          >
            {loading ? 'Resolving location...' : 'Generate dashboard'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [state, setState] = usePersistedState();
  const [now, setNow] = useState(new Date());
  const [mobileSectionOpen, setMobileSectionOpen] = useState({
    overview: true,
    identity: true,
    shadow: false,
    forecast: true,
    dates: true,
    transits: false,
  });
  const [activeMobileSection, setActiveMobileSection] = useState('overview');
  const forecastYear = now.getFullYear();

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
      .flatMap((planet) => Object.entries(natalMap).map(([natalBody, natalLon]) => {
        const diff = angularDistance(planet.longitude, natalLon);
        const aspect = aspectLabel(diff);
        if (!aspect) return null;
        return { planet: planet.body, natal: natalBody, aspect: aspect.name, orb: Number(aspect.delta.toFixed(2)) };
      }))
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

  const keyDates = useMemo(() => {
    if (!natal) return [];
    return computeKeyDates(natal, forecastYear);
  }, [natal, forecastYear]);

  const interpretations = useMemo(
    () => generateInterpretations(state.profile, natal, liveData, keyDates, forecastYear),
    [state.profile, natal, liveData, keyDates, forecastYear]
  );

  const themeShell = state.ui.darkMode
    ? 'bg-[radial-gradient(circle_at_top,_rgba(208,90,255,0.24),_transparent_30%),radial-gradient(circle_at_80%_20%,_rgba(255,185,91,0.26),_transparent_25%),linear-gradient(180deg,#100523_0%,#190b36_35%,#0b1225_100%)] text-white'
    : 'bg-[radial-gradient(circle_at_top,_rgba(255,190,221,0.35),_transparent_32%),radial-gradient(circle_at_80%_20%,_rgba(255,219,147,0.35),_transparent_25%),linear-gradient(180deg,#fffaf4_0%,#f7f1ff_45%,#eef6ff_100%)] text-slate-900';

  const cardBase = state.ui.darkMode
    ? 'rounded-[2rem] border border-white/10 bg-white/5 text-white backdrop-blur-md'
    : 'rounded-[2rem] border border-slate-200/70 bg-white/80 text-slate-900 backdrop-blur-md';

  const textMuted = state.ui.darkMode ? 'text-white/70' : 'text-slate-600';
  const sectionBorder = state.ui.darkMode ? 'border-white/10' : 'border-slate-200/80';
  const surfaceBase = state.ui.darkMode ? 'border-white/10 bg-white/5' : 'border-slate-200/80 bg-white';
  const surfaceSoft = state.ui.darkMode ? 'bg-white/5' : 'bg-slate-100/80';
  const accentText = state.ui.darkMode ? 'text-white/80' : 'text-slate-700';
  const setTab = (group, value) => setState((s) => ({ ...s, ui: { ...s.ui, activeDomainTab: { ...s.ui.activeDomainTab, [group]: value } } }));
  const jumpToSection = (id) => {
    setMobileSectionOpen((prev) => ({ ...prev, [id]: true }));
    setActiveMobileSection(id);
    const target = document.getElementById(id);
    if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };
  const setAllMobileSections = (isOpen) => {
    setMobileSectionOpen((prev) => Object.keys(prev).reduce((acc, key) => ({ ...acc, [key]: isOpen }), {}));
  };

  if (!state.profile) return <Landing onSubmit={(profile) => setState((s) => ({ ...s, profile }))} />;
  if (!natal) {
    return (
      <div className="min-h-screen bg-slate-950 px-4 py-10 text-white">
        <div className="mx-auto max-w-2xl rounded-3xl border border-rose-300/20 bg-rose-500/10 p-6">
          <h1 className="text-2xl font-semibold">We couldn&apos;t load this saved chart.</h1>
          <p className="mt-3 text-sm text-white/80">
            The stored profile is missing valid birth date/time/timezone data. Start a fresh chart to continue.
          </p>
          <button
            type="button"
            onClick={() => setState((s) => ({ ...s, profile: null }))}
            className="mt-4 rounded-2xl bg-white/15 px-4 py-2 text-sm font-medium text-white hover:bg-white/25"
          >
            Start new chart
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('min-h-screen overflow-x-clip transition-colors duration-300', themeShell)}>
      <div className="mx-auto max-w-7xl px-4 py-4 md:px-6 md:py-6">
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <BadgePill className="bg-fuchsia-500/20 text-fuchsia-200">{APP_NAME}</BadgePill>
            <h1 className="mt-3 text-3xl font-semibold md:text-5xl">{state.profile.name || 'Your chart'}</h1>
            <div className={cn('mt-2 flex flex-wrap gap-2 text-sm', textMuted)}>
              <span className="inline-flex items-center gap-1"><CalendarDays className="h-4 w-4" /> {state.profile.birthDate}</span>
              <span className="inline-flex items-center gap-1"><Clock3 className="h-4 w-4" /> {state.profile.birthTime}</span>
              <span className="inline-flex items-center gap-1"><MapPin className="h-4 w-4" /> {state.profile.locationLabel}</span>
            </div>
          </div>
          <div className="flex items-center gap-3 self-start md:self-auto">
            <button onClick={() => setState((s) => ({ ...s, profile: null }))} className={cn('rounded-2xl px-4 py-2 text-sm', state.ui.darkMode ? 'bg-white/10 text-white hover:bg-white/15' : 'bg-slate-900/10 text-slate-800 hover:bg-slate-900/15')}>New chart</button>
            <Toggle checked={state.ui.darkMode} onChange={(v) => setState((s) => ({ ...s, ui: { ...s.ui, darkMode: v } }))} />
          </div>
        </div>

        <motion.section initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} className={cn('rounded-[2rem] border p-6 md:p-8', sectionBorder)}>
          <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
            <div>
              <h2 className="max-w-3xl text-3xl font-semibold leading-tight md:text-5xl">A playful personal dossier with real astrology under the hood.</h2>
              <p className={cn('mt-4 max-w-2xl text-base md:text-lg', textMuted)}>{interpretations.overview}</p>
              <div className="mt-6 flex flex-wrap gap-3">
                <BadgePill className="bg-rose-500/20 text-rose-200">{natal.sunSign} Sun</BadgePill>
                <BadgePill className="bg-violet-500/20 text-violet-200">{natal.nakshatra.name}</BadgePill>
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

        <div className="mt-4 flex items-center gap-2 md:hidden">
          <button
            type="button"
            onClick={() => setAllMobileSections(true)}
            className={cn('rounded-xl px-3 py-2 text-xs font-medium', state.ui.darkMode ? 'bg-white/10 text-white/90' : 'bg-slate-900/10 text-slate-700')}
          >
            Expand all
          </button>
          <button
            type="button"
            onClick={() => setAllMobileSections(false)}
            className={cn('rounded-xl px-3 py-2 text-xs font-medium', state.ui.darkMode ? 'bg-white/10 text-white/90' : 'bg-slate-900/10 text-slate-700')}
          >
            Collapse all
          </button>
        </div>

        <div className="sticky top-2 z-20 mt-3 w-full pb-2 md:hidden">
          <div className={cn('grid w-full grid-cols-3 gap-2 rounded-2xl border px-2 py-2 backdrop-blur-md', sectionBorder, state.ui.darkMode ? 'bg-black/25' : 'bg-white/80')}>
            {MOBILE_SECTIONS.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => jumpToSection(item.id)}
                className={cn(
                  'min-w-0 truncate rounded-xl px-2 py-2.5 text-sm font-medium transition',
                  activeMobileSection === item.id
                    ? 'bg-fuchsia-500/35 text-white ring-1 ring-fuchsia-300/50'
                    : (state.ui.darkMode ? 'bg-white/10 text-white/80' : 'bg-slate-900/10 text-slate-700')
                )}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-8 grid gap-10">
          <Section id="overview" title="Overview" subtitle="The app should feel like the user learned something real about themselves." darkMode={state.ui.darkMode} collapsibleMobile isOpen={mobileSectionOpen.overview} onToggle={() => setMobileSectionOpen((prev) => ({ ...prev, overview: !prev.overview }))}>
            <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
              <Card className={cardBase}>
                <CardHeader><CardTitle>Deep personality read</CardTitle><CardDescription className={textMuted}>A longer portrait instead of just a sign label.</CardDescription></CardHeader>
                <CardContent className="space-y-4">
                  <p className={cn('leading-8', textMuted)}>{interpretations.personality}</p>
                  <ExpandableBlock title="Why this matters in daily life" darkMode={state.ui.darkMode}>
                    The point of this reading is not just symbolic flair. It is to translate personality structure into lived experience: how the person reacts, how they decide, what kind of environment sharpens them, what kind of environment drains them, and what they are actually trying to become when they are not merely coping.
                  </ExpandableBlock>
                </CardContent>
              </Card>
              <Card className={cardBase}>
                <CardHeader><CardTitle>Action guidance</CardTitle><CardDescription className={textMuted}>The practical side of the portrait.</CardDescription></CardHeader>
                <CardContent className="space-y-3">
                  {interpretations.actionGuidance.map((item) => <div key={item} className={cn('rounded-2xl border p-4 text-sm leading-6', surfaceBase)}>{item}</div>)}
                </CardContent>
              </Card>
            </div>
          </Section>

          <Section id="identity" title="Identity Trio" subtitle="Three systems, three cute identity stickers, one integrated portrait." darkMode={state.ui.darkMode} collapsibleMobile isOpen={mobileSectionOpen.identity} onToggle={() => setMobileSectionOpen((prev) => ({ ...prev, identity: !prev.identity }))}>
            <div className="grid gap-4 md:grid-cols-3">
              <IdentityCard title={`${natal.sunSign} Sun`} subtitle="Western identity core" stickerEmoji={identityEmoji('sun', natal.sunSign)} label={natal.sunSign} darkMode={state.ui.darkMode} />
              <IdentityCard title={natal.nakshatra.name} subtitle={`Nakshatra · Pada ${natal.nakshatra.pada}`} stickerEmoji={identityEmoji('nakshatra', natal.nakshatra.name)} label={natal.nakshatra.name} darkMode={state.ui.darkMode} />
              <IdentityCard title={natal.chineseZodiac} subtitle="Chinese zodiac archetype" stickerEmoji={identityEmoji('chinese', natal.chineseZodiac)} label={natal.chineseZodiac} darkMode={state.ui.darkMode} />
            </div>
            <div className="mt-6">
              <h3 className="text-lg font-semibold md:text-xl">Where All Three Converge</h3>
              <p className={cn('mt-1 text-sm', textMuted)}>This is usually where the user recognizes themselves most strongly.</p>
            </div>
            <div className="mt-4 grid gap-4">
              {interpretations.convergence.map((item) => (
                <Card key={item.title} className={cardBase}><CardContent className="p-5"><div className="flex items-center gap-2 text-lg font-semibold"><Gem className="h-5 w-5 text-fuchsia-300" />{item.title}</div><p className={cn('mt-3 text-sm leading-7', textMuted)}>{item.body}</p></CardContent></Card>
              ))}
            </div>
          </Section>

          <Section id="shadow" title="Shadow Analysis" subtitle="Protective patterns, not moral failure." darkMode={state.ui.darkMode} collapsibleMobile isOpen={mobileSectionOpen.shadow} onToggle={() => setMobileSectionOpen((prev) => ({ ...prev, shadow: !prev.shadow }))}>
            <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
              <Card className={cardBase}>
                <CardHeader><CardTitle>Shadow activation radar</CardTitle><CardDescription className={textMuted}>Weighted by live transit pressure.</CardDescription></CardHeader>
                <CardContent className="h-[320px] w-full"><ResponsiveContainer width="100%" height="100%"><RadarChart data={liveData.shadowRadar} outerRadius="72%"><PolarGrid /><PolarAngleAxis dataKey="trait" tick={{ fill: state.ui.darkMode ? '#f5e9ff' : '#334155', fontSize: 12 }} /><PolarRadiusAxis tick={false} axisLine={false} /><Radar dataKey="value" fillOpacity={0.45} strokeWidth={2} /></RadarChart></ResponsiveContainer></CardContent>
              </Card>
              <div className="space-y-4">
                {interpretations.shadowItems.map((item) => <Card key={item.title} className={cardBase}><CardContent className="p-5"><div className="text-lg font-semibold">{item.title}</div><p className={cn('mt-2 text-sm leading-7', textMuted)}>{item.body}</p></CardContent></Card>)}
              </div>
            </div>
            <Card className={cn(cardBase, 'mt-6')}><CardHeader><CardTitle>Highest expression</CardTitle><CardDescription className={textMuted}>Where the chart can go when the person matures into it.</CardDescription></CardHeader><CardContent className="space-y-3">{interpretations.highestExpression.map((item) => <div key={item} className={cn('rounded-2xl border p-4 text-sm leading-6', surfaceBase)}>{item}</div>)}</CardContent></Card>
          </Section>

          <Section id="forecast" title={`${forecastYear} Forecast`} subtitle="Now using computed key dates rather than generic placeholders." darkMode={state.ui.darkMode} collapsibleMobile isOpen={mobileSectionOpen.forecast} onToggle={() => setMobileSectionOpen((prev) => ({ ...prev, forecast: !prev.forecast }))}>
            <div className="grid gap-6 lg:grid-cols-[1.15fr_.85fr]">
              <Card className={cardBase}>
                <CardHeader><CardTitle>Year contour</CardTitle><CardDescription className={textMuted}>A mobile-friendly heatmap of domain intensity.</CardDescription></CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-3">
                    <div className={cn('grid grid-cols-[42px_repeat(5,minmax(0,1fr))] gap-2 text-[11px] font-semibold uppercase tracking-[0.14em]', textMuted)}>
                      <div></div>
                      <div className="text-center">Love</div>
                      <div className="text-center">Money</div>
                      <div className="text-center">Career</div>
                      <div className="text-center">Health</div>
                      <div className="text-center">Identity</div>
                    </div>
                    {liveData.yearHeat.map((m) => (
                      <div key={m.month} className="grid grid-cols-[42px_repeat(5,minmax(0,1fr))] items-center gap-2 text-xs md:text-sm">
                        <div className={cn('font-medium', textMuted)}>{m.month}</div>
                        {['love', 'money', 'career', 'health', 'identity'].map((k) => {
                          const v = m[k];
                          return (
                            <div
                              key={k}
                              className={cn('rounded-xl px-1.5 py-2 text-center text-[11px] font-semibold sm:px-2 sm:text-xs', state.ui.darkMode ? '' : 'text-slate-800')}
                              style={{ background: `linear-gradient(90deg, rgba(244,114,182,.18), rgba(168,85,247,${v / 100}))` }}
                            >
                              {v}
                            </div>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
              <div className="space-y-4">
                <Card className={cardBase}><CardContent className="p-5"><div className="flex items-center gap-2 text-lg font-semibold"><CalendarDays className="h-5 w-5" /> Main developmental theme</div><p className={cn('mt-2 text-sm leading-7', textMuted)}>{interpretations.identityForecast}</p></CardContent></Card>
                <Card className={cardBase}><CardContent className="p-5"><div className="flex items-center gap-2 text-lg font-semibold"><ShieldAlert className="h-5 w-5" /> Dominant live transit</div><p className={cn('mt-2 text-sm leading-7', textMuted)}>{interpretations.transitSummary}</p></CardContent></Card>
              </div>
            </div>
          </Section>

          <Section id="dates" title={`${forecastYear} Key Dates + Life Domains`} subtitle="Specific forecast windows and domain-level interpretation." darkMode={state.ui.darkMode} collapsibleMobile isOpen={mobileSectionOpen.dates} onToggle={() => setMobileSectionOpen((prev) => ({ ...prev, dates: !prev.dates }))}>
            <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
              <Card className={cardBase}>
                <CardHeader><CardTitle>Key dates to watch</CardTitle><CardDescription className={textMuted}>{`Computed from birthday timing plus strongest transit proximity in ${forecastYear}.`}</CardDescription></CardHeader>
                <CardContent className="space-y-3">
                  {interpretations.keyDates.map((item) => <div key={`${item.date}-${item.meaning}`} className={cn('rounded-2xl border p-4', surfaceBase)}><div className="font-medium">{item.date}</div><div className={cn('mt-1 text-sm', textMuted)}>{item.meaning}</div></div>)}
                </CardContent>
              </Card>
              <Card className={cardBase}>
                <CardHeader><CardTitle>Life domain forecast</CardTitle><CardDescription className={textMuted}>Tap through the domain views.</CardDescription></CardHeader>
                <CardContent className="space-y-4">
                  {[{ id: 'love', title: 'Love', icon: Heart }, { id: 'money', title: 'Money', icon: Coins }, { id: 'career', title: 'Career', icon: Briefcase }].map(({ id, title, icon: Icon }) => {
                    const active = state.ui.activeDomainTab[id] || 'now';
                    return (
                      <div key={id} className={cn('rounded-2xl border p-4', surfaceBase)}>
                        <div className="mb-3 flex items-center gap-2 text-lg font-semibold"><Icon className="h-5 w-5" />{title}</div>
                        <div className={cn('mb-3 grid grid-cols-3 gap-2 rounded-2xl p-1', surfaceSoft)}>
                          {['now', 'year', 'shadow'].map((tab) => (
                            <button key={tab} onClick={() => setTab(id, tab)} className={cn('rounded-2xl px-3 py-2 text-sm transition', active === tab ? 'bg-fuchsia-500/30 text-white ring-1 ring-fuchsia-300/50' : (state.ui.darkMode ? 'bg-white/5 text-white/80 hover:bg-white/10' : 'bg-slate-900/5 text-slate-700 hover:bg-slate-900/10'))}>
                              {tab === 'year' ? 'Year' : tab[0].toUpperCase() + tab.slice(1)}
                            </button>
                          ))}
                        </div>
                        <p className={cn('text-sm leading-7', textMuted)}>{interpretations.domains[id][active]}</p>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            </div>
          </Section>

          <Section id="transits" title="Current Transits" subtitle="The live astronomy layer feeding the present-tense reading." darkMode={state.ui.darkMode} collapsibleMobile isOpen={mobileSectionOpen.transits} onToggle={() => setMobileSectionOpen((prev) => ({ ...prev, transits: !prev.transits }))}>
            <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
              <Card className={cardBase}><CardHeader><CardTitle>Orb meters</CardTitle><CardDescription className={textMuted}>Current transit pressure against natal points.</CardDescription></CardHeader><CardContent className="space-y-4">{liveData.orbMeters.map((m) => <div key={m.name} className={cn('rounded-2xl border p-4', surfaceBase)}><div className="flex items-center justify-between gap-3"><div className="font-medium">{m.name}</div><div className={cn('text-sm', state.ui.darkMode ? 'text-white/70' : 'text-slate-600')}>{m.value}%</div></div><div className="mt-3"><ProgressBar value={m.value} /></div><p className={cn('mt-3 text-sm', textMuted)}>{m.note}</p></div>)}</CardContent></Card>
              <Card className={cardBase}><CardHeader><CardTitle>Current planets</CardTitle><CardDescription className={textMuted}>Live geocentric ecliptic positions.</CardDescription></CardHeader><CardContent className="space-y-3">{liveData.planets.map((planet) => <div key={planet.body} className={cn('flex items-center justify-between rounded-2xl border p-3', surfaceBase)}><div className="flex min-w-0 items-center gap-3"><div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-full border text-lg', state.ui.darkMode ? 'border-white/10 bg-white/10' : 'border-slate-200 bg-slate-100', accentText)}>{zodiacGlyph(planet.sign)}</div><div className="min-w-0"><div className="font-medium">{planet.body}</div><div className={cn('truncate text-sm', textMuted)}>{planet.formatted}</div></div></div><div className="ml-2 text-right text-sm">{planet.retrograde && <div className="text-amber-300">Rx</div>}{planet.elongation != null && <div className={textMuted}>{Math.round(planet.elongation)}°</div>}</div></div>)}</CardContent></Card>
            </div>
          </Section>
        </div>
      </div>
    </div>
  );
}
