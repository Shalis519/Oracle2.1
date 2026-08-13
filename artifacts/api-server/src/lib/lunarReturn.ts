import type { NatalChart } from "./astrology";

export interface LunarReturnLocation {
  city: string | null;
  latitude: number;
  longitude: number;
  timezone: string | null;
  source: "residence" | "birth";
}

export interface LunarChartBody {
  key: string;
  name: string;
  sign: string;
  signKey: string;
  degreeInSign: string;
  longitude: number;
  house: number | null;
}

export interface LunarChartAngle {
  key: string;
  abbr: string;
  sign: string;
  degreeInSign: string;
  longitude: number;
}

export interface LunarReturnResult {
  returnDate: string;
  returnTime: string;
  periodStart: string;
  periodEnd: string;
  location: LunarReturnLocation;
  usedBirthPlace: boolean;
  warning: string | null;
  ascendant: LunarChartAngle | null;
  moon: LunarChartBody;
  keyThemes: string[];
  recommendations: string[];
}

type ChartSnapshot = {
  bodies: LunarChartBody[];
  angles: LunarChartAngle[];
};

type ChartBuilder = (input: {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  latitude: number;
  longitude: number;
  timezone?: string | null;
}) => ChartSnapshot;

function normalize(value: number): number {
  return ((value % 360) + 360) % 360;
}

function signedDifference(value: number, target: number): number {
  return ((value - target + 540) % 360) - 180;
}

