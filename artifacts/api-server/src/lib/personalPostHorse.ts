import { Solar } from "lunar-typescript";
import { type BirthLocationContext, getBirthEightChar } from "./oracle";

const ZHI_CN = "子丑寅卯辰巳午未申酉戌亥".split("");
const ANIMALS = [
  "Крыса", "Бык", "Тигр", "Кролик", "Дракон", "Змея",
  "Лошадь", "Коза", "Обезьяна", "Петух", "Собака", "Свинья",
];
const PERIODS = [
  "23:00-01:00", "01:00-03:00", "03:00-05:00", "05:00-07:00",
  "07:00-09:00", "09:00-11:00", "11:00-13:00", "13:00-15:00",
  "15:00-17:00", "17:00-19:00", "19:00-21:00", "21:00-23:00",
];

// Личная Путешествующая лошадь определяется по земной ветви дня рождения.
const HORSE_BY_GROUP: Record<number, number> = {
  0: 2,  // 子 Крыса -> 寅 Тигр
  4: 2,  // 辰 Дракон -> 寅 Тигр
  8: 2,  // 申 Обезьяна -> 寅 Тигр
  2: 8,  // 寅 Тигр -> 申 Обезьяна
  6: 8,  // 午 Лошадь -> 申 Обезьяна
  10: 8, // 戌 Собака -> 申 Обезьяна
  5: 11, // 巳 Змея -> 亥 Свинья
  9: 11, // 酉 Петух -> 亥 Свинья
  1: 11, // 丑 Бык -> 亥 Свинья
  11: 5, // 亥 Свинья -> 巳 Змея
  3: 5,  // 卯 Кролик -> 巳 Змея
  7: 5,  // 未 Коза -> 巳 Змея
};

const SIX_HARMONY = [1, 0, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2];
const SAN_HE_GROUPS = [[8, 0, 4], [11, 3, 7], [2, 6, 10], [5, 9, 1]];
const SEASONAL_GROUPS = [[2, 3, 4], [5, 6, 7], [8, 9, 10], [11, 0, 1]];
const clashOf = (branch: number): number => (branch + 6) % 12;

const DAY_OFFICERS = [
  "Установление", "Устранение", "Наполнение", "Баланс", "Стабильность", "Удержание",
  "Разрушение", "Опасность", "Успех", "Сбор урожая", "Открытие", "Закрытие",
] as const;

const SAN_SHA_GROUPS: Array<{ source: number[]; sha: number[]; robbery: number; disaster: number }> = [
  { source: [8, 0, 4], sha: [5, 6, 7], robbery: 5, disaster: 6 },
  { source: [11, 3, 7], sha: [8, 9, 10], robbery: 8, disaster: 9 },
  { source: [2, 6, 10], sha: [11, 0, 1], robbery: 11, disaster: 0 },
  { source: [5, 9, 1], sha: [2, 3, 4], robbery: 2, disaster: 3 },
];

const PUNISHMENT_GROUPS = [[0, 3], [2, 5, 8], [1, 10, 7]];
const SELF_PUNISHMENT = new Set([4, 6, 9, 11]);
const HARM_PAIRS = [[0, 7], [1, 6], [2, 5], [3, 4], [8, 11], [9, 10]];
const BREAK_PAIRS = [[0, 9], [3, 6], [4, 1], [7, 10], [2, 11], [5, 8]];

function samePair(a: number, b: number, pairs: number[][]): boolean {
  return pairs.some(([left, right]) => (a === left && b === right) || (a === right && b === left));
}

function hasPunishment(a: number, b: number): boolean {
  if (a === b && SELF_PUNISHMENT.has(a)) return true;
  return PUNISHMENT_GROUPS.some((group) => group.includes(a) && group.includes(b));
}

function isSanSha(dayBranch: number, yearBranch: number, monthBranch: number): boolean {
  const yearGroup = SAN_SHA_GROUPS.find((group) => group.source.includes(yearBranch));
  const monthGroup = SAN_SHA_GROUPS.find((group) => group.source.includes(monthBranch));
  return Boolean(yearGroup?.sha.includes(dayBranch) || monthGroup?.sha.includes(dayBranch));
}

function isUnfavorableNatalRelation(dayBranch: number, natalBranches: number[]): boolean {
  return natalBranches.some((natal) =>
    dayBranch === clashOf(natal)
    || hasPunishment(dayBranch, natal)
    || samePair(dayBranch, natal, HARM_PAIRS)
    || samePair(dayBranch, natal, BREAK_PAIRS),
  );
}

const HORSE_SECTORS: Record<number, {
  mountain: string;
  direction: string;
  degrees: string;
  image: string;
}> = {
  2: {
    mountain: "СВ-3",
    direction: "Северо-восток",
    degrees: "52,5°-67,5°",
    image: "Лошадь, бегущая по зелёной траве",
  },
  8: {
    mountain: "ЮЗ-3",
    direction: "Юго-запад",
    degrees: "232,5°-247,5°",
    image: "Серая или белая лошадь",
  },
  11: {
    mountain: "СЗ-3",
    direction: "Северо-запад",
    degrees: "322,5°-337,5°",
    image: "Лошадь, бегущая по воде",
  },
  5: {
    mountain: "ЮВ-3",
    direction: "Юго-восток",
    degrees: "142,5°-157,5°",
    image: "Красный конь",
  },
};

export interface PersonalPostHorseHour {
  animal: string;
  period: string;
  isHorseHour: boolean;
  reason: string;
}

