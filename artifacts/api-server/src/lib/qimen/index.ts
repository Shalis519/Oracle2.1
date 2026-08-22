// Qi Men Dun Jia — public entry: scan an N-day window for personal walk structures.
import {
  BRANCH_ANIMAL_RU,
  BRANCH_ANIMAL_RU_GEN,
  BRANCH_HOUR_WINDOW,
  CHRONOLOGICAL_HOUR_SLOTS,
  BRANCHES,
  clashesBranch,
  PALACES,
  STEMS,
} from "./constants";
import { birthYearBranch, birthYearStem, birthYearRepresentativeStem, dayInfo, xunInfo } from "./calendar";
import { buildChart, buildPeriodMap, type PalaceCell } from "./chart";
import { monthJoeyYapJuForDate, monthPillarForDate } from "./ju";
import { detectThreeGenerals, detectJadeMaiden } from "./structures";
import { computeJiFuWishes, type JiFuWish } from "./jifu";
import { DOOR_NAME_RU, STEM_NAME_RU } from "../../data/qimen/maidens";
import { hourBranchFromClock, isLateZiClock, localSolarTime } from "./birthTime";

export type { JiFuWish } from "./jifu";

const MAIDEN_DAYS = 1;

const STRUCTURE_NAME = "Три Генерала";
const STRUCTURE_GOAL = "Деньги, доход, материальное благополучие";

export interface QimenStructure {
  date: string; // ISO yyyy-mm-dd
  dayGanZhi: string;
  hourBranch: number;
  hourLabel: string; // "час Лошади (11:00–13:00)"
  structure: "three_generals";
  structureName: string;
  goal: string;
  direction: string;
  dom: string;
  wonder: string;
  wonderName: string;
  star: string;
  starName: string;
  door: string;
  activation: string;
  signs: string[];
  result: string;
  note?: string;
}

export interface QimenJadeMaiden {
  date: string;
  dayGanZhi: string;
  hourBranch: number;
  hourLabel: string;
  direction: string;
  dir: string;
  dom: string;
  heavenStem: string;
  heavenStemName: string;
  earthStem: string;
  earthStemName: string;
  door: string;
  doorName: string;
  isMainGate: boolean;
}

export interface QimenBirthChartCell {
  palace: number;
  direction: string;
  trigram: string;
  earthStem: string;
  heavenStem: string;
  hiddenHeavenStem: string;
  hiddenEarthStem: string;
  star: string;
  pairedStar?: string;
  door: string;
  deity: string;
  isVoid: boolean;
  isDestinyPalace?: boolean;
}

export interface QimenBirthChart {
  hourGz: string;
  ju: number;
  yin: boolean;
  fuYin: boolean;
  zhiFuStar: string;
  zhiShiDoor: string;
  zhiFuPalace: number;
  zhiShiPalace: number;
  destinyPalace: number | null;
  cells: QimenBirthChartCell[];
}

export interface QimenMonthChart {
  monthGz: string;
  ju: number;
  yin: boolean;
  fuYin: boolean;
  zhiFuStar: string;
  zhiShiDoor: string;
  zhiFuPalace: number;
  zhiShiPalace: number;
  cells: QimenBirthChartCell[];
}

export interface QimenResult {
  hasBirthDate: boolean;
  birthYearAnimal: string | null;
  windowDays: number;
  maidenWindowDays: number;
  structures: QimenStructure[];
  jiFuWishes: JiFuWish[];
  jadeMaidens: QimenJadeMaiden[];
  birthChart: QimenBirthChart | null;
  monthChart: QimenMonthChart;
}

export interface ComputeOptions {
  birthDate?: string | null; // ISO yyyy-mm-dd
  birthTime?: string | null; // "HH:MM" (affects 立春 year-pillar boundary)
  from?: Date;
  timezone?: string | null; // user's current location timezone
  birthTimezone?: string | null;
  birthLongitude?: number | null;
  days?: number;
}

function localCalendarNoon(timezone?: string | null, instant = new Date()): Date {
  if (!timezone) return new Date(instant.getFullYear(), instant.getMonth(), instant.getDate(), 12, 0, 0);
  try {
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone: timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).formatToParts(instant);
    const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
    return new Date(Number(values.year), Number(values.month) - 1, Number(values.day), 12, 0, 0);
  } catch {
    return new Date(instant.getFullYear(), instant.getMonth(), instant.getDate(), 12, 0, 0);
  }
}

function birthHourParts(birthTime?: string | null): { hourBranch: number; lateZi: boolean; hour: number; minute: number } {
  const match = /^(\d{1,2}):(\d{2})/.exec(birthTime ?? "12:00");
  const hour = match ? Number(match[1]) : 12;
  const minute = match ? Number(match[2]) : 0;
  const safeHour = hour >= 0 && hour <= 23 ? hour : 12;
  const safeMinute = minute >= 0 && minute <= 59 ? minute : 0;
  return { hourBranch: Math.floor((safeHour + 1) / 2) % 12, lateZi: safeHour === 23 && safeMinute >= 29, hour: safeHour, minute: safeMinute };
}

