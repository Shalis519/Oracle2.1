// Qi Men Dun Jia — public entry: scan an N-day window for personal walk structures.
import {
  BRANCH_ANIMAL_RU, BRANCH_ANIMAL_RU_GEN, BRANCH_HOUR_WINDOW, BRANCHES, clashesBranch, PALACES, STEMS,
} from "./constants";
import { birthYearBranch, dayInfo } from "./calendar";
import { detectThreeGenerals, detectJadeMaiden, detectDoorMaiden } from "./structures";
import { computeJiFuWishes, type JiFuWish } from "./jifu";
import { DOOR_NAME_RU, JADE_MAIDEN_VARIANT_TEXT, STEM_NAME_RU } from "../../data/qimen/maidens";

export type { JiFuWish } from "./jifu";

const MAIDEN_DAYS = 7;

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
  variant: number;
  variantText: string;
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

export interface QimenDoorMaiden {
  date: string;
  dayGanZhi: string;
  hourBranch: number;
  hourLabel: string;
  hourStem: string;
  hourStemName: string;
  targetStem: string;
  targetStemName: string;
  direction: string;
  dir: string;
  dom: string;
  heavenStem: string;
  earthStem: string;
  door: string;
  doorName: string;
  goodDoor: boolean;
  noDuplication: boolean;
}

export interface QimenResult {
  hasBirthDate: boolean;
  birthYearAnimal: string | null;
  windowDays: number;
  maidenWindowDays: number;
  structures: QimenStructure[];
  jiFuWishes: JiFuWish[];
  jadeMaidens: QimenJadeMaiden[];
  doorMaidens: QimenDoorMaiden[];
}

export interface ComputeOptions {
  birthDate?: string | null; // ISO yyyy-mm-dd
  birthTime?: string | null; // "HH:MM" (affects 立春 year-pillar boundary)
  from?: Date;
  days?: number;
}

function hourLabel(hourBranch: number): string {
  return `час ${BRANCH_ANIMAL_RU_GEN[hourBranch]} (${BRANCH_HOUR_WINDOW[hourBranch]})`;
}

/**
 * Compute personal "Три Генерала" walk structures over a window starting at `from`.
 * Days where the user's birth-year branch 六冲-clashes the day branch are skipped.
 */
export function computeQimenStructures(opts: ComputeOptions = {}): QimenResult {
  const days = opts.days ?? 14;
  const from = opts.from ?? new Date();
  const hasBirthDate = !!opts.birthDate;
  const yearBranch = hasBirthDate ? birthYearBranch(opts.birthDate!, opts.birthTime) : -1;

  // Джи Фу is universal (no personal/六冲 gate) and shown for the current day only.
  const jiFuWishes = computeJiFuWishes(from, 1);

  // "Нефритовая Дева" & "Девушка, открывающая дверь" are universal (hour-chart
  // only, no birth date / no 六冲 filter), scanned over the next MAIDEN_DAYS days.
  const jadeMaidens: QimenJadeMaiden[] = [];
  const doorMaidens: QimenDoorMaiden[] = [];
  const mStart = new Date(from.getFullYear(), from.getMonth(), from.getDate(), 12, 0, 0);
  for (let d = 0; d < MAIDEN_DAYS; d++) {
    const date = new Date(mStart);
    date.setDate(mStart.getDate() + d);
    const day = dayInfo(date);
    const dayGz = STEMS[day.stem] + BRANCHES[day.branch];
    for (let h = 0; h < 12; h++) {
      for (const hit of detectJadeMaiden(date, h)) {
        jadeMaidens.push({
          date: day.iso,
          dayGanZhi: dayGz,
          hourBranch: h,
          hourLabel: hourLabel(h),
          variant: hit.variant,
          variantText: JADE_MAIDEN_VARIANT_TEXT[hit.variant] ?? "",
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
      for (const hit of detectDoorMaiden(date, h)) {
        doorMaidens.push({
          date: day.iso,
          dayGanZhi: dayGz,
          hourBranch: h,
          hourLabel: hourLabel(h),
          hourStem: hit.hourStem,
          hourStemName: STEM_NAME_RU[hit.hourStem] ?? "",
          targetStem: hit.targetStem,
          targetStemName: STEM_NAME_RU[hit.targetStem] ?? "",
          direction: PALACES[hit.palace].dirFull,
          dir: PALACES[hit.palace].dir,
          dom: PALACES[hit.palace].dom,
          heavenStem: hit.heavenStem,
          earthStem: hit.earthStem,
          door: hit.door,
          doorName: DOOR_NAME_RU[hit.door] ?? "",
          goodDoor: hit.goodDoor,
          noDuplication: hit.noDuplication,
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
      doorMaidens,
    };
  }

  const start = new Date(from.getFullYear(), from.getMonth(), from.getDate(), 12, 0, 0);
  for (let d = 0; d < days; d++) {
    const date = new Date(start);
    date.setDate(start.getDate() + d);
    const day = dayInfo(date);
    if (clashesBranch(yearBranch, day.branch)) continue; // personal 六冲 filter
    const dayGz = STEMS[day.stem] + BRANCHES[day.branch];
    for (let h = 0; h < 12; h++) {
      for (const hit of detectThreeGenerals(date, h)) {
        structures.push({
          date: day.iso,
          dayGanZhi: dayGz,
          hourBranch: h,
          hourLabel: hourLabel(h),
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
    doorMaidens,
  };
}