export interface PersonalPostHorseActivation {
  date: string;
  daysUntil: number;
  dayAnimal: string;
  horseAnimal: string;
  mountain: string;
  direction: string;
  degrees: string;
  image: string;
  hours: PersonalPostHorseHour[];
  instruction: string;
  safety: string;
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

function dayOfficer(dayBranch: number, monthBranch: number): string {
  return DAY_OFFICERS[(dayBranch - monthBranch + 12) % 12];
}

function isEarthPeriod(date: Date): boolean {
  const month = date.getMonth() + 1;
  const day = date.getDate();
  return [1, 4, 7, 10].includes(month) && day >= 21
    || [2, 5, 8, 11].includes(month) && day <= 7;
}

function hasVoidHour(ec: ReturnType<typeof baziAt>, branch: number): boolean {
  return Array.from(ec.getDayXunKong())
    .map((value) => ZHI_CN.indexOf(value))
    .includes(branch);
}

function buildHours(
  date: Date,
  horseBranch: number,
  monthBranch: number,
  natalBranches: number[],
): PersonalPostHorseHour[] {
  const ec = baziAt(date);
  const dayBranch = ZHI_CN.indexOf(ec.getDayZhi());
  const candidates = new Map<number, string>();
  candidates.set(horseBranch, "час личной лошади");
  candidates.set(SIX_HARMONY[horseBranch], "слияние с личной лошадью");
  for (const group of SAN_HE_GROUPS) {
    if (group.includes(horseBranch)) {
      for (const branch of group) {
        if (!candidates.has(branch)) candidates.set(branch, "союз с личной лошадью");
      }
    }
  }
  for (const group of SEASONAL_GROUPS) {
    if (group.includes(horseBranch)) {
      for (const branch of group) {
        if (!candidates.has(branch)) candidates.set(branch, "сезон с личной лошадью");
      }
    }
  }

  const result: PersonalPostHorseHour[] = [];
  const ordered = [...candidates.entries()].sort(
    ([a], [b]) => (a === 0 ? 12 : a) - (b === 0 ? 12 : b),
  );
  for (const [branch, reason] of ordered) {
    if (hasVoidHour(ec, branch)) continue;
    if (branch === clashOf(dayBranch)) continue;
    if (branch === clashOf(monthBranch)) continue;
    if (natalBranches.some((natal) => branch === clashOf(natal))) continue;
    result.push({
      animal: ANIMALS[branch],
      period: PERIODS[branch],
      isHorseHour: branch === horseBranch,
      reason,
    });
  }
  return result;
}

/**
 * Finds the nearest activation date visible in the three-day publication window.
 * Only the personal horse from the birth-day branch is used; the birth-year branch
 * is deliberately not used for this activation.
 */
export function computePersonalPostHorseActivation(
  birthDate: string,
  birthTime: string | null,
  today: Date = new Date(),
  location?: BirthLocationContext,
): PersonalPostHorseActivation | null {
  const birth = parseBirth(birthDate, birthTime);
  if (!birth) return null;
  try {
    const birthEc = getBirthEightChar(birthDate, birthTime, location);
    if (!birthEc) return null;
    const birthYearBranch = ZHI_CN.indexOf(birthEc.getYearZhi());
    const birthDayBranch = ZHI_CN.indexOf(birthEc.getDayZhi());
    const horseBranch = HORSE_BY_GROUP[birthDayBranch];
    const sector = HORSE_SECTORS[horseBranch];
    if (birthDayBranch < 0 || horseBranch === undefined || !sector) return null;
    // If the personal horse clashes with the natal day branch, it is the personal Destroyer.
    if (horseBranch === clashOf(birthDayBranch)) return null;
    const natalBranches = [birthYearBranch, birthDayBranch].filter((branch) => branch >= 0);

    for (let offset = 0; offset <= 3; offset++) {
      const date = new Date(today.getFullYear(), today.getMonth(), today.getDate() + offset, 12, 0, 0);
      if (isEarthPeriod(date)) continue;
      const ec = baziAt(date);
      const dayBranch = ZHI_CN.indexOf(ec.getDayZhi());
      const yearBranch = ZHI_CN.indexOf(ec.getYearZhi());
      const monthBranch = ZHI_CN.indexOf(ec.getMonthZhi());
      if (dayBranch < 0 || yearBranch < 0 || monthBranch < 0) continue;
      // The activation date must be the day of the personal horse.
      if (dayBranch !== horseBranch) continue;
      if (dayBranch === (yearBranch + 6) % 12) continue;
      if (dayBranch === (monthBranch + 6) % 12) continue;
      if (isSanSha(dayBranch, yearBranch, monthBranch)) continue;
      if (dayOfficer(dayBranch, monthBranch) === "Разрушение") continue;
      if (isUnfavorableNatalRelation(dayBranch, natalBranches)) continue;
      const hours = buildHours(date, horseBranch, monthBranch, natalBranches);
      // The personal horse hour is mandatory; affinity hours are supplementary.
      if (!hours.some((hour) => hour.isHorseHour)) continue;
      return {
        date: isoDate(date),
        daysUntil: offset,
        dayAnimal: ANIMALS[dayBranch],
        horseAnimal: ANIMALS[horseBranch],
        ...sector,
        hours,
        instruction: `Разместите изображение личной лошади в секторе ${sector.mountain}, мордой к двери. Подходящее изображение: ${sector.image}.`,
        safety: "Если поездок и работы стало слишком много и вы сильно устали, уберите изображение лошади в шкаф до восстановления.",
      };
    }
  } catch {
    return null;
  }
  return null;
}
