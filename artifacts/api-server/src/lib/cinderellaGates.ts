import { and, eq, inArray } from "drizzle-orm";
import { db, cinderellaInterpretationsTable } from "@workspace/db";

export type CinderellaMode = "natal" | "transit";

export interface CinderellaBody {
  key: string;
  name: string;
  symbol: string;
  longitude: number;
}

export interface CinderellaGate {
  id: string;
  pairKey: string;
  mode: CinderellaMode;
  transitBody: string | null;
  transitBodySymbol: string | null;
  natalBody: string;
  natalBodySymbol: string;
  aspectType: string;
  aspectKey: string;
  aspectSymbol: string;
  orb: number;
  peakDate: string | null;
  activeFrom: string | null;
  activeTo: string | null;
  interpretation: string;
}

const TARGETS = ["venus", "jupiter", "neptune", "sun", "pluto"] as const;
const TARGET_LABELS: Record<(typeof TARGETS)[number], string> = {
  venus: "Венера",
  jupiter: "Юпитер",
  neptune: "Нептун",
  sun: "Солнце",
  pluto: "Плутон",
};

const ASPECTS = [
  { key: "conjunction", label: "Соединение", symbol: "☌", angle: 0 },
  { key: "trine", label: "Тригон", symbol: "△", angle: 120 },
  { key: "quincunx", label: "Квинконс", symbol: "⚻", angle: 150 },
] as const;

const INTERPRETATIONS: Record<(typeof TARGETS)[number], string> = {
  venus: "Романтика, семейные связи, привлекательность и финансовые возможности через партнёрство.",
  jupiter: "Общественное признание, доверие аудитории, заметность и карьерный рост.",
  neptune: "Долговременная харизма, вдохновение, защищённость и интерес к эзотерике.",
  sun: "Харизма, популярность, способность быть замеченным и влиять на людей.",
  pluto: "Сильная карьерная реализация, влияние, власть и финансовый потенциал.",
};

function angularDistance(a: number, b: number): number {
  const raw = Math.abs(a - b) % 360;
  return raw > 180 ? 360 - raw : raw;
}

function findAspect(a: number, b: number, maxOrb: number): (typeof ASPECTS)[number] & { orb: number } | null {
  const separation = angularDistance(a, b);
  let best: ((typeof ASPECTS)[number] & { orb: number }) | null = null;
  for (const aspect of ASPECTS) {
    const orb = Math.abs(separation - aspect.angle);
    if (orb <= maxOrb && (!best || orb < best.orb)) best = { ...aspect, orb };
  }
  return best;
}

