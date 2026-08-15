import {
  computeNatalChart,
  type NatalAngle,
  type NatalBody,
  type NatalChart,
  type NatalHouse,
  type NatalChartInput,
  MAJOR_ASPECTS,
} from "./astrology";

export type ProgressionMethod = "secondary" | "solar_arc";

export interface ProgressionPoint {
  key: string;
  name: string;
  symbol: string;
  longitude: number;
  sign: string;
  signKey: string;
  degreeInSign: string;
  house: number | null;
  retrograde: boolean;
}

export interface ProgressionAspect {
  method: ProgressionMethod;
  exactDate: string;
  sourceBody: string;
  sourceBodyKey: string;
  sourceBodySymbol: string;
  targetBody: string;
  targetBodyKey: string;
  targetBodySymbol: string;
  aspectKey: string;
  orb: number;
  applying: boolean | null;
  sourceHouse: number | null;
  targetHouse: number | null;
}

export interface ProgressionResult {
  targetDate: string;
  progressedDate: string;
  ageYears: number;
  solarArc: number;
  points: ProgressionPoint[];
  houses: NatalHouse[];
  angles: NatalAngle[];
  aspects: ProgressionAspect[];
}

const PROGRESSION_ORB = 1;
const PROGRESSED_MOON_ORB = 1.5;

function normalize(value: number): number {
  return ((value % 360) + 360) % 360;
}

function angularDistance(a: number, b: number): number {
  const distance = Math.abs(normalize(a) - normalize(b));
  return Math.min(distance, 360 - distance);
}

function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * 86400000);
}

function isoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function dateParts(date: Date): Pick<NatalChartInput, "year" | "month" | "day" | "hour" | "minute" | "second"> {
  return {
    year: date.getUTCFullYear(),
    month: date.getUTCMonth() + 1,
    day: date.getUTCDate(),
    hour: date.getUTCHours(),
    minute: date.getUTCMinutes(),
    second: date.getUTCSeconds(),
  };
}

function ageInYears(birth: Date, target: Date): number {
  return (target.getTime() - birth.getTime()) / (365.2425 * 86400000);
}

function progressedDateForAge(birth: Date, ageYears: number): Date {
  return addDays(birth, ageYears);
}

function shiftedLongitude(longitude: number, arc: number): number {
  return normalize(longitude + arc);
}

function houseForLongitude(longitude: number, houses: NatalHouse[]): number | null {
  if (houses.length !== 12) return null;
  for (let index = 0; index < houses.length; index += 1) {
    const start = normalize(houses[index].longitude);
    const end = normalize(houses[(index + 1) % houses.length].longitude);
    const distance = normalize(longitude - start);
    const width = normalize(end - start) || 360;
    if (distance < width) return houses[index].number;
  }
  return 12;
}

function shiftHouses(houses: NatalHouse[], arc: number): NatalHouse[] {
  return houses.map((house) => ({
    ...house,
    longitude: Number(shiftedLongitude(house.longitude, arc).toFixed(4)),
  }));
}

function shiftAngle(angle: NatalAngle, arc: number): NatalAngle {
  const longitude = shiftedLongitude(angle.longitude, arc);
  return { ...angle, longitude, degreeInSign: formatDegree(longitude) };
}

function signData(longitude: number): { signKey: string; sign: string; degreeInSign: string } {
  const keys = ["aries", "taurus", "gemini", "cancer", "leo", "virgo", "libra", "scorpio", "sagittarius", "capricorn", "aquarius", "pisces"];
  const names = ["Овен", "Телец", "Близнецы", "Рак", "Лев", "Дева", "Весы", "Скорпион", "Стрелец", "Козерог", "Водолей", "Рыбы"];
  const value = normalize(longitude);
  const index = Math.floor(value / 30);
  return { signKey: keys[index], sign: names[index], degreeInSign: formatDegree(value) };
}

function formatDegree(longitude: number): string {
  const within = normalize(longitude) % 30;
  const degrees = Math.floor(within);
  const minutesFloat = (within - degrees) * 60;
  const minutes = Math.floor(minutesFloat);
  const seconds = Math.round((minutesFloat - minutes) * 60);
  return `${degrees}° ${minutes}' ${seconds}''`;
}

