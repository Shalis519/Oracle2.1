// Qi Men Dun Jia — "Исполнение желаний с Джи Фу".
// 值符 (Дух Джи Фу) sector at four scales (год / месяц / день / час), and a
// per-double-hour "strength" = how many of {год, месяц, день, час} Ji Fu land in
// the same sector as the hour's Ji Fu (1 hour itself .. max 4).
//
// Джи Фу извлекается из общего построителя карт Ци Мэнь:
//   - ЧАС: карта текущего двойного часа через buildChart.
//   - ДЕНЬ: дневная карта через buildPeriodMap и 日家 Цзюй.
//   - МЕСЯЦ: месячная карта через buildPeriodMap и 月家 Цзюй.
//   - ГОД: годовая карта через buildPeriodMap и 年家 Цзюй.
// В computeJiFuWishes эти четыре сектора сравниваются для каждого часа дня;
// выводятся только двойные, тройные и четверные совпадения.
import { Solar } from "lunar-typescript";
import {
  BRANCH_ANIMAL_RU_GEN,
  BRANCH_HOUR_WINDOW,
  CHRONOLOGICAL_HOUR_BRANCHES,
  BRANCHES,
  STEMS,
  parseGanZhi,
} from "./constants";
import { buildChart, buildPeriodMap } from "./chart";
import { dayJoeyYapJuForDate, juForDate } from "./ju";
import { dateToIso } from "./calendar";

// Full Russian direction per palace — nominative ("Восток") and prepositional
// ("на Востоке"). Center (5) never occurs here (always 寄 to 2).
const DIR_NOM: Record<number, string> = {
  1: "Север",
  2: "Юго-запад",
  3: "Восток",
  4: "Юго-восток",
  6: "Северо-запад",
  7: "Запад",
  8: "Северо-восток",
  9: "Юг",
};
const DIR_LOC: Record<number, string> = {
  1: "Севере",
  2: "Юго-западе",
  3: "Востоке",
  4: "Юго-востоке",
  6: "Северо-западе",
  7: "Западе",
  8: "Северо-востоке",
  9: "Юге",
};

function pillarsOf(date: Date) {
  const lunar = Solar.fromYmdHms(
    date.getFullYear(),
    date.getMonth() + 1,
    date.getDate(),
    12,
    0,
    0,
  ).getLunar();
  return {
    year: parseGanZhi(lunar.getYearInGanZhiExact()),
    month: parseGanZhi(lunar.getMonthInGanZhiExact()),
    day: parseGanZhi(lunar.getDayInGanZhi()),
  };
}

// Resolve the solar year number for a year-pillar sexagenary index near `date`
// (accounts for the 立春 boundary by checking the neighbouring Gregorian years).
function yearNumberFor(date: Date, yearIndex: number): number {
  for (const y of [
    date.getFullYear(),
    date.getFullYear() - 1,
    date.getFullYear() + 1,
  ]) {
    if ((((y - 1984) % 60) + 60) % 60 === yearIndex) return y;
  }
  return date.getFullYear();
}

/**
 * Метод: годовой слой QMDJ проекта, солнечный год от 立春.
 * Годовой Джи Фу — годовая карта использует только Иньский Дунь.
 * Один Юань = 60 солнечных лет. Для годового слоя Mingli используем
 * последовательность Инь 1 / Инь 7 / Инь 4, привязанную к солнечному году от
 * 立春, а не к календарному 1 января.
 */
export function yearJiFuPalace(date: Date): number {
  const { year } = pillarsOf(date);
  const solarYear = yearNumberFor(date, year.index);
  const yuan = Math.floor(((((solarYear - 1984) % 180) + 180) % 180) / 60) as
    | 0
    | 1
    | 2;
  const ju = [1, 7, 4][yuan]; // Эталон Mingli: 2026 попадает в Инь 1.
  return buildPeriodMap(
    date,
    "year",
    {
      stem: year.stem,
      // В годовой карте Mingli используется фактический годовой Драйвер,
      // а не 旬首仪 часового слоя.
      effectiveStem: year.stem,
      branch: year.branch,
      index: year.index,
      label: STEMS[year.stem] + BRANCHES[year.branch],
    },
    { yin: true, ju, term: "年家", yuan },
  ).zhiFuPalace;
}

