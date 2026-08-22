import type { NatalAspect, NatalBody, NatalChart, NatalHouse } from "./astrology.js";

export type MarriageGender = "мужчина" | "женщина";
export type MarriageSect = "дневная" | "ночная" | "неопределённая";
export type HouseElementRole =
  | "ruler"
  | "retrograde_ruler"
  | "co_ruler"
  | "junior_co_ruler"
  | "planet_in_house"
  | "planet_near_next_cusp"
  | "symbolic";

export interface MarriageHouseElement {
  house: number;
  bodyKey: string;
  bodyName: string;
  role: HouseElementRole;
  signKey?: string;
  repeatedRole: boolean;
  auxiliary: boolean;
}

export interface MarriageHouseStructure {
  house: 5 | 7 | 10;
  sign: string;
  signKey: string;
  width: number;
  large: boolean;
  elements: MarriageHouseElement[];
}

export interface MarriageHouseConnection {
  id: string;
  formula: "V + VII" | "V + X" | "VII + X";
  fromHouse: 5 | 7 | 10;
  toHouse: 5 | 7 | 10;
  fromBodyKey: string;
  toBodyKey: string;
  fromRole: HouseElementRole;
  toRole: HouseElementRole;
  relation: "aspect" | "shared_body";
  aspect?: NatalAspect;
  auxiliary: boolean;
}

export interface StrictNatalMarriageProfile {
  gender: MarriageGender | null;
  sect: MarriageSect;
  firstMarriageSignificator: string | null;
  firstMarriageSignificatorName: string | null;
  houses: MarriageHouseStructure[];
  connections: MarriageHouseConnection[];
  formulas: string[];
}

const SIGN_KEYS = [
  "aries", "taurus", "gemini", "cancer", "leo", "virgo",
  "libra", "scorpio", "sagittarius", "capricorn", "aquarius", "pisces",
] as const;

const DIRECT_RULER: Record<string, string> = {
  aries: "mars",
  taurus: "venus",
  gemini: "mercury",
  cancer: "moon",
  leo: "sun",
  virgo: "mercury",
  libra: "venus",
  scorpio: "pluto",
  sagittarius: "jupiter",
  capricorn: "saturn",
  aquarius: "uranus",
  pisces: "neptune",
};

const RETROGRADE_BY_SIGN: Record<string, string> = {
  aries: "pluto",
  scorpio: "mars",
  sagittarius: "neptune",
  pisces: "jupiter",
  capricorn: "uranus",
  aquarius: "saturn",
};

const SIGNIFICATOR_BY_SECT: Record<MarriageGender, Record<Exclude<MarriageSect, "неопределённая">, string>> = {
  мужчина: { дневная: "venus", ночная: "moon" },
  женщина: { дневная: "sun", ночная: "mars" },
};

function normalize(value: number): number {
  return ((value % 360) + 360) % 360;
}

function forwardDistance(from: number, to: number): number {
  return normalize(to - from);
}

function signIndex(signKey: string): number {
  return Math.max(0, SIGN_KEYS.indexOf(signKey as (typeof SIGN_KEYS)[number]));
}

function bodyMap(chart: NatalChart): Map<string, NatalBody> {
  return new Map(chart.bodies.map((body) => [body.key, body]));
}

function bodyName(chart: NatalChart, key: string): string {
  return bodyMap(chart).get(key)?.name ?? key;
}

function houseWidth(houses: NatalHouse[], number: number): number {
  const current = houses.find((house) => house.number === number);
  const next = houses.find((house) => house.number === (number === 12 ? 1 : number + 1));
  if (!current || !next) return 30;
  return forwardDistance(current.longitude, next.longitude) || 360;
}

