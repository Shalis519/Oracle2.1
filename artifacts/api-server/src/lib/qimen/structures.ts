// Structure detection over an hourly chart. First structure: "Три Генерала".
import { controls, PALACES, STEMS } from "./constants";
import { buildChart, DOOR_ELEMENT, STAR_ELEMENT, mainGateStar } from "./chart";
import {
  GENERALS_ACTIVATION, GENERALS_STAR_NAME, THREE_GENERALS_TABLE, WONDER_NAME,
} from "../../data/qimen/threeGenerals";
import { flyingStarYear, getFlyingStar } from "../data/fengshui";

const WONDERS = ["乙", "丙", "丁"] as const;
const QUALIFY_STARS = new Set(["天辅", "天心", "天任"]);
// Допустимые Врата: три благоприятных (休 Отдых, 生 Жизнь, 开 Открытие) плюс
// нейтральные 杜 (Преграда/тайник) и 景 (Пейзаж/сцена). Исключены неблагоприятные
// 死 (Смерть), 惊 (Испуг/шок) и 伤 (Вред).
const QUALIFY_DOORS = new Set(["休门", "生门", "开门", "杜门", "景门"]);

// 墓 (tomb) palace per wonder.
const TOMB: Record<string, number> = { 乙: 6, 丙: 6, 丁: 8 };
// Per-wonder direction cautions to avoid (Правила активации).
const WONDER_AVOID: Record<string, number[]> = { 乙: [2], 丙: [1], 丁: [6, 2] };
// Door must not be activated in these palaces (休 юг, 生 север, 开 восток).
const DOOR_AVOID: Record<string, number> = { 休门: 9, 生门: 1, 开门: 3 };

export interface GeneralsHit {
  structure: "three_generals";
  palace: number;
  direction: string; // full Russian, e.g. "северо-запад"
  dom: string; // "6 Дом"
  wonder: string; // 乙/丙/丁
  wonderName: string;
  star: string; // 天辅/天心/天任
  starName: string;
  door: string;
  activation: string; // Фонтанчик / Вентилятор / Свеча
  signs: string[];
  result: string;
  note?: string;
}

/**
 * Detect "Три Генерала" activations in the chart for the given hour.
 * Returns one hit per qualifying palace that passes ALL activation rules.
 */
export function detectThreeGenerals(date: Date, hourBranch: number, lateZi = false): GeneralsHit[] {
  const chart = buildChart(date, hourBranch, lateZi);
  if (chart.fuYin) return []; // Избегаем Фу Инь

  const hits: GeneralsHit[] = [];
  for (let p = 1; p <= 9; p++) {
    if (p === 5) continue; // center has no direction
    const cell = chart.cells[p];
    const wonder = cell.heavenStem; // Только небесное кольцо
    if (!WONDERS.includes(wonder as (typeof WONDERS)[number])) continue;
    if (!QUALIFY_STARS.has(cell.star)) continue;
    if (!QUALIFY_DOORS.has(cell.door)) continue;

    // --- Exclusions (Правила активации) ---
    if (cell.isVoid) continue; // Избегаем дворца ПУСТОТЫ (空亡)
    if (cell.heavenStem === "庚" || cell.earthStem === "庚") continue; // Избегаем Гэн
    if (TOMB[wonder] === p) continue; // Избегаем сектора МОГИЛЫ (墓)
    if (DOOR_AVOID[cell.door] === p) continue; // 休 юг / 生 север / 开 восток
    if ((WONDER_AVOID[wonder] ?? []).includes(p)) continue; // per-wonder cautions
    // 门迫: door must not control (克) the star.
    if (controls(DOOR_ELEMENT[cell.door], STAR_ELEMENT[cell.star])) continue;

    const row = THREE_GENERALS_TABLE[wonder as "乙" | "丙" | "丁"][p];
    if (!row) continue;

    hits.push({
      structure: "three_generals",
      palace: p,
      direction: PALACES[p].dirFull,
      dom: PALACES[p].dom,
      wonder,
      wonderName: WONDER_NAME[wonder],
      star: cell.star,
      starName: GENERALS_STAR_NAME[cell.star],
      door: cell.door,
      activation: GENERALS_ACTIVATION[cell.star],
      signs: row.signs,
      result: row.result,
      note: row.note,
    });
  }
  return hits;
}

