import { computeNatalChart, computeTransits, type NatalChart, type NatalChartInput, type TransitResult } from "./astrology";
import { computeSecondaryProgressions, computeFastProgressions, computeSolarArcDirections, type ProgressionAspect, type ProgressionResult } from "./progressions";
import { buildStrictNatalMarriageProfile, type MarriageGender, type StrictNatalMarriageProfile } from "./shestopalovMarriageNatal.js";

export const MARRIAGE_MIN_AGE = 15;
export const MARRIAGE_MAX_AGE = 79;

export type PredictiveFormulaKey = "marriage";

export type MarriageIndicator = {
  id: string;
  kind: "natal" | "secondary_progression" | "fast_progression" | "solar_arc" | "transit" | "retrograde_support";
  label: string;
  date?: string;
  age?: number;
  houses: number[];
  method?: string;
  progressionMethod?: "secondary" | "fast" | "solar_arc";
  formula?: "V + VII" | "V + X" | "VII + X";
  sourceRole?: string;
  targetRole?: string;
  sourceBodyKey?: string;
  targetBodyKey?: string;
  eventKey?: string;
  applying?: boolean | null;
  phase?: "applying" | "exact" | "separating";
  orb?: number;
};

export type NatalMarriageHouse = {
  number: 5 | 7 | 10;
  sign: string;
  signKey: string;
  rulers: string[];
  rulerKeys: string[];
  planets: string[];
};

export type NatalMarriageProfile = {
  houses: NatalMarriageHouse[];
  formulas: string[];
  connections: MarriageIndicator[];
};

export type NatalMarriageAspect = {
  body1: string;
  body2: string;
  type: string;
  typeKey: string;
  orb: number;
  quality: "harmonious" | "tense" | "neutral";
};

export type NatalMarriageCharacter = {
  participantNames: string[];
  harmoniousCount: number;
  tenseCount: number;
  neutralCount: number;
  aspects: NatalMarriageAspect[];
  summary: string;
};

export type NatalMarriageCycle = {
  loveFormulaStatus: "confirmed" | "not_confirmed";
  loveFormulas: string[];
  officialMarriageStatus: "confirmed" | "not_confirmed";
  officialMarriageFormula: "VII + X";
  connectionCount: number;
  officialConnectionCount: number;
  celibacyAssessment: "not_established";
  celibacyNote: string;
  summary: string;
};

export type MarriageWindow = {
  dateFrom: string;
  dateTo: string;
  ageFrom: number;
  ageTo: number;
  confirmations: number;
  strength: "strong" | "moderate";
  indicators: MarriageIndicator[];
};

export type MarriageFormulaResult = {
  formula: PredictiveFormulaKey;
  formulaLabel: string;
  searchFrom: string;
  searchTo: string;
  ageFrom: number;
  ageTo: number;
  natalBasis: MarriageIndicator[];
  natalProfile: NatalMarriageProfile;
  natalCharacter: NatalMarriageCharacter;
  natalCycle: NatalMarriageCycle;
  strictNatalProfile: StrictNatalMarriageProfile;
  windows: MarriageWindow[];
  methodology: {
    houseSystem: "Placidus";
    progression: "day-for-a-year";
    minConfirmations: 3;
    retrogradeProgressivePlanets: "flagged";
  };
};

const RULERS: Record<string, string[]> = {
  aries: ["mars"],
  taurus: ["venus"],
  gemini: ["mercury"],
  cancer: ["moon"],
  leo: ["sun"],
  virgo: ["mercury"],
  libra: ["venus"],
  scorpio: ["mars", "pluto"],
  sagittarius: ["jupiter"],
  capricorn: ["saturn"],
  aquarius: ["saturn", "uranus"],
  pisces: ["jupiter", "neptune"],
};

