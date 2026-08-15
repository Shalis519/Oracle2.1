import { computeNatalChart, type NatalChart } from "./astrology";
import { asc, eq } from "drizzle-orm";
import { db, lunarInterpretationsTable } from "@workspace/db";

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
  second?: number;
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

function dateTimeFromOffset(date: string, offsetSeconds: number): { date: string; hour: number; minute: number; second: number } {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCSeconds(offsetSeconds);
  return { date: d.toISOString().slice(0, 10), hour: d.getUTCHours(), minute: d.getUTCMinutes(), second: d.getUTCSeconds() };
}

function formatDate(date: string): string {
  return new Date(`${date}T12:00:00Z`).toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

function signInLocativeCase(sign: string): string {
  const forms: Record<string, string> = {
    Овен: "Овне",
    Телец: "Тельце",
    Близнецы: "Близнецах",
    Рак: "Раке",
    Лев: "Льве",
    Дева: "Деве",
    Весы: "Весах",
    Скорпион: "Скорпионе",
    Стрелец: "Стрельце",
    Козерог: "Козероге",
    Водолей: "Водолее",
    Рыбы: "Рыбах",
  };
  return forms[sign] ?? sign;
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
): { date: string; hour: number; minute: number; second: number } | null {
  const samples: { offset: number; longitude: number }[] = [];
  const step = 6 * 60 * 60;
  const minOffset = -40 * 24 * 60 * 60;
  const maxOffset = 40 * 24 * 60 * 60;

  for (let offset = minOffset; offset <= maxOffset; offset += step) {
    const point = dateTimeFromOffset(startDate, offset);
    const chart = buildChart({
      year: Number(point.date.slice(0, 4)),
      month: Number(point.date.slice(5, 7)),
      day: Number(point.date.slice(8, 10)),
      hour: point.hour,
      minute: point.minute,
      second: point.second,
      latitude: location.latitude,
      longitude: location.longitude,
      timezone: location.timezone,
    });
    const moon = findMoon(chart);
    if (moon) samples.push({ offset, longitude: moon.longitude });
  }

  const crossings: { low: number; high: number; baseLongitude: number; targetDistance: number }[] = [];
  for (let index = 1; index < samples.length; index += 1) {
    const previous = samples[index - 1];
    const current = samples[index];
    const arc = normalize(current.longitude - previous.longitude);
    const targetDistance = normalize(natalMoonLongitude - previous.longitude);
    if (arc > 0 && arc < 30 && targetDistance <= arc) {
      crossings.push({
        low: previous.offset,
        high: current.offset,
        baseLongitude: previous.longitude,
        targetDistance,
      });
    }
  }

  const candidates = crossings
    .filter((crossing) => direction === 1 ? crossing.high >= 0 : crossing.low <= 0)
    .sort((a, b) => direction === 1 ? a.low - b.low : b.high - a.high);
  const crossing = candidates[0];
  if (!crossing) return null;

  let low = crossing.low;
  let high = crossing.high;
  const evaluateLongitude = (offset: number): number | null => {
    const point = dateTimeFromOffset(startDate, offset);
    const chart = buildChart({
      year: Number(point.date.slice(0, 4)),
      month: Number(point.date.slice(5, 7)),
      day: Number(point.date.slice(8, 10)),
      hour: point.hour,
      minute: point.minute,
      second: point.second,
      latitude: location.latitude,
      longitude: location.longitude,
      timezone: location.timezone,
    });
    const moon = findMoon(chart);
    return moon?.longitude ?? null;
  };

  const targetDistance = crossing.targetDistance;
  for (let iteration = 0; iteration < 18; iteration += 1) {
    const middle = Math.floor((low + high) / 2);
    const middleLongitude = evaluateLongitude(middle);
    if (middleLongitude == null) break;
    const middleDistance = normalize(middleLongitude - crossing.baseLongitude);
    if (Math.abs(middleDistance - targetDistance) <= 0.00005) {
      low = middle;
      high = middle;
      break;
    }
    if (middleDistance >= targetDistance) high = middle;
    else low = middle;
  }

  return dateTimeFromOffset(startDate, Math.floor((low + high) / 2));
}

const lunarReturnCache = new Map<string, { expiresAt: number; result: LunarReturnResult | null }>();
const LUNAR_CACHE_TTL_MS = 10 * 60 * 1000;

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
    second: previous.second,
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
    returnTime: `${String(previous.hour).padStart(2, "0")}:${String(previous.minute).padStart(2, "0")}:${String(previous.second).padStart(2, "0")}`,
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

export async function hydrateLunarRecommendations(result: LunarReturnResult | null): Promise<LunarReturnResult | null> {
  if (!result) return null;
  const rows = await db
    .select()
    .from(lunarInterpretationsTable)
    .where(eq(lunarInterpretationsTable.isActive, true))
    .orderBy(asc(lunarInterpretationsTable.category), asc(lunarInterpretationsTable.key));
  const signText = rows.find((row) => row.category === "sign" && row.key === result.moon.signKey)?.text?.trim();
  const houseText = result.moon.house
    ? rows.find((row) => row.category === "house" && row.key === String(result.moon.house))?.text?.trim()
    : null;
  const available = [signText, houseText].filter((text): text is string => Boolean(text && text !== "В разработке"));
  return {
    ...result,
    recommendations: available.length > 0
      ? [`В этом лунном месяце особенно важны темы Луны в ${signInLocativeCase(result.moon.sign)}${result.moon.house ? ` и ${result.moon.house}-го дома. ` : ". "}${available.join(" ")}`]
      : ["В разработке"],
  };
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
  const cacheKey = [
    profile.birthDate,
    profile.birthTime ?? "",
    today,
    location.source,
    location.latitude,
    location.longitude,
    location.timezone ?? "",
  ].join("|");
  const cached = lunarReturnCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) return cached.result;

  const result = computeCurrentLunarReturn(natalChart, today, location, buildNatalChart);
  lunarReturnCache.set(cacheKey, { expiresAt: Date.now() + LUNAR_CACHE_TTL_MS, result });
  return result;
}
