import { Solar } from "lunar-typescript";
import { type BirthLocationContext, getBirthEightChar } from "./oracle";
import { FLY_ORDER_DIRECTIONS, flyingStarYear, getFlyingStar } from "./data/fengshui";

const ZHI_CN = "子丑寅卯辰巳午未申酉戌亥".split("");
const GAN_CN = "甲乙丙丁戊己庚辛壬癸".split("");
const ANIMALS = [
  "Крыса", "Бык", "Тигр", "Кролик", "Дракон", "Змея",
  "Лошадь", "Коза", "Обезьяна", "Петух", "Собака", "Свинья",
];
const MONTHS = [
  "января", "февраля", "марта", "апреля", "мая", "июня",
  "июля", "августа", "сентября", "октября", "ноября", "декабря",
];
const PERIODS = [
  "23:00-01:00", "01:00-03:00", "03:00-05:00", "05:00-07:00",
  "07:00-09:00", "09:00-11:00", "11:00-13:00", "13:00-15:00",
  "15:00-17:00", "17:00-19:00", "19:00-21:00", "21:00-23:00",
];
const SECTOR_DEGREES: Record<string, string> = {
  Север: "337,5°-22,5°",
  "Северо-восток": "22,5°-67,5°",
  Восток: "67,5°-112,5°",
  "Юго-восток": "112,5°-157,5°",
  Юг: "157,5°-202,5°",
  "Юго-запад": "202,5°-247,5°",
  Запад: "247,5°-292,5°",
  "Северо-запад": "292,5°-337,5°",
};

// Земная ветвь года или дня рождения -> ветвь дня активации из PDF.
const MONEY_DAY_BY_BIRTH_BRANCH: Record<number, number> = {
  0: 8,  // Крыса -> Обезьяна
  1: 9,  // Бык -> Петух
  2: 10, // Тигр -> Собака
  3: 11, // Кролик -> Свинья
  4: 0,  // Дракон -> Крыса
  5: 1,  // Змея -> Бык
  6: 2,  // Лошадь -> Тигр
  7: 3,  // Коза -> Кролик
  8: 4,  // Обезьяна -> Дракон
  9: 5,  // Петух -> Змея
  10: 6, // Собака -> Лошадь
  11: 7, // Свинья -> Коза
};

const NOBLE_HELPER_BY_STEM: Record<string, number[]> = {
  "Дерево-Ян": [7, 1],
  "Дерево-Инь": [8, 0],
  "Огонь-Ян": [9, 11],
  "Огонь-Инь": [11, 9],
  "Земля-Ян": [1, 7],
  "Земля-Инь": [0, 8],
  "Металл-Ян": [1, 7],
  "Металл-Инь": [2, 6],
  "Вода-Ян": [3, 5],
  "Вода-Инь": [5, 3],
};

// Личная Почтовая лошадь определяется по земной ветви дня рождения.
const POST_HORSE_BY_DAY_BRANCH: Record<number, number> = {
  0: 2, 4: 2, 8: 2,
  2: 8, 6: 8, 10: 8,
  5: 11, 9: 11, 1: 11,
  11: 5, 3: 5, 7: 5,
};

const SIX_HARMONY = [1, 0, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2];
const SAN_HE_GROUPS = [[8, 0, 4], [11, 3, 7], [2, 6, 10], [5, 9, 1]];
const SEASONAL_GROUPS = [[2, 3, 4], [5, 6, 7], [8, 9, 10], [11, 0, 1]];

const STAR_ACTIVATORS: Record<number, string> = {
  1: "фонтанчик",
  6: "вентилятор",
  8: "свеча",
};

export interface MoneyStarSector {
  number: number;
  source: "годовая" | "месячная";
  direction: string;
  degrees: string | null;
  activator: string;
  replacedByMonthlyFive: boolean;
}

export interface MoneyActivationHour {
  animal: string;
  period: string;
  reason: string;
}

export interface VtalkivanieMoneyActivation {
  date: string;
  daysUntil: number;
  month: string;
  dayAnimal: string;
  daySources: string[];
  hours: MoneyActivationHour[];
  stars: MoneyStarSector[];
  warning: string | null;
  instruction: string;
}

