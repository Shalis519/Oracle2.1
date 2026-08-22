export interface BirthClockInput {
  isoDate: string;
  time: string | null | undefined;
  timezone: string | null | undefined;
  longitude: number;
  solarTimeMode?: "mean" | "true";
}

export interface BirthClockResult {
  civilDate: string;
  civilTime: string;
  solarDate: string;
  solarTime: string;
  utcOffsetMinutes: number;
  longitudeCorrectionMinutes: number;
  equationOfTimeMinutes: number;
  crossedCivilDate: boolean;
}

function parseInput(input: BirthClockInput): { year: number; month: number; day: number; hour: number; minute: number } | null {
  const date = /^(\d{4})-(\d{2})-(\d{2})/.exec(input.isoDate ?? "");
  const time = /^(\d{1,2}):(\d{2})/.exec(input.time ?? "12:00");
  if (!date || !time) return null;
  const year = Number(date[1]);
  const month = Number(date[2]);
  const day = Number(date[3]);
  const hour = Number(time[1]);
  const minute = Number(time[2]);
  const probe = new Date(year, month - 1, day, hour, minute, 0);
  if (!Number.isFinite(input.longitude) || input.longitude < -180 || input.longitude > 180) return null;
  if (probe.getFullYear() !== year || probe.getMonth() !== month - 1 || probe.getDate() !== day || hour > 23 || minute > 59) return null;
  return { year, month, day, hour, minute };
}

function zonedParts(utcMs: number, timezone: string): Record<string, number> {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(new Date(utcMs));
  return Object.fromEntries(parts.filter((p) => p.type !== "literal").map((p) => [p.type, Number(p.value)]));
}

function offsetMinutesForLocal(year: number, month: number, day: number, hour: number, minute: number, timezone: string | null | undefined): number {
  if (!timezone) return 0;
  try {
    const localAsUtc = Date.UTC(year, month - 1, day, hour, minute, 0);
    const parts = zonedParts(localAsUtc, timezone);
    const shownAsUtc = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second);
    return Math.round((shownAsUtc - localAsUtc) / 60000);
  } catch {
    return 0;
  }
}

/** Equation of time in minutes, NOAA approximation. */
function equationOfTimeMinutes(date: Date): number {
  const start = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const day = Math.floor((date.getTime() - start.getTime()) / 86400000) + 1;
  const b = (2 * Math.PI * (day - 81)) / 364;
  return 9.87 * Math.sin(2 * b) - 7.53 * Math.cos(b) - 1.5 * Math.sin(b);
}

function formatLocal(ms: number): { date: string; time: string } {
  const d = new Date(ms);
  const yyyy = d.getUTCFullYear();
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(d.getUTCDate()).padStart(2, "0");
  const hh = String(d.getUTCHours()).padStart(2, "0");
  const mi = String(d.getUTCMinutes()).padStart(2, "0");
  return { date: `${yyyy}-${mm}-${dd}`, time: `${hh}:${mi}` };
}

/**
 * Converts civil birth time to true local solar time. This helper is diagnostic
 * until the project confirms that the chosen Qimen reference uses this mode.
 */
export function localSolarTime(input: BirthClockInput): BirthClockResult | null {
  const parsed = parseInput(input);
  if (!parsed) return null;
  const offset = offsetMinutesForLocal(parsed.year, parsed.month, parsed.day, parsed.hour, parsed.minute, input.timezone);
  const civilUtc = Date.UTC(parsed.year, parsed.month - 1, parsed.day, parsed.hour, parsed.minute, 0) - offset * 60000;
  const utcDate = new Date(civilUtc);
  const longitudeCorrection = input.longitude * 4;
  const equation = input.solarTimeMode === "true" ? equationOfTimeMinutes(utcDate) : 0;
  const solarMs = civilUtc + (longitudeCorrection + equation) * 60000;
  const formatted = formatLocal(solarMs);
  return {
    civilDate: `${String(parsed.year).padStart(4, "0")}-${String(parsed.month).padStart(2, "0")}-${String(parsed.day).padStart(2, "0")}`,
    civilTime: `${String(parsed.hour).padStart(2, "0")}:${String(parsed.minute).padStart(2, "0")}`,
    solarDate: formatted.date,
    solarTime: formatted.time,
    utcOffsetMinutes: offset,
    longitudeCorrectionMinutes: longitudeCorrection,
    equationOfTimeMinutes: Number(equation.toFixed(2)),
    crossedCivilDate: formatted.date !== `${String(parsed.year).padStart(4, "0")}-${String(parsed.month).padStart(2, "0")}-${String(parsed.day).padStart(2, "0")}`,
  };
}

/** Hour branch from a solar clock, with 子 spanning 23:00–00:59. */
export const trueLocalSolarTime = localSolarTime;

export function hourBranchFromClock(time: string): number {
  const match = /^(\d{1,2}):(\d{2})/.exec(time);
  if (!match) return -1;
  const hour = Number(match[1]);
  if (hour < 0 || hour > 23) return -1;
  return Math.floor((hour + 1) / 2) % 12;
}

/** Returns true for the late-Zi half: 23:00–00:00. */
export function isLateZiClock(_date: string, time: string): boolean {
  const match = /^(\d{1,2}):(\d{2})/.exec(time);
  if (!match) return false;
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  return hour === 23 && minute >= 0 && minute <= 59;
}
