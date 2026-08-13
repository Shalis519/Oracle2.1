// Qi Men Dun Jia — core constants (rotating plate / 轉盤).
// All indices are 0-based unless noted. Stems 甲=0..癸=9; Branches 子=0..亥=11.

export type Element = "wood" | "fire" | "earth" | "metal" | "water";

export const STEMS = ["甲", "乙", "丙", "丁", "戊", "己", "庚", "辛", "壬", "癸"] as const;
export const BRANCHES = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"] as const;

// Russian zodiac animal per branch index (nominative).
export const BRANCH_ANIMAL_RU = [
  "Крыса", "Бык", "Тигр", "Кролик", "Дракон", "Змея",
  "Лошадь", "Коза", "Обезьяна", "Петух", "Собака", "Свинья",
] as const;

// Genitive form, for "час Лошади", "час Крысы".
export const BRANCH_ANIMAL_RU_GEN = [
  "Крысы", "Быка", "Тигра", "Кролика", "Дракона", "Змеи",
  "Лошади", "Козы", "Обезьяны", "Петуха", "Собаки", "Свиньи",
] as const;

// Standard solar double-hour windows per branch index ("час Козы (13:00–15:00)").
export const BRANCH_HOUR_WINDOW = [
  "23:00–01:00", "01:00–03:00", "03:00–05:00", "05:00–07:00",
  "07:00–09:00", "09:00–11:00", "11:00–13:00", "13:00–15:00",
  "15:00–17:00", "17:00–19:00", "19:00–21:00", "21:00–23:00",
] as const;

// Display order for all double-hours: chronological daytime cycle first,
// followed by the late-Zi interval that crosses midnight.
export const CHRONOLOGICAL_HOUR_BRANCHES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 0] as const;

// Six clashes (六冲): branch index -> the branch it clashes with (opposite, +6).
export function clashesBranch(a: number, b: number): boolean {
  return (a - b + 12) % 12 === 6;
}

// Stem element.
export const STEM_ELEMENT: Element[] = [
  "wood", "wood",   // 甲 乙
  "fire", "fire",   // 丙 丁
  "earth", "earth", // 戊 己
  "metal", "metal", // 庚 辛
  "water", "water", // 壬 癸
];

// 五行相克 (control): X controls XKE[X].
const KE: Record<Element, Element> = {
  wood: "earth",
  earth: "water",
  water: "fire",
  fire: "metal",
  metal: "wood",
};
export function controls(a: Element, b: Element): boolean {
  return KE[a] === b;
}

// Palaces 1..9 (Luo Shu). 5 = center (no direction / no door).
export interface PalaceInfo {
  num: number;
  trigram: string;
  element: Element;
  dir: string; // short Russian (e.g. "ЮЗ"); "" for center
  dirFull: string; // full Russian lowercase (e.g. "юго-запад")
  dom: string; // PDF "Дом" label, e.g. "2 Дом"
}

export const PALACES: Record<number, PalaceInfo> = {
  1: { num: 1, trigram: "坎", element: "water", dir: "С", dirFull: "север", dom: "1 Дом" },
  2: { num: 2, trigram: "坤", element: "earth", dir: "ЮЗ", dirFull: "юго-запад", dom: "2 Дом" },
  3: { num: 3, trigram: "震", element: "wood", dir: "В", dirFull: "восток", dom: "3 Дом" },
  4: { num: 4, trigram: "巽", element: "wood", dir: "ЮВ", dirFull: "юго-восток", dom: "4 Дом" },
  5: { num: 5, trigram: "中", element: "earth", dir: "", dirFull: "центр", dom: "5 Дом" },
  6: { num: 6, trigram: "乾", element: "metal", dir: "СЗ", dirFull: "северо-запад", dom: "6 Дом" },
  7: { num: 7, trigram: "兑", element: "metal", dir: "З", dirFull: "запад", dom: "7 Дом" },
  8: { num: 8, trigram: "艮", element: "earth", dir: "СВ", dirFull: "северо-восток", dom: "8 Дом" },
  9: { num: 9, trigram: "离", element: "fire", dir: "Ю", dirFull: "юг", dom: "9 Дом" },
};

// 九星: name -> original (earth) palace + element.天禽 lodges with 天芮 (坤2) on the moving ring.
export interface StarInfo {
  name: string;
  palace: number;
  element: Element;
}
export const STARS: StarInfo[] = [
  { name: "天蓬", palace: 1, element: "water" },
  { name: "天芮", palace: 2, element: "earth" },
  { name: "天冲", palace: 3, element: "wood" },
  { name: "天辅", palace: 4, element: "wood" },
  { name: "天禽", palace: 5, element: "earth" },
  { name: "天心", palace: 6, element: "metal" },
  { name: "天柱", palace: 7, element: "metal" },
  { name: "天任", palace: 8, element: "earth" },
  { name: "天英", palace: 9, element: "fire" },
];

// 八门: name -> original palace + element (no door at center 5).
export interface DoorInfo {
  name: string;
  palace: number;
  element: Element;
}
export const DOORS: DoorInfo[] = [
  { name: "休门", palace: 1, element: "water" },
  { name: "死门", palace: 2, element: "earth" },
  { name: "伤门", palace: 3, element: "wood" },
  { name: "杜门", palace: 4, element: "wood" },
  { name: "开门", palace: 6, element: "metal" },
  { name: "惊门", palace: 7, element: "metal" },
  { name: "生门", palace: 8, element: "earth" },
  { name: "景门", palace: 9, element: "fire" },
];

// 八神 ring order (starts at 值符), filled along the path in dun direction.
export const DEITIES = [
  "值符", "螣蛇", "太阴", "六合", "白虎", "玄武", "九地", "九天",
] as const;

// Rotating-plate movement path around the 8 outer palaces (转盘 forward path).
export const PATH = [1, 8, 3, 4, 9, 2, 7, 6] as const;
export function pathIndex(palace: number): number {
  return PATH.indexOf(palace as (typeof PATH)[number]);
}

// Branch index -> palace it belongs to (for 旬空 void palaces and 墓 tomb).
export const BRANCH_PALACE: number[] = [
  1, // 子 -> 坎1
  8, // 丑 -> 艮8
  8, // 寅 -> 艮8
  3, // 卯 -> 震3
  4, // 辰 -> 巽4
  4, // 巳 -> 巽4
  9, // 午 -> 离9
  2, // 未 -> 坤2
  2, // 申 -> 坤2
  7, // 酉 -> 兑7
  6, // 戌 -> 乾6
  6, // 亥 -> 乾6
];

// 旬首 (xun leader) stem (戊己庚辛壬癸) per xun number 0..5.
export const XUN_YI_STEM = [4, 5, 6, 7, 8, 9]; // 戊己庚辛壬癸

// Sexagenary index (0..59) from stem+branch.
export function ganZhiIndex(stem: number, branch: number): number {
  for (let i = 0; i < 60; i++) {
    if (i % 10 === stem && i % 12 === branch) return i;
  }
  return -1;
}

// Parse a "干支" string like "戊寅".
export function parseGanZhi(gz: string): { stem: number; branch: number; index: number } {
  const stem = STEMS.indexOf(gz[0] as (typeof STEMS)[number]);
  const branch = BRANCHES.indexOf(gz[1] as (typeof BRANCHES)[number]);
  return { stem, branch, index: ganZhiIndex(stem, branch) };
}
