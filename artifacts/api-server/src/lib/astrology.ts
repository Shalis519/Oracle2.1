import circularPkg from "circular-natal-horoscope-js";

const { Origin, Horoscope } = circularPkg as unknown as {
  Origin: new (args: {
    year: number;
    month: number;
    date: number;
    hour: number;
    minute: number;
    latitude: number;
    longitude: number;
  }) => OriginInstance;
  Horoscope: new (args: {
    origin: OriginInstance;
    houseSystem?: string;
    zodiac?: string;
    aspectPoints?: string[];
    aspectWithPoints?: string[];
    aspectTypes?: string[];
    language?: string;
  }) => HoroscopeInstance;
};

interface OriginInstance {
  timezone: string;
  julianDate: number;
  localSiderealTime: number;
  utcTime: Date;
}

interface ChartDegrees {
  Ecliptic: {
    DecimalDegrees: number;
    ArcDegreesFormatted30: string;
  };
}

interface ChartPosition {
  Ecliptic: ChartDegrees["Ecliptic"];
}

interface SignInfo {
  key: string;
  label: string;
}

interface BodyInstance {
  key: string;
  label: string;
  Sign: SignInfo;
  ChartPosition: ChartPosition;
  House?: { id: number };
  isRetrograde?: boolean;
}

interface HouseInstance {
  id: number;
  Sign: SignInfo;
  ChartPosition: { StartPosition: ChartPosition };
}

interface AngleInstance {
  key: string;
  Sign: SignInfo;
  ChartPosition: ChartPosition;
}

interface AspectInstance {
  point1Key: string;
  point2Key: string;
  aspectKey: string;
  orb: number;
  orbUsed: number;
}

interface HoroscopeInstance {
  CelestialBodies: { all: BodyInstance[] };
  CelestialPoints: { all: BodyInstance[] };
  Houses: HouseInstance[];
  Aspects: { all: AspectInstance[] };
  Ascendant: AngleInstance;
  Midheaven: AngleInstance;
}

// Russian labels for zodiac signs keyed by the library's English key.
const SIGN_RU: Record<string, string> = {
  aries: "Овен",
  taurus: "Телец",
  gemini: "Близнецы",
  cancer: "Рак",
  leo: "Лев",
  virgo: "Дева",
  libra: "Весы",
  scorpio: "Скорпион",
  sagittarius: "Стрелец",
  capricorn: "Козерог",
  aquarius: "Водолей",
  pisces: "Рыбы",
};

const SIGN_SYMBOL: Record<string, string> = {
  aries: "\u2648",
  taurus: "\u2649",
  gemini: "\u264A",
  cancer: "\u264B",
  leo: "\u264C",
  virgo: "\u264D",
  libra: "\u264E",
  scorpio: "\u264F",
  sagittarius: "\u2650",
  capricorn: "\u2651",
  aquarius: "\u2652",
  pisces: "\u2653",
};

// Russian labels and glyphs for the celestial bodies and points we expose.
const BODY_RU: Record<string, string> = {
  sun: "Солнце",
  moon: "Луна",
  mercury: "Меркурий",
  venus: "Венера",
  mars: "Марс",
  jupiter: "Юпитер",
  saturn: "Сатурн",
  uranus: "Уран",
  neptune: "Нептун",
  pluto: "Плутон",
  chiron: "Хирон",
  northnode: "Северный узел",
  southnode: "Южный узел",
  lilith: "Лилит",
};

const BODY_SYMBOL: Record<string, string> = {
  sun: "\u2609",
  moon: "\u263D",
  mercury: "\u263F",
  venus: "\u2640",
  mars: "\u2642",
  jupiter: "\u2643",
  saturn: "\u2644",
  uranus: "\u2645",
  neptune: "\u2646",
  pluto: "\u2647",
  chiron: "\u26B7",
  northnode: "\u260A",
  southnode: "\u260B",
  lilith: "\u26B8",
};

