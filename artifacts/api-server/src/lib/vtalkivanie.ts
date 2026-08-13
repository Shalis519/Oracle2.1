import { Solar } from "lunar-typescript";
import { HEAVENLY_STEMS } from "./data/bazi";
import { type BirthLocationContext, getBirthEightChar } from "./oracle";
import {
  FLY_ORDER_DIRECTIONS,
  getFlyingStar,
  getStarByNumber,
} from "./data/fengshui";

const GAN_CN = "甲乙丙丁戊己庚辛壬癸".split("");
const ZHI_CN = "子丑寅卯辰巳午未申酉戌亥".split("");
const ANIMALS = [
  "Крыса", "Бык", "Тигр", "Кролик", "Дракон", "Змея",
  "Лошадь", "Коза", "Обезьяна", "Петух", "Собака", "Свинья",
];
const MONTH_NAMES = [
  "января", "февраля", "марта", "апреля", "мая", "июня",
  "июля", "августа", "сентября", "октября", "ноября", "декабря",
];
const TWO_HOUR_PERIODS = [
  "23:00–01:00", "01:00–03:00", "03:00–05:00", "05:00–07:00",
  "07:00–09:00", "09:00–11:00", "11:00–13:00", "13:00–15:00",
  "15:00–17:00", "17:00–19:00", "19:00–21:00", "21:00–23:00",
];
const SECTOR_DEGREES: Record<string, string> = {
  Север: "337,5°–22,5°",
  "Северо-восток": "22,5°–67,5°",
  Восток: "67,5°–112,5°",
  "Юго-восток": "112,5°–157,5°",
  Юг: "157,5°–202,5°",
  "Юго-запад": "202,5°–247,5°",
  Запад: "247,5°–292,5°",
  "Северо-запад": "292,5°–337,5°",
};

// Months are indexed by their BaZi branch: 寅 = February, …, 子 = January.
const ACTIVATION_MONTHS_BY_STEM: Record<string, number[]> = {
  "Металл-Ян": [1, 5, 9],
  "Металл-Инь": [4, 8, 12],
  "Вода-Ян": [4, 8, 12],
  "Вода-Инь": [3, 7, 11],
  "Дерево-Ян": [3, 7, 11],
  "Дерево-Инь": [2, 6, 10],
  "Огонь-Ян": [2, 6, 10],
  "Огонь-Инь": [1, 5, 9],
  "Земля-Ян": [2, 6, 10],
  "Земля-Инь": [1, 5, 9],
};

// PDF table: BaZi month branch -> two day-branch/hour-branch pairs.
const DAY_HOUR_PAIRS: Record<number, [number, number][]> = {
  0: [[9, 5], [5, 9]],
  1: [[6, 10], [10, 6]],
  2: [[7, 11], [11, 7]],
  3: [[0, 8], [8, 0]],
  4: [[9, 1], [1, 9]],
  5: [[2, 10], [10, 2]],
  6: [[11, 3], [3, 11]],
  7: [[0, 4], [4, 0]],
  8: [[5, 1], [1, 5]],
  9: [[2, 6], [6, 2]],
  10: [[3, 7], [7, 3]],
  11: [[8, 4], [4, 8]],
};

export interface VtalkivanieStarSector {
  number: number;
  source: "годовая" | "месячная";
  sector: string;
  direction: string;
  degrees: string | null;
}

export interface VtalkivanieActivation {
  date: string;
  daysUntil: number;
  month: string;
  dayAnimal: string;
  hourAnimal: string;
  period: string;
  yearStem: string;
  dayStem: string;
  stars: VtalkivanieStarSector[];
  businessInstruction: string;
  relationshipInstruction: string;
  familyInstruction: string;
}

function baziAt(date: Date, hour = 12, minute = 0) {
  return Solar.fromYmdHms(
    date.getFullYear(), date.getMonth() + 1, date.getDate(), hour, minute, 0,
  ).getLunar().getEightChar();
}

function effectiveYear(date: Date): number {
  // The existing calendar library supplies the solar-term-aware year stem. The
  // Gregorian year is used as the annual-star cycle anchor; Li Chun is handled
  // by selecting the previous year before the solar-year boundary.
  const ec = baziAt(date);
  const yearGan = ec.getYearGan();
  const yearIndex = GAN_CN.indexOf(yearGan);
  const gregorianYear = date.getFullYear();
  const expectedIndex = ((gregorianYear - 4) % 10 + 10) % 10;
  return yearIndex === expectedIndex ? gregorianYear : gregorianYear - 1;
}

function targetMonthBranch(date: Date): number {
  return ZHI_CN.indexOf(baziAt(date).getMonthZhi());
}

function dateForBranch(from: Date, year: number, month: number, branch: number): Date | null {
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 0);
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    if (ZHI_CN.indexOf(baziAt(d).getDayZhi()) === branch && d >= from) {
      return new Date(d);
    }
  }
  return null;
}

