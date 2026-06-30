// Structure detection over an hourly chart. First structure: "Три Генерала".
import { controls, PALACES, STEM_ELEMENT, STEMS } from "./constants";
import { buildChart, DOOR_ELEMENT, STAR_ELEMENT } from "./chart";
import {
  GENERALS_ACTIVATION, GENERALS_STAR_NAME, THREE_GENERALS_TABLE, WONDER_NAME,
} from "../../data/qimen/threeGenerals";

const WONDERS = ["乙", "丙", "丁"] as const;
const QUALIFY_STARS = new Set(["天辅", "天心", "天任"]);
const QUALIFY_DOORS = new Set(["休门", "生门", "开门"]);

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
export function detectThreeGenerals(date: Date, hourBranch: number): GeneralsHit[] {
  const chart = buildChart(date, hourBranch);
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

export { STEMS, STEM_ELEMENT };