/**
 * Месячный Цзи Фу по Joey Yap Month Charts.
 *
 * Это отдельный месячный слой и не должен смешиваться с Guam Ham Hai.
 * Для режима Joey Yap месячная структура выбирается из последовательности
 * Yin 1 / Yin 4 / Yin 7 по группе земной ветви солнечного года. В 2026 году
 * (午 — лошадь) контроль Mingli показывает Yin 7 для Joey Yap, включая
 * август–декабрь; это отличается от Guam Ham Hai, где на тех же датах
 * контрольные значения дают Yin 4.
 *
 * Важно: год определяется по солнечной границе 立春 через
 * getYearInGanZhiExact(), а месячный столп — через getMonthInGanZhiExact().
 */
export function monthJoeyYapJiFuPalace(date: Date): number {
  const { year, month } = pillarsOf(date);
  // Joey Yap Month Charts use three Yin structures. The year-branch groups
  // select the corresponding Upper/Middle/Lower cycle: 1 / 7 / 4.
  const yuanByBranch: Record<number, 0 | 1 | 2> = {
    2: 0, // 寅
    8: 0, // 申
    5: 0, // 巳
    11: 0, // 亥
    0: 1, // 子
    6: 1, // 午
    3: 1, // 卯
    9: 1, // 酉
    4: 2, // 辰
    10: 2, // 戌
    1: 2, // 丑
    7: 2, // 未
  };
  const yuan = yuanByBranch[year.branch];
  const ju = [1, 7, 4][yuan];
  return buildPeriodMap(
    date,
    "month",
    {
      stem: month.stem,
      // В Month Charts Joey Yap 值符 привязан к месячному стволу карты.
      // 旬首仪 применяется для часового слоя, но не должен подменять
      // фактический месячный ствол при определении дворца 符.
      effectiveStem: month.stem,
      branch: month.branch,
      index: month.index,
      label: STEMS[month.stem] + BRANCHES[month.branch],
    },
    { yin: true, ju, term: "月家 Joey Yap", yuan },
  ).zhiFuPalace;
}

/** Backward-compatible alias: the active monthly Ji Fu mode is Joey Yap. */
export const monthJiFuPalace = monthJoeyYapJiFuPalace;

function nearestJiaZiAnchor(date: Date, yin: boolean): Date {
  // 日家 starts its 180-day cycle from the 甲子 day nearest the relevant
  // solstice: 夏至 for 阴遁, 冬至 for 阳遁. We search around the astronomical
  // calendar date rather than relying on a private field from juForDate.
  const targetMonth = yin ? 5 : 11;
  const target = new Date(date.getFullYear(), targetMonth, 21, 12, 0, 0);
  let best: Date | undefined;
  let bestDistance = Infinity;
  for (let offset = -30; offset <= 30; offset += 1) {
    const candidate = new Date(target);
    candidate.setDate(target.getDate() + offset);
    const p = pillarsOf(candidate).day;
    if (p.index !== 0) continue;
    const distance = Math.abs(candidate.getTime() - target.getTime());
    if (distance < bestDistance) {
      best = candidate;
      bestDistance = distance;
    }
  }
  if (!best) {
    throw new Error(
      "Не удалось определить опорный день 甲子 для дневного Джи Фу",
    );
  }
  return best;
}

/**
 * Метод: Joey Yap Day Chart, отдельный дневной цикл 日家.
 * Дневной Джи Фу — 日家 делит 180 дней на три 60-дневных Юаня.
 */
