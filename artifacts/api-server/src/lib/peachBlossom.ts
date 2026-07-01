import { Solar } from "lunar-typescript";
import {
  PEACH_ANIMAL_META,
  PEACH_INTERPRETATION,
  magnetismText,
  boostPeopleText,
  YEAR_NOTE,
  DAY_NOTE,
  sameOverview,
  differentOverview,
  FAVORABLE_YEAR_NOTE,
  FAVORABLE_DAY_NOTE,
  FAVORABLE_SAME_NOTE,
  FAVORABLE_FOOTER,
  ACTIVATION_INTRO,
  ACTIVATION_METHODS,
  ACTIVATION_CONDITIONS,
  ACTIVATION_WARNINGS,
  ACTIVATION_PLACEMENT,
  ACTIVATION_WHEN_TO_START,
  type PeachAnimal,
} from "../data/peachBlossom";

// Canonical order of the twelve Earthly Branches (地支), index 子=0 … 亥=11.
const ZHI_CN = "子丑寅卯辰巳午未申酉戌亥".split("");

// Russian animal names by branch index.
const ANIMALS_RU = [
  "Крыса",
  "Бык",
  "Тигр",
  "Кролик",
  "Дракон",
  "Змея",
  "Лошадь",
  "Коза",
  "Обезьяна",
  "Петух",
  "Собака",
  "Свинья",
];

// Russian pinyin of each branch by index.
const BRANCH_PINYIN = [
  "Цзы",
  "Чоу",
  "Инь",
  "Мао",
  "Чэнь",
  "Сы",
  "У",
  "Вэй",
  "Шэнь",
  "Ю",
  "Сюй",
  "Хай",
];

const MONTHS_RU = [
  "января",
  "февраля",
  "марта",
  "апреля",
  "мая",
  "июня",
  "июля",
  "августа",
  "сентября",
  "октября",
  "ноября",
  "декабря",
];
const WEEKDAYS_RU = ["пн", "вт", "ср", "чт", "пт", "сб", "вс"];

// Two-hour periods by branch index (子=0 starts at 23:00).
const TWO_HOUR_PERIODS = [
  "23:00–01:00",
  "01:00–03:00",
  "03:00–05:00",
  "05:00–07:00",
  "07:00–09:00",
  "09:00–11:00",
  "11:00–13:00",
  "13:00–15:00",
  "15:00–17:00",
  "17:00–19:00",
  "19:00–21:00",
  "21:00–23:00",
];

// Six-harmony (六合) partner of each branch by index.
const SIX_HARMONY = [1, 0, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2];
// Triple-combination frames (三合 союз).
const SAN_HE_GROUPS = [
  [8, 0, 4], // 申子辰
  [11, 3, 7], // 亥卯未
  [2, 6, 10], // 寅午戌
  [5, 9, 1], // 巳酉丑
];
// Seasonal/directional trios (三會/方合 сезон).
const SEASONAL_GROUPS = [
  [2, 3, 4], // 寅卯辰
  [5, 6, 7], // 巳午未
  [8, 9, 10], // 申酉戌
  [11, 0, 1], // 亥子丑
];

// Six-harm (六害) partner of each branch by index (нежелательный час).
const SIX_HARMS: Record<number, number> = {
  0: 7,
  7: 0,
  1: 6,
  6: 1,
  2: 5,
  5: 2,
  3: 4,
  4: 3,
  8: 11,
  11: 8,
  9: 10,
  10: 9,
};

// Noble Person (天乙贵人) branch indices by the day's Heavenly Stem character.
const GUIREN: Record<string, number[]> = {
  甲: [1, 7],
  乙: [0, 8],
  丙: [11, 9],
  丁: [11, 9],
  戊: [1, 7],
  己: [0, 8],
  庚: [2, 6],
  辛: [2, 6],
  壬: [3, 5],
  癸: [3, 5],
};

