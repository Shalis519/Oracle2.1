// Qi Men Dun Jia — rotating-plate (轉盤) hour chart.
import {
  DEITIES, DOORS, PALACES, PATH, STARS, STEMS, BRANCHES, type Element, pathIndex,
} from "./constants";
import { dayInfo, hourGanZhiIndex, hourStem, xunInfo, type DayInfo } from "./calendar";
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
  hourBranch: number; // 0..11
  hourStem: number; // 0..9
  hourGz: string;
  ju: JuResult;
  fuYin: boolean;
  zhiFuStar: string; // 值符 (Дух Джи Фу)
  zhiShiDoor: string; // 值使
  zhiFuPalace: number; // palace carrying 值符 star (= 时干 palace)
  cells: Record<number, PalaceCell>; // outer palaces 1,2,3,4,6,7,8,9 (+5 minimal)
}

export function buildChart(date: Date, hourBranch: number): Chart {
  const day = dayInfo(date);
  const ju = juForDate(date);
  const yin = ju.yin;
  const hs = hourStem(day.stem, hourBranch);
  const hourGz = STEMS[hs] + BRANCHES[hourBranch];
  const hourIdx = hourGanZhiIndex(day.stem, hourBranch);
  const xun = xunInfo(hourIdx);

  // Earth plate stems by palace (1..9).
  const earthStem: number[] = Array(10).fill(-1);
  const stemPalace: number[] = Array(10).fill(-1);
  for (let p = 0; p < 9; p++) {
    const palace = yin ? (((ju.ju - 1 - p) % 9 + 9) % 9) + 1 : (((ju.ju - 1 + p) % 9) + 1);
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
  const kStar = ((iHour - iFu) % 8 + 8) % 8;

  // Doors advance from 值使 (pFu) by hour position; deities anchor on 值符 (pHour).
  const dir = yin ? -1 : 1;
  const doorShift = ((xun.pos * dir) % 8 + 8) % 8;

  const cells: Record<number, PalaceCell> = {};
  for (let i = 0; i < 8; i++) {
    const p = PATH[i];
    const starSrc = PATH[((i - kStar) % 8 + 8) % 8];
    const doorSrc = PATH[((i - doorShift) % 8 + 8) % 8];
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

export { STAR_ELEMENT, DOOR_ELEMENT, PALACES };