function shiftLocalDate(date: string, days: number): string {
  const d = new Date(`${date}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

function localDateTimeFromOffset(date: string, minutes: number): { date: string; hour: number; minute: number } {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCMinutes(minutes);
  return { date: d.toISOString().slice(0, 10), hour: d.getUTCHours(), minute: d.getUTCMinutes() };
}

function formatDate(date: string): string {
  return new Date(`${date}T12:00:00Z`).toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

function findMoon(chart: ChartSnapshot): LunarChartBody | null {
  return chart.bodies.find((body) => body.key === "moon") ?? null;
}

function findReturnInRange(
  natalMoonLongitude: number,
  startDate: string,
  direction: 1 | -1,
  location: LunarReturnLocation,
  buildChart: ChartBuilder,
): { date: string; hour: number; minute: number } | null {
  const samples: { date: string; hour: number; minute: number; difference: number }[] = [];
  for (let dayOffset = 0; dayOffset <= 40; dayOffset += 1) {
    const day = shiftLocalDate(startDate, direction * dayOffset);
    for (const hour of [0, 6, 12, 18]) {
      const chart = buildChart({
        year: Number(day.slice(0, 4)),
        month: Number(day.slice(5, 7)),
        day: Number(day.slice(8, 10)),
        hour,
        minute: 0,
        latitude: location.latitude,
        longitude: location.longitude,
        timezone: location.timezone,
      });
      const moon = findMoon(chart);
      if (!moon) continue;
      samples.push({ date: day, hour, minute: 0, difference: signedDifference(moon.longitude, natalMoonLongitude) });
    }
  }

  const ordered = direction === 1 ? samples : [...samples].reverse();
  for (let index = 1; index < ordered.length; index += 1) {
    const previous = ordered[index - 1];
    const current = ordered[index];
    if (Math.abs(previous.difference) <= 0.15) return previous;
    if (previous.difference === 0 || current.difference === 0 || previous.difference * current.difference < 0) {
      let low = 0;
      let high = 360;
      const base = previous.date;
      for (let iteration = 0; iteration < 9; iteration += 1) {
        const middle = Math.floor((low + high) / 2);
        const point = localDateTimeFromOffset(base, middle);
        const chart = buildChart({
          year: Number(point.date.slice(0, 4)),
          month: Number(point.date.slice(5, 7)),
          day: Number(point.date.slice(8, 10)),
          hour: point.hour,
          minute: point.minute,
          latitude: location.latitude,
          longitude: location.longitude,
          timezone: location.timezone,
        });
        const moon = findMoon(chart);
        if (!moon) break;
        const difference = signedDifference(moon.longitude, natalMoonLongitude);
        if (Math.abs(difference) <= 0.08) return point;
        if (previous.difference * difference <= 0) high = middle;
        else low = middle;
      }
      const point = localDateTimeFromOffset(base, Math.floor((low + high) / 2));
      return point;
    }
  }
  return null;
}

function recommendations(signKey: string, houseNumber: number | null): { themes: string[]; texts: string[] } {
  const byHouse: Record<number, [string, string]> = {
    1: ["личность и самопрезентация", "Обратите внимание на личные решения, внешний образ и инициативу."],
    2: ["деньги и ценности", "Пересмотрите финансовые приоритеты и отношение к собственным ресурсам."],
    3: ["общение и обучение", "Полезно уделить внимание разговорам, документам, поездкам и новым знаниям."],
    4: ["дом и семья", "Сосредоточьтесь на домашней опоре, семье и эмоциональной безопасности."],
    5: ["творчество и любовь", "Оставьте место творчеству, радости, романтике и личным проектам."],
    6: ["работа и здоровье", "Настройте режим, рабочие процессы и заботу о физическом состоянии."],
    7: ["отношения и партнёрство", "Обращайте внимание на договорённости, взаимность и личные границы."],
    8: ["общие ресурсы и трансформация", "Разбирайте финансовые обязательства и внутренние изменения постепенно."],
    9: ["смысл, путешествия и обучение", "Подходящее время для расширения кругозора, обучения и дальних планов."],
    10: ["карьера и статус", "Определите приоритеты в карьере и действиях, влияющих на репутацию."],
    11: ["друзья и планы", "Пересмотрите круг общения и долгосрочные цели, связанные с сообществами."],
    12: ["отдых и внутренний мир", "Планируйте восстановление, тишину и работу с внутренними состояниями."],
  };
  const signThemes: Record<string, string> = {
    aries: "инициатива и самостоятельность", taurus: "ресурсы и устойчивость", gemini: "общение и обмен идеями",
    cancer: "дом и эмоциональная опора", leo: "самовыражение и творчество", virgo: "порядок и практические шаги",
    libra: "отношения и баланс", scorpio: "глубина и трансформация", sagittarius: "смысл и расширение возможностей",
    capricorn: "цели и ответственность", aquarius: "свобода и новые связи", pisces: "интуиция и внутренний мир",
  };
  const house = houseNumber ? byHouse[houseNumber] : null;
  return {
    themes: [signThemes[signKey] ?? "эмоциональный фокус", ...(house ? [house[0]] : [])],
    texts: [house?.[1] ?? "Наблюдайте за эмоциональными реакциями и выбирайте действия, которые поддерживают ваши долгосрочные цели."],
  };
}

export function computeCurrentLunarReturn(
  natalChart: ChartSnapshot,
  today: string,
  location: LunarReturnLocation,
  buildChart: ChartBuilder,
): LunarReturnResult | null {
  const natalMoon = findMoon(natalChart);
  if (!natalMoon) return null;
  const previous = findReturnInRange(natalMoon.longitude, today, -1, location, buildChart);
  const next = findReturnInRange(natalMoon.longitude, today, 1, location, buildChart);
  if (!previous || !next) return null;

  const returnChart = buildChart({
    year: Number(previous.date.slice(0, 4)),
    month: Number(previous.date.slice(5, 7)),
    day: Number(previous.date.slice(8, 10)),
    hour: previous.hour,
    minute: previous.minute,
    latitude: location.latitude,
    longitude: location.longitude,
    timezone: location.timezone,
  });
  const returnMoon = findMoon(returnChart);
  if (!returnMoon) return null;
  const lunar = recommendations(returnMoon.signKey, returnMoon.house);
  const ascendant = returnChart.angles.find((angle) => angle.key === "ascendant") ?? null;
  return {
    returnDate: previous.date,
    returnTime: `${String(previous.hour).padStart(2, "0")}:${String(previous.minute).padStart(2, "0")}`,
    periodStart: previous.date,
    periodEnd: next.date,
    location,
    usedBirthPlace: location.source === "birth",
    warning: location.source === "birth" ? "Лунар рассчитан для города рождения. Укажите город проживания в настройках для нового расчёта." : null,
    ascendant,
    moon: returnMoon,
    keyThemes: lunar.themes,
    recommendations: lunar.texts,
  };
}

export function lunarReturnStartsToday(lunar: LunarReturnResult | null, today: string): boolean {
  return Boolean(lunar?.returnDate === today);
}

export function lunarReturnSummaryText(): string {
  return "Начался новый лунар. Подробности во вкладке Западная астрология.";
}

export function lunarReturnDateLabel(date: string): string {
  return formatDate(date);
}

export function computeLunarForProfile(
  profile: {
    birthDate: string | null;
    birthTime: string | null;
    birthPlace: string | null;
    birthLatitude: number | null;
    birthLongitude: number | null;
    birthTimezone: string | null;
    city: string | null;
    cityLatitude: number | null;
    cityLongitude: number | null;
    cityTimezone: string | null;
  },
  today: string,
  buildNatalChart: ChartBuilder,
): LunarReturnResult | null {
  if (!profile.birthDate || profile.birthLatitude == null || profile.birthLongitude == null) return null;
  const [year, month, day] = profile.birthDate.split("-").map(Number);
  const [hour, minute] = (profile.birthTime ?? "12:00").split(":").map(Number);
  const birthInput = {
    year,
    month,
    day,
    hour: Number.isFinite(hour) ? hour : 12,
    minute: Number.isFinite(minute) ? minute : 0,
    latitude: profile.birthLatitude,
    longitude: profile.birthLongitude,
    timezone: profile.birthTimezone,
  };
  const natalChart: NatalChart = buildNatalChart(birthInput) as NatalChart;
  const hasResidence = profile.cityLatitude != null && profile.cityLongitude != null;
  const location: LunarReturnLocation = hasResidence
    ? {
        city: profile.city,
        latitude: profile.cityLatitude!,
        longitude: profile.cityLongitude!,
        timezone: profile.cityTimezone,
        source: "residence",
      }
    : {
        city: profile.birthPlace,
        latitude: profile.birthLatitude,
        longitude: profile.birthLongitude,
        timezone: profile.birthTimezone,
        source: "birth",
      };
  return computeCurrentLunarReturn(natalChart, today, location, buildNatalChart);
}