// Peach flower branch index by branch index of the year/day pillar.
// 申子辰→酉(9)Петух · 寅午戌→卯(3)Кролик · 亥卯未→子(0)Крыса · 巳酉丑→午(6)Лошадь.
const PEACH_MAP: Record<number, PeachAnimal> = {
  8: "Петух",
  0: "Петух",
  4: "Петух",
  2: "Кролик",
  6: "Кролик",
  10: "Кролик",
  11: "Крыса",
  3: "Крыса",
  7: "Крыса",
  5: "Лошадь",
  9: "Лошадь",
  1: "Лошадь",
};

const PEACH_ANIMAL_BRANCH_IDX: Record<PeachAnimal, number> = {
  Крыса: 0,
  Лошадь: 6,
  Кролик: 3,
  Петух: 9,
};

// Display order of the double-hours (from 丑, wrapping to 子 last) — matches the source.
const HOUR_ORDER_IDX = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 0];

/** Six-clash (六冲) partner of an Earthly Branch by index. */
const clashOf = (i: number): number => (i + 6) % 12;

/** True when `branch` clashes (六冲) with any of the given branches. */
function clashesWith(branch: number, others: number[]): boolean {
  const c = clashOf(branch);
  return others.includes(c);
}

interface ParsedDate {
  year: number;
  month: number;
  day: number;
}

function parseDate(dateStr: string): ParsedDate | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(dateStr);
  if (!m) return null;
  return { year: Number(m[1]), month: Number(m[2]), day: Number(m[3]) };
}

function parseHourMinute(birthTime: string | null): { hour: number; minute: number } {
  let hour = 12;
  let minute = 0;
  if (birthTime) {
    const hm = /^(\d{1,2}):(\d{2})/.exec(birthTime);
    if (hm) {
      const h = Number(hm[1]);
      const m = Number(hm[2]);
      if (h >= 0 && h <= 23 && m >= 0 && m <= 59) {
        hour = h;
        minute = m;
      }
    }
  }
  return { hour, minute };
}

/** Members of the triple-combination frame (三合) that contains `idx`. */
function sanHeMembers(idx: number): number[] {
  for (const g of SAN_HE_GROUPS) if (g.includes(idx)) return g;
  return [idx];
}

/** Members of the seasonal trio (方合) that contains `idx`. */
function seasonalMembers(idx: number): number[] {
  for (const g of SEASONAL_GROUPS) if (g.includes(idx)) return g;
  return [idx];
}

/**
 * Branches of days valid for activation: the peach flower's own branch plus its
 * 六合 / 三合 / 方合 partners, minus any that clash (六冲) with the natal year/day.
 */
function validDayBranches(pbIdx: number, natalBranchIdxs: number[]): Set<number> {
  const all = new Set<number>([pbIdx, SIX_HARMONY[pbIdx]]);
  for (const b of sanHeMembers(pbIdx)) all.add(b);
  for (const b of seasonalMembers(pbIdx)) all.add(b);
  const out = new Set<number>();
  for (const b of all) if (!clashesWith(b, natalBranchIdxs)) out.add(b);
  return out;
}

/**
 * Good double-hours for a given day: only the Noble Person's hours (天乙贵人),
 * excluding void hours (旬空), the harm hour (六害) and hours clashing (六冲)
 * with the natal year/day branch.
 */
function goodHoursForDay(
  dayGan: string,
  dayBranchIdx: number,
  voidIdxs: number[],
  natalBranchIdxs: number[],
): number[] {
  const guiren = GUIREN[dayGan] ?? [];
  const harmIdx = SIX_HARMS[dayBranchIdx];
  return HOUR_ORDER_IDX.filter(
    (b) =>
      guiren.includes(b) &&
      !voidIdxs.includes(b) &&
      b !== harmIdx &&
      !clashesWith(b, natalBranchIdxs),
  );
}

export interface PeachPair {
  date: string;
  time: string;
}

function formatDate(d: Date): string {
  const weekday = WEEKDAYS_RU[(d.getDay() + 6) % 7];
  return `${d.getDate()} ${MONTHS_RU[d.getMonth()]} (${weekday})`;
}

