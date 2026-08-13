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

const HORSE_SECTORS: Record<number, {
  mountain: string;
  direction: string;
  degrees: string;
  image: string;
}> = {
  2: {
    mountain: "СВ3 (Тигр 寅)",
    direction: "Северо-восток",
    degrees: "52,5°-67,5°",
    image: "Лошадь, бегущая по зелёной траве",
  },
  8: {
    mountain: "ЮЗ3 (Обезьяна 申)",
    direction: "Юго-запад",
    degrees: "232,5°-247,5°",
    image: "Серая или белая лошадь",
  },
  11: {
    mountain: "СЗ3 (Свинья 亥)",
    direction: "Северо-запад",
    degrees: "322,5°-337,5°",
    image: "Лошадь, бегущая по воде",
  },
  5: {
    mountain: "ЮВ3 (Змея 巳)",
    direction: "Юго-восток",
    degrees: "142,5°-157,5°",
    image: "Красный конь",
  },
};

export interface PersonalPostHorseHour {
  animal: string;
  period: string;
  isHorseHour: boolean;
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

function buildHours(date: Date, horseBranch: number): PersonalPostHorseHour[] {
  const ec = baziAt(date);
  const dayBranch = ZHI_CN.indexOf(ec.getDayZhi());
  const hours: PersonalPostHorseHour[] = [];
  for (let branch = 0; branch < 12; branch++) {
    if (hasVoidHour(ec, branch)) continue;
    if (branch === (dayBranch + 6) % 12) continue;
    hours.push({
      animal: ANIMALS[branch],
      period: PERIODS[branch],
      isHorseHour: branch === horseBranch,
    });
  }
  return hours;
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
    const birthDayBranch = ZHI_CN.indexOf(birthEc.getDayZhi());
    const horseBranch = HORSE_BY_GROUP[birthDayBranch];
    const sector = HORSE_SECTORS[horseBranch];
    if (birthDayBranch < 0 || horseBranch === undefined || !sector) return null;

    for (let offset = 0; offset <= 3; offset++) {
      const date = new Date(today.getFullYear(), today.getMonth(), today.getDate() + offset, 12, 0, 0);
      if (isEarthPeriod(date)) continue;
      const ec = baziAt(date);
      const dayBranch = ZHI_CN.indexOf(ec.getDayZhi());
      const yearBranch = ZHI_CN.indexOf(ec.getYearZhi());
      const monthBranch = ZHI_CN.indexOf(ec.getMonthZhi());
      if (dayBranch < 0 || yearBranch < 0 || monthBranch < 0) continue;
      if (dayBranch === (yearBranch + 6) % 12) continue;
      if (dayBranch === (monthBranch + 6) % 12) continue;
      const hours = buildHours(date, horseBranch);
      if (hours.length === 0) continue;
      const preferredHours = hours.filter((hour) => hour.isHorseHour);
      const selectedHours = preferredHours.length > 0 ? preferredHours : hours;
      return {
        date: isoDate(date),
        daysUntil: offset,
        dayAnimal: ANIMALS[dayBranch],
        horseAnimal: ANIMALS[horseBranch],
        ...sector,
        hours: selectedHours,
        instruction: `Разместите изображение личной лошади в секторе ${sector.mountain}, мордой к двери. Подходящее изображение: ${sector.image}.`,
        safety: "Если поездок и работы стало слишком много и вы сильно устали, уберите изображение лошади в шкаф до восстановления.",
      };
    }
  } catch {
    return null;
  }
  return null;
}
