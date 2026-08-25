// Structure detection over an hourly chart. First structure: "Три Генерала".
import { controls, PALACES, STEMS, STEM_ELEMENT, parseGanZhi, type Element } from "./constants";
import { buildChart, DOOR_ELEMENT, STAR_ELEMENT, mainGateStar } from "./chart";
import {
  GENERALS_ACTIVATION, GENERALS_STAR_NAME, THREE_GENERALS_TABLE, WONDER_NAME,
} from "../../data/qimen/threeGenerals";
import { flyingStarYear, getFlyingStar } from "../data/fengshui";
import { xunInfo } from "./calendar";

const WONDERS = ["乙", "丙", "丁"] as const;
const QUALIFY_STARS = new Set(["天辅", "天心", "天任"]);
// Для публикации допускаются только Врата Отдыха, Жизни и Открытия.
// Тайник, Пейзаж, Шок, Ранение и Смерть не проходят пользовательский фильтр.
const QUALIFY_DOORS = new Set(["休门", "生门", "开门"]);
// «Три Мистика» — домашняя активация: дополнительно допустимы Врата Вида и Тайника.
const THREE_MYSTICS_DOORS = new Set(["休门", "生门", "开门", "景门", "杜门"]);
const THREE_MYSTICS_GOAL: Record<"乙" | "丙" | "丁", string> = {
  乙: "Поддержать знакомство, важный контакт или уже существующие отношения",
  丙: "Усилить денежные дела, доход и практические финансовые задачи",
  丁: "Продвинуть документы, согласования, переписку или деловой разговор",
};
// Полностью благоприятные сочетания Heaven Stem → Earth Stem из таблиц
// Yi/Bing/Ding and Stem Combo в книге 540 Yang Structure. Умеренные (半吉)
// сочетания намеренно не включены в пользовательский вывод.
const THREE_MYSTICS_GOOD_EARTH_STEMS: Record<"乙" | "丙" | "丁", ReadonlySet<string>> = {
  乙: new Set(["丙", "丁"]),
  丙: new Set(["甲", "乙", "丁", "戊", "辛"]),
  丁: new Set(["甲", "乙", "丙", "丁", "戊", "壬"]),
};
const THREE_MYSTICS_ACTIVATION: Record<string, string> = {
  天辅: "Фонтанчик",
  天心: "Вентилятор",
  天任: "Свеча или газовая конфорка",
};

// 墓 (tomb) palace per wonder.
const TOMB: Record<string, number> = { 乙: 6, 丙: 6, 丁: 8 };
// Per-wonder direction cautions to avoid (Правила активации).
const WONDER_AVOID: Record<string, number[]> = { 乙: [2], 丙: [1], 丁: [6, 2] };
// Door must not be activated in these palaces (休 юг, 生 север, 开 восток).
const DOOR_AVOID: Record<string, number> = { 休门: 9, 生门: 1, 开门: 3 };

export interface FlyingBirdFallsIntoCaveHit {
  structure: "flying_bird_falls_into_cave";
  palace: number;
  direction: string;
  heavenStem: "丙";
  earthStem: "戊" | "己" | "庚" | "辛" | "壬" | "癸";
  hiddenJia: string;
  status: "placeholder";
  published: false;
}

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
  support?: SupportCheck;
}

export interface ThreeMysticsHit {
  palace: number;
  direction: string;
  dom: string;
  wonder: "乙" | "丙" | "丁";
  wonderName: string;
  earthStem: string;
  goal: string;
  star: string;
  starName: string;
  door: string;
  activation: string;
  support?: SupportCheck;
}

/**
 * Detect "Три Генерала" activations in the chart for the given hour.
 * Returns one hit per qualifying palace that passes ALL activation rules.
 */
/**
 * Внутренняя заглушка структуры 飛鳥跌穴 / Flying Bird Falls Into Cave.
 *
 * Joey Yap's 540 Yang Structure table defines the stem formation as
 * Heaven Plate 丙 over Earth Plate 甲. In the plotted chart 甲 is hidden
 * behind one of the six 六儀 markers 戊/己/庚/辛/壬/癸, according to the
 * current 旬. The visible marker is therefore resolved from the chart's
 * period pillar rather than hard-coded to 戊.
 *
 * This detector intentionally does not enter QimenResult and cannot be
 * published until the remaining school-specific conditions are verified.
 */
export function detectFlyingBirdFallsIntoCave(date: Date, hourBranch: number, lateZi = false): FlyingBirdFallsIntoCaveHit[] {
  const chart = buildChart(date, hourBranch, lateZi);
  const periodIndex = parseGanZhi(chart.hourGz).index;
  const hiddenJia = STEMS[xunInfo(periodIndex).yiStem] as FlyingBirdFallsIntoCaveHit["earthStem"];
  const hits: FlyingBirdFallsIntoCaveHit[] = [];
  for (let p = 1; p <= 9; p++) {
    if (p === 5) continue;
    const cell = chart.cells[p];
    if (cell.heavenStem !== "丙" || cell.earthStem !== hiddenJia) continue;
    hits.push({
      structure: "flying_bird_falls_into_cave",
      palace: p,
      direction: PALACES[p].dirFull,
      heavenStem: "丙",
      earthStem: hiddenJia,
      hiddenJia: `甲${chart.hourGz.charAt(1)}`,
      status: "placeholder",
      published: false,
    });
  }
  return hits;
}