/** Builds the (day, hour) activation pairs over the next `daysAhead` days. */
function buildDayHourPairs(
  animal: PeachAnimal,
  natalBranchIdxs: number[],
  today: Date,
  daysAhead = 30,
): PeachPair[] {
  const pbIdx = PEACH_ANIMAL_BRANCH_IDX[animal];
  const validDays = validDayBranches(pbIdx, natalBranchIdxs);
  const pairs: PeachPair[] = [];

  for (let i = 1; i <= daysAhead; i++) {
    const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() + i);
    let dayBranchIdx: number;
    let curYearIdx: number;
    let curMonthIdx: number;
    let dayGan: string;
    let voidIdxs: number[];
    try {
      const ec = Solar.fromYmdHms(d.getFullYear(), d.getMonth() + 1, d.getDate(), 12, 0, 0)
        .getLunar()
        .getEightChar();
      dayBranchIdx = ZHI_CN.indexOf(ec.getDayZhi());
      curYearIdx = ZHI_CN.indexOf(ec.getYearZhi());
      curMonthIdx = ZHI_CN.indexOf(ec.getMonthZhi());
      dayGan = ec.getDayGan();
      voidIdxs = Array.from(ec.getDayXunKong())
        .map((c) => ZHI_CN.indexOf(c))
        .filter((x) => x >= 0);
    } catch {
      continue;
    }
    if (dayBranchIdx < 0) continue;
    if (!validDays.has(dayBranchIdx)) continue;
    // Skip the day if its branch clashes with the current year or month.
    if (clashesWith(dayBranchIdx, [curYearIdx, curMonthIdx].filter((x) => x >= 0))) continue;

    const good = goodHoursForDay(dayGan, dayBranchIdx, voidIdxs, natalBranchIdxs);
    if (good.length === 0) continue;

    const dateStr = formatDate(d);
    for (const h of good) {
      pairs.push({ date: dateStr, time: `${TWO_HOUR_PERIODS[h]} (${ANIMALS_RU[h]})` });
    }
  }
  return pairs;
}

export interface PeachFlower {
  scope: "year" | "day";
  scopeLabel: string;
  animal: PeachAnimal;
  branchZh: string;
  branchPinyin: string;
  sector: string;
  degrees: string;
  intro: string;
  body: string;
  darkSide: string;
  keywords: string;
  magnetism: string;
  boostPeople: string;
  note: string;
}

export interface PeachFavorableDay {
  scopeLabel: string;
  animal: PeachAnimal;
  branchZh: string;
  sector: string;
  degrees: string;
  pairs: PeachPair[];
  note: string | null;
}

export interface PeachActivationMethod {
  title: string;
  body: string | null;
  extra: string | null;
  bullets: string[];
}

export interface PeachActivationBlock {
  title: string;
  bullets: string[];
}

export interface PeachActivation {
  intro: string;
  methods: PeachActivationMethod[];
  conditions: PeachActivationBlock;
  warnings: PeachActivationBlock;
  placement: PeachActivationBlock;
  whenToStart: { title: string; text: string };
}

export interface PeachBranchName {
  zh: string;
  ru: string;
}

export interface PeachBlossomResult {
  yearBranch: PeachBranchName;
  dayBranch: PeachBranchName;
  coincide: boolean;
  flowers: PeachFlower[];
  overview: { lines: string[]; bullets: string[] };
  favorableDays: PeachFavorableDay[];
  favorableFooter: string[];
  activation: PeachActivation;
}

function makeFlower(
  scope: "year" | "day",
  scopeLabel: string,
  animal: PeachAnimal,
  note: string,
): PeachFlower {
  const meta = PEACH_ANIMAL_META[animal];
  const interp = PEACH_INTERPRETATION[animal];
  return {
    scope,
    scopeLabel,
    animal,
    branchZh: meta.branchZh,
    branchPinyin: meta.branchPinyin,
    sector: meta.sector,
    degrees: meta.degrees,
    intro: interp.intro,
    body: interp.body,
    darkSide: interp.darkSide,
    keywords: interp.keywords,
    magnetism: magnetismText(animal),
    boostPeople: boostPeopleText(animal),
    note,
  };
}