function makeProgressedPoints(natal: NatalChart, progressed: NatalChart, houses: NatalHouse[], arc: number, method: ProgressionMethod): ProgressionPoint[] {
  return progressed.bodies.map((body) => {
    const longitude = method === "secondary" ? body.longitude : shiftedLongitude(natal.bodies.find((item) => item.key === body.key)?.longitude ?? body.longitude, arc);
    const details = signData(longitude);
    return {
      key: body.key,
      name: body.name,
      symbol: body.symbol,
      longitude: Number(longitude.toFixed(4)),
      ...details,
      house: houseForLongitude(longitude, houses),
      retrograde: method === "secondary" ? body.retrograde : false,
    };
  });
}

function buildAspects(
  method: ProgressionMethod,
  exactDate: string,
  sources: ProgressionPoint[],
  targets: NatalBody[],
  orb: number,
): ProgressionAspect[] {
  const aspects: ProgressionAspect[] = [];
  for (const source of sources) {
    for (const target of targets) {
      const distance = angularDistance(source.longitude, target.longitude);
      let best: { key: string; diff: number } | null = null;
      for (const candidate of MAJOR_ASPECTS) {
        const diff = Math.abs(distance - candidate.angle);
        if (diff <= orb && (!best || diff < best.diff)) best = { key: candidate.key, diff };
      }
      if (best) {
        aspects.push({
          method,
          exactDate,
          sourceBody: source.name,
          sourceBodyKey: source.key,
          sourceBodySymbol: source.symbol,
          targetBody: target.name,
          targetBodyKey: target.key,
          targetBodySymbol: target.symbol,
          aspectKey: best.key,
          orb: Number(best.diff.toFixed(2)),
          applying: null,
          sourceHouse: source.house,
          targetHouse: target.house,
        });
      }
    }
  }
  return aspects.sort((a, b) => a.orb - b.orb);
}

function buildBirthDate(input: NatalChartInput): Date {
  return new Date(Date.UTC(input.year, input.month - 1, input.day, input.hour, input.minute, input.second ?? 0));
}

export function computeSecondaryProgressions(input: NatalChartInput, targetDate: Date): ProgressionResult {
  const birthDate = buildBirthDate(input);
  const ageYears = ageInYears(birthDate, targetDate);
  if (ageYears < 0) throw new Error("Дата прогрессии не может быть раньше рождения");
  const progressedDate = progressedDateForAge(birthDate, ageYears);
  const progressedInput = { ...input, ...dateParts(progressedDate) };
  const natal = computeNatalChart(input);
  const progressed = computeNatalChart(progressedInput);
  const progressedSun = progressed.bodies.find((body) => body.key === "sun");
  const natalSun = natal.bodies.find((body) => body.key === "sun");
  const solarArc = progressedSun && natalSun ? normalize(progressedSun.longitude - natalSun.longitude) : 0;
  const houses = shiftHouses(natal.houses, solarArc);
  const points = makeProgressedPoints(natal, progressed, houses, solarArc, "secondary");
  const aspects = buildAspects("secondary", isoDate(targetDate), points, natal.bodies, PROGRESSION_ORB);
  const moon = points.find((point) => point.key === "moon");
  if (moon) {
    const moonAspects = buildAspects("secondary", isoDate(targetDate), [moon], natal.bodies, PROGRESSED_MOON_ORB);
    for (const aspect of moonAspects) {
      if (!aspects.some((item) => item.sourceBodyKey === aspect.sourceBodyKey && item.targetBodyKey === aspect.targetBodyKey && item.aspectKey === aspect.aspectKey)) aspects.push(aspect);
    }
  }
  return {
    targetDate: isoDate(targetDate),
    progressedDate: progressedDate.toISOString(),
    ageYears: Number(ageYears.toFixed(6)),
    solarArc: Number(solarArc.toFixed(4)),
    points,
    houses,
    angles: natal.angles.map((angle) => shiftAngle(angle, solarArc)),
    aspects: aspects.sort((a, b) => a.orb - b.orb),
  };
}

export function computeSolarArcDirections(input: NatalChartInput, targetDate: Date): ProgressionResult {
  const secondary = computeSecondaryProgressions(input, targetDate);
  const natal = computeNatalChart(input);
  const houses = shiftHouses(natal.houses, secondary.solarArc);
  const points = makeProgressedPoints(natal, natal, houses, secondary.solarArc, "solar_arc");
  const aspects = buildAspects("solar_arc", isoDate(targetDate), points, natal.bodies, 1);
  return {
    ...secondary,
    points,
    houses,
    angles: natal.angles.map((angle) => shiftAngle(angle, secondary.solarArc)),
    aspects,
  };
}