// Display order for the bodies table and the wheel.
const BODY_ORDER = [
  "sun",
  "moon",
  "mercury",
  "venus",
  "mars",
  "jupiter",
  "saturn",
  "uranus",
  "neptune",
  "pluto",
  "chiron",
  "northnode",
  "southnode",
  "lilith",
];

const ASPECT_RU: Record<string, { label: string; symbol: string }> = {
  conjunction: { label: "Соединение", symbol: "\u260C" },
  opposition: { label: "Оппозиция", symbol: "\u260D" },
  trine: { label: "Тригон", symbol: "\u25B3" },
  square: { label: "Квадрат", symbol: "\u25A1" },
  sextile: { label: "Секстиль", symbol: "\u26B9" },
  quincunx: { label: "Квинконс", symbol: "\u26BB" },
  semisextile: { label: "Полусекстиль", symbol: "\u26BA" },
  semisquare: { label: "Полуквадрат", symbol: "\u2220" },
  sesquiquadrate: { label: "Полутораквадрат", symbol: "\u26BC" },
  quintile: { label: "Квинтиль", symbol: "Q" },
};

const ANGLE_RU: Record<string, { label: string; abbr: string; symbol: string }> = {
  ascendant: { label: "Асцендент", abbr: "ASC", symbol: "Asc" },
  descendant: { label: "Десцендент", abbr: "DSC", symbol: "Dsc" },
  midheaven: { label: "Середина неба", abbr: "MC", symbol: "MC" },
  imumcoeli: { label: "Надир", abbr: "IC", symbol: "IC" },
};

export interface NatalChartInput {
  year: number;
  month: number; // 1-12
  day: number;
  hour: number; // 0-23
  minute: number; // 0-59
  latitude: number;
  longitude: number;
  timezone?: string | null;
}

export interface NatalBody {
  key: string;
  name: string;
  symbol: string;
  sign: string;
  signKey: string;
  signSymbol: string;
  longitude: number;
  degreeInSign: string;
  house: number | null;
  retrograde: boolean;
}

export interface NatalAngle {
  key: string;
  name: string;
  abbr: string;
  sign: string;
  signKey: string;
  signSymbol: string;
  longitude: number;
  degreeInSign: string;
}

export interface NatalHouse {
  number: number;
  sign: string;
  signKey: string;
  signSymbol: string;
  longitude: number;
  degreeInSign: string;
}

export interface NatalAspect {
  body1: string;
  body1Symbol: string;
  body2: string;
  body2Symbol: string;
  type: string;
  typeKey: string;
  typeSymbol: string;
  orb: number;
}

export interface TransitBody {
  key: string;
  name: string;
  symbol: string;
  sign: string;
  signKey: string;
  signSymbol: string;
  longitude: number;
  degreeInSign: string;
  house: number | null;
  retrograde: boolean;
  speed: string; // "fast" | "slow"
}

export interface TransitAspect {
  transitBody: string;
  transitBodySymbol: string;
  transitSign: string;        // sign of transit body today
  transitSignSymbol: string;
  transitHouse: number | null; // NATAL house the transit body is moving through today
  transitRetrograde: boolean;
  natalBody: string;
  natalBodySymbol: string;
  natalSign: string;         // sign of natal body
  natalSignSymbol: string;
  natalHouse: number | null; // already existed; rename for clarity
  type: string;
  typeKey: string;
  typeSymbol: string;
  orb: number;
  durationDays: number;
}

export interface TransitResult {
  date: string;
  transitBodies: TransitBody[];
  aspects: TransitAspect[];
}

export interface NatalChart {
  bodies: NatalBody[];
  angles: NatalAngle[];
  houses: NatalHouse[];
  aspects: NatalAspect[];
  meta: {
    timezone: string;
    julianDate: number;
    utc: string;
    latitude: number;
    longitude: number;
    houseSystem: string;
  };
}

function degreeWithinSign(pos: ChartPosition): string {
  // ArcDegreesFormatted30 is like "24° 20' 7''" (degrees within the 30° sign).
  return pos.Ecliptic.ArcDegreesFormatted30;
}

