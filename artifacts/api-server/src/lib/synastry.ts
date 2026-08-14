import { createHash } from "node:crypto";
import { and, eq, inArray } from "drizzle-orm";
import { db, cinderellaInterpretationsTable } from "@workspace/db";
import { computeNatalChart, type NatalChart, type NatalChartInput } from "./astrology";
import { searchCities } from "./cities";

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

type SynastryPerson = "user" | "contact";

export interface SynastryGate {
  pairKey: string;
  aspectKey: string;
  aspectType: string;
  aspectSymbol: string;
  orb: number;
  sourcePerson: SynastryPerson;
  sourceLabel: string;
  targetPerson: SynastryPerson;
  targetLabel: string;
  interpretation: string;
}

export interface SynastryResult {
  version: 1;
  status: "ready";
  calculatedAt: string;
  inputHash: string;
  summary: string;
  cinderellaGates: SynastryGate[];
  aspects: unknown[];
  warnings: string[];
}

function angularDistance(a: number, b: number) {
  const raw = Math.abs(a - b) % 360;
  return raw > 180 ? 360 - raw : raw;
}

function findAspect(a: number, b: number, maxOrb = 3) {
  const distance = angularDistance(a, b);
  let best: (typeof ASPECTS)[number] & { orb: number } | null = null;
  for (const aspect of ASPECTS) {
    const orb = Math.abs(distance - aspect.angle);
    if (orb <= maxOrb && (!best || orb < best.orb)) best = { ...aspect, orb };
  }
  return best;
}

function getBody(chart: NatalChart, key: string) {
  return chart.bodies.find((body) => body.key === key);
}

function makeInput(date: string, time: string, latitude: number, longitude: number, timezone?: string | null): NatalChartInput {
  const dateMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  const timeMatch = /^(\d{2}):(\d{2})/.exec(time);
  if (!dateMatch || !timeMatch) throw new Error("Некорректные дата или время рождения");
  return {
    year: Number(dateMatch[1]),
    month: Number(dateMatch[2]),
    day: Number(dateMatch[3]),
    hour: Number(timeMatch[1]),
    minute: Number(timeMatch[2]),
    latitude,
    longitude,
    timezone,
  };
}

function inputHash(input: unknown) {
  return createHash("sha256").update(JSON.stringify(input)).digest("hex");
}

export function resolveContactBirthLocation(place: string | null | undefined) {
  const city = place ? searchCities(place, 1)[0] : undefined;
  return city ? { latitude: city.lat, longitude: city.lng, timezone: city.timezone, name: city.name } : null;
}

export async function calculateSynastry(params: {
  userInput: NatalChartInput;
  contactInput: NatalChartInput;
  userLabel: string;
  contactLabel: string;
}) : Promise<SynastryResult> {
  const input = { user: params.userInput, contact: params.contactInput };
  const userChart = computeNatalChart(params.userInput);
  const contactChart = computeNatalChart(params.contactInput);
  const pairs = TARGETS.map((targetKey) => ({ targetKey, label: TARGET_LABELS[targetKey] }));
  const pairKeys = pairs.map(({ targetKey }) => `chiron-${targetKey}`);
  const interpretations = await db.select().from(cinderellaInterpretationsTable).where(and(
    eq(cinderellaInterpretationsTable.mode, "synastry"),
    eq(cinderellaInterpretationsTable.isActive, true),
    inArray(cinderellaInterpretationsTable.pairKey, pairKeys),
  ));
  const interpretationByPair = new Map(interpretations.map((row) => [`${row.pairKey}:${row.aspectKey}`, row.text]));
  const gates: SynastryGate[] = [];
  const userChiron = getBody(userChart, "chiron");
  const contactChiron = getBody(contactChart, "chiron");
  if (!userChiron || !contactChiron) throw new Error("В карте отсутствует Хирон");

  for (const { targetKey, label } of pairs) {
    const userTarget = getBody(userChart, targetKey);
    const contactTarget = getBody(contactChart, targetKey);
    if (!userTarget || !contactTarget) continue;
    const directions = [
      { chiron: userChiron, target: contactTarget, sourcePerson: "user" as const, sourceLabel: params.userLabel, targetPerson: "contact" as const, targetLabel: params.contactLabel },
      { chiron: contactChiron, target: userTarget, sourcePerson: "contact" as const, sourceLabel: params.contactLabel, targetPerson: "user" as const, targetLabel: params.userLabel },
    ];
    for (const direction of directions) {
      const aspect = findAspect(direction.chiron.longitude, direction.target.longitude);
      if (!aspect) continue;
      const pairKey = `chiron-${targetKey}`;
      const interpretation = interpretationByPair.get(`${pairKey}:${aspect.key}`)
        ?? interpretationByPair.get(`${pairKey}:any`)
        ?? "В разработке";
      gates.push({
        pairKey,
        aspectKey: aspect.key,
        aspectType: aspect.label,
        aspectSymbol: aspect.symbol,
        orb: Number(aspect.orb.toFixed(2)),
        sourcePerson: direction.sourcePerson,
        sourceLabel: direction.sourceLabel,
        targetPerson: direction.targetPerson,
        targetLabel: direction.targetLabel,
        interpretation,
      });
    }
  }

  const hash = inputHash(input);
  return {
    version: 1,
    status: "ready",
    calculatedAt: new Date().toISOString(),
    inputHash: hash,
    summary: gates.length ? `Найдено связей Врат Золушки: ${gates.length}.` : "Значимые Врата Золушки не найдены.",
    cinderellaGates: gates.sort((a, b) => a.orb - b.orb),
    aspects: [],
    warnings: [],
  };
}