function buildMonthChart(date: Date): QimenMonthChart {
  const pillar = monthPillarForDate(date);
  const chart = buildPeriodMap(date, "month", pillar, monthJoeyYapJuForDate(date));
  const cells = Object.values(chart.cells).map((cell: PalaceCell) => ({
    palace: cell.palace,
    direction: PALACES[cell.palace].dir,
    trigram: PALACES[cell.palace].trigram,
    earthStem: cell.earthStem,
    heavenStem: cell.heavenStem,
    hiddenHeavenStem: cell.hiddenHeavenStem,
    hiddenEarthStem: cell.hiddenEarthStem,
    star: cell.star,
    pairedStar: cell.pairedStar,
    door: cell.door,
    deity: cell.deity,
    isVoid: cell.isVoid,
  }));
  return {
    monthGz: pillar.label,
    ju: chart.ju.ju,
    yin: chart.ju.yin,
    fuYin: chart.fuYin,
    zhiFuStar: chart.zhiFuStar,
    zhiShiDoor: chart.zhiShiDoor,
    zhiFuPalace: chart.zhiFuPalace,
    zhiShiPalace: chart.zhiShiPalace,
    cells,
  };
}

function buildBirthChart(
  birthDate?: string | null,
  birthTime?: string | null,
  birthTimezone?: string | null,
  birthLongitude?: number | null,
): QimenBirthChart | null {
  if (!birthDate) return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(birthDate);
  if (!match) return null;
  const civilTime = birthTime ?? "12:00";
  const solar = birthLongitude != null
    ? localSolarTime({ isoDate: birthDate, time: civilTime, timezone: birthTimezone, longitude: birthLongitude })
    : null;
  // Солнечная поправка выбирает часовую ветвь, но не переносит календарную дату
  // рождения: для ранней Крысы дневной ствол остаётся стволом указанной даты.
  const chartDateText = birthDate;
  const chartTimeText = solar?.solarTime ?? civilTime;
  const { hourBranch, lateZi } = solar
    ? { hourBranch: hourBranchFromClock(chartTimeText), lateZi: solar.solarDate < birthDate || isLateZiClock(solar.solarDate, chartTimeText) }
    : birthHourParts(civilTime);
  const [chartYear, chartMonth, chartDay] = chartDateText.split("-").map(Number);
  const [hour, minute] = chartTimeText.split(":").map(Number);
  const date = new Date(chartYear, chartMonth - 1, chartDay, hour, minute, 0);
  if (Number.isNaN(date.getTime()) || hourBranch < 0) return null;
  const chart = buildChart(date, hourBranch, lateZi);
  // Дворец Судьбы: дворец НС дня рождения в небесной тарелке.
  const day = dayInfo(date);
  const destinyStem = day.stem === 0 ? STEMS[xunInfo(day.index).yiStem] : STEMS[day.stem];
  const destinyCell = Object.values(chart.cells).find((cell: PalaceCell) => cell.heavenStem === destinyStem);
  const destinyPalace = destinyCell?.palace ?? null;
  const cells = Object.values(chart.cells).map((cell: PalaceCell) => ({
    palace: cell.palace,
    isDestinyPalace: cell.palace === destinyPalace,
    direction: PALACES[cell.palace].dir,
    trigram: PALACES[cell.palace].trigram,
    earthStem: cell.earthStem,
    heavenStem: cell.heavenStem,
    hiddenHeavenStem: cell.hiddenHeavenStem,
    hiddenEarthStem: cell.hiddenEarthStem,
    star: cell.star,
    pairedStar: cell.pairedStar,
    door: cell.door,
    deity: cell.deity,
    isVoid: cell.isVoid,
  }));
  return {
    hourGz: chart.hourGz,
    ju: chart.ju.ju,
    yin: chart.ju.yin,
    fuYin: chart.fuYin,
    zhiFuStar: chart.zhiFuStar,
    zhiShiDoor: chart.zhiShiDoor,
    zhiFuPalace: chart.zhiFuPalace,
    zhiShiPalace: chart.zhiShiPalace,
    destinyPalace,
    cells,
  };
}

function hourLabel(hourBranch: number, lateZi = false): string {
  const prefix = lateZi ? "поздний час" : "час";
  return `${prefix} ${BRANCH_ANIMAL_RU_GEN[hourBranch]} (${BRANCH_HOUR_WINDOW[hourBranch]})`;
}

/**
 * Compute personal "Три Генерала" walk structures over a window starting at `from`.
 * Days where the user's birth-year branch 六冲-clashes the day branch are skipped.
 */