const ACTIVATION: PeachActivation = {
  intro: ACTIVATION_INTRO,
  methods: ACTIVATION_METHODS,
  conditions: ACTIVATION_CONDITIONS,
  warnings: ACTIVATION_WARNINGS,
  placement: ACTIVATION_PLACEMENT,
  whenToStart: ACTIVATION_WHEN_TO_START,
};

/**
 * Full "Цветок Персика" (桃花) computation. Peach flowers are derived from the
 * birth-year and birth-day Earthly Branches (via lunar-typescript, so solar-term
 * boundaries are respected). Returns null on malformed/out-of-range dates.
 */
export function computePeachBlossom(
  birthDate: string,
  birthTime: string | null,
  today: Date = new Date(),
): PeachBlossomResult | null {
  const d = parseDate(birthDate);
  if (!d) return null;
  if (d.month < 1 || d.month > 12 || d.day < 1 || d.day > 31) return null;

  let yearBranchIdx: number;
  let dayBranchIdx: number;
  try {
    const { hour, minute } = parseHourMinute(birthTime);
    const ec = Solar.fromYmdHms(d.year, d.month, d.day, hour, minute, 0)
      .getLunar()
      .getEightChar();
    yearBranchIdx = ZHI_CN.indexOf(ec.getYearZhi());
    dayBranchIdx = ZHI_CN.indexOf(ec.getDayZhi());
  } catch {
    return null;
  }
  if (yearBranchIdx < 0 || dayBranchIdx < 0) return null;

  const yearAnimal = PEACH_MAP[yearBranchIdx];
  const dayAnimal = PEACH_MAP[dayBranchIdx];
  if (!yearAnimal || !dayAnimal) return null;

  const coincide = yearAnimal === dayAnimal;
  const natalBranchIdxs = [yearBranchIdx, dayBranchIdx];

  const flowers: PeachFlower[] = [makeFlower("year", "года", yearAnimal, YEAR_NOTE)];
  if (!coincide) {
    flowers.push(makeFlower("day", "дня", dayAnimal, DAY_NOTE));
  }

  const overview = coincide
    ? sameOverview(yearAnimal)
    : differentOverview(yearAnimal, dayAnimal);

  const favorableDays: PeachFavorableDay[] = [];
  if (coincide) {
    const meta = PEACH_ANIMAL_META[yearAnimal];
    favorableDays.push({
      scopeLabel: "года и дня",
      animal: yearAnimal,
      branchZh: meta.branchZh,
      sector: meta.sector,
      degrees: meta.degrees,
      pairs: buildDayHourPairs(yearAnimal, natalBranchIdxs, today),
      note: FAVORABLE_SAME_NOTE,
    });
  } else {
    const yMeta = PEACH_ANIMAL_META[yearAnimal];
    const dMeta = PEACH_ANIMAL_META[dayAnimal];
    const yearPairs = buildDayHourPairs(yearAnimal, natalBranchIdxs, today);
    const dayPairs = buildDayHourPairs(dayAnimal, natalBranchIdxs, today);
    favorableDays.push({
      scopeLabel: "года",
      animal: yearAnimal,
      branchZh: yMeta.branchZh,
      sector: yMeta.sector,
      degrees: yMeta.degrees,
      pairs: yearPairs,
      note: yearPairs.length > 0 ? FAVORABLE_YEAR_NOTE : null,
    });
    favorableDays.push({
      scopeLabel: "дня",
      animal: dayAnimal,
      branchZh: dMeta.branchZh,
      sector: dMeta.sector,
      degrees: dMeta.degrees,
      pairs: dayPairs,
      note: dayPairs.length > 0 ? FAVORABLE_DAY_NOTE : null,
    });
  }

  return {
    yearBranch: { zh: ZHI_CN[yearBranchIdx], ru: BRANCH_PINYIN[yearBranchIdx] },
    dayBranch: { zh: ZHI_CN[dayBranchIdx], ru: BRANCH_PINYIN[dayBranchIdx] },
    coincide,
    flowers,
    overview,
    favorableDays,
    favorableFooter: FAVORABLE_FOOTER,
    activation: ACTIVATION,
  };
}
