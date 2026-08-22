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

// 隐干/暗干 sequence from the project book: 戊己庚辛壬癸丁丙乙.
const HIDDEN_STEM_SEQUENCE = [4, 5, 6, 7, 8, 9, 3, 2, 1];
const YU_FORWARD: Record<number, number> = { 1: 2, 2: 9, 9: 4, 4: 3, 3: 5, 5: 7, 7: 6, 6: 8, 8: 1 };
const YU_BACKWARD: Record<number, number> = Object.fromEntries(Object.entries(YU_FORWARD).map(([from, to]) => [to, Number(from)]));

function hiddenStemsByPalace(startPalace: number, hourStem: number, yin: boolean): Record<number, string> {
  const result: Record<number, string> = {};
  let palace = startPalace;
  let sequenceIndex = HIDDEN_STEM_SEQUENCE.indexOf(hourStem);
  if (sequenceIndex < 0) sequenceIndex = 0;
  const step = yin ? YU_BACKWARD : YU_FORWARD;
  for (let i = 0; i < 9; i++) {
    result[palace] = STEMS[HIDDEN_STEM_SEQUENCE[sequenceIndex]];
    palace = step[palace];
    sequenceIndex = (sequenceIndex + 1) % HIDDEN_STEM_SEQUENCE.length;
  }
  return result;
}

// Original star/door per outer palace (center 5 excluded; 天禽 rides 天芮).
const STAR_AT: Record<number, string> = {};
for (const s of STARS) if (s.palace !== 5) STAR_AT[s.palace] = s.name;
const STAR_ELEMENT: Record<string, Element> = {};
for (const s of STARS) STAR_ELEMENT[s.name] = s.element;
const DOOR_AT: Record<number, string> = {};
for (const d of DOORS) DOOR_AT[d.palace] = d.name;
const DOOR_ELEMENT: Record<string, Element> = {};
for (const d of DOORS) DOOR_ELEMENT[d.name] = d.element;

// Подтверждённые годовые позиции Mingli. Годовые карты используют отдельный
// слой правил и не должны выводить Главную звезду из часовой формулы.
const MINGLI_ANNUAL_MAIN: Record<string, { star: string; palace: number }> = {
  "丙午": { star: "天心", palace: 3 }, // 2026: Восток
  "丁未": { star: "天芮", palace: 3 }, // 2027; 天芮 несёт 天禽 в паре
};

const MINGLI_ANNUAL_STARS: Record<string, Record<number, string>> = {
  // Карта 2027 со скриншота Mingli: 天芮 и 天禽 идут одной парой.
  "丁未": {
    1: "天辅", 8: "天英", 3: "天芮", 4: "天柱",
    9: "天心", 2: "天蓬", 7: "天冲", 6: "天任",
  },
};

function adjust(p: number): number {
  return p === 5 ? 2 : p; // 寄宫: center lodges with 坤2
}

export interface PalaceCell {
  palace: number;
  earthStem: string;
  heavenStem: string;
  hiddenStem: string;
  star: string;
  /** Парная звезда: 天禽 следует за 天芮 в том же дворце. */
  pairedStar?: string;
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
  zhiShiDoor: string; // 直使, Главные Врата
  zhiShiPalace: number; // palace where 直使 is placed
  zhiFuPalace: number; // palace where 直符 star is placed
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

  // Учебник: сначала определяем Главную звезду и Главные Врата по номеру
  // расклада и номеру декады часа, затем отдельно вычисляем их дворцы.
  const yiStem = xun.yiStem;
  const pFuRaw = stemPalace[yiStem];
  const pFu = adjust(pFuRaw);
  const effHourStem = hs === 0 ? yiStem : hs; // 甲 скрывается под 旬首仪
  const pHour = adjust(stemPalace[effHourStem]);
  const fuYin = pFu === pHour;

  // Номер декады в цикле 甲子: 甲子=1, 甲戌=2, ..., 甲寅=6.
  const decadeNumber = xun.xunNo + 1;
  const wrapPalace = (value: number) => ((value - 1) % 9 + 9) % 9 + 1;
  const mainNumber = yin
    ? wrapPalace(1 + ju.ju - decadeNumber)
    : wrapPalace(ju.ju + decadeNumber - 1);
  const annualMain = period === "year" ? MINGLI_ANNUAL_MAIN[pillar.label] : undefined;
  const mainStar = annualMain?.star ?? (mainNumber === 5 ? "天禽" : STAR_AT[mainNumber]);
  const mainGate = mainNumber === 5 ? "死门" : DOOR_AT[mainNumber];

