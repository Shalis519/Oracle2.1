import { createHash } from "node:crypto";
import { and, eq, inArray } from "drizzle-orm";
import { db, cinderellaInterpretationsTable, synastryInterpretationsTable, synastryHouseInterpretationsTable } from "@workspace/db";
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
const GENERAL_ASPECTS = [
  { key: "conjunction", label: "Соединение", symbol: "☌", angle: 0, orb: 3.72 },
  { key: "sextile", label: "Секстиль", symbol: "⚹", angle: 60, orb: 0.61 },
  { key: "square", label: "Квадрат", symbol: "□", angle: 90, orb: 0.93 },
  { key: "trine", label: "Тригон", symbol: "△", angle: 120, orb: 1.23 },
  { key: "opposition", label: "Оппозиция", symbol: "☍", angle: 180, orb: 2.85 },
] as const;
const GENERAL_BODY_KEYS = ["sun", "moon", "mercury", "venus", "mars", "jupiter", "saturn", "uranus", "neptune", "pluto", "chiron", "lilith"] as const;
const HOUSE_BODY_KEYS = ["sun", "moon", "mercury", "venus", "mars", "jupiter", "saturn"] as const;
const OUTER_PLANETS = new Set(["uranus", "neptune", "pluto"]);
const SOCIAL_PLANETS = new Set(["jupiter", "saturn"]);

function isExcludedGeneralAspect(sourceBody: string, targetBody: string) {
  const bothOuter = OUTER_PLANETS.has(sourceBody) && OUTER_PLANETS.has(targetBody);
  const socialOuter = (SOCIAL_PLANETS.has(sourceBody) && OUTER_PLANETS.has(targetBody))
    || (SOCIAL_PLANETS.has(targetBody) && OUTER_PLANETS.has(sourceBody));
  return bothOuter || socialOuter;
}
const GENERAL_BODY_LABELS: Record<string, string> = {
  sun: "Солнце", moon: "Луна", mercury: "Меркурий", venus: "Венера", mars: "Марс", jupiter: "Юпитер",
  saturn: "Сатурн", uranus: "Уран", neptune: "Нептун", pluto: "Плутон", chiron: "Хирон", lilith: "Лилит",
};
const ASPECTS = [
  { key: "conjunction", label: "Соединение", symbol: "☌", angle: 0 },
  { key: "trine", label: "Тригон", symbol: "△", angle: 120 },
  { key: "quincunx", label: "Квинконс", symbol: "⚻", angle: 150 },
] as const;

type SynastryPerson = "user" | "contact";

export interface SynastryAspect {
  sourcePerson: SynastryPerson;
  sourceBody: string;
  sourceLabel: string;
  targetPerson: SynastryPerson;
  targetBody: string;
  targetLabel: string;
  aspectKey: string;
  aspectType: string;
  aspectSymbol: string;
  orb: number;
  directionKey: string;
  categoryKey: string;
  interpretation: string;
}

export interface SynastryTheme {
  key: string;
  label: string;
  aspects: SynastryAspect[];
}

export interface SynastrySemanticBlock {
  key: string;
  title: string;
  summary: string;
  aspect: SynastryAspect;
  relatedHousePlacements: SynastryHousePlacement[];
}

export interface SynastryHousePlacement {
  sourcePerson: SynastryPerson;
  sourceBody: string;
  sourceLabel: string;
  targetPerson: SynastryPerson;
  targetLabel: string;
  houseNumber: number;
  directionKey: string;
  interpretation: string;
  isMutual?: boolean;
}

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
  aspects: SynastryAspect[];
  housePlacements: SynastryHousePlacement[];
  themes: SynastryTheme[];
  semanticBlocks: SynastrySemanticBlock[];
  warnings: string[];
}

function angularDistance(a: number, b: number) {
  const raw = Math.abs(a - b) % 360;
  return raw > 180 ? 360 - raw : raw;
}

function findCinderellaAspect(a: number, b: number, maxOrb = 3) {
  const distance = angularDistance(a, b);
  let best: (typeof ASPECTS)[number] & { orb: number } | null = null;
  for (const aspect of ASPECTS) {
    const orb = Math.abs(distance - aspect.angle);
    if (orb <= maxOrb && (!best || orb < best.orb)) best = { ...aspect, orb };
  }
  return best;
}