export function detectThreeGenerals(
  date: Date,
  hourBranch: number,
  lateZi = false,
  birthYearStem?: number,
  representativeStem?: number,
): GeneralsHit[] {
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
    const support = birthYearStem === undefined
      ? undefined
      : evaluateSupportPalace(chart, p, birthYearStem, representativeStem);
    if (birthYearStem !== undefined && (!support || !support.supported)) continue;

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
      support: support ?? undefined,
    });
  }
  return hits;
}

/**
 * Detect "Три Мистика" (三奇) for an indoor activation.
 * The formula is universal: it uses the hourly chart and does not depend on birth data.
 * A hit requires a Mystic on the Heaven plate, a permitted door and a qualifying star.
 */
export function detectThreeMystics(
  date: Date,
  hourBranch: number,
  lateZi = false,
  birthYearStem?: number,
  representativeStem?: number,
): ThreeMysticsHit[] {
  const chart = buildChart(date, hourBranch, lateZi);
  if (chart.fuYin) return [];

  const hits: ThreeMysticsHit[] = [];
  for (let p = 1; p <= 9; p++) {
    if (p === 5) continue;
    const cell = chart.cells[p];
    const wonder = cell.heavenStem as "乙" | "丙" | "丁";
    if (!WONDERS.includes(wonder)) continue;
    if (!QUALIFY_STARS.has(cell.star)) continue;
    if (!THREE_MYSTICS_DOORS.has(cell.door)) continue;
    if (!THREE_MYSTICS_GOOD_EARTH_STEMS[wonder].has(cell.earthStem)) continue;

    // Явные табу исходной схемы и общие безопасные ограничения активаций.
    if (cell.isVoid) continue;
    if (cell.heavenStem === "庚" || cell.earthStem === "庚") continue;
    if (TOMB[wonder] === p) continue;
    if ((WONDER_AVOID[wonder] ?? []).includes(p)) continue;
    if (DOOR_AVOID[cell.door] === p) continue;
    if (annualYellowFive(p, date)) continue;
    if (controls(DOOR_ELEMENT[cell.door], STAR_ELEMENT[cell.star])) continue;
    // Сочетание Небесного и Земного стволов уже прошло строгую проверку
    // по списку благоприятных формирований из книги 540 Yang Structure.
    const support = birthYearStem === undefined
      ? undefined
      : evaluateSupportPalace(chart, p, birthYearStem, representativeStem);
    if (birthYearStem !== undefined && (!support || !support.supported)) continue;

    hits.push({
      palace: p,
      direction: PALACES[p].dirFull,
      dom: PALACES[p].dom,
      wonder,
      wonderName: WONDER_NAME[wonder],
      earthStem: cell.earthStem,
      goal: THREE_MYSTICS_GOAL[wonder],
      star: cell.star,
      starName: GENERALS_STAR_NAME[cell.star],
      door: cell.door,
      activation: THREE_MYSTICS_ACTIVATION[cell.star],
      support: support ?? undefined,
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
export type SupportRelation = "supports" | "same" | "receives" | "controls" | "neutral";

export interface SupportCheck {
  supported: boolean;
  relation: SupportRelation;
  structurePalace: number;
  supportPalace: number;
  structureElement: Element;
  personElement: Element;
}

function generates(source: Element, target: Element): boolean {
  return ({ wood: "fire", fire: "earth", earth: "metal", metal: "water", water: "wood" } as Record<Element, Element>)[source] === target;
}

/** Проверяет, поддерживает ли дворец структуры человека через НС года рождения. НС ищется только в Небесном кольце. */
export function evaluateSupportPalace(chart: ReturnType<typeof buildChart>, structurePalace: number, birthYearStem: number, representativeStem = birthYearStem): SupportCheck | null {
  if (birthYearStem < 0 || birthYearStem > 9 || structurePalace === 5) return null;
  const stem = STEMS[representativeStem];
  const supportPalace = Object.values(chart.cells).find((cell) => cell.heavenStem === stem)?.palace;
  if (!supportPalace || supportPalace === 5) return null;
  const structureElement = PALACES[structurePalace].element;
  const personElement = STEM_ELEMENT[birthYearStem];
  const relation: SupportRelation = structureElement === personElement
    ? "same"
    : generates(structureElement, personElement)
      ? "supports"
      : generates(personElement, structureElement)
        ? "receives"
        : controls(structureElement, personElement) || controls(personElement, structureElement)
          ? "controls"
          : "neutral";
  return { supported: relation === "supports" || relation === "same", relation, structurePalace, supportPalace, structureElement, personElement };
}

export interface JadeMaidenHit {
  palace: number;
  variant: number;
  heavenStem: string;
  earthStem: string;
  door: string;
  isMainGate: boolean;
  support?: SupportCheck;
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

export function detectJadeMaiden(date: Date, hourBranch: number, lateZi = false, birthYearStem?: number, representativeStem?: number): JadeMaidenHit[] {
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
    const support = birthYearStem === undefined ? undefined : evaluateSupportPalace(chart, p, birthYearStem, representativeStem);
    if (birthYearStem !== undefined && (!support || !support.supported)) continue;
    hits.push({ palace: p, variant, heavenStem: h, earthStem: e, door: c.door, isMainGate: isMain, support: support ?? undefined });
  }
  return hits;
}

export { STEMS };
