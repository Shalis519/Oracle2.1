import {
  computeTransits,
  type NatalChart,
  type NatalChartInput,
  type TransitAspect,
} from "./astrology";

export type TransitWindowPhase = "applying" | "exact" | "separating";

export interface TransitAspectSample {
  date: string;
  aspect: TransitAspect;
}

export interface LongTermTransitWindow {
  key: string;
  transitBodyKey: string;
  natalBodyKey: string;
  aspectKey: string;
  startDate: string;
  peakDate: string;
  endDate: string;
  peakOrb: number;
  focusDate: string;
  focusOrb: number;
  phase: TransitWindowPhase;
  phaseReference: "forecast_start" | "window_start";
  aspect: TransitAspect;
}

const FAST_TRANSIT_BODY_KEYS = new Set(["sun", "mercury", "venus", "mars"]);
const LONG_TERM_EXCLUDED_NATAL_BODY_KEYS = [
  "chiron",
  "lilith",
  "northnode",
  "southnode",
];
const WINDOW_PADDING_DAYS = 14;

function isoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function addCalendarDays(date: Date, days: number): Date {
  const result = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
  result.setUTCDate(result.getUTCDate() + days);
  return result;
}

function daysBetween(first: string, second: string): number {
  return Math.round(
    (new Date(`${second}T00:00:00.000Z`).getTime() -
      new Date(`${first}T00:00:00.000Z`).getTime()) /
      86400000,
  );
}

function phaseAt(samples: TransitAspectSample[], index: number): TransitWindowPhase {
  const current = samples[index];
  const previous = samples[index - 1];
  const next = samples[index + 1];

  if (current.aspect.orb <= 0.05) return "exact";
  if (next && next.aspect.orb + 0.005 < current.aspect.orb) return "applying";
  if (previous && previous.aspect.orb + 0.005 < current.aspect.orb) return "separating";
  if (next && next.aspect.orb > current.aspect.orb + 0.005) return "separating";
  if (previous && previous.aspect.orb > current.aspect.orb + 0.005) return "applying";
  return "exact";
}

/**
 * Groups daily samples of the same transit into continuous active periods.
 * The astronomical aspect and its existing orb are supplied by computeTransits.
 */
export function groupTransitAspectSamples(
  samples: TransitAspectSample[],
  forecastStart: string,
): LongTermTransitWindow[] {
  const byKey = new Map<string, TransitAspectSample[]>();
  for (const sample of samples) {
    const key = `${sample.aspect.transitBodyKey}|${sample.aspect.natalBodyKey}|${sample.aspect.typeKey}`;
    const entries = byKey.get(key) ?? [];
    entries.push(sample);
    byKey.set(key, entries);
  }

  const windows: LongTermTransitWindow[] = [];
  for (const [key, entries] of byKey) {
    entries.sort((a, b) => a.date.localeCompare(b.date));
    let group: TransitAspectSample[] = [];
    const pushGroup = () => {
      if (!group.length) return;
      let peakIndex = 0;
      for (let index = 1; index < group.length; index += 1) {
        if (group[index].aspect.orb < group[peakIndex].aspect.orb) peakIndex = index;
      }
      const referenceIndex = Math.max(
        0,
        group.findIndex((sample) => sample.date >= forecastStart),
      );
      const focusIndex = group.findIndex((sample) => sample.date === forecastStart);
      const selectedIndex = focusIndex >= 0 ? focusIndex : referenceIndex;
      const peak = group[peakIndex];
      const focus = group[selectedIndex];
      windows.push({
        key,
        transitBodyKey: peak.aspect.transitBodyKey,
        natalBodyKey: peak.aspect.natalBodyKey,
        aspectKey: peak.aspect.typeKey,
        startDate: group[0].date,
        peakDate: peak.date,
        endDate: group[group.length - 1].date,
        peakOrb: peak.aspect.orb,
        focusDate: focus.date,
        focusOrb: focus.aspect.orb,
        phase: phaseAt(group, selectedIndex),
        phaseReference:
          focusIndex >= 0 ? "forecast_start" : "window_start",
        aspect: peak.aspect,
      });
      group = [];
    };

    for (const entry of entries) {
      const last = group[group.length - 1];
      if (last && daysBetween(last.date, entry.date) !== 1) pushGroup();
      group.push(entry);
    }
    pushGroup();
  }

  return windows.sort(
    (left, right) =>
      left.startDate.localeCompare(right.startDate) ||
      left.peakOrb - right.peakOrb ||
      left.key.localeCompare(right.key),
  );
}

export function computeFastTransitAspectWindows(
  input: NatalChartInput,
  natal: NatalChart,
  dateFrom: Date,
  dateTo: Date,
): LongTermTransitWindow[] {
  const samples: TransitAspectSample[] = [];
  const from = addCalendarDays(dateFrom, -WINDOW_PADDING_DAYS);
  const to = addCalendarDays(dateTo, WINDOW_PADDING_DAYS);

  for (let cursor = from; cursor <= to; cursor = addCalendarDays(cursor, 1)) {
    const result = computeTransits(
      natal,
      isoDate(cursor),
      input.latitude,
      input.longitude,
      input.timezone,
      {
        excludedBodies: ["moon"],
        excludedNatalBodies: LONG_TERM_EXCLUDED_NATAL_BODY_KEYS,
        maxAspects: null,
      },
    );
    for (const aspect of result?.aspects ?? []) {
      if (!FAST_TRANSIT_BODY_KEYS.has(aspect.transitBodyKey)) continue;
      samples.push({ date: isoDate(cursor), aspect });
    }
  }

  const forecastStart = isoDate(dateFrom);
  const forecastEnd = isoDate(dateTo);
  return groupTransitAspectSamples(samples, forecastStart).filter(
    (window) =>
      window.endDate >= forecastStart && window.startDate <= forecastEnd,
  );
}

export function isFastTransitBody(bodyKey: string): boolean {
  return FAST_TRANSIT_BODY_KEYS.has(bodyKey);
}