function mapBody(b: BodyInstance): NatalBody {
  return {
    key: b.key,
    name: BODY_RU[b.key] ?? b.label,
    symbol: BODY_SYMBOL[b.key] ?? "",
    sign: SIGN_RU[b.Sign.key] ?? b.Sign.label,
    signKey: b.Sign.key,
    signSymbol: SIGN_SYMBOL[b.Sign.key] ?? "",
    longitude: Number(b.ChartPosition.Ecliptic.DecimalDegrees.toFixed(4)),
    degreeInSign: degreeWithinSign(b.ChartPosition),
    house: b.House?.id ?? null,
    retrograde: Boolean(b.isRetrograde),
  };
}

function signKeyForLongitude(lon: number): string {
  const keys = [
    "aries",
    "taurus",
    "gemini",
    "cancer",
    "leo",
    "virgo",
    "libra",
    "scorpio",
    "sagittarius",
    "capricorn",
    "aquarius",
    "pisces",
  ];
  const idx = Math.floor((((lon % 360) + 360) % 360) / 30);
  return keys[idx];
}

function formatDegreeInSign(lon: number): string {
  const within = (((lon % 360) + 360) % 360) % 30;
  const d = Math.floor(within);
  const mFloat = (within - d) * 60;
  const m = Math.floor(mFloat);
  const s = Math.round((mFloat - m) * 60);
  return `${d}\u00B0 ${m}' ${s}''`;
}

function buildAngle(
  key: "ascendant" | "descendant" | "midheaven" | "imumcoeli",
  longitude: number,
  signKey?: string,
  degreeInSign?: string,
): NatalAngle {
  const info = ANGLE_RU[key];
  const sk = signKey ?? signKeyForLongitude(longitude);
  return {
    key,
    name: info.label,
    abbr: info.abbr,
    sign: SIGN_RU[sk] ?? sk,
    signKey: sk,
    signSymbol: SIGN_SYMBOL[sk] ?? "",
    longitude: Number((((longitude % 360) + 360) % 360).toFixed(4)),
    degreeInSign: degreeInSign ?? formatDegreeInSign(longitude),
  };
}

// Classical (traditional) orbs of the planets — full orbs in degrees.
// The orb allowed for an aspect between two bodies is the average of their
// two orbs (i.e. the sum of their "moieties" / half-orbs), per Lilly.
const CLASSICAL_ORB: Record<string, number> = {
  sun: 15,
  moon: 12,
  mercury: 7,
  venus: 7,
  mars: 8,
  jupiter: 9,
  saturn: 9,
  // Modern planets / points are not part of the classical tradition; assigned
  // modest orbs so only tight contacts register.
  uranus: 5,
  neptune: 5,
  pluto: 5,
  chiron: 4,
  northnode: 3,
  southnode: 3,
  lilith: 3,
};
const DEFAULT_ORB = 4;
const moiety = (key: string) => (CLASSICAL_ORB[key] ?? DEFAULT_ORB) / 2;

export const MAJOR_ASPECTS: { key: string; angle: number }[] = [
  { key: "conjunction", angle: 0 },
  { key: "sextile", angle: 60 },
  { key: "square", angle: 90 },
  { key: "trine", angle: 120 },
  { key: "opposition", angle: 180 },
];

// Compute major aspects between bodies using classical per-planet orbs.
function computeAspects(bodies: NatalBody[]): NatalAspect[] {
  const out: NatalAspect[] = [];
  for (let i = 0; i < bodies.length; i++) {
    for (let j = i + 1; j < bodies.length; j++) {
      const b1 = bodies[i];
      const b2 = bodies[j];
      let sep = Math.abs(b1.longitude - b2.longitude) % 360;
      if (sep > 180) sep = 360 - sep;
      const allowed = moiety(b1.key) + moiety(b2.key);
      let best: { key: string; diff: number } | null = null;
      for (const asp of MAJOR_ASPECTS) {
        const diff = Math.abs(sep - asp.angle);
        if (diff <= allowed && (best === null || diff < best.diff)) {
          best = { key: asp.key, diff };
        }
      }
      if (best) {
        const info = ASPECT_RU[best.key] ?? { label: best.key, symbol: "" };
        out.push({
          body1: b1.name,
          body1Symbol: b1.symbol,
          body2: b2.name,
          body2Symbol: b2.symbol,
          type: info.label,
          typeKey: best.key,
          typeSymbol: info.symbol,
          orb: Number(best.diff.toFixed(2)),
        });
      }
    }
  }
  // Tightest aspects first.
  out.sort((a, z) => a.orb - z.orb);
  return out;
}

