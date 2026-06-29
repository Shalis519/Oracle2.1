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

const R_OUTER = 300;
const R_ZODIAC_IN = 256;
const R_GLYPH_SIGN = 278;
const R_HOUSE_RING = 256;
const R_HOUSE_NUM = 238;
const R_PLANET = 206;
const R_TICK_OUT = R_ZODIAC_IN;
const R_ASPECT = 168;

export default function NatalWheel({
  bodies,
  angles,
  houses,
  aspects,
}: NatalWheelProps) {
  const asc = angles.find((a) => a.key === "ascendant");
  const mc = angles.find((a) => a.key === "midheaven");
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

  return (
    <svg
      viewBox={`0 0 ${SIZE} ${SIZE}`}
      className="w-full h-auto max-w-[620px] mx-auto select-none"
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

      {/* house cusps */}
      {houses.map((h) => {
        const a = toXY(R_ASPECT, h.longitude);
        const b = toXY(R_HOUSE_RING, h.longitude);
        const next = houses.find((x) => x.number === (h.number % 12) + 1);
        let midLon = h.longitude + 15;
        if (next) {
          let span = next.longitude - h.longitude;
          span = ((span % 360) + 360) % 360;
          midLon = h.longitude + span / 2;
        }
        const numPos = toXY(R_HOUSE_NUM, midLon);
        const isAngular = h.number === 1 || h.number === 4 || h.number === 7 || h.number === 10;
        return (
          <g key={`h${h.number}`}>
            <line
              x1={a.x}
              y1={a.y}
              x2={b.x}
              y2={b.y}
              stroke={isAngular ? "hsl(45 55% 60% / 0.55)" : "hsl(45 30% 60% / 0.25)"}
              strokeWidth={isAngular ? 1.5 : 0.75}
            />
            <text
              x={numPos.x}
              y={numPos.y}
              textAnchor="middle"
              dominantBaseline="central"
              fontSize={12}
              fill="hsl(164 15% 55%)"
            >
              {toRoman(h.number)}
            </text>
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

      {/* angle markers (ASC / MC) */}
      {[asc, mc].map((ang) =>
        ang ? (
          <g key={ang.key}>
            {(() => {
              const o = toXY(R_OUTER, ang.longitude);
              const inn = toXY(R_ASPECT, ang.longitude);
              const lab = toXY(R_OUTER + 12, ang.longitude);
              return (
                <>
                  <line x1={inn.x} y1={inn.y} x2={o.x} y2={o.y} stroke="hsl(45 60% 65% / 0.5)" strokeWidth={1} strokeDasharray="3 3" />
                  <text x={lab.x} y={lab.y} textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight={700} fill="hsl(45 60% 70%)">
                    {ang.abbr}
                  </text>
                </>
              );
            })()}
          </g>
        ) : null,
      )}

      {/* planets */}
      {placed.map(({ b, lon, displayLon }) => {
        const tickOut = toXY(R_TICK_OUT, lon);
        const tickIn = toXY(R_PLANET + 14, displayLon);
        const gpos = toXY(R_PLANET, displayLon);
        return (
          <g key={b.key}>
            <line x1={tickOut.x} y1={tickOut.y} x2={tickIn.x} y2={tickIn.y} stroke="hsl(45 30% 60% / 0.4)" strokeWidth={0.75} />
            <text
              x={gpos.x}
              y={gpos.y}
              textAnchor="middle"
              dominantBaseline="central"
              fontSize={19}
              fill="hsl(45 55% 78%)"
            >
              {g(b.symbol)}
            </text>
            {b.retrograde && (
              <text
                x={gpos.x + 13}
                y={gpos.y - 9}
                textAnchor="middle"
                dominantBaseline="central"
                fontSize={9}
                fill="hsl(0 60% 65%)"
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
