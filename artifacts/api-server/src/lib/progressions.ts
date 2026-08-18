import {
  computeNatalChart,
  type NatalAngle,
  type NatalBody,
  type NatalChart,
  type NatalHouse,
  type NatalChartInput,
  MAJOR_ASPECTS,
} from "./astrology";

export type ProgressionMethod = "secondary" | "fast" | "solar_arc";

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
  phase: "applying" | "exact" | "separating";
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

export interface SecondaryProgressionWindow {
  method: "secondary";
  eventType: "ingress_house_cusp" | "sign_ingress";
  sourceBody: string;
  sourceBodyKey: string;
  sourceSign?: string;
  sourceSignKey?: string;
  targetHouse?: number;
  targetCuspLongitude?: number;
  startDate: string;
  peakDate: string;
  endDate: string;
  orb: number;
  descriptionKey: "house_cusp" | "moon_sign";
}

export interface ProgressionAspectWindow {
  method: "secondary";
  eventType: "major_aspect";
  sourceBody: string;
  sourceBodyKey: string;
  targetBody: string;
  targetBodyKey: string;
  aspectKey: string;
  startDate: string;
  peakDate: string;
  endDate: string;
  orb: number;
  phase: "applying" | "exact" | "separating";
  sourceHouse: number | null;
  targetHouse: number | null;
  descriptionKey: "progressed_to_natal" | "progressed_to_progressed";
}

export interface ProgressionLunationWindow {
  method: "secondary";
  eventType: "progressed_new_moon" | "progressed_full_moon";
  startDate: string;
  peakDate: string;
  endDate: string;
  orb: number;
  natalContactBody: string;
  natalContactBodyKey: string;
  natalContactAspect: string;
  descriptionKey: "lunation_with_natal_contact";
}

const PROGRESSION_ORB = 1;
const PROGRESSED_MOON_ORB = 1.5;
const PROGRESSION_CUSP_ORB = 1;
const PERSONAL_PROGRESSIVE_BODY_KEYS = ["sun", "moon", "mercury", "venus", "mars"] as const;

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

function makeProgressedPoints(
  natal: NatalChart,
  progressed: NatalChart,
  houses: NatalHouse[],
  arc: number,
  method: ProgressionMethod,
  activeBodyKeys?: ReadonlySet<string>,
): ProgressionPoint[] {
  return progressed.bodies.filter((body) => !activeBodyKeys || activeBodyKeys.has(body.key)).map((body) => {
    const longitude = method === "secondary" || method === "fast" ? body.longitude : shiftedLongitude(natal.bodies.find((item) => item.key === body.key)?.longitude ?? body.longitude, arc);
    const details = signData(longitude);
    return {
      key: body.key,
      name: body.name,
      symbol: body.symbol,
      longitude: Number(longitude.toFixed(4)),
      ...details,
      house: houseForLongitude(longitude, houses),
      retrograde: method === "solar_arc" ? false : body.retrograde,
    };
  });
}

function approximateDailySpeed(bodyKey: string, method: ProgressionMethod): number {
  if (method === "solar_arc") return 0.0027; // ~1 degree per year / 365
  if (method === "fast") {
    if (bodyKey === "moon") return 13.176 * 12; // ~158 degrees per year
    if (bodyKey === "sun") return 0.9856 * 12; // ~11.8 degrees per year
    return 1.0 * 12; // rough average for others
  }
  // secondary
  if (bodyKey === "moon") return 13.176 / 365.25; // ~0.036 degrees per day
  if (bodyKey === "sun") return 0.9856 / 365.25; // ~0.0027 degrees per day
  return 1.0 / 365.25; // rough average for others
}