export function dayJiFuPalace(date: Date): number {
  const { day } = pillarsOf(date);
  const dayJu = dayJoeyYapJuForDate(date);
  const yin = dayJu.yin;
  const ju = dayJu.ju;
  const yuan = dayJu.yuan;
  return buildPeriodMap(
    date,
    "day",
    {
      stem: day.stem,
      branch: day.branch,
      index: day.index,
      label: STEMS[day.stem] + BRANCHES[day.branch],
    },
    { yin, ju, term: "日家", yuan: yuan as 0 | 1 | 2 },
  ).zhiFuPalace;
}

/**
 * Метод: Zhi Run / 置闰, часовой слой.
 * Часовой Джи Фу — где 甲 / 值符 на небесной тарелке (def A, 置闰 движок).
 */
export function hourJiFuPalace(date: Date, hourBranch: number): number {
  return buildChart(date, hourBranch).zhiFuPalace;
}

export interface JiFuWish {
  date: string; // ISO yyyy-mm-dd
  dayGanZhi: string;
  hourBranch: number;
  hourAnimalGen: string; // lowercase genitive, e.g. "петуха"
  hourLabel: string; // "час Петуха (17:00–19:00)"
  direction: string; // nominative, e.g. "Восток"
  directionLoc: string; // prepositional, e.g. "Востоке"
  yearPalace: number;
  monthPalace: number;
  dayPalace: number;
  hourPalace: number;
  yearDirection: string;
  monthDirection: string;
  dayDirection: string;
  hourDirection: string;
  strength: number; // 2..4
  matchYear: boolean;
  matchMonth: boolean;
  matchDay: boolean;
}

/**
 * Scan an N-day window × 12 double-hours. For every double-hour, the Ji Fu sits in
 * its hour-sector; strength counts how many of {год, месяц, день, час} share that
 * sector. Cards are emitted when strength ≥ 2 (the hour plus at least one larger scale), then shown in chronological order.
 */
export function computeJiFuWishes(from: Date, days: number): JiFuWish[] {
  const start = new Date(
    from.getFullYear(),
    from.getMonth(),
    from.getDate(),
    12,
    0,
    0,
  );
  const wishes: JiFuWish[] = [];

  for (let d = 0; d < days; d++) {
    const date = new Date(start);
    date.setDate(start.getDate() + d);
    const yp = yearJiFuPalace(date);
    const mp = monthJiFuPalace(date);
    const dp = dayJiFuPalace(date);
    const iso = dateToIso(date);

    for (const h of CHRONOLOGICAL_HOUR_BRANCHES) {
      const hp = hourJiFuPalace(date, h);
      const matchYear = yp === hp;
      const matchMonth = mp === hp;
      const matchDay = dp === hp;
      const strength =
        1 + (matchYear ? 1 : 0) + (matchMonth ? 1 : 0) + (matchDay ? 1 : 0);
      if (strength < 2) continue;

      const chart = buildChart(date, h);
      const dayGz = STEMS[chart.day.stem] + BRANCHES[chart.day.branch];
      wishes.push({
        date: iso,
        dayGanZhi: dayGz,
        hourBranch: h,
        hourAnimalGen: BRANCH_ANIMAL_RU_GEN[h].toLowerCase(),
        hourLabel: `час ${BRANCH_ANIMAL_RU_GEN[h]} (${BRANCH_HOUR_WINDOW[h]})`,
        direction: DIR_NOM[hp],
        directionLoc: DIR_LOC[hp],
        yearPalace: yp,
        monthPalace: mp,
        dayPalace: dp,
        hourPalace: hp,
        yearDirection: DIR_NOM[yp],
        monthDirection: DIR_NOM[mp],
        dayDirection: DIR_NOM[dp],
        hourDirection: DIR_NOM[hp],
        strength,
        matchYear,
        matchMonth,
        matchDay,
      });
    }
  }

  const chronologicalPosition = new Map<number, number>(
    CHRONOLOGICAL_HOUR_BRANCHES.map((branch, position) => [branch, position]),
  );
  wishes.sort(
    (a, b) =>
      a.date.localeCompare(b.date) ||
      (chronologicalPosition.get(a.hourBranch) ?? 99) -
        (chronologicalPosition.get(b.hourBranch) ?? 99),
  );
  return wishes;
}