function signOverlapsHouse(house: NatalHouse, nextHouse: NatalHouse, sign: number): number {
  const start = normalize(house.longitude);
  const width = forwardDistance(start, nextHouse.longitude) || 360;
  const signStart = sign * 30;
  const candidates = [signStart - 360, signStart, signStart + 360];
  const breaks = [0, width];
  for (const candidate of candidates) {
    const distance = candidate - start;
    if (distance > 0 && distance < width) breaks.push(distance);
  }
  breaks.sort((a, b) => a - b);
  let overlap = 0;
  for (let index = 0; index < breaks.length - 1; index += 1) {
    const midpoint = start + (breaks[index] + breaks[index + 1]) / 2;
    const midpointSign = Math.floor(normalize(midpoint) / 30);
    if (midpointSign === sign) overlap += breaks[index + 1] - breaks[index];
  }
  return overlap;
}

function housesForBody(chart: NatalChart, body: NatalBody): Map<number, HouseElementRole> {
  const roles = new Map<number, HouseElementRole>();
  if (body.house) roles.set(body.house, "planet_in_house");
  for (const house of chart.houses) {
    const nextNumber = house.number === 12 ? 1 : house.number + 1;
    const next = chart.houses.find((candidate) => candidate.number === nextNumber);
    if (!next) continue;
    const distance = forwardDistance(body.longitude, next.longitude);
    if (distance > 0 && distance < 3) roles.set(nextNumber, "planet_near_next_cusp");
  }
  return roles;
}

function rulersForSign(chart: NatalChart, signKey: string): Array<{ key: string; role: HouseElementRole }> {
  const result: Array<{ key: string; role: HouseElementRole }> = [];
  const direct = DIRECT_RULER[signKey];
  if (direct) result.push({ key: direct, role: "ruler" });
  for (const body of chart.bodies) {
    if (!body.retrograde) continue;
    if (RETROGRADE_BY_SIGN[signKey] === body.key && body.key !== direct) result.push({ key: body.key, role: "retrograde_ruler" });
  }
  return result;
}

function pushElement(elements: MarriageHouseElement[], chart: NatalChart, house: number, bodyKey: string, role: HouseElementRole, signKey?: string, auxiliary = false): void {
  const repeatedRole = elements.some((element) => element.house === house && element.bodyKey === bodyKey);
  elements.push({ house, bodyKey, bodyName: bodyName(chart, bodyKey), role, signKey, repeatedRole, auxiliary });
}

function symbolicRulersForHouse(chart: NatalChart, houseNumber: 5 | 7 | 10): string[] {
  const signKey = SIGN_KEYS[houseNumber - 1];
  const keys = [DIRECT_RULER[signKey]];
  const retrogradePair = RETROGRADE_BY_SIGN[signKey];
  if (retrogradePair && chart.bodies.some((body) => body.key === retrogradePair && body.retrograde)) keys.push(retrogradePair);
  return [...new Set(keys.filter(Boolean))];
}

function buildHouseStructure(chart: NatalChart, houseNumber: 5 | 7 | 10): MarriageHouseStructure {
  const house = chart.houses.find((item) => item.number === houseNumber)!;
  const nextNumber = houseNumber + 1;
  const next = chart.houses.find((item) => item.number === nextNumber)!;
  const width = houseWidth(chart.houses, houseNumber);
  const large = width >= 30;
  const elements: MarriageHouseElement[] = [];
  const cuspRulers = rulersForSign(chart, house.signKey);
  for (const ruler of cuspRulers) pushElement(elements, chart, houseNumber, ruler.key, ruler.role, house.signKey);

  const cuspIndex = signIndex(house.signKey);
  const qualifyingSigns: Array<{ sign: number; overlap: number }> = [];
  for (let offset = 1; offset <= 2; offset += 1) {
    const sign = (cuspIndex + offset) % 12;
    const overlap = signOverlapsHouse(house, next, sign);
    const qualifies = large ? overlap >= 15 : offset === 1 && overlap > width / 2;
    if (qualifies) qualifyingSigns.push({ sign, overlap });
  }
  qualifyingSigns.forEach(({ sign }) => {
    const role: HouseElementRole = qualifyingSigns.indexOf(qualifyingSigns.find((item) => item.sign === sign)!) === 0 ? "co_ruler" : "junior_co_ruler";
    const signKey = SIGN_KEYS[sign];
    for (const ruler of rulersForSign(chart, signKey)) pushElement(elements, chart, houseNumber, ruler.key, role, signKey);
  });

  for (const body of chart.bodies) {
    const houseRoles = housesForBody(chart, body);
    const role = houseRoles.get(houseNumber);
    if (role) pushElement(elements, chart, houseNumber, body.key, role, undefined, false);
  }
  for (const symbolicKey of symbolicRulersForHouse(chart, houseNumber)) pushElement(elements, chart, houseNumber, symbolicKey, "symbolic", SIGN_KEYS[houseNumber - 1], true);
  return { house: houseNumber, sign: house.sign, signKey: house.signKey, width: Number(width.toFixed(4)), large, elements };
}