function dateAtAge(input: NatalChartInput, age: number): Date {
  const birth = new Date(Date.UTC(input.year, input.month - 1, input.day, input.hour, input.minute, input.second ?? 0));
  const target = new Date(birth);
  target.setUTCFullYear(target.getUTCFullYear() + age);
  return target;
}

function isoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * 86400000);
}

function housesRuledBy(chart: NatalChart, bodyKey: string): number[] {
  const houses: number[] = [];
  for (const house of chart.houses) {
    if ((RULERS[house.signKey] ?? []).includes(bodyKey)) houses.push(house.number);
  }
  return houses;
}

function uniqueNumbers(values: number[]): number[] {
  return [...new Set(values)].sort((a, b) => a - b);
}

function natalMarriageProfile(chart: NatalChart): NatalMarriageProfile {
  const tracked = new Set(["venus", "mars", "pluto", "sun", "moon", "jupiter", "saturn", "uranus", "neptune"]);
  const houses = ([5, 7, 10] as const).map((number) => {
    const house = chart.houses.find((item) => item.number === number);
    const rulerKeys = house ? RULERS[house.signKey] ?? [] : [];
    return {
      number,
      sign: house?.sign ?? "не определён",
      signKey: house?.signKey ?? "",
      rulers: rulerKeys.map((key) => chart.bodies.find((body) => body.key === key)?.name ?? key),
      rulerKeys,
      planets: chart.bodies.filter((body) => body.house === number && tracked.has(body.key)).map((body) => body.name),
    };
  });

  const connections: MarriageIndicator[] = [];
  const formulas = new Set<string>();
  const bodyHouses = new Map(chart.bodies.map((body) => [body.key, body.house]));
  for (const bodyKey of tracked) {
    const ruled = housesRuledBy(chart, bodyKey);
    const placed = bodyHouses.get(bodyKey);
    const connected = uniqueNumbers([...ruled, ...(placed ? [placed] : [])]);
    const marriageHouses = connected.filter((house) => [5, 7, 10].includes(house));
    if (marriageHouses.length < 2) continue;

    const hasV = marriageHouses.includes(5);
    const hasVII = marriageHouses.includes(7);
    const hasX = marriageHouses.includes(10);
    const formula = hasVII && hasX ? "VII + X" : hasV && hasVII ? "V + VII" : hasV && hasX ? "V + X" : null;
    if (!formula) continue;
    formulas.add(formula);
    const bodyName = chart.bodies.find((body) => body.key === bodyKey)?.name ?? bodyKey;
    connections.push({
      id: `natal-${bodyKey}-${formula}`,
      kind: "natal",
      label: `${bodyName} связан с формулой ${formula}`,
      houses: marriageHouses,
      method: "натальная карта",
    });
  }

  return { houses, formulas: [...formulas], connections };
}