function dateShift(dateStr: string, days: number): string {
  const date = new Date(`${dateStr}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function createGate(
  mode: CinderellaMode,
  transitBody: CinderellaBody | null,
  natalBody: CinderellaBody,
  aspect: (typeof ASPECTS)[number] & { orb: number },
  peakDate: string | null,
): CinderellaGate {
  const targetKey = (transitBody?.key === "chiron" ? natalBody.key : transitBody?.key ?? natalBody.key) as (typeof TARGETS)[number];
  const transitLabel = transitBody?.name ?? null;
  const natalLabel = natalBody.name;
  return {
    id: `${mode}-${transitBody?.key ?? "natal"}-${natalBody.key}-${aspect.key}`,
    pairKey: transitBody?.key === "chiron" ? `chiron-${natalBody.key}` : `chiron-${transitBody?.key ?? natalBody.key}`,
    mode,
    transitBody: transitLabel,
    transitBodySymbol: transitBody?.symbol ?? null,
    natalBody: natalLabel,
    natalBodySymbol: natalBody.symbol,
    aspectType: aspect.label,
    aspectKey: aspect.key,
    aspectSymbol: aspect.symbol,
    orb: Number(aspect.orb.toFixed(2)),
    peakDate,
    activeFrom: peakDate ? dateShift(peakDate, -3) : null,
    activeTo: peakDate ? dateShift(peakDate, 3) : null,
    interpretation: INTERPRETATIONS[targetKey] ?? "В разработке",
  };
}

export function detectNatalCinderellaGates(bodies: CinderellaBody[]): CinderellaGate[] {
  const chiron = bodies.find((body) => body.key === "chiron");
  if (!chiron) return [];
  const result: CinderellaGate[] = [];
  for (const key of TARGETS) {
    const target = bodies.find((body) => body.key === key);
    if (!target) continue;
    const aspect = findAspect(chiron.longitude, target.longitude, 3);
    if (aspect) result.push(createGate("natal", chiron, target, aspect, null));
  }
  return result.sort((a, b) => a.orb - b.orb);
}

export function detectTransitCinderellaGates(
  natalBodies: CinderellaBody[],
  today: string,
  getTransitBodies: (date: string) => CinderellaBody[],
): CinderellaGate[] {
  const natalChiron = natalBodies.find((body) => body.key === "chiron");
  if (!natalChiron) return [];
  const result: CinderellaGate[] = [];
  const transitDates = Array.from({ length: 7 }, (_, index) => dateShift(today, index - 3));

  for (const key of TARGETS) {
    const natalTarget = natalBodies.find((body) => body.key === key);
    if (!natalTarget) continue;
    let best: { date: string; transitBody: CinderellaBody; natalBody: CinderellaBody; aspect: (typeof ASPECTS)[number] & { orb: number } } | null = null;
    for (const date of transitDates) {
      const transitBodies = getTransitBodies(date);
      const transitChiron = transitBodies.find((body) => body.key === "chiron");
      const transitTarget = transitBodies.find((body) => body.key === key);
      const options = [
        transitChiron && findAspect(transitChiron.longitude, natalTarget.longitude, 1)
          ? { transitBody: transitChiron, natalBody: natalTarget, aspect: findAspect(transitChiron.longitude, natalTarget.longitude, 1)! }
          : null,
        transitTarget && findAspect(transitTarget.longitude, natalChiron.longitude, 1)
          ? { transitBody: transitTarget, natalBody: natalChiron, aspect: findAspect(transitTarget.longitude, natalChiron.longitude, 1)! }
          : null,
      ].filter(Boolean) as { transitBody: CinderellaBody; natalBody: CinderellaBody; aspect: (typeof ASPECTS)[number] & { orb: number } }[];
      for (const option of options) {
        if (!best || option.aspect.orb < best.aspect.orb) best = { date, ...option };
      }
    }
    if (best) result.push(createGate("transit", best.transitBody, best.natalBody, best.aspect, best.date));
  }
  return result.filter((gate) => gate.activeFrom! <= today && today <= gate.activeTo!).sort((a, b) => a.orb - b.orb);
}

export async function hydrateCinderellaGates(gates: CinderellaGate[]): Promise<CinderellaGate[]> {
  if (gates.length === 0) return gates;
  const pairs = [...new Set(gates.map((gate) => gate.pairKey))];
  const rows = await db
    .select()
    .from(cinderellaInterpretationsTable)
    .where(and(
      eq(cinderellaInterpretationsTable.isActive, true),
      inArray(cinderellaInterpretationsTable.pairKey, pairs),
    ));
  const byKey = new Map(rows.map((row) => [`${row.pairKey}:${row.mode}:${row.aspectKey}`, row]));
  return gates.map((gate) => {
    const exact = byKey.get(`${gate.pairKey}:${gate.mode}:${gate.aspectKey}`)
      ?? byKey.get(`${gate.pairKey}:${gate.mode}:any`);
    return exact ? { ...gate, interpretation: exact.text } : { ...gate, interpretation: "В разработке" };
  });
}

export function formatCinderellaTransitText(gate: CinderellaGate): string {
  const target = cinderellaTargetLabel(gate.pairKey.replace(/^chiron-/, ""));
  const transitDescription = gate.transitBody === "Хирон"
    ? "транзитный Хирон - натальная планета"
    : `транзитная ${gate.transitBody ?? "планета"} - натальный Хирон`;
  return `Хирон - ${target}, ${gate.aspectType.toLowerCase()}, орбис ${gate.orb.toFixed(2)}° (${transitDescription})`;
}

export function cinderellaTargetLabel(key: string): string {
  return TARGET_LABELS[key as (typeof TARGETS)[number]] ?? key;
}