function sectForChart(chart: NatalChart): MarriageSect {
  const sun = chart.bodies.find((body) => body.key === "sun");
  if (!sun || !sun.house) return "неопределённая";
  return sun.house >= 7 ? "дневная" : "ночная";
}

function formulaForHouses(a: number, b: number): "V + VII" | "V + X" | "VII + X" | null {
  const pair = [a, b].sort((x, y) => x - y).join("+");
  if (pair === "5+7") return "V + VII";
  if (pair === "5+10") return "V + X";
  if (pair === "7+10") return "VII + X";
  return null;
}

function aspectBetween(aspects: NatalAspect[], left: string, right: string): NatalAspect | undefined {
  return aspects.find((aspect) => (aspect.body1 === left && aspect.body2 === right) || (aspect.body1 === right && aspect.body2 === left));
}

export function buildStrictNatalMarriageProfile(chart: NatalChart, gender: MarriageGender | null): StrictNatalMarriageProfile {
  const sect = sectForChart(chart);
  const firstMarriageSignificator = gender && sect !== "неопределённая" ? SIGNIFICATOR_BY_SECT[gender][sect] : null;
  const houses = ([5, 7, 10] as const).map((number) => buildHouseStructure(chart, number));
  const connections: MarriageHouseConnection[] = [];
  for (const [leftIndex, left] of houses.entries()) {
    for (const right of houses.slice(leftIndex + 1)) {
      const formula = formulaForHouses(left.house, right.house);
      if (!formula) continue;
      for (const from of left.elements) {
        for (const to of right.elements) {
          const aspect = aspectBetween(chart.aspects, from.bodyName, to.bodyName);
          if (from.bodyKey === to.bodyKey) {
            connections.push({ id: `${formula}-${from.bodyKey}-${from.role}-${to.role}`, formula, fromHouse: left.house, toHouse: right.house, fromBodyKey: from.bodyKey, toBodyKey: to.bodyKey, fromRole: from.role, toRole: to.role, relation: "shared_body", auxiliary: from.auxiliary || to.auxiliary });
          } else if (aspect) {
            connections.push({ id: `${formula}-${from.bodyKey}-${from.role}-${to.bodyKey}-${to.role}-${aspect.typeKey}`, formula, fromHouse: left.house, toHouse: right.house, fromBodyKey: from.bodyKey, toBodyKey: to.bodyKey, fromRole: from.role, toRole: to.role, relation: "aspect", aspect, auxiliary: from.auxiliary || to.auxiliary });
          }
        }
      }
    }
  }
  const formulas = [...new Set(connections.filter((connection) => !connection.auxiliary).map((connection) => connection.formula))];
  return {
    gender,
    sect,
    firstMarriageSignificator,
    firstMarriageSignificatorName: firstMarriageSignificator ? bodyName(chart, firstMarriageSignificator) : null,
    houses,
    connections,
    formulas,
  };
}