function buildNatalMarriageCharacter(chart: NatalChart, profile: NatalMarriageProfile): NatalMarriageCharacter {
  const participantKeys = new Set<string>();
  for (const connection of profile.connections) {
    const match = chart.bodies.find((body) => connection.label.startsWith(body.name));
    if (match) participantKeys.add(match.key);
  }
  for (const key of ["mars", "venus", "pluto"]) {
    const body = chart.bodies.find((item) => item.key === key);
    if (body && (body.house === 5 || body.house === 7 || body.house === 10 || housesRuledBy(chart, key).some((house) => [5, 7, 10].includes(house)))) participantKeys.add(key);
  }

  const participantNames = chart.bodies.filter((body) => participantKeys.has(body.key)).map((body) => body.name);
  const aspects = chart.aspects
    .filter((aspect) => participantNames.includes(aspect.body1) && participantNames.includes(aspect.body2))
    .map((aspect) => ({
      body1: aspect.body1,
      body2: aspect.body2,
      type: aspect.type,
      typeKey: aspect.typeKey,
      orb: aspect.orb,
      quality: ["trine", "sextile"].includes(aspect.typeKey) ? "harmonious" as const : ["square", "opposition"].includes(aspect.typeKey) ? "tense" as const : "neutral" as const,
    }))
    .slice(0, 12);

  const harmoniousCount = aspects.filter((aspect) => aspect.quality === "harmonious").length;
  const tenseCount = aspects.filter((aspect) => aspect.quality === "tense").length;
  const neutralCount = aspects.filter((aspect) => aspect.quality === "neutral").length;
  const formulaText = profile.formulas.length ? profile.formulas.join(", ") : "связь V, VII и X домов не сформирована напрямую";
  const namesText = participantNames.length ? participantNames.join(", ") : "планеты формулы не выделены";

  let summary = `Натальная основа брака: ${formulaText}. В формуле участвуют ${namesText}.`;
  if (harmoniousCount >= 2 && tenseCount === 1) summary += " Преобладают гармоничные связи, но одна напряжённая связь указывает на постоянную зону, требующую внимания.";
  else if (tenseCount >= 2 && harmoniousCount === 1) summary += " Напряжённых связей больше, чем гармоничных; отношения могут требовать особой работы с взаимностью и конфликтами.";
  else if (tenseCount > 0 && harmoniousCount === 0) summary += " В отобранных связях преобладает напряжённая динамика; это указывает на возможные испытания, но не предсказывает событие автоматически.";
  else if (harmoniousCount > 0 && tenseCount === 0) summary += " В отобранных связях преобладает гармоничная динамика и потенциал взаимной поддержки.";
  else summary += " Качество брачной темы уточняется по прогностическим аспектам и дополнительным факторам карты.";

  return { participantNames, harmoniousCount, tenseCount, neutralCount, aspects, summary };
}

function strictNatalProfileAdapter(profile: StrictNatalMarriageProfile): NatalMarriageProfile {
  return {
    houses: profile.houses.map((house) => {
      const rulerElements = house.elements.filter((element) => ["ruler", "retrograde_ruler", "co_ruler", "junior_co_ruler"].includes(element.role));
      const planetElements = house.elements.filter((element) => ["planet_in_house", "planet_near_next_cusp"].includes(element.role));
      return {
        number: house.house,
        sign: house.sign,
        signKey: house.signKey,
        rulers: rulerElements.map((element) => element.bodyName),
        rulerKeys: rulerElements.map((element) => element.bodyKey),
        planets: planetElements.map((element) => element.bodyName),
      };
    }),
    formulas: profile.formulas,
    connections: strictNatalBasis(profile),
  };
}

function strictNatalBasis(profile: StrictNatalMarriageProfile): MarriageIndicator[] {
  return profile.connections.map((connection) => ({
    id: `natal-${connection.id}`,
    kind: "natal",
    label: `${connection.formula}: ${connection.fromBodyKey} (${connection.fromRole}) — ${connection.toBodyKey} (${connection.toRole})${connection.relation === "shared_body" ? "; общая планета" : connection.aspect ? `; ${connection.aspect.type}, орбис ${connection.aspect.orb.toFixed(2)}°` : ""}`,
    houses: [connection.fromHouse, connection.toHouse],
    method: "натальная карта по полной иерархии элементов",
    formula: connection.formula,
    sourceRole: connection.fromRole,
    targetRole: connection.toRole,
    orb: connection.aspect?.orb,
  }));
}

