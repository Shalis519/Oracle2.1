import { useMemo } from "react";
import type {
  NatalBody,
  NatalAngle,
  NatalHouse,
  NatalAspect,
} from "@workspace/api-client-react";

// Variation selector forces text (non-emoji) presentation of astro glyphs.
const VS = "\uFE0E";
const g = (s: string) => (s ? s + VS : s);

const ROMAN = [
  "I",
  "II",
  "III",
  "IV",
  "V",
  "VI",
  "VII",
  "VIII",
  "IX",
  "X",
  "XI",
  "XII",
];
const toRoman = (n: number) => ROMAN[n - 1] ?? String(n);
const degreeLabel = (value: string) => value.split(" ")[0] ?? value;

const SIGN_KEYS = [
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
const SIGN_SECTOR_COLORS = [
  "hsl(0 55% 38%)",
  "hsl(112 45% 32%)",
  "hsl(215 62% 40%)",
  "hsl(188 55% 38%)",
  "hsl(0 55% 38%)",
  "hsl(112 45% 32%)",
  "hsl(215 62% 40%)",
  "hsl(188 55% 38%)",
  "hsl(0 55% 38%)",
  "hsl(112 45% 32%)",
  "hsl(215 62% 40%)",
  "hsl(188 55% 38%)",
];

const SIGN_SYMBOLS: Record<string, string> = {
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

// Aspect line colors: harmonious vs tense vs neutral.
const ASPECT_STYLE: Record<string, { color: string; opacity: number }> = {
  conjunction: { color: "hsl(45 60% 60%)", opacity: 0.7 },
  trine: { color: "hsl(180 55% 55%)", opacity: 0.65 },
  sextile: { color: "hsl(200 65% 60%)", opacity: 0.55 },
  square: { color: "hsl(0 65% 58%)", opacity: 0.6 },
  opposition: { color: "hsl(0 70% 62%)", opacity: 0.65 },
};

interface NatalWheelProps {
  bodies: NatalBody[];
  angles: NatalAngle[];
  houses: NatalHouse[];
  aspects: NatalAspect[];
}

const SIZE = 620;
const C = SIZE / 2;
// Padding around the wheel so angle labels (ASC/DSC/MC/IC) are never clipped.
const PAD = 30;

const R_OUTER = 300;
const R_ZODIAC_IN = 256;
const R_GLYPH_SIGN = 278;
const R_HOUSE_NUM = 238;
const R_PLANET = 206;
const R_ASPECT = 168;
const R_CUSP_LABEL = R_OUTER + 15;

export default function NatalWheel({
  bodies,
  angles,
  houses,
  aspects,
}: NatalWheelProps) {
  const asc = angles.find((a) => a.key === "ascendant");
  const ascLon = asc?.longitude ?? 0;

  // Map an ecliptic longitude to an SVG point. Ascendant sits on the left
  // (9 o'clock) and longitude increases counterclockwise, matching the
  // standard western chart convention.
  const toXY = (r: number, lon: number) => {
    const theta = ((180 + (lon - ascLon)) * Math.PI) / 180;
    return { x: C + r * Math.cos(theta), y: C - r * Math.sin(theta) };
  };

  // Spread planet glyphs so close conjunctions do not overlap, while the
  // pointer tick still marks the true degree on the zodiac ring.
  const placed = useMemo(() => {
    const sorted = [...bodies]
      .map((b) => ({ b, lon: b.longitude }))
      .sort((a, z) => a.lon - z.lon);
    const minSep = 7;
    const adj = sorted.map((s) => s.lon);
    for (let iter = 0; iter < 60; iter++) {
      let moved = false;
      for (let i = 0; i < adj.length; i++) {
        const j = (i + 1) % adj.length;
        let diff = adj[j] - adj[i];
        diff = ((diff % 360) + 360) % 360;
        if (diff < minSep) {
          const push = (minSep - diff) / 2;
          adj[i] = (adj[i] - push + 360) % 360;
          adj[j] = (adj[j] + push) % 360;
          moved = true;
        }
      }
      if (!moved) break;
    }
    return sorted.map((s, i) => ({ ...s, displayLon: adj[i] }));
  }, [bodies, ascLon]);

  const bodyLonByName = useMemo(() => {
    const m = new Map<string, number>();
    bodies.forEach((b) => m.set(b.name, b.longitude));
    return m;
  }, [bodies]);

  const annularSectorPath = (startLon: number, endLon: number) => {
    const outerStart = toXY(R_OUTER, startLon);
    const outerEnd = toXY(R_OUTER, endLon);
    const innerEnd = toXY(R_ZODIAC_IN, endLon);
    const innerStart = toXY(R_ZODIAC_IN, startLon);
    return [
      `M ${outerStart.x} ${outerStart.y}`,
      `A ${R_OUTER} ${R_OUTER} 0 0 0 ${outerEnd.x} ${outerEnd.y}`,
      `L ${innerEnd.x} ${innerEnd.y}`,
      `A ${R_ZODIAC_IN} ${R_ZODIAC_IN} 0 0 1 ${innerStart.x} ${innerStart.y}`,
      "Z",
    ].join(" ");
  };

  return (
    <svg
      viewBox={`${-PAD} ${-PAD} ${SIZE + PAD * 2} ${SIZE + PAD * 2}`}
      className="w-full h-auto max-w-[680px] mx-auto select-none"
      role="img"
      aria-label="Натальная карта"
    >
      {/* base rings */}
      <circle cx={C} cy={C} r={R_OUTER} fill="hsl(222 30% 8%)" stroke="hsl(45 30% 60% / 0.35)" strokeWidth={1.5} />
      <circle cx={C} cy={C} r={R_ZODIAC_IN} fill="hsl(222 25% 11%)" stroke="hsl(45 30% 60% / 0.25)" strokeWidth={1} />
      <circle cx={C} cy={C} r={R_HOUSE_NUM} fill="none" stroke="hsl(45 30% 60% / 0.12)" strokeWidth={1} />
      <circle cx={C} cy={C} r={R_ASPECT} fill="hsl(222 28% 9%)" stroke="hsl(45 30% 60% / 0.18)" strokeWidth={1} />

      {/* zodiac sectors */}
      {SIGN_KEYS.map((key, i) => {
        const start = i * 30;
        const p1 = toXY(R_ZODIAC_IN, start);
        const p2 = toXY(R_OUTER, start);
        const mid = toXY(R_GLYPH_SIGN, start + 15);
        const even = i % 2 === 0;
        return (
          <g key={key}>
            <path
              d={annularSectorPath(start, start + 30)}
              fill={SIGN_SECTOR_COLORS[i]}
              fillOpacity={0.52}
              stroke="none"
            />
            <line x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke="hsl(45 30% 60% / 0.3)" strokeWidth={1} />
            <text
              x={mid.x}
              y={mid.y}
              textAnchor="middle"
              dominantBaseline="central"
              fontSize={22}
              fill={even ? "hsl(45 55% 65%)" : "hsl(260 35% 70%)"}
            >
              {g(SIGN_SYMBOLS[key])}
            </text>
          </g>
        );
      })}

      {/* degree ticks every 5 / 10 degrees on the zodiac inner edge */}
      {Array.from({ length: 72 }).map((_, i) => {
        const lon = i * 5;
        const major = i % 6 === 0;
        const o = toXY(R_ZODIAC_IN, lon);
        const inn = toXY(R_ZODIAC_IN - (major ? 10 : 5), lon);
        return (
          <line
            key={`t${i}`}
            x1={o.x}
            y1={o.y}
            x2={inn.x}
            y2={inn.y}
            stroke="hsl(45 30% 60% / 0.25)"
            strokeWidth={major ? 1 : 0.5}
          />
        );
      })}

      {/* house cusps: radial guides styled like the reference chart */}
      {houses.map((h) => {
        const a = toXY(R_ASPECT, h.longitude);
        const b = toXY(R_CUSP_LABEL - 4, h.longitude);
        const cuspLabel = toXY(R_CUSP_LABEL, h.longitude);
        const isAngular = h.number === 1 || h.number === 4 || h.number === 7 || h.number === 10;
        return (
          <g key={`h${h.number}`}>
            {!isAngular && (
              <>
                <line
                  x1={a.x}
                  y1={a.y}
                  x2={b.x}
                  y2={b.y}
                  stroke="hsl(320 35% 68% / 0.48)"
                  strokeWidth={0.9}
                />
                <text
                  x={cuspLabel.x}
                  y={cuspLabel.y}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fontSize={12}
                  fontWeight={600}
                  fill="hsl(45 42% 68% / 0.95)"
                >
                  {toRoman(h.number)} {degreeLabel(h.degreeInSign)}
                </text>
              </>
            )}
          </g>
        );
      })}

      {/* aspect lines */}
      {aspects.map((asp, i) => {
        const l1 = bodyLonByName.get(asp.body1);
        const l2 = bodyLonByName.get(asp.body2);
        if (l1 === undefined || l2 === undefined) return null;
        const style = ASPECT_STYLE[asp.typeKey] ?? { color: "hsl(45 30% 60%)", opacity: 0.4 };
        const p1 = toXY(R_ASPECT, l1);
        const p2 = toXY(R_ASPECT, l2);
        return (
          <line
            key={`a${i}`}
            x1={p1.x}
            y1={p1.y}
            x2={p2.x}
            y2={p2.y}
            stroke={style.color}
            strokeOpacity={style.opacity}
            strokeWidth={1}
          />
        );
      })}

      {/* angle markers (ASC / DSC / MC / IC) */}
      {angles.map((ang) => {
        const o = toXY(R_OUTER, ang.longitude);
        const inn = toXY(R_ASPECT, ang.longitude);
        const lab = toXY(R_OUTER + 3, ang.longitude);
        const isMain = ang.key === "ascendant" || ang.key === "midheaven";
        const isAsc = ang.key === "ascendant";
        const isDsc = ang.key === "descendant";
        return (
          <g key={ang.key}>
            <line
              x1={inn.x}
              y1={inn.y}
              x2={o.x}
              y2={o.y}
              stroke={isMain ? "hsl(45 65% 68% / 0.7)" : "hsl(45 55% 62% / 0.4)"}
              strokeWidth={isMain ? 1.5 : 1}
            />
            <text
              x={lab.x + (isAsc ? -5 : isDsc ? 5 : 0)}
              y={lab.y}
              textAnchor={isAsc ? "end" : isDsc ? "start" : "middle"}
              dominantBaseline="central"
              fontSize={12}
              fontWeight={700}
              fill={isMain ? "hsl(45 65% 72%)" : "hsl(45 40% 62%)"}
            >
              {ang.abbr} {degreeLabel(ang.degreeInSign)}
            </text>
          </g>
        );
      })}

      {/* planets */}
      {placed.map(({ b, lon, displayLon }) => {
        const gpos = toXY(R_PLANET, displayLon);
        return (
          <g key={b.key}>
            <text
              x={gpos.x}
              y={gpos.y}
              textAnchor="middle"
              dominantBaseline="central"
              fontSize={24}
              fill="hsl(45 55% 78%)"
            >
              {g(b.symbol)}
            </text>
            <text
              x={gpos.x + 14}
              y={gpos.y - 12}
              textAnchor="middle"
              dominantBaseline="central"
              fontSize={10}
              fontWeight={600}
              fill="hsl(45 42% 70% / 0.95)"
            >
              {degreeLabel(b.degreeInSign)}
            </text>
            {b.retrograde && (
              <text
                x={gpos.x + 13}
                y={gpos.y + 16}
                textAnchor="middle"
                dominantBaseline="central"
                fontSize={10}
                fontWeight={700}
                fill="hsl(0 60% 65% / 0.9)"
              >
                R
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}