function buildAspects(
  method: ProgressionMethod,
  exactDate: string,
  sources: ProgressionPoint[],
  targets: NatalBody[],
  orb: number,
  activeTargetKeys?: ReadonlySet<string>,
  futureSources: ProgressionPoint[] = [],
): ProgressionAspect[] {
  const aspects: ProgressionAspect[] = [];
  for (const source of sources) {
    for (const target of targets) {
      if (activeTargetKeys && !activeTargetKeys.has(target.key)) continue;
      const distance = angularDistance(source.longitude, target.longitude);
      let best: { key: string; diff: number, angle: number } | null = null;
      for (const candidate of MAJOR_ASPECTS) {
        const diff = Math.abs(distance - candidate.angle);
        if (diff <= orb && (!best || diff < best.diff)) best = { key: candidate.key, diff, angle: candidate.angle };
      }
      if (best) {
        const futureSource = futureSources.find((item) => item.key === source.key);
        const futureDistance = futureSource ? angularDistance(futureSource.longitude, target.longitude) : undefined;
        const futureDiff = futureDistance === undefined ? undefined : Math.abs(futureDistance - best.angle);
        const phase = futureDiff === undefined ? "exact" : Math.abs(futureDiff - best.diff) < 0.02 ? "exact" : futureDiff < best.diff ? "applying" : "separating";
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
          applying: phase === "applying",
          phase,
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

export function computeSecondaryProgressions(
  input: NatalChartInput,
  targetDate: Date,
  natalOverride?: NatalChart,
  activeBodyKeys?: ReadonlySet<string>,
  includePhase = false,
): ProgressionResult {
  const birthDate = buildBirthDate(input);
  const ageYears = ageInYears(birthDate, targetDate);
  if (ageYears < 0) throw new Error("Дата прогрессии не может быть раньше рождения");
  const progressedDate = progressedDateForAge(birthDate, ageYears);
  const progressedInput = { ...input, ...dateParts(progressedDate) };
  const natal = natalOverride ?? computeNatalChart(input);
  const progressed = computeNatalChart(progressedInput);
  const progressedSun = progressed.bodies.find((body) => body.key === "sun");
  const natalSun = natal.bodies.find((body) => body.key === "sun");
  const solarArc = progressedSun && natalSun ? normalize(progressedSun.longitude - natalSun.longitude) : 0;
  const houses = shiftHouses(natal.houses, solarArc);
  const points = makeProgressedPoints(natal, progressed, houses, solarArc, "secondary", activeBodyKeys);
  let futurePoints: ProgressionPoint[] = [];
  if (includePhase) {
    const nextDate = addDays(targetDate, 1);
    const nextAgeYears = ageInYears(birthDate, nextDate);
    const nextProgressedDate = progressedDateForAge(birthDate, nextAgeYears);
    const nextProgressed = computeNatalChart({ ...input, ...dateParts(nextProgressedDate) });
    const nextSun = nextProgressed.bodies.find((body) => body.key === "sun");
    const nextArc = nextSun && natalSun ? normalize(nextSun.longitude - natalSun.longitude) : solarArc;
    futurePoints = makeProgressedPoints(natal, nextProgressed, shiftHouses(natal.houses, nextArc), nextArc, "secondary", activeBodyKeys);
  }
  const aspects = buildAspects("secondary", isoDate(targetDate), points, natal.bodies, PROGRESSION_ORB, activeBodyKeys, futurePoints);
  const moon = activeBodyKeys?.has("moon") === false ? undefined : points.find((point) => point.key === "moon");
  if (moon) {
    const moonAspects = buildAspects("secondary", isoDate(targetDate), [moon], natal.bodies, PROGRESSED_MOON_ORB, activeBodyKeys, futurePoints.filter((point) => point.key === "moon"));
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

export function computeFastProgressions(input: NatalChartInput, targetDate: Date, natalOverride?: NatalChart): ProgressionResult {
  const birthDate = buildBirthDate(input);
  const ageYears = ageInYears(birthDate, targetDate);
  if (ageYears < 0) throw new Error("Дата быстрой прогрессии не может быть раньше рождения");
  const lifeDays = (targetDate.getTime() - birthDate.getTime()) / 86400000;
  const progressedDate = addDays(birthDate, lifeDays / 12);
  const progressedInput = { ...input, ...dateParts(progressedDate) };
  const natal = natalOverride ?? computeNatalChart(input);
  const progressed = computeNatalChart(progressedInput);
  const progressedSun = progressed.bodies.find((body) => body.key === "sun");
  const natalSun = natal.bodies.find((body) => body.key === "sun");
  const solarArc = progressedSun && natalSun ? normalize(progressedSun.longitude - natalSun.longitude) : 0;
  const houses = shiftHouses(natal.houses, solarArc);
  const points = makeProgressedPoints(natal, progressed, houses, solarArc, "fast");
  const aspects = buildAspects("fast", isoDate(targetDate), points, natal.bodies, PROGRESSION_ORB);
  return {
    targetDate: isoDate(targetDate),
    progressedDate: progressedDate.toISOString(),
    ageYears: Number(ageYears.toFixed(6)),
    solarArc: Number(solarArc.toFixed(4)),
    points,
    houses,
    angles: natal.angles.map((angle) => shiftAngle(angle, solarArc)),
    aspects,
  };
}

export function computeSolarArcDirections(input: NatalChartInput, targetDate: Date, natalOverride?: NatalChart): ProgressionResult {
  const secondary = computeSecondaryProgressions(input, targetDate, natalOverride);
  const natal = natalOverride ?? computeNatalChart(input);
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

function dateOnly(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function addCalendarDays(date: Date, days: number): Date {
  const result = dateOnly(date);
  result.setUTCDate(result.getUTCDate() + days);
  return result;
}

/**
 * Builds explicit windows instead of treating a planet as active in a house
 * for the whole period after it crosses the cusp. Only personal planets are
 * scanned, and only major-aspect-sized cusp orbs are used.
 */
export function computeSecondaryProgressionWindows(
  input: NatalChartInput,
  dateFrom: Date,
  dateTo: Date,
  natalOverride?: NatalChart,
): SecondaryProgressionWindow[] {
  const natal = natalOverride ?? computeNatalChart(input);
  const from = addCalendarDays(dateFrom, -400);
  const to = addCalendarDays(dateTo, 400);
  const samples: Array<{ date: Date; result: ProgressionResult }> = [];
  for (let cursor = from; cursor <= to; cursor = addCalendarDays(cursor, 1)) {
    samples.push({ date: new Date(cursor), result: computeSecondaryProgressions(input, cursor, natal, new Set(PERSONAL_PROGRESSIVE_BODY_KEYS), true) });
  }

  const windows: SecondaryProgressionWindow[] = [];
  for (const bodyKey of PERSONAL_PROGRESSIVE_BODY_KEYS) {
    const bodyName = samples[0]?.result.points.find((point) => point.key === bodyKey)?.name;
    if (!bodyName) continue;

    for (const house of natal.houses) {
      const inside = samples.map((sample) => {
        const point = sample.result.points.find((item) => item.key === bodyKey);
        return Boolean(point && angularDistance(point.longitude, house.longitude) <= PROGRESSION_CUSP_ORB);
      });
      let index = 0;
      while (index < inside.length) {
        if (!inside[index]) { index += 1; continue; }
        const startIndex = index;
        while (index + 1 < inside.length && inside[index + 1]) index += 1;
        const endIndex = index;
        let peakIndex = startIndex;
        let peakOrb = Number.POSITIVE_INFINITY;
        for (let candidate = startIndex; candidate <= endIndex; candidate += 1) {
          const point = samples[candidate].result.points.find((item) => item.key === bodyKey);
          if (!point) continue;
          const orb = angularDistance(point.longitude, house.longitude);
          if (orb < peakOrb) { peakOrb = orb; peakIndex = candidate; }
        }
        if (endIndex > startIndex || peakOrb <= 0.05) {
          const point = samples[peakIndex].result.points.find((item) => item.key === bodyKey)!;
          windows.push({
            method: "secondary",
            eventType: "ingress_house_cusp",
            sourceBody: bodyName,
            sourceBodyKey: bodyKey,
            targetHouse: house.number,
            targetCuspLongitude: Number(house.longitude.toFixed(4)),
            startDate: isoDate(samples[startIndex].date),
            peakDate: isoDate(samples[peakIndex].date),
            endDate: isoDate(samples[endIndex].date),
            orb: Number(peakOrb.toFixed(2)),
            descriptionKey: "house_cusp",
          });
        }
        index += 1;
      }
    }
  }

  const moonTransitions: SecondaryProgressionWindow[] = [];
  let previousSignKey: string | undefined;
  for (let index = 0; index < samples.length; index += 1) {
    const moon = samples[index].result.points.find((point) => point.key === "moon");
    if (!moon) continue;
    if (previousSignKey !== undefined && moon.signKey !== previousSignKey) {
      const exitIndex = index - 1;
      const nextChange = samples.slice(index + 1).findIndex((sample) => sample.result.points.find((point) => point.key === "moon")?.signKey !== moon.signKey);
      const endIndex = nextChange === -1 ? samples.length - 1 : index + nextChange;
      moonTransitions.push({
        method: "secondary",
        eventType: "sign_ingress",
        sourceBody: moon.name,
        sourceBodyKey: "moon",
        sourceSign: moon.sign,
        sourceSignKey: moon.signKey,
        startDate: isoDate(samples[index].date),
        peakDate: isoDate(samples[index].date),
        endDate: isoDate(samples[endIndex].date),
        orb: 0,
        descriptionKey: "moon_sign",
      });
    }
    previousSignKey = moon.signKey;
  }
  return [...windows, ...moonTransitions]
    .filter((window) => window.endDate >= isoDate(dateFrom) && window.startDate <= isoDate(dateTo))
    .sort((a, b) => a.startDate.localeCompare(b.startDate) || a.sourceBody.localeCompare(b.sourceBody));
}

function groupWindow<T>(samples: Array<{ date: Date; value: T | null }>, isActive: (value: T) => boolean, distance: (value: T) => number): { start: number; peak: number; end: number }[] {
  const result: { start: number; peak: number; end: number }[] = [];
  let index = 0;
  while (index < samples.length) {
    const firstValue = samples[index].value;
    if (firstValue == null || !isActive(firstValue)) { index += 1; continue; }
    const start = index;
    while (index + 1 < samples.length && samples[index + 1].value && isActive(samples[index + 1].value!)) index += 1;
    const end = index;
    let peak = start;
    let best = distance(samples[start].value!);
    for (let candidate = start + 1; candidate <= end; candidate += 1) {
      const current = distance(samples[candidate].value!);
      if (current < best) { best = current; peak = candidate; }
    }
    result.push({ start, peak, end });
    index += 1;
  }
  return result;
}

function majorAspectDistance(a: number, b: number, aspectKey: string): number {
  const angle = MAJOR_ASPECTS.find((aspect) => aspect.key === aspectKey)?.angle ?? 0;
  return Math.abs(angularDistance(a, b) - angle);
}

export function computeSecondaryProgressionAspectWindows(
  input: NatalChartInput,
  dateFrom: Date,
  dateTo: Date,
  natalOverride?: NatalChart,
): ProgressionAspectWindow[] {
  const natal = natalOverride ?? computeNatalChart(input);
  const from = addCalendarDays(dateFrom, -400);
  const to = addCalendarDays(dateTo, 400);
  const dates: Date[] = [];
  const results: ProgressionResult[] = [];
  for (let cursor = from; cursor <= to; cursor = addCalendarDays(cursor, 1)) {
    dates.push(new Date(cursor));
    results.push(computeSecondaryProgressions(input, cursor, natal, undefined, true));
  }
  const windows: ProgressionAspectWindow[] = [];
  const sourcePoints = results[0]?.points ?? [];
  for (const source of sourcePoints) {
    for (const target of natal.bodies) {
      if (source.key === target.key) continue;
      for (const aspect of MAJOR_ASPECTS) {
        const samples = results.map((result, index) => {
          const point = result.points.find((item) => item.key === source.key);
          if (!point) return { date: dates[index], value: null };
          const orb = majorAspectDistance(point.longitude, target.longitude, aspect.key);
          return { date: dates[index], value: { orb, sourceHouse: point.house, targetHouse: target.house ?? null } };
        });
        const orbLimit = source.key === "moon" ? PROGRESSED_MOON_ORB : PROGRESSION_ORB;
        for (const group of groupWindow(samples, (value) => value.orb <= orbLimit, (value) => value.orb)) {
          const peak = samples[group.peak].value!;
          const before = group.start > 0 ? samples[group.start - 1].value : null;
          const after = group.end + 1 < samples.length ? samples[group.end + 1].value : null;
          const phase = before && before.orb > peak.orb ? "applying" : after && after.orb > peak.orb ? "separating" : "exact";
          windows.push({
            method: "secondary",
            eventType: "major_aspect",
            sourceBody: source.name,
            sourceBodyKey: source.key,
            targetBody: target.name,
            targetBodyKey: target.key,
            aspectKey: aspect.key,
            startDate: isoDate(samples[group.start].date),
            peakDate: isoDate(samples[group.peak].date),
            endDate: isoDate(samples[group.end].date),
            orb: Number(peak.orb.toFixed(2)),
            phase,
            sourceHouse: peak.sourceHouse,
            targetHouse: peak.targetHouse,
            descriptionKey: "progressed_to_natal",
          });
        }
      }
    }
  }
  return windows
    .filter((window) => window.endDate >= isoDate(dateFrom) && window.startDate <= isoDate(dateTo))
    .sort((a, b) => a.startDate.localeCompare(b.startDate) || a.orb - b.orb);
}

export function computeSecondaryLunationWindows(
  input: NatalChartInput,
  dateFrom: Date,
  dateTo: Date,
  natalOverride?: NatalChart,
): ProgressionLunationWindow[] {
  const natal = natalOverride ?? computeNatalChart(input);
  const from = addCalendarDays(dateFrom, -400);
  const to = addCalendarDays(dateTo, 400);
  const dates: Date[] = [];
  const results: ProgressionResult[] = [];
  for (let cursor = from; cursor <= to; cursor = addCalendarDays(cursor, 1)) {
    dates.push(new Date(cursor));
    results.push(computeSecondaryProgressions(input, cursor, natal, new Set(["sun", "moon"]), true));
  }
  const windows: ProgressionLunationWindow[] = [];
  for (const event of [{ key: "progressed_new_moon", angle: 0 }, { key: "progressed_full_moon", angle: 180 }] as const) {
    const samples = results.map((result, index) => {
      const sun = result.points.find((point) => point.key === "sun");
      const moon = result.points.find((point) => point.key === "moon");
      if (!sun || !moon) return { date: dates[index], value: null };
      return { date: dates[index], value: Math.abs(angularDistance(sun.longitude, moon.longitude) - event.angle) };
    });
    for (const group of groupWindow(samples, (value) => value <= PROGRESSION_ORB, (value) => value)) {
      const peakDate = samples[group.peak].date;
      const peakResult = results[group.peak];
      const sun = peakResult.points.find((point) => point.key === "sun");
      const moon = peakResult.points.find((point) => point.key === "moon");
      if (!sun || !moon) continue;
      let contact: { body: NatalBody; aspectKey: string } | null = null;
      for (const body of natal.bodies) {
        for (const source of [sun, moon]) {
          const candidate = MAJOR_ASPECTS.map((aspect) => ({ aspect, orb: majorAspectDistance(source.longitude, body.longitude, aspect.key) }))
            .sort((a, b) => a.orb - b.orb)[0];
          if (candidate && candidate.orb <= PROGRESSED_MOON_ORB && (!contact || candidate.orb < majorAspectDistance(source.longitude, contact.body.longitude, contact.aspectKey))) {
            contact = { body, aspectKey: candidate.aspect.key };
          }
        }
      }
      if (!contact) continue;
      windows.push({
        method: "secondary",
        eventType: event.key,
        startDate: isoDate(samples[group.start].date),
        peakDate: isoDate(peakDate),
        endDate: isoDate(samples[group.end].date),
        orb: Number(samples[group.peak].value!.toFixed(2)),
        natalContactBody: contact.body.name,
        natalContactBodyKey: contact.body.key,
        natalContactAspect: contact.aspectKey,
        descriptionKey: "lunation_with_natal_contact",
      });
    }
  }
  return windows
    .filter((window) => window.endDate >= isoDate(dateFrom) && window.startDate <= isoDate(dateTo))
    .sort((a, b) => a.startDate.localeCompare(b.startDate));
}