export function buildNatalMarriageCycle(profile: StrictNatalMarriageProfile): NatalMarriageCycle {
  const connections = profile.connections.filter((connection) => !connection.auxiliary);
  const loveFormulas = [...new Set(connections.map((connection) => connection.formula))];
  const officialConnectionCount = connections.filter((connection) => connection.formula === "VII + X").length;
  const loveFormulaStatus = loveFormulas.length > 0 ? "confirmed" as const : "not_confirmed" as const;
  const officialMarriageStatus = officialConnectionCount > 0 ? "confirmed" as const : "not_confirmed" as const;
  const summary = officialMarriageStatus === "confirmed"
    ? `Натальный первый цикл подтверждает формулу любви ${loveFormulas.join(", ")} и обязательную формулу официального брака VII + X.`
    : loveFormulaStatus === "confirmed"
      ? `Натальный первый цикл подтверждает любовную формулу ${loveFormulas.join(", ")}, но обязательная комбинация VII + X не подтверждена.`
      : "Натальная формула любви не подтверждена по найденным не вспомогательным элементам домов.";
  return {
    loveFormulaStatus,
    loveFormulas,
    officialMarriageStatus,
    officialMarriageFormula: "VII + X",
    connectionCount: connections.length,
    officialConnectionCount,
    celibacyAssessment: "not_established",
    celibacyNote: "Отсутствие натальной формулы само по себе не является достаточным основанием для вывода о безбрачии; отдельные авторские условия должны быть проверены полностью.",
    summary,
  };
}

function strictNatalCharacter(chart: NatalChart, profile: StrictNatalMarriageProfile): NatalMarriageCharacter {
  const participantKeys = new Set<string>();
  for (const connection of profile.connections) {
    participantKeys.add(connection.fromBodyKey);
    participantKeys.add(connection.toBodyKey);
  }
  if (profile.firstMarriageSignificator) participantKeys.add(profile.firstMarriageSignificator);
  const participantNames = chart.bodies.filter((body) => participantKeys.has(body.key)).map((body) => body.name);
  const aspects: NatalMarriageAspect[] = profile.connections
    .filter((connection) => connection.relation === "aspect" && connection.aspect)
    .map((connection) => {
      const aspect = connection.aspect!;
      return {
        body1: chart.bodies.find((body) => body.key === connection.fromBodyKey)?.name ?? connection.fromBodyKey,
        body2: chart.bodies.find((body) => body.key === connection.toBodyKey)?.name ?? connection.toBodyKey,
        type: aspect.type,
        typeKey: aspect.typeKey,
        orb: aspect.orb,
        quality: ["trine", "sextile"].includes(aspect.typeKey) ? "harmonious" : ["square", "opposition"].includes(aspect.typeKey) ? "tense" : "neutral",
      };
    });
  const harmoniousCount = aspects.filter((aspect) => aspect.quality === "harmonious").length;
  const tenseCount = aspects.filter((aspect) => aspect.quality === "tense").length;
  const neutralCount = aspects.filter((aspect) => aspect.quality === "neutral").length;
  let summary = profile.formulas.length ? `В натальной карте подтверждены формулы ${profile.formulas.join(", ")}.` : "В натальной карте не подтверждена полноправная связь элементов V, VII и X домов.";
  if (profile.firstMarriageSignificatorName) summary += ` Сигнификатор первого брака по полу и секте карты — ${profile.firstMarriageSignificatorName}.`;
  if (harmoniousCount >= 2 && tenseCount === 1) summary += " Две гармоничные связи сочетаются с одной напряжённой: в брачной теме есть хорошая основа и постоянная зона напряжения.";
  else if (tenseCount >= 2 && harmoniousCount === 1) summary += " Напряжённых связей больше, чем гармоничных: возможны страдания или неравная взаимность.";
  else if (tenseCount > 0 && harmoniousCount === 0) summary += " В отобранных связях преобладает напряжённая динамика; дополнительные условия карты обязательны для конкретного вывода о характере отношений.";
  else if (harmoniousCount > 0) summary += " В отобранных связях присутствует гармоничная основа брачной темы.";
  return { participantNames, harmoniousCount, tenseCount, neutralCount, aspects, summary };
}

function formulaForHouses(leftHouse: number, rightHouse: number): "V + VII" | "V + X" | "VII + X" | null {
  const pair = [leftHouse, rightHouse].sort((a, b) => a - b).join("+");
  if (pair === "5+7") return "V + VII";
  if (pair === "5+10") return "V + X";
  if (pair === "7+10") return "VII + X";
  return null;
}

