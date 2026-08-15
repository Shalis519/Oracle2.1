// Qi Men Dun Jia — "Исполнение желаний с Джи Фу".
// 值符 (Дух Джи Фу) sector at four scales (год / месяц / день / час), and a
// per-double-hour "strength" = how many of {год, месяц, день, час} Ji Fu land in
// the same sector as the hour's Ji Fu (1 hour itself .. max 4).
//
// Definitions were reverse-engineered and validated against the user's source:
//   - ЧАС:  def A — palace of the hour stem (甲 hides as 旬首仪) on the 置闰 earth
//           plate = where 甲 / 值符 lands on the heaven plate. Validated against a
//           full July-2026 hourly table (341/341 cells). Computed by buildChart.
//   - ДЕНЬ: def A — palace of the day stem; continuous 日家 ju = ((-index) mod 9)
//           in the 阴 (post-夏至) half. Validated: 30.06.2026→СВ, 08.07.2026→Восток.
//   - МЕСЯЦ:def B — palace of the month 旬首仪; 月家 ju calibrated for the 子午卯酉
//           (中元) year group, e.g. 2026. Validated: 午月→Север, 未月→ЮЗ.
//   - ГОД:  def B — palace of the year 旬首仪; 年家 always 阴遁, ju cycle [7,4,1].
//           Validated: 2026 丙午 阴7 → Восток.
//
// NOTE (calibration scope): ЧАС and ДЕНЬ(阴 half) are general; МЕСЯЦ is calibrated
// for 中元 years (子午卯酉, incl. 2026) and ГОД for the current 三元 cycle. The 阳
// half (after 冬至) of the daily model is mirrored but not yet anchored to a source.
import { Solar } from "lunar-typescript";
import {
  BRANCH_ANIMAL_RU_GEN,
  BRANCH_HOUR_WINDOW,
  CHRONOLOGICAL_HOUR_BRANCHES,
  BRANCHES,
  STEMS,
  XUN_YI_STEM,
  parseGanZhi,
} from "./constants";
import { buildChart } from "./chart";
import { juForDate } from "./ju";
import { dateToIso } from "./calendar";

// 戊己庚辛壬癸丁丙乙 placement sequence (stem indices) around the Luo Shu earth plate.
const SEQ = [4, 5, 6, 7, 8, 9, 3, 2, 1];
const seqIdx: Record<number, number> = {};
SEQ.forEach((s, i) => (seqIdx[s] = i));

// 寄宫: center (5) lodges with 坤 (2).
const adjust = (p: number): number => (p === 5 ? 2 : p);

// Palace (1..9, center→2) carrying a given stem on an earth plate of (ju, dun).
function palaceOfStem(ju: number, yin: boolean, stemIdx: number): number {
  const k = seqIdx[stemIdx];
  const p = yin ? ((((ju - 1 - k) % 9) + 9) % 9) + 1 : ((ju - 1 + k) % 9) + 1;
  return adjust(p);
}

// 旬首仪 stem (戊己庚辛壬癸) for a sexagenary index 0..59.
const yiStemOf = (index: number): number => XUN_YI_STEM[Math.floor(index / 10)];

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
 * Годовой Джи Фу — годовая карта использует только Иньский Дунь.
 * Один Юань = 60 солнечных лет; стартовые дворцы: верхний 1, средний 4,
 * нижний 7. Цикл привязан к солнечному году от 立春, а не к календарному 1 января.
 */
export function yearJiFuPalace(date: Date): number {
  const { year } = pillarsOf(date);
  const solarYear = yearNumberFor(date, year.index);
  const yuan = Math.floor(((((solarYear - 1984) % 180) + 180) % 180) / 60);
  const ju = [7, 1, 4][yuan]; // 1984-2043: 下元, 2044-2103: 上元, 2104-2163: 中元
  return palaceOfStem(ju, true, yiStemOf(year.index));
}

/**
 * Месячный Джи Фу — 月家 делит 60 месяцев на три пятилетних Юаня.
 * Таблица стартовых Иньских Цзюй следует классической последовательности
 * для пяти групп годового ствола: 甲己, 乙庚, 丙辛, 丁壬, 戊癸.
 */
export function monthJiFuPalace(date: Date): number {
  const { year, month } = pillarsOf(date);
  // Four 孟 branches (寅申巳亥) = 上元, four 仲 branches
  // (子午卯酉) = 中元, four 季 branches (辰戌丑未) = 下元.
  // The source's explicit example (壬午 year) confirms that the
  // 1/7/4 sequence is selected by the year branch group, not shifted by
  // the year stem pair.
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
  const ju = [1, 7, 4][yuanByBranch[year.branch]];
  return palaceOfStem(ju, true, yiStemOf(month.index));
}

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

/** Дневной Джи Фу — 日家 делит 180 дней на три 60-дневных Юаня. */
export function dayJiFuPalace(date: Date): number {
  const { day } = pillarsOf(date);
  const yin = juForDate(date).yin;
  const anchor = nearestJiaZiAnchor(date, yin);
  const diffDays = Math.floor((date.getTime() - anchor.getTime()) / 86400000);
  const yuan = ((Math.floor(diffDays / 60) % 3) + 3) % 3;
  const ju = yin ? [9, 3, 6][yuan] : [1, 7, 4][yuan];
  const eff = day.stem === 0 ? yiStemOf(day.index) : day.stem;
  return palaceOfStem(ju, yin, eff);
}

/** Часовой Джи Фу — где 甲 / 值符 на небесной тарелке (def A, 置闰 движок). */
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
