// Structure detection over an hourly chart. First structure: "Три Генерала".
import {
  controls,
  PALACES,
  STEMS,
  parseGanZhi,
  type Element,
  BRANCH_PALACE,
  BRANCHES,
} from "./constants";
import {
  buildChart,
  DOOR_ELEMENT,
  isHourControlsDay,
  STAR_ELEMENT,
  mainGateStar,
} from "./chart";
import {
  GENERALS_ACTIVATION,
  GENERALS_STAR_NAME,
  THREE_GENERALS_TABLE,
  WONDER_NAME,
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
const THREE_MYSTICS_GOOD_EARTH_STEMS: Record<
  "乙" | "丙" | "丁",
  ReadonlySet<string>
> = {
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
// Врата не должны контролировать дворец. Это положение ограничивает действие
// и не публикуется ни в одной пользовательской структуре.
export function hasDoorPalaceConflict(door: string, palace: number): boolean {
  if (palace === 5 || !DOOR_ELEMENT[door] || !PALACES[palace]) return true;
  const doorElement = DOOR_ELEMENT[door];
  const palaceElement = PALACES[palace].element;
  return controls(doorElement, palaceElement);
}

const FIVE_BATTALIONS_STEMS = ["甲", "乙", "丙", "丁", "戊"] as const;
type FiveBattalionsStem = (typeof FIVE_BATTALIONS_STEMS)[number];

// Для публикации используются только строго благоприятные связки Небесного
// и Земного стволов из таблиц 540 Yang Structure.
const FIVE_BATTALIONS_GOOD_EARTH_STEMS: Record<
  FiveBattalionsStem,
  ReadonlySet<string>
> = {
  甲: new Set(["丙", "丁"]),
  乙: new Set(["丙", "丁"]),
  丙: new Set(["甲", "乙", "丁", "戊", "辛"]),
  丁: new Set(["甲", "乙", "丙", "丁", "戊", "壬"]),
  戊: new Set(["丙", "丁"]),
};

export const FIVE_BATTALIONS_GOAL: Record<string, string> = {
  休门: "найти поддержку, провести спокойный разговор, договориться, помириться, отправиться в путешествие, пойти на свидание или восстановить силы",
  生门: "дать объявление о продаже, найти покупателя, согласовать цену, получить оплату или оформить сделку",
  伤门: "вернуть долг, настоять на оплате, защитить свои интересы или решить спор с конкурентом",
  杜门: "подготовить закрытый документ, защитить информацию, продумать план или выполнить сложную аналитическую либо техническую задачу",
  景门: "дать рекламу, провести презентацию, показать товар или услугу, подготовить публичное выступление, документ или визуальный материал",
  死门: "удалить объявление о продаже товара, отказаться от ненужного, завершить процесс, разорвать отношения или решить вопрос земли, недвижимости, наследства либо страхования",
  惊门: "совершить важный звонок по финансовому, документальному или юридическому вопросу, провести сложные переговоры, выступить или обратиться в суд",
  开门: "пройти собеседование или переговоры с руководителем, договориться о новой должности, подписать контракт, открыть бизнес или торговую точку, отправиться в авиапутешествие",
};

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

export interface FiveBattalionsHit {
  palace: number;
  direction: string;
  dom: string;
  heavenStem: FiveBattalionsStem;
  earthStem: string;
  door: string;
  goal: string;
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
export function detectFlyingBirdFallsIntoCave(
  date: Date,
  hourBranch: number,
  lateZi = false,
): FlyingBirdFallsIntoCaveHit[] {
  const chart = buildChart(date, hourBranch, lateZi);
  const periodIndex = parseGanZhi(chart.hourGz).index;
  const hiddenJia = STEMS[
    xunInfo(periodIndex).yiStem
  ] as FlyingBirdFallsIntoCaveHit["earthStem"];
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
  if (chart.fuYin || isHourControlsDay(chart)) return []; // Фу Инь и час пяти дисгармоний

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
    if (isAnnualYellowFive(p, date)) continue; // Годовая Жёлтая Пятёрка
    if (hasDoorPalaceConflict(cell.door, p)) continue;
    if ((WONDER_AVOID[wonder] ?? []).includes(p)) continue; // per-wonder cautions
    // 门迫: door must not control (克) the star.
    if (controls(DOOR_ELEMENT[cell.door], STAR_ELEMENT[cell.star])) continue;

    const row = THREE_GENERALS_TABLE[wonder as "乙" | "丙" | "丁"][p];
    if (!row) continue;
    const support =
      birthYearStem === undefined
        ? undefined
        : evaluateSupportPalace(chart, p, birthYearStem, representativeStem);
    if (birthYearStem !== undefined && (!support || !support.supported))
      continue;

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
  if (chart.fuYin || isHourControlsDay(chart)) return [];

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
    if (hasDoorPalaceConflict(cell.door, p)) continue;
    if (isAnnualYellowFive(p, date)) continue;
    if (controls(DOOR_ELEMENT[cell.door], STAR_ELEMENT[cell.star])) continue;
    // Сочетание Небесного и Земного стволов уже прошло строгую проверку
    // по списку благоприятных формирований из книги 540 Yang Structure.
    const support =
      birthYearStem === undefined
        ? undefined
        : evaluateSupportPalace(chart, p, birthYearStem, representativeStem);
    if (birthYearStem !== undefined && (!support || !support.supported))
      continue;

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

// --- "Личная дверь Великого Благородного" -------------------------------
// Отдельная формула: выбранный Янский или Иньский Благородный задаёт дворец,
// а в этом же дворце одновременно должны быть НС года рождения на Небесной
// тарелке, Пустота и Великий Инь либо Шесть Гармоний. Другие формулы и
// ограничения структур намеренно сюда не переносятся.
const NOBLE_HELPER_BRANCHES_BY_STEM: Record<number, { yang: number; yin: number }> = {
  0: { yang: 7, yin: 1 }, // 甲: 未 / 丑
  1: { yang: 8, yin: 0 }, // 乙: 申 / 子
  2: { yang: 9, yin: 11 }, // 丙: 酉 / 亥
  3: { yang: 11, yin: 9 }, // 丁: 亥 / 酉
  4: { yang: 1, yin: 7 }, // 戊: 丑 / 未
  5: { yang: 0, yin: 8 }, // 己: 子 / 申
  6: { yang: 1, yin: 7 }, // 庚: 丑 / 未
  7: { yang: 2, yin: 6 }, // 辛: 寅 / 午
  8: { yang: 3, yin: 5 }, // 壬: 卯 / 巳
  9: { yang: 5, yin: 3 }, // 癸: 巳 / 卯
};

export type NobleHelperKind = "yang" | "yin";

export interface NobleHelperDoorHit {
  kind: NobleHelperKind;
  palace: number;
  direction: string;
  dom: string;
  nobleBranch: string;
  heavenStem: string;
  deity: "太阴" | "六合";
}

export function detectNobleHelperDoor(
  date: Date,
  hourBranch: number,
  birthYearStem: number,
  lateZi = false,
): NobleHelperDoorHit[] {
  const chart = buildChart(date, hourBranch, lateZi);
  const branches = NOBLE_HELPER_BRANCHES_BY_STEM[birthYearStem];
  if (!branches) return [];

  const hits: NobleHelperDoorHit[] = [];
  for (const kind of ["yang", "yin"] as const) {
    const nobleBranchIndex = branches[kind];
    const palace = BRANCH_PALACE[nobleBranchIndex];
    const cell = chart.cells[palace];
    if (!cell || cell.heavenStem !== STEMS[birthYearStem]) continue;
    if (!cell.isVoid || (cell.deity !== "太阴" && cell.deity !== "六合")) continue;
    hits.push({
      kind,
      palace,
      direction: PALACES[palace].dirFull,
      dom: PALACES[palace].dom,
      nobleBranch: BRANCHES[nobleBranchIndex],
      heavenStem: cell.heavenStem,
      deity: cell.deity,
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
export type SupportRelation =
  | "supports"
  | "same"
  | "receives"
  | "controls"
  | "neutral";

export interface SupportCheck {
  supported: boolean;
  relation: SupportRelation;
  structurePalace: number;
  personPalace: number;
  structureElement: Element;
  personElement: Element;
}

function generates(source: Element, target: Element): boolean {
  return (
    (
      {
        wood: "fire",
        fire: "earth",
        earth: "metal",
        metal: "water",
        water: "wood",
      } as Record<Element, Element>
    )[source] === target
  );
}

/**
 * Классифицирует связь дворца структуры с личным дворцом пользователя.
 * В публикацию допускаются только совпадение стихий и поддержка, когда
 * стихия дворца структуры порождает стихию личного дворца.
 */
export function personalSupportRelation(
  structureElement: Element,
  personElement: Element,
): SupportRelation {
  if (structureElement === personElement) return "same";
  if (generates(structureElement, personElement)) return "supports";
  if (generates(personElement, structureElement)) return "receives";
  if (
    controls(structureElement, personElement) ||
    controls(personElement, structureElement)
  )
    return "controls";
  return "neutral";
}

/**
 * Проверяет личную пользу структуры по двум дворцам часовой карты.
 * НС года рождения нужен, чтобы найти на Небесной тарелке личный дворец
 * пользователя. Затем сравниваются стихии этого дворца и дворца структуры.
 */
export function evaluateSupportPalace(
  chart: ReturnType<typeof buildChart>,
  structurePalace: number,
  birthYearStem: number,
  representativeStem = birthYearStem,
): SupportCheck | null {
  if (birthYearStem < 0 || birthYearStem > 9 || structurePalace === 5)
    return null;
  const stem = STEMS[representativeStem];
  const personPalace = Object.values(chart.cells).find(
    (cell) => cell.heavenStem === stem,
  )?.palace;
  if (!personPalace || personPalace === 5) return null;

  const structureElement = PALACES[structurePalace].element;
  const personElement = PALACES[personPalace].element;
  const relation = personalSupportRelation(structureElement, personElement);

  return {
    supported: relation === "supports" || relation === "same",
    relation,
    structurePalace,
    personPalace,
    structureElement,
    personElement,
  };
}

export type WindDunVariant = 1 | 2 | 3 | 4;

export interface WindDunHit {
  palace: number;
  variant: WindDunVariant;
  direction: string;
  dom: string;
  heavenStem: string;
  earthStem: string;
  door: string;
  deity: string;
  support?: SupportCheck;
}

export const WIND_DUN_GOAL =
  "рассказать о предложении, подготовить рекламную публикацию, разместить объявление или расширить полезные контакты";

const WIND_DUN_DOORS = new Set(["休门", "生门", "开门"]);
const SOUTHEAST_PALACE = 4;

export function windDunVariant(
  palace: number,
  heavenStem: string,
  earthStem: string,
  door: string,
  deity: string,
): WindDunVariant | null {
  const allowedDoor = WIND_DUN_DOORS.has(door);
  const inSoutheast = palace === SOUTHEAST_PALACE;

  if (inSoutheast && heavenStem === "乙" && allowedDoor && deity === "六合")
    return 1;
  if (inSoutheast && heavenStem === "乙" && allowedDoor) return 2;
  if (inSoutheast && heavenStem === "丙" && door === "开门") return 3;
  if (heavenStem === "辛" && earthStem === "乙" && allowedDoor) return 4;
  return null;
}

/**
 * Detect "Ветряной Дунь" (風遁) by the four rows of the user-provided scheme.
 * Rows 1-3 require the Xun / southeast palace. Row 4 has no palace condition
 * and is checked in any outer palace, with the ordinary door-palace safety rule.
 */
export function detectWindDun(
  date: Date,
  hourBranch: number,
  lateZi = false,
  birthYearStem?: number,
  representativeStem?: number,
): WindDunHit[] {
  const chart = buildChart(date, hourBranch, lateZi);
  if (chart.fuYin || isHourControlsDay(chart)) return [];

  const hits: WindDunHit[] = [];
  for (let palace = 1; palace <= 9; palace++) {
    if (palace === 5) continue;
    const cell = chart.cells[palace];
    const variant = windDunVariant(
      palace,
      cell.heavenStem,
      cell.earthStem,
      cell.door,
      cell.deity,
    );
    if (!variant) continue;

    if (cell.isVoid) continue;
    if (cell.heavenStem === "庚" || cell.earthStem === "庚") continue;
    if (isAnnualYellowFive(palace, date)) continue;
    if (controls(DOOR_ELEMENT[cell.door], STAR_ELEMENT[cell.star])) continue;
    // In rows 1-3 the direction and door are explicit parts of the formula.
    // Row 4 does not specify a palace, so the ordinary safety filter applies.
    if (variant === 4 && hasDoorPalaceConflict(cell.door, palace)) continue;

    const support =
      birthYearStem === undefined
        ? undefined
        : evaluateSupportPalace(
            chart,
            palace,
            birthYearStem,
            representativeStem,
          );
    if (birthYearStem !== undefined && (!support || !support.supported))
      continue;

    hits.push({
      palace,
      variant,
      direction: PALACES[palace].dirFull,
      dom: PALACES[palace].dom,
      heavenStem: cell.heavenStem,
      earthStem: cell.earthStem,
      door: cell.door,
      deity: cell.deity,
      support: support ?? undefined,
    });
  }

  return hits;
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
export function jadeMaidenVariant(
  heavenStem: string,
  earthStem: string,
  isMainGate: boolean,
): number {
  // 三奇 (乙/丙/丁) are Mystics. 戊/庚/壬 are yang stems and are accepted by
  // the one-page scheme as a positive element; 戊 itself is not a Mystic.
  const positiveOrMystic = (x: string) =>
    ["乙", "丙", "丁", "戊", "庚", "壬"].includes(x);
  if (heavenStem === "丁" && earthStem === "丁") return isMainGate ? 1 : 2;
  if (heavenStem === "丁" && positiveOrMystic(earthStem) && isMainGate)
    return 3;
  if (positiveOrMystic(heavenStem) && earthStem === "丁" && isMainGate)
    return 4;
  return 0;
}

// Годовая летящая звезда сектора === 5 (五黄 «Жёлтая Пятёрка»): в Ци Мэнь такой
// сектор не используется. Направление берётся из годовой карты (2026 — юг).
export function isAnnualYellowFive(palace: number, date: Date): boolean {
  const dirFull = PALACES[palace].dirFull;
  const dir = dirFull.charAt(0).toUpperCase() + dirFull.slice(1);
  return getFlyingStar(dir, flyingStarYear(date)).starNumber === 5;
}

export function detectJadeMaiden(
  date: Date,
  hourBranch: number,
  lateZi = false,
  birthYearStem?: number,
  representativeStem?: number,
): JadeMaidenHit[] {
  const chart = buildChart(date, hourBranch, lateZi);
  if (isHourControlsDay(chart)) return [];
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
    if (isAnnualYellowFive(p, date)) continue;
    if (hasDoorPalaceConflict(c.door, p)) continue;
    // В формуле участвуют только Отдых, Открытие, Жизнь, Пейзаж и Тайник.
    // Врата Тайника допустимы с отдельной оговоркой для скрытых встреч.
    const jadeMaidenDoors = new Set(["休门", "开门", "生门", "景门", "杜门"]);
    if (!jadeMaidenDoors.has(c.door)) continue;
    const support =
      birthYearStem === undefined
        ? undefined
        : evaluateSupportPalace(chart, p, birthYearStem, representativeStem);
    if (birthYearStem !== undefined && (!support || !support.supported))
      continue;
    hits.push({
      palace: p,
      variant,
      heavenStem: h,
      earthStem: e,
      door: c.door,
      isMainGate: isMain,
      support: support ?? undefined,
    });
  }
  return hits;
}

/**
 * Detect the personal structure "Пять Батальонов".
 * The target palace is defined by the user's natal Врата Рождения.
 * In a valid hourly chart the Главные Врата arrive in that palace together
 * with one of the five permitted Heaven stems and all common safety rules.
 */
export function detectFiveBattalions(
  date: Date,
  hourBranch: number,
  wealthPalace: number,
  lateZi = false,
): FiveBattalionsHit[] {
  if (wealthPalace === 5 || !PALACES[wealthPalace]) return [];
  const chart = buildChart(date, hourBranch, lateZi);
  if (
    chart.fuYin ||
    isHourControlsDay(chart) ||
    chart.zhiShiPalace !== wealthPalace
  )
    return [];

  const cell = chart.cells[wealthPalace];
  if (!cell || cell.door !== chart.zhiShiDoor) return [];
  const heavenStem = cell.heavenStem as FiveBattalionsStem;
  if (!FIVE_BATTALIONS_STEMS.includes(heavenStem)) return [];
  if (!FIVE_BATTALIONS_GOOD_EARTH_STEMS[heavenStem].has(cell.earthStem))
    return [];

  if (cell.isVoid) return [];
  if (cell.heavenStem === "庚" || cell.earthStem === "庚") return [];
  if (hasDoorPalaceConflict(cell.door, wealthPalace)) return [];
  if (isAnnualYellowFive(wealthPalace, date)) return [];
  if (controls(DOOR_ELEMENT[cell.door], STAR_ELEMENT[cell.star])) return [];

  // Табу, относящиеся именно к Трём Мистикам, применяются только к 乙, 丙 и 丁.
  if (WONDERS.includes(heavenStem as (typeof WONDERS)[number])) {
    if (TOMB[heavenStem] === wealthPalace) return [];
    if ((WONDER_AVOID[heavenStem] ?? []).includes(wealthPalace)) return [];
  }

  return [
    {
      palace: wealthPalace,
      direction: PALACES[wealthPalace].dirFull,
      dom: PALACES[wealthPalace].dom,
      heavenStem,
      earthStem: cell.earthStem,
      door: cell.door,
      goal: FIVE_BATTALIONS_GOAL[cell.door],
    },
  ];
}

export { STEMS };

export type TigerDunVariant = 1 | 2 | 3 | 4;

export interface TigerDunHit {
  palace: number;
  variant: TigerDunVariant;
  direction: string;
  dom: string;
  heavenStem: string;
  earthStem: string;
  door: string;
  star: string;
  support?: SupportCheck;
}

export const TIGER_DUN_GOAL =
  "преодолеть препятствие, защитить свои интересы, провести сложные переговоры или укрепить позицию в важном деле";

// Во второй и четвёртой строках исходной схемы Земная тарелка не задана.
// Для публикации оставляем только сочетания Неба и Земли, признанные
// благоприятными в изученном материале, с учётом уже заданных Врат.
const TIGER_DUN_GOOD_EARTH_STEMS: Record<2 | 4, ReadonlySet<string>> = {
  2: new Set(["丁", "己"]), // 乙 над 丁; 乙 над 己 при Вратах Жизни - «Земной Дунь».
  4: new Set(["丁"]), // 庚 над 丁 при счастливых Вратах; Открытие - счастливые Врата.
};

export function isTigerDunEarthStemAllowed(
  variant: TigerDunVariant,
  earthStem: string,
): boolean {
  if (variant === 1) return earthStem === "辛";
  if (variant === 3) return earthStem === "乙";
  return TIGER_DUN_GOOD_EARTH_STEMS[variant].has(earthStem);
}

function tigerDunVariant(cell: {
  palace: number;
  heavenStem: string;
  earthStem: string;
  door: string;
}): TigerDunVariant | 0 {
  // Полная формула на схеме задаёт сочетания Врат и дворцов. Поэтому общий
  // фильтр «Врата контролируют дворец» к этой структуре намеренно не применяется.
  if (cell.palace === 8) {
    if (
      cell.heavenStem === "乙" &&
      cell.earthStem === "辛" &&
      cell.door === "休门"
    )
      return 1;
    if (cell.heavenStem === "乙" && cell.door === "生门") return 2;
    if (
      cell.heavenStem === "辛" &&
      cell.earthStem === "乙" &&
      cell.door === "生门"
    )
      return 3;
  }
  if (cell.palace === 7 && cell.heavenStem === "庚" && cell.door === "开门")
    return 4;
  return 0;
}

/**
 * Detect the personal structure «Тигровый Дунь» (虎遁).
 * Во второй и четвёртой строках исходной схемы Земная тарелка не названа,
 * поэтому она дополнительно проходит белый список благоприятных сочетаний
 * Небесного и Земного стволов. 庚 обязателен только на Небесной тарелке
 * четвёртого варианта и не должен попадать под общие запреты других структур.
 */
export function detectTigerDun(
  date: Date,
  hourBranch: number,
  lateZi = false,
  birthYearStem?: number,
  representativeStem?: number,
): TigerDunHit[] {
  const chart = buildChart(date, hourBranch, lateZi);
  if (chart.fuYin || isHourControlsDay(chart)) return [];

  const hits: TigerDunHit[] = [];
  for (const palace of [8, 7]) {
    const cell = chart.cells[palace];
    if (!cell) continue;
    const variant = tigerDunVariant(cell);
    if (!variant) continue;

    // В строках 2 и 4 исходная схема не фиксирует Земную тарелку.
    // Публикуем только проверенные благоприятные сочетания стволов.
    if (!isTigerDunEarthStemAllowed(variant, cell.earthStem)) continue;

    if (cell.isVoid) continue;
    if (isAnnualYellowFive(palace, date)) continue;
    if (controls(DOOR_ELEMENT[cell.door], STAR_ELEMENT[cell.star])) continue;

    // Только второй вариант использует Небесный ствол Трёх Мистиков без
    // заданного ствола Земной тарелки. Проверяем табу, зависящие от 乙 и дворца.
    if (variant === 2) {
      if (TOMB.乙 === palace) continue;
      if ((WONDER_AVOID.乙 ?? []).includes(palace)) continue;
    }

    const support =
      birthYearStem === undefined
        ? undefined
        : evaluateSupportPalace(
            chart,
            palace,
            birthYearStem,
            representativeStem,
          );
    if (birthYearStem !== undefined && (!support || !support.supported))
      continue;

    hits.push({
      palace,
      variant,
      direction: PALACES[palace].dirFull,
      dom: PALACES[palace].dom,
      heavenStem: cell.heavenStem,
      earthStem: cell.earthStem,
      door: cell.door,
      star: cell.star,
      support: support ?? undefined,
    });
  }
  return hits;
}