export function computeQimenStructures(opts: ComputeOptions = {}): QimenResult {
  const days = opts.days ?? 14;
  const from = localCalendarNoon(opts.timezone, opts.from ?? new Date());
  const hasBirthDate = !!opts.birthDate;
  const yearBranch = hasBirthDate ? birthYearBranch(opts.birthDate!, opts.birthTime) : -1;
  const yearStem = hasBirthDate ? birthYearStem(opts.birthDate!, opts.birthTime) : -1;
  const representativeYearStem = hasBirthDate ? birthYearRepresentativeStem(opts.birthDate!, opts.birthTime) : -1;

  // Джи Фу is universal (no personal/六冲 gate) and shown for the current day only.
  const jiFuWishes = computeJiFuWishes(from, 1);
  const birthChart = buildBirthChart(opts.birthDate, opts.birthTime, opts.birthTimezone ?? opts.timezone, opts.birthLongitude);
  const monthChart = buildMonthChart(from);

  // Нефритовая Дева is universal and scanned over the next MAIDEN_DAYS days.
  const jadeMaidens: QimenJadeMaiden[] = [];
  const mStart = new Date(from.getFullYear(), from.getMonth(), from.getDate(), 12, 0, 0);
  for (let d = 0; d < MAIDEN_DAYS; d++) {
    const date = new Date(mStart);
    date.setDate(mStart.getDate() + d);
    const day = dayInfo(date);
    const dayGz = STEMS[day.stem] + BRANCHES[day.branch];
    // Для прогулки действует запрет личного столкновения: если ветвь дня
    // конфликтует с ветвью года рождения, Нефритовую Деву не публикуем.
    // Например, день Тигра исключает рождённых в год Обезьяны.
    if (hasBirthDate && clashesBranch(yearBranch, day.branch)) continue;
    for (const slot of CHRONOLOGICAL_HOUR_SLOTS) {
      const h = slot.branch;
      for (const hit of detectJadeMaiden(date, h, slot.lateZi, yearStem >= 0 ? yearStem : undefined, representativeYearStem >= 0 ? representativeYearStem : undefined)) {
        jadeMaidens.push({
          date: day.iso,
          dayGanZhi: dayGz,
          hourBranch: h,
          hourLabel: hourLabel(h, slot.lateZi),
          direction: PALACES[hit.palace].dirFull,
          dir: PALACES[hit.palace].dir,
          dom: PALACES[hit.palace].dom,
          heavenStem: hit.heavenStem,
          heavenStemName: STEM_NAME_RU[hit.heavenStem] ?? "",
          earthStem: hit.earthStem,
          earthStemName: STEM_NAME_RU[hit.earthStem] ?? "",
          door: hit.door,
          doorName: DOOR_NAME_RU[hit.door] ?? "",
                        isMainGate: hit.isMainGate,

        });
      }
    }
  }

  const structures: QimenStructure[] = [];
  if (!hasBirthDate || yearBranch < 0) {
    return {
      hasBirthDate,
      birthYearAnimal: null,
      windowDays: days,
      maidenWindowDays: MAIDEN_DAYS,
      structures,
      jiFuWishes,
      jadeMaidens,
      birthChart,
      monthChart,
    };
  }

  const start = new Date(from.getFullYear(), from.getMonth(), from.getDate(), 12, 0, 0);
  for (let d = 0; d < days; d++) {
    const date = new Date(start);
    date.setDate(start.getDate() + d);
    const day = dayInfo(date);
    if (clashesBranch(yearBranch, day.branch)) continue; // personal 六冲 filter
    const dayGz = STEMS[day.stem] + BRANCHES[day.branch];
    for (const slot of CHRONOLOGICAL_HOUR_SLOTS) {
      const h = slot.branch;
      for (const hit of detectThreeGenerals(date, h, slot.lateZi)) {
        structures.push({
          date: day.iso,
          dayGanZhi: dayGz,
          hourBranch: h,
          hourLabel: hourLabel(h, slot.lateZi),
          structure: hit.structure,
          structureName: STRUCTURE_NAME,
          goal: STRUCTURE_GOAL,
          direction: hit.direction,
          dom: hit.dom,
          wonder: hit.wonder,
          wonderName: hit.wonderName,
          star: hit.star,
          starName: hit.starName,
          door: hit.door,
          activation: hit.activation,
          signs: hit.signs,
          result: hit.result,
          note: hit.note,
        });
      }
    }
  }

  return {
    hasBirthDate,
    birthYearAnimal: BRANCH_ANIMAL_RU[yearBranch],
    windowDays: days,
    maidenWindowDays: MAIDEN_DAYS,
    structures,
    jiFuWishes,
    jadeMaidens,
    birthChart,
    monthChart,
  };
}