// --- "Нефритовая Дева" (玉女守门) -------------------------------------------
// Universal structure evaluated only on hourly charts. When a birth year is supplied,
// the public scan applies the day-vs-birth-year clash prohibition before publishing hits.
// Signal stem 丁 (Огонь Инь); Мистики = 乙丙丁.
// Variants (per structure palace p), following the four-row one-page scheme:
//   1: H=丁 & E=丁 & door = Главные Врата (самый сильный)
//   2: H=丁 & E=丁 (без учёта Главных Врат)
//   3: H=丁 & E=янский ствол или 三奇 & door = Главные Врата
//   4: H=янский ствол или 三奇 & E=丁 & door = Главные Врата
// 三奇 (Три Мистика) are 乙/丙/丁. 戊 is 六仪, but is included in the
// positive/yang stem set for rows 3–4, as shown by the one-page scheme.
export interface JadeMaidenHit {
  palace: number;
  variant: number;
  heavenStem: string;
  earthStem: string;
  door: string;
  isMainGate: boolean;
}

/** Classifies the four rows from the one-page Jade Maiden scheme. */
export function jadeMaidenVariant(heavenStem: string, earthStem: string, isMainGate: boolean): number {
  // 三奇 (乙/丙/丁) are Mystics. 戊/庚/壬 are yang stems and are accepted by
  // the one-page scheme as a positive element; 戊 itself is not a Mystic.
  const positiveOrMystic = (x: string) =>
    ["乙", "丙", "丁", "戊", "庚", "壬"].includes(x);
  if (heavenStem === "丁" && earthStem === "丁") return isMainGate ? 1 : 2;
  if (heavenStem === "丁" && positiveOrMystic(earthStem) && isMainGate) return 3;
  if (positiveOrMystic(heavenStem) && earthStem === "丁" && isMainGate) return 4;
  return 0;
}

// Годовая летящая звезда сектора === 5 (五黄 «Жёлтая Пятёрка»): в Ци Мэнь такой
// сектор не используется. Направление берётся из годовой карты (2026 — юг).
function annualYellowFive(palace: number, date: Date): boolean {
  const dirFull = PALACES[palace].dirFull;
  const dir = dirFull.charAt(0).toUpperCase() + dirFull.slice(1);
  return getFlyingStar(dir, flyingStarYear(date)).starNumber === 5;
}

export function detectJadeMaiden(date: Date, hourBranch: number, lateZi = false): JadeMaidenHit[] {
  const chart = buildChart(date, hourBranch, lateZi);
  const main = mainGateStar(chart);
  const hits: JadeMaidenHit[] = [];
  for (let p = 1; p <= 9; p++) {
    if (p === 5) continue; // center has no direction
    const c = chart.cells[p];
    const h = c.heavenStem;
    const e = c.earthStem;
    const isMain = main.gate !== "" && c.door === main.gate;
    const variant = jadeMaidenVariant(h, e, isMain);
    if (!variant) continue;
    // 五黄: сектор с годовой звездой «Жёлтая Пятёрка» в Ци Мэнь не используется
    // (в 2026 году — юг); такие структуры исключаем.
    if (annualYellowFive(p, date)) continue;
    // В формуле участвуют только Отдых, Открытие, Жизнь, Пейзаж и Тайник.
    // Врата Тайника допустимы с отдельной оговоркой для скрытых встреч.
    const jadeMaidenDoors = new Set(["休门", "开门", "生门", "景门", "杜门"]);
    if (!jadeMaidenDoors.has(c.door)) continue;
    hits.push({ palace: p, variant, heavenStem: h, earthStem: e, door: c.door, isMainGate: isMain });
  }
  return hits;
}

export { STEMS };
