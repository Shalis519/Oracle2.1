// Qi Men Dun Jia — rotating-plate (轉盤) hour chart.
import {
  DEITIES,
  DOORS,
  PALACES,
  PATH,
  STARS,
  STEMS,
  BRANCHES,
  type Element,
  pathIndex,
} from "./constants";
import {
  dayInfo,
  hourGanZhiIndex,
  hourStem,
  xunInfo,
  type DayInfo,
} from "./calendar";
import { juForDate, type JuResult } from "./ju";

// 戊己庚辛壬癸丁丙乙 placement sequence (stem indices).
const SEQ = [4, 5, 6, 7, 8, 9, 3, 2, 1];

// Original star/door per outer palace (center 5 excluded; 天禽 rides 天芮).
const STAR_AT: Record<number, string> = {};
for (const s of STARS) if (s.palace !== 5) STAR_AT[s.palace] = s.name;
const STAR_ELEMENT: Record<string, Element> = {};
for (const s of STARS) STAR_ELEMENT[s.name] = s.element;
const DOOR_AT: Record<number, string> = {};
for (const d of DOORS) DOOR_AT[d.palace] = d.name;
const DOOR_ELEMENT: Record<string, Element> = {};
for (const d of DOORS) DOOR_ELEMENT[d.name] = d.element;

function adjust(p: number): number {
  return p === 5 ? 2 : p; // 寄宫: center lodges with 坤2
}

export interface PalaceCell {
  palace: number;
  earthStem: string;
  heavenStem: string;
  star: string;
  door: string;
  deity: string;
  isVoid: boolean;
}

export interface Chart {
  day: DayInfo;
  hourBranch: number; // 0..11 for an hourly chart; -1 for year/month/day maps
  hourStem: number; // effective period stem 0..9
  hourGz: string; // period Gan-Zhi label
  ju: JuResult;
  fuYin: boolean;
  zhiFuStar: string; // 值符 (Дух Джи Фу)
  zhiShiDoor: string; // 值使
  zhiFuPalace: number; // palace carrying 值符 star (= period stem palace)
  cells: Record<number, PalaceCell>; // outer palaces 1,2,3,4,6,7,8,9 (+5 minimal)
}

export type QimenPeriod = "year" | "month" | "day" | "hour";

interface PeriodPillar {
  stem: number;
  effectiveStem?: number;
  branch: number;
  index: number;
  label: string;
}