function strictProgressionIndicators(
  result: ProgressionResult,
  profile: StrictNatalMarriageProfile,
  activeBodyKeys?: ReadonlySet<string>,
  sourceFilter: "all" | "moon" | "non_moon" = "all",
): MarriageIndicator[] {
  const output: MarriageIndicator[] = [];
  for (const aspect of result.aspects) {
    const isProgressedMoon = aspect.sourceBodyKey === "moon";
    if (activeBodyKeys && !activeBodyKeys.has(aspect.sourceBodyKey)) continue;
    if (sourceFilter === "moon" && !isProgressedMoon) continue;
    if (sourceFilter === "non_moon" && isProgressedMoon) continue;
    const matches: Array<{ formula: "V + VII" | "V + X" | "VII + X"; fromHouse: number; toHouse: number; sourceRole: string; targetRole: string }> = [];
    for (let leftIndex = 0; leftIndex < profile.houses.length; leftIndex += 1) {
      const left = profile.houses[leftIndex];
      for (const right of profile.houses.slice(leftIndex + 1)) {
        const formula = formulaForHouses(left.house, right.house);
        if (!formula) continue;
        for (const from of left.elements) {
          for (const to of right.elements) {
            if (from.bodyKey === aspect.sourceBodyKey && to.bodyKey === aspect.targetBodyKey) matches.push({ formula, fromHouse: left.house, toHouse: right.house, sourceRole: from.role, targetRole: to.role });
            if (to.bodyKey === aspect.sourceBodyKey && from.bodyKey === aspect.targetBodyKey) matches.push({ formula, fromHouse: right.house, toHouse: left.house, sourceRole: to.role, targetRole: from.role });
          }
        }
      }
    }
    for (const match of matches) {
      output.push({
        id: `${aspect.method}-${aspect.exactDate}-${aspect.sourceBodyKey}-${aspect.targetBodyKey}-${aspect.aspectKey}-${match.sourceRole}-${match.targetRole}`,
        kind: aspect.method === "fast" ? "fast_progression" : aspect.method === "solar_arc" ? "solar_arc" : "secondary_progression",
        label: `${aspect.sourceBody} образует ${aspect.aspectKey} к ${aspect.targetBody}; ${match.formula}, роли ${match.sourceRole} и ${match.targetRole}`,
        date: aspect.exactDate,
        age: result.ageYears,
        houses: [match.fromHouse, match.toHouse],
        method: aspect.method === "fast" ? "быстрая прогрессия (1:12)" : aspect.method === "solar_arc" ? "солнечная дуга" : "вторичная прогрессия",
        progressionMethod: aspect.method,
        formula: match.formula,
        sourceRole: match.sourceRole,
        targetRole: match.targetRole,
        sourceBodyKey: aspect.sourceBodyKey,
        targetBodyKey: aspect.targetBodyKey,
        eventKey: `${aspect.sourceBodyKey}:${aspect.targetBodyKey}:${aspect.aspectKey}:${match.formula}`,
        applying: aspect.applying,
        phase: aspect.phase,
        orb: aspect.orb,
      });
    }
  }
  return output;
}

function strictTransitIndicators(result: TransitResult, profile: StrictNatalMarriageProfile, date: string, age: number): MarriageIndicator[] {
  const output: MarriageIndicator[] = [];
  for (const aspect of result.aspects) {
    const natalBody = profile.houses.flatMap((house) => house.elements).find((element) => element.bodyName === aspect.natalBody);
    if (!natalBody) continue;
    const connection = profile.connections.find((item) => item.toBodyKey === natalBody.bodyKey || item.fromBodyKey === natalBody.bodyKey);
    if (!connection) continue;
    output.push({
      id: `transit-${date}-${aspect.transitBody}-${aspect.natalBody}-${aspect.typeKey}-${natalBody.role}`,
      kind: "transit",
      label: `Транзитный ${aspect.transitBody} образует ${aspect.type.toLowerCase()} с ${aspect.natalBody}; дополнительный триггер формулы ${connection.formula}`,
      date,
      age,
      houses: [connection.fromHouse, connection.toHouse],
      method: "транзитный триггер",
      formula: connection.formula,
      targetRole: natalBody.role,
      orb: aspect.orb,
    });
  }
  return output;
}