export function computeNatalChart(input: NatalChartInput): NatalChart {
  const origin = new Origin({
    year: input.year,
    month: input.month - 1, // library uses 0-indexed months
    date: input.day,
    hour: input.hour,
    minute: input.minute,
    latitude: input.latitude,
    longitude: input.longitude,
  });

  const horoscope = new Horoscope({
    origin,
    houseSystem: "placidus",
    zodiac: "tropical",
    // Aspects are computed separately using classical per-planet orbs.
    language: "en",
  });

  const allBodies = [
    ...horoscope.CelestialBodies.all,
    ...horoscope.CelestialPoints.all,
  ];
  const byKey = new Map(allBodies.map((b) => [b.key, b]));

  const bodies: NatalBody[] = BODY_ORDER.filter((k) => byKey.has(k)).map((k) =>
    mapBody(byKey.get(k)!),
  );

  const ascLon = horoscope.Ascendant.ChartPosition.Ecliptic.DecimalDegrees;
  const mcLon = horoscope.Midheaven.ChartPosition.Ecliptic.DecimalDegrees;

  const angles: NatalAngle[] = [
    buildAngle(
      "ascendant",
      ascLon,
      horoscope.Ascendant.Sign.key,
      degreeWithinSign(horoscope.Ascendant.ChartPosition),
    ),
    buildAngle(
      "midheaven",
      mcLon,
      horoscope.Midheaven.Sign.key,
      degreeWithinSign(horoscope.Midheaven.ChartPosition),
    ),
    buildAngle("descendant", ascLon + 180),
    buildAngle("imumcoeli", mcLon + 180),
  ];

  const houses: NatalHouse[] = horoscope.Houses.map((h) => {
    const lon = h.ChartPosition.StartPosition.Ecliptic.DecimalDegrees;
    return {
      number: h.id,
      sign: SIGN_RU[h.Sign.key] ?? h.Sign.label,
      signKey: h.Sign.key,
      signSymbol: SIGN_SYMBOL[h.Sign.key] ?? "",
      longitude: Number(lon.toFixed(4)),
      degreeInSign: formatDegreeInSign(lon),
    };
  });

  const aspects: NatalAspect[] = computeAspects(bodies);

  return {
    bodies,
    angles,
    houses,
    aspects,
    meta: {
      timezone: input.timezone ?? "UTC",
      julianDate: origin.julianDate,
      utc: origin.utcTime.toISOString(),
      latitude: input.latitude,
      longitude: input.longitude,
      houseSystem: "Плацидус",
    },
  };
}

/** Bodies we track for transits (no Chiron, nodes, Lilith for daily forecast). */
const TRANSIT_BODIES = [
  "sun", "moon", "mercury", "venus", "mars",
  "jupiter", "saturn", "uranus", "neptune", "pluto",
];

/** Slow planets stay in aspect longer. */
const PLANET_SPEED: Record<string, number> = {
  sun: 1,
  moon: 2,
  mercury: 2,
  venus: 2,
  mars: 2,
  jupiter: 7,
  saturn: 14,
  uranus: 30,
  neptune: 30,
  pluto: 30,
};

function getHouseForLongitude(longitude: number, houses: NatalHouse[]): number {
  let bestHouse = 1;
  let bestDist = Infinity;
  for (const h of houses) {
    const hStart = h.longitude;
    const hEnd = (h.longitude + 30) % 360; // rough; Placidus houses vary
    let dist = (longitude - hStart + 360) % 360;
    if (dist < bestDist) {
      bestDist = dist;
      bestHouse = h.number;
    }
  }
  return bestHouse;
}