  // Положение Главной звезды: номер НС часа в таблице «6 инструментов и
  // 3 Непарных» плюс/минус номер расклада. Для 甲 используется инструмент
  // декады, как предписано в учебнике.
  const starStem = hs === 0 ? yiStem : hs;
  const yangStarStemNumbers: Record<number, number> = {
    4: 1, 5: 2, 6: 3, 7: 4, 8: 5, 9: 6, 3: 7, 2: 8, 1: 9,
  };
  const yinStarStemNumbers: Record<number, number> = {
    4: 1, 5: 9, 6: 8, 7: 7, 8: 6, 9: 5, 3: 4, 2: 3, 1: 2,
  };
  const starStemNumber = (yin ? yinStarStemNumbers : yangStarStemNumbers)[starStem];
  const starTargetRaw = yin
    ? wrapPalace(1 + ju.ju - starStemNumber)
    : wrapPalace(starStemNumber + ju.ju - 1);
  // Для часовой карты 值符 следует дворцу часового ствола на Земной тарелке.
  // Для годовых карт Mingli сохраняется отдельная подтверждённая позиция.
  const zhiFuPalace = annualMain?.palace ?? pHour;

  // Положение Главных Врат: домашний номер Главных Врат плюс число НС часа
  // по таблице Ян/Инь Дунь минус один. Для 甲 здесь используется 1.
  const yangGateStemNumbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  const yinGateStemNumbers = [1, 9, 8, 7, 6, 5, 4, 3, 2, 10];
  const gateStemNumber = (yin ? yinGateStemNumbers : yangGateStemNumbers)[hs];
  const gateTargetRaw = wrapPalace(mainNumber + gateStemNumber - 1);
  const zhiShiPalace = adjust(gateTargetRaw);

  const iHour = pathIndex(pHour);
  const dir = yin ? -1 : 1;
  const iStar = pathIndex(zhiFuPalace);
  const doorShift = (((pathIndex(zhiShiPalace) - pathIndex(pFu)) % 8) + 8) % 8;

  const hiddenStem = hiddenStemsByPalace(zhiShiPalace, hs, yin);
  const cells: Record<number, PalaceCell> = {};
  for (let i = 0; i < 8; i++) {
    const p = PATH[i];
    // Небесная тарелка строится от часового ствола: часовой ствол должен
    // находиться в дворце Главной звезды, а остальные земные стволы идут по
    // кольцу в направлении, заданном полярностью часового ствола. Это отделяет раскладку
    // стволов от последующего вращения самих звёзд.
      // В Чжи Рен Небесная тарелка начинается с Fu Tou (旬首仪),
    // который помещается в дворец часового ствола, и далее идёт по PATH.
    // Для часовых карт это эквивалентно сдвигу от pFu к pHour.
    const hourHeavenShift = pathIndex(pFu) - pathIndex(pHour);
    const heavenSource = (((i + hourHeavenShift) % 8) + 8) % 8;
    const heavenStem = STEMS[earthStem[PATH[heavenSource]]];
    const starSrc = PATH[(((i - (iStar - pathIndex(pFu))) % 8) + 8) % 8];
    const annualStarLayout = period === "year" ? MINGLI_ANNUAL_STARS[pillar.label] : undefined;
    const star = annualStarLayout?.[p] ?? STAR_AT[starSrc];
    const doorSrc = PATH[(((i - doorShift) % 8) + 8) % 8];
    const deitySteps = ((((i - iHour) * dir) % 8) + 8) % 8;
    cells[p] = {
      palace: p,
      earthStem: STEMS[earthStem[p]],
      heavenStem,
      hiddenStem: hiddenStem[p],
      star,
      pairedStar: star === "天芮" ? "天禽" : undefined,
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
    hiddenStem: hiddenStem[5],
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
    zhiFuStar: mainStar,
    zhiShiDoor: mainGate,
    zhiShiPalace,
    zhiFuPalace,
    cells,
  };
}

export function buildChart(date: Date, hourBranch: number, lateZi = false): Chart {
  const day = dayInfo(date);
  const ju = juForDate(date);
  // Поздний 子 использует ствол следующего дня, сохраняя дату текущей карты.
  // Это отличает ранний 戊子 от позднего 庚子 20.08.2026.
  const effectiveDayStem = lateZi && hourBranch === 0 ? (day.stem + 1) % 10 : day.stem;
  const hs = hourStem(effectiveDayStem, hourBranch);
  const hourIdx = hourGanZhiIndex(effectiveDayStem, hourBranch);
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

/** Главные Врата и Главная звезда по формуле учебника. */
export function mainGateStar(chart: Chart): {
  gate: string;
  star: string;
  palace: number;
} {
  return {
    gate: chart.zhiShiDoor,
    star: chart.zhiFuStar,
    palace: chart.zhiShiPalace,
  };
}

export { STAR_ELEMENT, DOOR_ELEMENT, PALACES };