function aspectHouses(aspect: ProgressionAspect): number[] {
  return uniqueNumbers([aspect.sourceHouse ?? 0, aspect.targetHouse ?? 0].filter((house) => house > 0));
}

function aspectFormula(aspect: ProgressionAspect): string | null {
  const houses = aspectHouses(aspect);
  const hasV = houses.includes(5);
  const hasVII = houses.includes(7);
  const hasX = houses.includes(10);
  if (hasVII && hasX) return "VII + X";
  if (hasV && hasVII) return "V + VII";
  if (hasV && hasX) return "V + X";
  return null;
}

function progressionIndicator(aspect: ProgressionAspect, resultAge: number): MarriageIndicator | null {
  const formula = aspectFormula(aspect);
  if (!formula) return null;
  return {
    id: `secondary-${aspect.exactDate}-${aspect.sourceBodyKey}-${aspect.targetBodyKey}-${aspect.aspectKey}`,
    kind: "secondary_progression",
    label: `${aspect.sourceBody} образует ${aspect.aspectKey} к ${aspect.targetBody}; формула ${formula}`,
    date: aspect.exactDate,
    age: resultAge,
    houses: aspectHouses(aspect),
    method: "вторичная прогрессия",
    applying: aspect.applying,
    phase: aspect.phase,
    orb: aspect.orb,
  };
}

function scanDates(start: Date, end: Date, stepDays: number): Date[] {
  const dates: Date[] = [];
  for (let cursor = start; cursor <= end; cursor = addDays(cursor, stepDays)) dates.push(cursor);
  if (!dates.length || dates[dates.length - 1].getTime() !== end.getTime()) dates.push(end);
  return dates;
}

function confirmationMethodKey(indicator: MarriageIndicator): string {
  if (indicator.kind === "retrograde_support") {
    if (indicator.progressionMethod === "secondary") return "secondary_progression";
    if (indicator.progressionMethod === "fast") return "fast_progression";
    if (indicator.progressionMethod === "solar_arc") return "solar_arc";
    return "retrograde_support";
  }
  return indicator.kind;
}

function mergeIndicators(indicators: MarriageIndicator[]): MarriageWindow[] {
  const sorted = [...indicators].sort((a, b) => String(a.date).localeCompare(String(b.date)));
  const windows: MarriageWindow[] = [];
  for (const indicator of sorted) {
    const date = new Date(`${indicator.date}T00:00:00Z`);
    const current = windows[windows.length - 1];
    const currentFormula = current?.indicators[0]?.formula;
    if (!current || currentFormula !== indicator.formula || date.getTime() - new Date(`${current.dateFrom}T00:00:00Z`).getTime() > 30 * 86400000) {
      windows.push({ dateFrom: indicator.date!, dateTo: indicator.date!, ageFrom: indicator.age ?? 0, ageTo: indicator.age ?? 0, confirmations: 0, strength: "moderate", indicators: [indicator] });
    } else {
      current.dateTo = indicator.date!;
      current.ageTo = indicator.age ?? current.ageTo;
      current.indicators.push(indicator);
    }
  }
  return windows.map((window) => {
    const unique = new Map<string, MarriageIndicator>();
    for (const indicator of window.indicators) unique.set(`${indicator.kind}:${indicator.method}:${indicator.id.split("-").slice(0, 2).join("-")}`, indicator);
    const indicators = [...unique.values()];
    const hasOfficialMarriageFormula = indicators.some((indicator) => indicator.formula === "VII + X");
    const confirmationIndicators = indicators.filter((indicator) => indicator.kind !== "retrograde_support");
    const confirmations = new Set(confirmationIndicators.map(confirmationMethodKey)).size;
    const hasNonSeparatingProgression = confirmationIndicators.some((indicator) => indicator.kind !== "transit" && indicator.kind !== "natal" && indicator.phase !== "separating");
    return { ...window, indicators, confirmations: hasOfficialMarriageFormula && hasNonSeparatingProgression ? confirmations : 0, strength: confirmations >= 4 ? "strong" : "moderate" };
  });
}