function findGeneralAspect(a: number, b: number) {
  const distance = angularDistance(a, b);
  let best: (typeof GENERAL_ASPECTS)[number] & { orbValue: number } | null = null;
  for (const aspect of GENERAL_ASPECTS) {
    const orbValue = Math.abs(distance - aspect.angle);
    if (orbValue <= aspect.orb && (!best || orbValue < best.orbValue)) best = { ...aspect, orbValue };
  }
  return best;
}

function getBody(chart: NatalChart, key: string) {
  return chart.bodies.find((body) => body.key === key);
}

function getHouseForLongitude(longitude: number, houses: NatalChart["houses"]): number {
  const ordered = [...houses].sort((a, b) => a.number - b.number);
  for (let index = 0; index < ordered.length; index += 1) {
    const current = ordered[index];
    const next = ordered[(index + 1) % ordered.length];
    const span = (next.longitude - current.longitude + 360) % 360;
    const distance = (longitude - current.longitude + 360) % 360;
    if (distance < span || (index === ordered.length - 1 && distance === span)) return current.number;
  }
  return 1;
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

function normalizeGender(value: string | null | undefined) {
  const normalized = (value ?? "").toLowerCase();
  if (["male", "м", "муж", "мужской"].includes(normalized)) return "male";
  if (["female", "ж", "жен", "женский"].includes(normalized)) return "female";
  return null;
}

function directionFor(sourcePerson: SynastryPerson, userGender?: string | null, contactGender?: string | null) {
  const user = normalizeGender(userGender);
  const contact = normalizeGender(contactGender);
  if (!user || !contact || user === contact) return "neutral";
  const sourceGender = sourcePerson === "user" ? user : contact;
  return sourceGender === "male" ? "male-to-female" : "female-to-male";
}

function themeLabel(key: string) {
  const labels: Record<string, string> = {
    sensuality: "Чувственность и притяжение", conflict: "Конфликты и напряжение", emotions: "Эмоциональная связь",
    communication: "Общение и понимание", support: "Поддержка и развитие", general: "Общая динамика",
  };
  return labels[key] ?? key;
}

const HOUSE_THEME_LABELS: Record<number, string> = {
  1: "самовыражение и личную инициативу", 2: "ресурсы и чувство ценности", 3: "общение и ближайшее окружение",
  4: "дом и эмоциональную опору", 5: "творчество, романтику и удовольствие", 6: "повседневные обязанности и рабочий ритм",
  7: "партнёрство и ожидания от отношений", 8: "доверие, общие ресурсы и глубокие перемены",
  9: "мировоззрение, обучение и расширение горизонтов", 10: "цели, статус и профессиональную реализацию",
  11: "дружбу, общие планы и будущее", 12: "скрытые переживания и внутренние ресурсы",
};

function semanticTitle(aspect: SynastryAspect) {
  const pair = new Set([aspect.sourceBody, aspect.targetBody]);
  if (pair.has("jupiter") && pair.has("sun") && aspect.aspectKey === "opposition") return "Разные взгляды на путь и самореализацию";
  if (pair.has("sun") && pair.has("saturn") && ["square", "opposition"].includes(aspect.aspectKey)) return "Самовыражение и требования ответственности";
  if (pair.has("mars") && pair.has("uranus")) return "Импульсивность и потребность в свободе";
  if (pair.has("mercury") && pair.has("uranus")) return "Неожиданность в общении и мышлении";
  if (pair.has("jupiter") && pair.has("lilith")) return "Убеждения и независимое самовыражение";
  if (aspect.sourceBody === "jupiter" && aspect.targetBody === "jupiter") return "Общие взгляды и планы";
  if (aspect.sourceBody === "saturn" && aspect.targetBody === "saturn") return "Сходное чувство ответственности";
  if (aspect.categoryKey === "conflict") return "Различия в целях и жизненных установках";
  if (aspect.categoryKey === "sensuality") return "Притяжение и различия в желаниях";
  if (aspect.categoryKey === "communication") return "Общение и обмен идеями";
  if (aspect.categoryKey === "emotions") return "Эмоциональная близость и чувствительность";
  if (aspect.categoryKey === "support") return "Общие ориентиры и взаимная поддержка";
  return "Взаимодействие планет и жизненных тем";
}

function normalizeFormalAddress(text: string) {
  return text.replace(/\bвы\b/gi, "Вы").replace(/\bвам\b/gi, "Вам").replace(/\bвас\b/gi, "Вас");
}

function semanticSummary(aspect: SynastryAspect, placements: SynastryHousePlacement[]) {
  const direction = aspect.aspectKey === "trine" || aspect.aspectKey === "sextile" || aspect.aspectKey === "conjunction"
    ? "может помогать вам легче раскрывать потенциал друг друга"
    : "может создавать различия во взглядах и требовать осознанного баланса";
  const houseNumbers = [...new Set(placements.map((placement) => placement.houseNumber))].sort((a, b) => a - b);
  const houseThemes = houseNumbers.map((number) => HOUSE_THEME_LABELS[number]).filter(Boolean);
  const houseContext = houseThemes.length > 0
    ? ` Эта тема затрагивает ${houseThemes.join(", ")}.`
    : "";
  const sourcePlanet = GENERAL_BODY_LABELS[aspect.sourceBody] ?? aspect.sourceBody;
  const targetPlanet = GENERAL_BODY_LABELS[aspect.targetBody] ?? aspect.targetBody;
  const aspectMeaning = aspect.interpretation.trim() && aspect.interpretation.trim() !== "В разработке"
    ? normalizeFormalAddress(aspect.interpretation.trim())
    : `${sourcePlanet} и ${targetPlanet} образуют аспект ${aspect.aspectType.toLowerCase()}. Эта связь ${direction}.`;
  return `${aspectMeaning}${houseContext}`;
}

function fallbackCategory(sourceBody: string, targetBody: string, aspectKey: string) {
  const bodies = new Set([sourceBody, targetBody]);
  if (bodies.has("venus") || bodies.has("mars") || bodies.has("pluto")) return "sensuality";
  if (["square", "opposition"].includes(aspectKey) && (bodies.has("saturn") || bodies.has("uranus") || bodies.has("mars"))) return "conflict";
  if (bodies.has("moon")) return "emotions";
  if (bodies.has("mercury")) return "communication";
  if (bodies.has("jupiter") || bodies.has("sun")) return "support";
  return "general";
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
  userGender?: string | null;
  contactGender?: string | null;
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
      const aspect = findCinderellaAspect(direction.chiron.longitude, direction.target.longitude);
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

  const [interpretationRows, houseInterpretationRows] = await Promise.all([
    db.select().from(synastryInterpretationsTable).where(eq(synastryInterpretationsTable.isActive, true)),
    db.select().from(synastryHouseInterpretationsTable).where(eq(synastryHouseInterpretationsTable.isActive, true)),
  ]);
  const interpretationMap = new Map(interpretationRows.map((row) => [`${row.sourceBody}:${row.targetBody}:${row.aspectKey}:${row.directionKey}`, row]));
  const houseInterpretationMap = new Map(houseInterpretationRows.map((row) => [`${row.planetBody}:${row.houseNumber}:${row.directionKey}`, row]));
  const aspects: SynastryAspect[] = [];
  const userBodies = userChart.bodies.filter((body) => (GENERAL_BODY_KEYS as readonly string[]).includes(body.key));
  const contactBodies = contactChart.bodies.filter((body) => (GENERAL_BODY_KEYS as readonly string[]).includes(body.key));
  for (const source of userBodies) {
    for (const target of contactBodies) {
      const found = findGeneralAspect(source.longitude, target.longitude);
      if (!found || isExcludedGeneralAspect(source.key, target.key)) continue;
      const directionKey = directionFor("user", params.userGender, params.contactGender);
      const row = interpretationMap.get(`${source.key}:${target.key}:${found.key}:${directionKey}`)
        ?? interpretationMap.get(`${source.key}:${target.key}:${found.key}:neutral`);
      const categoryKey = row?.categoryKey ?? fallbackCategory(source.key, target.key, found.key);
      aspects.push({ sourcePerson: "user", sourceBody: source.key, sourceLabel: params.userLabel, targetPerson: "contact", targetBody: target.key, targetLabel: params.contactLabel, aspectKey: found.key, aspectType: found.label, aspectSymbol: found.symbol, orb: Number(found.orbValue.toFixed(2)), directionKey, categoryKey, interpretation: row?.text?.trim() || "В разработке" });
    }
  }
  const housePlacements: SynastryHousePlacement[] = [];
  const userHouseBodies = userChart.bodies.filter((body) => (HOUSE_BODY_KEYS as readonly string[]).includes(body.key));
  const contactHouseBodies = contactChart.bodies.filter((body) => (HOUSE_BODY_KEYS as readonly string[]).includes(body.key));
  const rawHousePlacements: SynastryHousePlacement[] = [];
  for (const source of userHouseBodies) {
    const houseNumber = getHouseForLongitude(source.longitude, contactChart.houses);
    const directionKey = directionFor("user", params.userGender, params.contactGender);
    const row = houseInterpretationMap.get(`${source.key}:${houseNumber}:${directionKey}`)
      ?? houseInterpretationMap.get(`${source.key}:${houseNumber}:neutral`);
    rawHousePlacements.push({ sourcePerson: "user", sourceBody: source.key, sourceLabel: params.userLabel, targetPerson: "contact", targetLabel: params.contactLabel, houseNumber, directionKey, interpretation: row?.text?.trim() || "В разработке" });
  }
  for (const source of contactHouseBodies) {
    const houseNumber = getHouseForLongitude(source.longitude, userChart.houses);
    const directionKey = directionFor("contact", params.userGender, params.contactGender);
    const row = houseInterpretationMap.get(`${source.key}:${houseNumber}:${directionKey}`)
      ?? houseInterpretationMap.get(`${source.key}:${houseNumber}:neutral`);
    rawHousePlacements.push({ sourcePerson: "contact", sourceBody: source.key, sourceLabel: params.contactLabel, targetPerson: "user", targetLabel: params.userLabel, houseNumber, directionKey, interpretation: row?.text?.trim() || "В разработке" });
  }
  const consumedHousePlacements = new Set<SynastryHousePlacement>();
  for (const placement of rawHousePlacements) {
    if (consumedHousePlacements.has(placement)) continue;
    const mirror = rawHousePlacements.find((candidate) => candidate !== placement && candidate.sourcePerson !== placement.sourcePerson && candidate.sourceBody === placement.sourceBody && candidate.houseNumber === placement.houseNumber);
    if (mirror) {
      const mutualRow = houseInterpretationMap.get(`${placement.sourceBody}:${placement.houseNumber}:mutual`);
      if (mutualRow?.text?.trim() && mutualRow.text.trim() !== "В разработке") {
        housePlacements.push({ ...placement, interpretation: mutualRow.text.trim(), directionKey: "mutual", isMutual: true });
        consumedHousePlacements.add(placement);
        consumedHousePlacements.add(mirror);
        continue;
      }
    }
    housePlacements.push(placement);
    consumedHousePlacements.add(placement);
  }

  const grouped = new Map<string, SynastryAspect[]>();
  for (const aspect of aspects) grouped.set(aspect.categoryKey, [...(grouped.get(aspect.categoryKey) ?? []), aspect]);
  const themes = [...grouped.entries()]
    .filter(([, items]) => items.length >= 3)
    .map(([key, items]) => ({ key, label: themeLabel(key), aspects: items.sort((a, b) => a.orb - b.orb) }));

  const semanticBlocks: SynastrySemanticBlock[] = aspects
    .map((aspect) => {
      const relatedHousePlacements = housePlacements.filter((placement) => [aspect.sourceBody, aspect.targetBody].includes(placement.sourceBody));
      return {
        key: `${aspect.sourceBody}-${aspect.targetBody}-${aspect.aspectKey}`,
        title: semanticTitle(aspect),
        summary: semanticSummary(aspect, relatedHousePlacements),
        aspect,
        relatedHousePlacements,
      };
    })
    .filter((block) => block.aspect.interpretation !== "В разработке" || block.relatedHousePlacements.some((placement) => placement.interpretation !== "В разработке"));

  const hash = inputHash(input);
  return {
    version: 1,
    status: "ready",
    calculatedAt: new Date().toISOString(),
    inputHash: hash,
    summary: gates.length ? `Найдено связей Врат Золушки: ${gates.length}.` : "Значимые Врата Золушки не найдены.",
    cinderellaGates: gates.sort((a, b) => a.orb - b.orb),
    aspects: aspects.sort((a, b) => a.orb - b.orb),
    housePlacements,
    themes,
    semanticBlocks,
    warnings: [],
  };
}