/** Compute transit positions for a given date and compare against natal chart. */
export function computeTransits(
  natalChart: NatalChart,
  dateStr: string,
  latitude: number,
  longitude: number,
  timezone?: string | null,
): TransitResult | null {
  const m = /^\d{4}-(\d{2})-(\d{2})$/.exec(dateStr);
  if (!m) return null;

  const year = Number(dateStr.slice(0, 4));
  const month = Number(m[1]);
  const day = Number(m[2]);

  const origin = new Origin({
    year,
    month: month - 1,
    date: day,
    hour: 12,
    minute: 0,
    latitude,
    longitude,
  });

  const horoscope = new Horoscope({
    origin,
    houseSystem: "placidus",
    zodiac: "tropical",
    language: "en",
  });

  const allBodies = [
    ...horoscope.CelestialBodies.all,
    ...horoscope.CelestialPoints.all,
  ];
  const byKey = new Map(allBodies.map((b) => [b.key, b]));

  const transitBodies: TransitBody[] = TRANSIT_BODIES.filter((k) => byKey.has(k)).map((k) => {
    const b = byKey.get(k)!;
    return {
      key: b.key,
      name: BODY_RU[b.key] ?? b.label,
      symbol: BODY_SYMBOL[b.key] ?? "",
      sign: SIGN_RU[b.Sign.key] ?? b.Sign.label,
      signKey: b.Sign.key,
      signSymbol: SIGN_SYMBOL[b.Sign.key] ?? "",
      longitude: Number(b.ChartPosition.Ecliptic.DecimalDegrees.toFixed(4)),
      degreeInSign: degreeWithinSign(b.ChartPosition),
      house: b.House?.id ?? null,
      retrograde: Boolean(b.isRetrograde),
      speed: (PLANET_SPEED[b.key] ?? 2) > 5 ? "slow" : "fast",
    };
  });

  const natalByKey = new Map(natalChart.bodies.map((b) => [b.key, b]));

  const aspects: TransitAspect[] = [];
  for (const t of transitBodies) {
    for (const natalBody of natalChart.bodies) {
      if (t.key === natalBody.key) continue;
      const natalKey = natalBody.key;
      let sep = Math.abs(t.longitude - natalBody.longitude) % 360;
      if (sep > 180) sep = 360 - sep;
      const allowed = moiety(t.key) + moiety(natalKey);
      let best: { key: string; diff: number } | null = null;
      for (const asp of MAJOR_ASPECTS) {
        const diff = Math.abs(sep - asp.angle);
        if (diff <= allowed && (best === null || diff < best.diff)) {
          best = { key: asp.key, diff };
        }
      }
      if (best) {
        const info = ASPECT_RU[best.key] ?? { label: best.key, symbol: "" };
        aspects.push({
          transitBody: t.name,
          transitBodySymbol: t.symbol,
          transitSign: t.sign,
          transitSignSymbol: t.signSymbol,
          // Дом считается по НАТАЛЬНЫМ куспидам: по какому дому натальной карты
          // идёт транзитная планета — это основа семантической цепочки прогноза.
          transitHouse: getHouseForLongitude(t.longitude, natalChart.houses),
          transitRetrograde: t.retrograde,
          natalBody: natalBody.name,
          natalBodySymbol: natalBody.symbol,
          natalSign: natalBody.sign,
          natalSignSymbol: natalBody.signSymbol,
          natalHouse: natalBody.house,
          type: info.label,
          typeKey: best.key,
          typeSymbol: info.symbol,
          orb: Number(best.diff.toFixed(2)),
          durationDays: PLANET_SPEED[t.key] ?? 2,
        });
      }
    }
  }

  // Tightest aspects first; limit to top 5 for prose synthesis
  aspects.sort((a, z) => a.orb - z.orb);

  return {
    date: dateStr,
    transitBodies,
    aspects: aspects.slice(0, 5),
  };
}