export function computeMarriageFormula(input: NatalChartInput, gender: MarriageGender | null = null): MarriageFormulaResult {
  const natal = computeNatalChart(input);
  const strictNatalProfile = buildStrictNatalMarriageProfile(natal, gender);
  const natalProfile = strictNatalProfileAdapter(strictNatalProfile);
  const natalBasis = strictNatalBasis(strictNatalProfile);
  const natalCharacter = strictNatalCharacter(natal, strictNatalProfile);
  const natalCycle = buildNatalMarriageCycle(strictNatalProfile);
  const searchStart = dateAtAge(input, MARRIAGE_MIN_AGE);
  const searchEnd = addDays(dateAtAge(input, MARRIAGE_MAX_AGE + 1), -1);
  const indicators: MarriageIndicator[] = [];
  const activeBodyKeys = new Set(
    strictNatalProfile.houses.flatMap((house) => house.elements.map((element) => element.bodyKey)),
  );
  if (strictNatalProfile.firstMarriageSignificator) activeBodyKeys.add(strictNatalProfile.firstMarriageSignificator);

  const slowCandidates = new Map<string, { indicator: MarriageIndicator; date: Date; retrograde: boolean; bodyName?: string }>();
  const collectSlowCandidates = (progression: ProgressionResult, candidates: MarriageIndicator[]) => {
    for (const indicator of candidates.filter((item) => item.phase !== "separating")) {
      const key = indicator.eventKey ?? `${indicator.sourceBodyKey ?? ""}:${indicator.targetBodyKey ?? ""}:${indicator.formula ?? ""}:${indicator.kind}`;
      const point = indicator.sourceBodyKey ? progression.points.find((item) => item.key === indicator.sourceBodyKey) : undefined;
      const existing = slowCandidates.get(key);
      if (!existing || (indicator.orb ?? Number.POSITIVE_INFINITY) < (existing.indicator.orb ?? Number.POSITIVE_INFINITY)) {
        slowCandidates.set(key, { indicator, date: new Date(`${indicator.date}T00:00:00Z`), retrograde: Boolean(point?.retrograde), bodyName: point?.name });
      }
    }
  };
  // Основной проход: медленные прогрессивные планеты с шагом 30 дней.
  for (const date of scanDates(searchStart, searchEnd, 30)) {
    const progression = computeSecondaryProgressions(input, date, natal, activeBodyKeys);
    collectSlowCandidates(progression, strictProgressionIndicators(progression, strictNatalProfile, activeBodyKeys, "non_moon"));
  }

  // Прогрессивная Луна движется быстрее остальных вторичных планет,
  // поэтому контролируется отдельным проходом с шагом 14 дней,
  // но только если она входит в натальную формулу.
  if (activeBodyKeys.has("moon")) for (const date of scanDates(searchStart, searchEnd, 14)) {
    const progression = computeSecondaryProgressions(input, date, natal, activeBodyKeys);
    collectSlowCandidates(progression, strictProgressionIndicators(progression, strictNatalProfile, activeBodyKeys, "moon"));
  }

  const slowWindowDates = [...slowCandidates.values()].map((item) => item.date);
  for (const item of slowCandidates.values()) {
    indicators.push(item.indicator);
    if (item.retrograde) indicators.push({
      ...item.indicator,
      id: `retrograde-${item.indicator.id}`,
      kind: "retrograde_support",
      label: `${item.bodyName ?? item.indicator.sourceBodyKey ?? "Планета"} ретрограден в прогрессии; применяется отдельное правило дополнительного управления`,
      method: "правило ретроградной прогрессивной планеты",
    });
  }
  const selectedEventKeys = new Set([...slowCandidates.keys()]);
  const exactSecondaryDates = new Map<string, Date>();
  for (const candidate of slowWindowDates) exactSecondaryDates.set(isoDate(candidate), candidate);
  for (const date of exactSecondaryDates.values()) {
    const exactProgression = computeSecondaryProgressions(input, date, natal, activeBodyKeys, true);
    const exactIndicators = strictProgressionIndicators(exactProgression, strictNatalProfile, activeBodyKeys, "all")
      .filter((indicator) => indicator.phase !== "separating" && Boolean(indicator.eventKey && selectedEventKeys.has(indicator.eventKey)));
    indicators.push(...exactIndicators);
  }

  const refinementDates = new Map<string, Date>();
  // Быстрые техники уточняют медленное событие рядом с ним,
  // а не создают самостоятельное полугодовое окно.
  for (const candidate of slowWindowDates) {
    for (const date of scanDates(addDays(candidate, -45), addDays(candidate, 45), 7)) {
      if (date < searchStart || date > searchEnd) continue;
      refinementDates.set(isoDate(date), date);
    }
  }
  for (const date of refinementDates.values()) {
    const progressionResults = [
      computeFastProgressions(input, date, natal),
      computeSolarArcDirections(input, date, natal),
    ];
    for (const progression of progressionResults) {
      const foundIndicators = strictProgressionIndicators(progression, strictNatalProfile);
      for (const found of foundIndicators) {
        indicators.push(found);
        const transits = computeTransits(natal, date.toISOString().slice(0, 10), input.latitude, input.longitude, input.timezone, { excludedBodies: ["moon"] });
        if (transits) indicators.push(...strictTransitIndicators(transits, strictNatalProfile, found.date ?? date.toISOString().slice(0, 10), found.age ?? progression.ageYears));
        const point = found.sourceBodyKey ? progression.points.find((item) => item.key === found.sourceBodyKey) : undefined;
        if (point && found.progressionMethod === "fast") indicators.push({
          id: `retrograde-${found.id}`,
          kind: "retrograde_support",
          label: `${point.name} ретрограден в быстрой прогрессии; применяется отдельное правило дополнительного управления`,
          date: found.date,
          age: found.age,
          houses: found.houses,
          method: "правило ретроградной прогрессивной планеты",
          progressionMethod: found.progressionMethod,
          formula: found.formula,
          sourceRole: found.sourceRole,
          targetRole: found.targetRole,
          sourceBodyKey: found.sourceBodyKey,
          targetBodyKey: found.targetBodyKey,
        });
      }
    }
  }

  const windows = mergeIndicators(indicators)
    .map((window) => ({ ...window, confirmations: window.confirmations + (natalCycle.officialMarriageStatus === "confirmed" ? 1 : 0) }))
    .filter((window) => window.confirmations >= 3)
    .sort((a, b) => a.dateFrom.localeCompare(b.dateFrom));

  return {
    formula: "marriage",
    formulaLabel: "Возможный период бракосочетания",
    searchFrom: isoDate(searchStart),
    searchTo: isoDate(searchEnd),
    ageFrom: MARRIAGE_MIN_AGE,
    ageTo: MARRIAGE_MAX_AGE,
    natalBasis,
    natalProfile,
    natalCharacter,
    natalCycle,
    strictNatalProfile,
    windows,
    methodology: {
      houseSystem: "Placidus",
      progression: "day-for-a-year",
      minConfirmations: 3,
      retrogradeProgressivePlanets: "flagged",
    },
  };
}
