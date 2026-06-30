// Qi Men Dun Jia — calendar primitives backed by lunar-typescript.
import { Solar } from "lunar-typescript";
import { BRANCHES, BRANCH_PALACE, parseGanZhi, XUN_YI_STEM } from "./constants";

export interface DayInfo {
  /** ISO yyyy-mm-dd */
  iso: string;
  /** day stem 0..9 */
  stem: number;
  /** day branch 0..11 */
  branch: number;
  /** sexagenary index 0..59 */
  index: number;
}

export function dateToIso(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function isoToDate(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d, 12, 0, 0);
}

/** Day pillar (Gregorian solar day) for a given Date. Uses local noon to avoid boundary jitter. */
export function dayInfo(d: Date): DayInfo {
  const solar = Solar.fromYmdHms(d.getFullYear(), d.getMonth() + 1, d.getDate(), 12, 0, 0);
  const gz = solar.getLunar().getDayInGanZhi();
  const { stem, branch, index } = parseGanZhi(gz);
  return { iso: dateToIso(d), stem, branch, index };
}

/**
 * Hour pillar via 五鼠遁 (day stem -> hour stem). Hour branch 0..11 (子..亥).
 * 子时 uses the day stem (early-子 convention); each calendar day owns its 12 double-hours.
 */
export function hourStem(dayStem: number, hourBranch: number): number {
  return ((dayStem % 5) * 2 + hourBranch) % 10;
}

/** Hour sexagenary index 0..59 from day stem + hour branch. */
export function hourGanZhiIndex(dayStem: number, hourBranch: number): number {
  const hs = hourStem(dayStem, hourBranch);
  // find index with index%10==hs and index%12==hourBranch
  for (let i = 0; i < 60; i++) {
    if (i % 10 === hs && i % 12 === hourBranch) return i;
  }
  return -1;
}

export interface XunInfo {
  /** xun number 0..5 (甲子..甲寅 -> 0..5) */
  xunNo: number;
  /** 旬首 leader 仪 stem (戊己庚辛壬癸) */
  yiStem: number;
  /** position within xun = stem index 0..9 (steps for 值使 advance) */
  pos: number;
  /** the two void branches (旬空) */
  voidBranches: [number, number];
  /** void palaces */
  voidPalaces: number[];
}

/** 旬 info for a sexagenary index (0..59): leader 仪, position, and 旬空 void. */
export function xunInfo(gzIndex: number): XunInfo {
  const leaderIndex = gzIndex - (gzIndex % 10); // 0,10,20,30,40,50
  const xunNo = leaderIndex / 10;
  const yiStem = XUN_YI_STEM[xunNo];
  const pos = gzIndex % 10;
  const leaderBranch = leaderIndex % 12;
  const v1 = (leaderBranch + 10) % 12;
  const v2 = (leaderBranch + 11) % 12;
  const voidPalaces = Array.from(new Set([BRANCH_PALACE[v1], BRANCH_PALACE[v2]]));
  return { xunNo, yiStem, pos, voidBranches: [v1, v2], voidPalaces };
}

export interface TermPoint {
  name: string; // Chinese name, e.g. "冬至"
  date: Date;
}

/** The solar term in effect at date d (most recent term boundary at or before d). */
export function currentTerm(d: Date): TermPoint {
  const solar = Solar.fromYmdHms(d.getFullYear(), d.getMonth() + 1, d.getDate(), d.getHours(), d.getMinutes(), 0);
  const jq = solar.getLunar().getPrevJieQi(true);
  return { name: jq.getName(), date: solarToDate(jq.getSolar()) };
}

/** Next solar term strictly after date d. */
export function nextTerm(d: Date): TermPoint {
  const solar = Solar.fromYmdHms(d.getFullYear(), d.getMonth() + 1, d.getDate(), d.getHours(), d.getMinutes(), 0);
  const jq = solar.getLunar().getNextJieQi(true);
  return { name: jq.getName(), date: solarToDate(jq.getSolar()) };
}

function solarToDate(s: { getYear(): number; getMonth(): number; getDay(): number; getHour(): number; getMinute(): number; getSecond(): number }): Date {
  return new Date(s.getYear(), s.getMonth() - 1, s.getDay(), s.getHour(), s.getMinute(), s.getSecond());
}

/** Days (signed, fractional) from a to b. */
export function dayDiff(a: Date, b: Date): number {
  return (b.getTime() - a.getTime()) / 86400000;
}

/** DST-proof civil day number (counts whole calendar days, ignoring time-of-day). */
export function dayNumber(d: Date): number {
  return Math.floor(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 86400000);
}

/**
 * Year-pillar branch index (0..11) for a birth date, using the 立春 (Lichun) year boundary.
 * Returns -1 for malformed or invalid dates (caller treats as "no usable birth date").
 */
export function birthYearBranch(iso: string): number {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso ?? "");
  if (!m) return -1;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  // Calendar validity (rejects e.g. 2026-02-30, month 0/13).
  const probe = new Date(y, mo - 1, d);
  if (probe.getFullYear() !== y || probe.getMonth() !== mo - 1 || probe.getDate() !== d) {
    return -1;
  }
  try {
    const zhi = Solar.fromYmd(y, mo, d).getLunar().getEightChar().getYearZhi();
    return BRANCHES.indexOf(zhi as (typeof BRANCHES)[number]);
  } catch {
    return -1;
  }
}
