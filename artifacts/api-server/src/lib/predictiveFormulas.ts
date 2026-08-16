import { computeNatalChart, type NatalChart, type NatalChartInput } from "./astrology";
import { computeSecondaryProgressions, type ProgressionAspect } from "./progressions";

export const MARRIAGE_MIN_AGE = 15;
export const MARRIAGE_MAX_AGE = 79;

export type PredictiveFormulaKey = "marriage";

export type MarriageIndicator = {
  id: string;
  kind: "natal" | "secondary_progression" | "retrograde_support";
  label: string;
  date?: string;
  age?: number;
  houses: number[];
  method?: string;
  applying?: boolean | null;
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
    orb: aspect.orb,
  };
}

function scanDates(start: Date, end: Date, stepDays: number): Date[] {
  const dates: Date[] = [];
  for (let cursor = start; cursor <= end; cursor = addDays(cursor, stepDays)) dates.push(cursor);
  if (!dates.length || dates[dates.length - 1].getTime() !== end.getTime()) dates.push(end);
  return dates;
}

function mergeIndicators(indicators: MarriageIndicator[]): MarriageWindow[] {
  const sorted = [...indicators].sort((a, b) => String(a.date).localeCompare(String(b.date)));
  const windows: MarriageWindow[] = [];
  for (const indicator of sorted) {
    const date = new Date(`${indicator.date}T00:00:00Z`);
    const current = windows[windows.length - 1];
    if (!current || date.getTime() - new Date(`${current.dateTo}T00:00:00Z`).getTime() > 180 * 86400000) {
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
    const confirmations = indicators.length;
    return { ...window, indicators, confirmations, strength: confirmations >= 4 ? "strong" : "moderate" };
  });
}

export function computeMarriageFormula(input: NatalChartInput): MarriageFormulaResult {
  const natal = computeNatalChart(input);
  const natalProfile = natalMarriageProfile(natal);
  const natalBasis = natalProfile.connections;
  const natalCharacter = buildNatalMarriageCharacter(natal, natalProfile);
  const searchStart = dateAtAge(input, MARRIAGE_MIN_AGE);
  const searchEnd = addDays(dateAtAge(input, MARRIAGE_MAX_AGE + 1), -1);
  const indicators: MarriageIndicator[] = [];

  // Ежегодный проход находит широкие окна; точное сужение добавим отдельным методом.
  for (const date of scanDates(searchStart, searchEnd, 365)) {
    const progression = computeSecondaryProgressions(input, date);
    for (const aspect of progression.aspects) {
      const found = progressionIndicator(aspect, progression.ageYears);
      if (found) indicators.push(found);
      const point = progression.points.find((item) => item.key === aspect.sourceBodyKey);
      if (point?.retrograde && found) {
        indicators.push({
          id: `retrograde-${found.id}`,
          kind: "retrograde_support",
          label: `${point.name} ретрограден в прогрессии; применяется правило дополнительного управления`,
          date: found.date,
          age: found.age,
          houses: found.houses,
          method: "правило ретроградной прогрессивной планеты",
        });
      }
    }
  }

  const windows = mergeIndicators(indicators)
    .map((window) => ({ ...window, confirmations: window.confirmations + (natalBasis.length > 0 ? 1 : 0) }))
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
    windows,
    methodology: {
      houseSystem: "Placidus",
      progression: "day-for-a-year",
      minConfirmations: 3,
      retrogradeProgressivePlanets: "flagged",
    },
  };
}