function buildPeriodChart(
  date: Date,
  period: QimenPeriod,
  pillar: PeriodPillar,
  ju: JuResult,
): Chart {
  const day = dayInfo(date);
  const yin = ju.yin;
  const hs = pillar.effectiveStem ?? pillar.stem;
  const hourBranch = period === "hour" ? pillar.branch : -1;
  const hourGz = pillar.label;
  const xun = xunInfo(pillar.index);

  // Earth plate stems by palace (1..9).
  const earthStem: number[] = Array(10).fill(-1);
  const stemPalace: number[] = Array(10).fill(-1);
  for (let p = 0; p < 9; p++) {
    const palace = yin
      ? ((((ju.ju - 1 - p) % 9) + 9) % 9) + 1
      : ((ju.ju - 1 + p) % 9) + 1;
    earthStem[palace] = SEQ[p];
    stemPalace[SEQ[p]] = palace;
  }

  // 值符 anchor (旬首仪 palace) and 时干 palace.
  const yiStem = xun.yiStem;
  const pFu = adjust(stemPalace[yiStem]);
  const effHourStem = hs === 0 ? yiStem : hs; // 甲 hides as the 旬首仪
  const pHour = adjust(stemPalace[effHourStem]);
  const fuYin = pFu === pHour;

  const iFu = pathIndex(pFu);
  const iHour = pathIndex(pHour);
  const kStar = (((iHour - iFu) % 8) + 8) % 8;

  // 八门 in 置闰法: the original 值使 gate is the gate whose home palace
  // carries the 旬首仪 (pFu). Its target palace is found by advancing the
  // position inside the current 旬 in the dun direction. This is different
  // from the star shift: the hour-stem palace (pHour) is not the gate anchor.
  const dir = yin ? -1 : 1;
  let gateTargetRaw = stemPalace[yiStem];
  for (let step = 0; step < xun.pos; step += 1) {
    gateTargetRaw += dir;
    if (gateTargetRaw > 9) gateTargetRaw = 1;
    if (gateTargetRaw < 1) gateTargetRaw = 9;
  }
  // The center has no gate; when the target lands there, continue one palace
  // in the same direction, matching the standard 寄宫 handling.
  if (gateTargetRaw === 5) {
    gateTargetRaw += dir;
    if (gateTargetRaw > 9) gateTargetRaw = 1;
    if (gateTargetRaw < 1) gateTargetRaw = 9;
  }
  const gateTarget = adjust(gateTargetRaw);
  const doorShift = (((pathIndex(gateTarget) - pathIndex(pFu)) % 8) + 8) % 8;

  const cells: Record<number, PalaceCell> = {};
  for (let i = 0; i < 8; i++) {
    const p = PATH[i];
    const starSrc = PATH[(((i - kStar) % 8) + 8) % 8];
    const doorSrc = PATH[(((i - doorShift) % 8) + 8) % 8];
    const deitySteps = ((((i - iHour) * dir) % 8) + 8) % 8;
    cells[p] = {
      palace: p,
      earthStem: STEMS[earthStem[p]],
      heavenStem: STEMS[earthStem[starSrc]],
      star: STAR_AT[starSrc],
      door: DOOR_AT[doorSrc],
      deity: DEITIES[deitySteps],
      isVoid: xun.voidPalaces.includes(p),
    };
  }
  // Center cell (minimal; not a walkable direction).
  cells[5] = {
    palace: 5,
    earthStem: STEMS[earthStem[5]],
    heavenStem: STEMS[earthStem[5]],
    star: "天禽",
    door: "",
    deity: "",
    isVoid: xun.voidPalaces.includes(5),
  };

  return {
    day,
    hourBranch,
    hourStem: hs,
    hourGz,
    ju,
    fuYin,
    zhiFuStar: STAR_AT[pFu],
    zhiShiDoor: DOOR_AT[pFu],
    zhiFuPalace: pHour,
    cells,
  };
}

export function buildChart(date: Date, hourBranch: number): Chart {
  const day = dayInfo(date);
  const ju = juForDate(date);
  const hs = hourStem(day.stem, hourBranch);
  const hourIdx = hourGanZhiIndex(day.stem, hourBranch);
  return buildPeriodChart(
    date,
    "hour",
    {
      stem: hs,
      branch: hourBranch,
      index: hourIdx,
      label: STEMS[hs] + BRANCHES[hourBranch],
    },
    ju,
  );
}

export function buildPeriodMap(
  date: Date,
  period: Exclude<QimenPeriod, "hour">,
  pillar: PeriodPillar,
  ju: JuResult,
): Chart {
  return buildPeriodChart(date, period, pillar, ju);
}

/**
 * Главные Врата / Главная звезда for an hour chart (метод literaqimen.ru):
 * 1) find the hour stem on the earth plate -> palace A (= 时干宫 = zhiFuPalace;
 *    already handles 甲 hiding via 旬首仪);
 * 2) read the stem standing above it (heaven plate at A) -> stem X;
 * 3) find X on the earth plate -> palace B (X is never 甲, so always found);
 * 4) the gate/star whose HOME palace is B are the Main Gate / Main Star.
 */
export function mainGateStar(chart: Chart): {
  gate: string;
  star: string;
  palace: number;
} {
  const a = chart.zhiFuPalace;
  const x = chart.cells[a]?.heavenStem;
  let b = -1;
  for (let p = 1; p <= 9; p++) {
    if (chart.cells[p]?.earthStem === x) {
      b = p;
      break;
    }
  }
  const home = b === 5 ? 2 : b; // 寄宫: center lodges with 坤2
  const gate = DOORS.find((d) => d.palace === home)?.name ?? "";
  const star = STARS.find((s) => s.palace === home)?.name ?? "";
  return { gate, star, palace: home };
}

export { STAR_ELEMENT, DOOR_ELEMENT, PALACES };