function baziAt(date: Date, hour = 12, minute = 0) {
  return Solar.fromYmdHms(
    date.getFullYear(), date.getMonth() + 1, date.getDate(), hour, minute, 0,
  ).getLunar().getEightChar();
}

function parseBirth(birthDate: string, birthTime: string | null): { date: Date; hour: number; minute: number } | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(birthDate);
  if (!match) return null;
  const [hour, minute] = (birthTime ?? "12:00").split(":").map(Number);
  return {
    date: new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3])),
    hour: Number.isFinite(hour) && hour >= 0 && hour <= 23 ? hour : 12,
    minute: Number.isFinite(minute) && minute >= 0 && minute <= 59 ? minute : 0,
  };
}

function isoDate(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function monthlyCenterStar(yearBranchIdx: number, monthBranchIdx: number): number {
  const start = [0, 6, 3, 9].includes(yearBranchIdx)
    ? 8
    : [4, 10, 1, 7].includes(yearBranchIdx)
      ? 5
      : 2;
  const monthNumber = ((monthBranchIdx - 2 + 12) % 12) + 1;
  return (((start - (monthNumber - 1) - 1 + 9) % 9) + 1);
}

function starAtDirection(number: number, direction: string, source: "годовая" | "месячная", replacedByMonthlyFive = false): MoneyStarSector {
  return {
    number,
    source,
    direction,
    degrees: SECTOR_DEGREES[direction] ?? null,
    activator: STAR_ACTIVATORS[number],
    replacedByMonthlyFive,
  };
}

function flyingMap(date: Date, source: "годовая" | "месячная"): Map<number, string> {
  const year = flyingStarYear(date);
  const yearBranchIdx = ZHI_CN.indexOf(baziAt(date).getYearZhi());
  const monthBranchIdx = ZHI_CN.indexOf(baziAt(date).getMonthZhi());
  const center = source === "годовая"
    ? (((year % 9) + 9) % 9 === 0 ? 2 : 11 - (((year % 9) + 9) % 9))
    : monthlyCenterStar(yearBranchIdx, monthBranchIdx);
  return new Map(FLY_ORDER_DIRECTIONS.map((direction, offset) => [
    ((center - 1 + offset) % 9) + 1,
    direction,
  ]));
}

function strictHours(
  date: Date,
  natalBranches: number[],
  nobleBranches: number[],
  postHorseBranch: number | undefined,
): MoneyActivationHour[] {
  const ec = baziAt(date);
  const dayBranch = ZHI_CN.indexOf(ec.getDayZhi());
  const monthBranch = ZHI_CN.indexOf(ec.getMonthZhi());
  if (dayBranch < 0 || monthBranch < 0) return [];

  const voidBranches = Array.from(ec.getDayXunKong())
    .map((branch) => ZHI_CN.indexOf(branch))
    .filter((idx) => idx >= 0);
  const clash = (idx: number) => (idx + 6) % 12;
  const candidates = new Map<number, string>();
  candidates.set(dayBranch, "час дня активации");
  const harmony = SIX_HARMONY[dayBranch];
  if (!candidates.has(harmony)) candidates.set(harmony, "слияние с днём активации");
  for (const group of SAN_HE_GROUPS) {
    if (group.includes(dayBranch)) {
      for (const branch of group) {
        if (!candidates.has(branch)) candidates.set(branch, "союз с днём активации");
      }
    }
  }
  for (const group of SEASONAL_GROUPS) {
    if (group.includes(dayBranch)) {
      for (const branch of group) {
        if (!candidates.has(branch)) candidates.set(branch, "сезон с днём активации");
      }
    }
  }
  for (const branch of nobleBranches) {
    if (!candidates.has(branch)) candidates.set(branch, "час Благородного человека");
  }
  if (postHorseBranch !== undefined && !candidates.has(postHorseBranch)) {
    candidates.set(postHorseBranch, "час Почтовой лошади");
  }

  return [...candidates.entries()]
    .sort(([a], [b]) => (a === 0 ? 12 : a) - (b === 0 ? 12 : b))
    .filter(([hourBranch]) => {
      if (voidBranches.includes(hourBranch)) return false;
      if (hourBranch === clash(dayBranch) || hourBranch === clash(monthBranch)) return false;
      if (natalBranches.some((branch) => hourBranch === clash(branch))) return false;
      return true;
    })
    .map(([hourBranch, reason]) => ({
      animal: ANIMALS[hourBranch],
      period: PERIODS[hourBranch],
      reason,
    }));
}

function sectorsForDate(date: Date): { stars: MoneyStarSector[]; warning: string | null } {
  const annual = flyingMap(date, "годовая");
  const monthly = flyingMap(date, "месячная");
  const targets: MoneyStarSector[] = [];
  const warnings: string[] = [];
  for (const number of [1, 6, 8]) {
    const annualDirection = annual.get(number);
    const monthlyFiveDirection = monthly.get(5);
    const annualIsCenter = annualDirection === "Центр";
    const blocked = !annualIsCenter && annualDirection === monthlyFiveDirection;
    if (blocked || annualIsCenter) {
      const direction = monthly.get(number);
      if (direction && direction !== "Центр") {
        targets.push(starAtDirection(number, direction, "месячная", blocked));
        warnings.push(`Годовой сектор звезды ${number} заменён месячным`);
      }
    } else if (annualDirection) {
      targets.push(starAtDirection(number, annualDirection, "годовая"));
    }
  }
  return { stars: targets, warning: warnings.length ? warnings.join(". ") + "." : null };
}

export function computeVtalkivanieMoneyActivation(
  birthDate: string,
  birthTime: string | null,
  today: Date = new Date(),
  location?: BirthLocationContext,
): VtalkivanieMoneyActivation | null {
  const birth = parseBirth(birthDate, birthTime);
  if (!birth) return null;
  try {
    const birthEc = getBirthEightChar(birthDate, birthTime, location);
    if (!birthEc) return null;
    const birthYearBranch = ZHI_CN.indexOf(birthEc.getYearZhi());
    const birthDayBranch = ZHI_CN.indexOf(birthEc.getDayZhi());
    const birthYearStem = GAN_CN.indexOf(birthEc.getYearGan());
    const birthDayStem = GAN_CN.indexOf(birthEc.getDayGan());
    const birthYearStemInfo = ["Дерево", "Дерево", "Огонь", "Огонь", "Земля", "Земля", "Металл", "Металл", "Вода", "Вода"][birthYearStem];
    const birthDayStemInfo = ["Дерево", "Дерево", "Огонь", "Огонь", "Земля", "Земля", "Металл", "Металл", "Вода", "Вода"][birthDayStem];
    const stemPolarity = (stem: number) => stem % 2 === 0 ? "Ян" : "Инь";
    const nobleBranches = [...new Set([
      ...(NOBLE_HELPER_BY_STEM[`${birthYearStemInfo}-${stemPolarity(birthYearStem)}`] ?? []),
      ...(NOBLE_HELPER_BY_STEM[`${birthDayStemInfo}-${stemPolarity(birthDayStem)}`] ?? []),
    ])];
    const postHorseBranch = POST_HORSE_BY_DAY_BRANCH[birthDayBranch];
    const targets = [birthYearBranch, birthDayBranch]
      .filter((idx) => idx >= 0)
      .map((idx) => MONEY_DAY_BY_BIRTH_BRANCH[idx]);
    const daySources = [...new Set(targets)].map((target) => ANIMALS[target]);
    const natalBranches = [birthYearBranch, birthDayBranch].filter((idx) => idx >= 0);

    for (let offset = 0; offset <= 3; offset++) {
      const date = new Date(today.getFullYear(), today.getMonth(), today.getDate() + offset, 12, 0, 0);
      const dayBranch = ZHI_CN.indexOf(baziAt(date).getDayZhi());
      if (!targets.includes(dayBranch)) continue;
      const hours = strictHours(date, natalBranches, nobleBranches, postHorseBranch);
      if (hours.length === 0) continue;
      const { stars, warning } = sectorsForDate(date);
      if (stars.length === 0) continue;
      return {
        date: isoDate(date),
        daysUntil: offset,
        month: MONTHS[date.getMonth()],
        dayAnimal: ANIMALS[dayBranch],
        daySources,
        hours,
        stars,
        warning,
        instruction: `Для звезды 1 используйте фонтанчик, для звезды 6 - вентилятор, для звезды 8 - свечу.`,
      };
    }
  } catch {
    return null;
  }
  return null;
}