function starSector(number: number, target: Date): VtalkivanieStarSector | null {
  const year = effectiveYear(target);
  const annual = FLY_ORDER_DIRECTIONS.map((direction) => getFlyingStar(direction, year));
  const annualHit = annual.find((star) => star.starNumber === number);
  const monthlyBranch = targetMonthBranch(target);
  const yearBranch = ZHI_CN.indexOf(baziAt(target).getYearZhi());
  const monthCenter = [0, 6, 3, 9].includes(yearBranch)
    ? 8
    : [4, 10, 1, 7].includes(yearBranch)
      ? 5
      : 2;
  const baziMonthNumber = ((monthlyBranch - 2 + 12) % 12) + 1;
  const monthlyCenter = ((monthCenter - (baziMonthNumber - 1) - 1 + 9) % 9) + 1;
  const monthlyHit = FLY_ORDER_DIRECTIONS.map((direction, offset) => ({
    ...getStarByNumber(((monthlyCenter - 1 + offset) % 9) + 1),
    direction,
  })).find((star) => star.starNumber === number);
  const hit = annualHit?.direction === "Центр" ? monthlyHit : annualHit;
  if (!hit || hit.direction === "Центр") return null;
  return {
    number,
    source: annualHit?.direction === "Центр" ? "месячная" : "годовая",
    sector: hit.direction,
    direction: hit.direction,
    degrees: SECTOR_DEGREES[hit.direction] ?? null,
  };
}

export function computeVtalkivanieActivation(
  birthDate: string,
  birthTime: string | null,
  today: Date = new Date(),
  location?: BirthLocationContext,
): VtalkivanieActivation | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(birthDate);
  if (!match) return null;
  const birth = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  const [parsedHour, parsedMinute] = (birthTime ?? "12:00").split(":").map(Number);
  const birthHour = Number.isFinite(parsedHour) ? parsedHour : 12;
  const birthMinute = Number.isFinite(parsedMinute) ? parsedMinute : 0;
  try {
    const birthEc = getBirthEightChar(birthDate, birthTime, location);
    if (!birthEc) return null;
    const yearStemIndex = GAN_CN.indexOf(birthEc.getYearGan());
    const dayStemIndex = GAN_CN.indexOf(birthEc.getDayGan());
    const yearStem = HEAVENLY_STEMS[yearStemIndex];
    const dayStem = HEAVENLY_STEMS[dayStemIndex];
    if (!yearStem || !dayStem) return null;
    const allowedMonths = new Set([
      ...(ACTIVATION_MONTHS_BY_STEM[`${yearStem.element}-${yearStem.polarity}`] ?? []),
      ...(ACTIVATION_MONTHS_BY_STEM[`${dayStem.element}-${dayStem.polarity}`] ?? []),
    ]);
    for (let offset = 0; offset <= 3; offset++) {
      const probe = new Date(today.getFullYear(), today.getMonth(), today.getDate() + offset);
      const monthBranch = targetMonthBranch(probe);
      const monthNumber = monthBranch === 0 ? 12 : monthBranch;
      if (!allowedMonths.has(monthNumber)) continue;
      for (const [dayBranch, hourBranch] of DAY_HOUR_PAIRS[monthBranch] ?? []) {
        const activationDate = dateForBranch(probe, probe.getFullYear(), probe.getMonth() + 1, dayBranch);
        if (!activationDate || activationDate.getTime() !== probe.getTime()) continue;
        const stars = [starSector(8, activationDate), starSector(9, activationDate)].filter(
          (star): star is VtalkivanieStarSector => Boolean(star),
        );
        if (stars.length === 0) continue;
        const dayAnimal = ANIMALS[dayBranch];
        const hourAnimal = ANIMALS[hourBranch];
        const date = `${activationDate.getFullYear()}-${String(activationDate.getMonth() + 1).padStart(2, "0")}-${String(activationDate.getDate()).padStart(2, "0")}`;
        const sector8 = stars.find((s) => s.number === 8)?.direction ?? "Центр";
        const sector9 = stars.find((s) => s.number === 9)?.direction ?? "Центр";
        return {
          date,
          daysUntil: offset,
          month: MONTH_NAMES[activationDate.getMonth()],
          dayAnimal,
          hourAnimal,
          period: TWO_HOUR_PERIODS[hourBranch],
          yearStem: `${yearStem.element}-${yearStem.polarity}`,
          dayStem: `${dayStem.element}-${dayStem.polarity}`,
          stars,
          businessInstruction: `Для бизнеса зажгите свечи одновременно в секторах ${sector8} и ${sector9}.`,
          relationshipInstruction: `Для новых знакомств используйте сектор ${sector9}.`,
          familyInstruction: `Для рождения детей используйте сектор ${sector8}.`,
        };
      }
    }
  } catch {
    return null;
  }
  return null;
}
