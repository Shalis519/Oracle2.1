import { ARCANA, getArcana, type ArcanaData } from "./data/arcana";
import {
  HEAVENLY_STEMS,
  EARTHLY_BRANCHES,
  ELEMENT_MEANINGS,
  SYMBOLIC_STARS,
} from "./data/bazi";
import { getFlyingStar, type FlyingStarData } from "./data/fengshui";
import { DREAM_MEANINGS, DEFAULT_DREAM_INTERPRETATION } from "./data/dreams";

/** Reduce any positive number to the 1..22 arcana range. */
export function reduceToArcana(n: number): number {
  let v = Math.abs(Math.trunc(n));
  while (v > 22) {
    v = String(v)
      .split("")
      .reduce((acc, d) => acc + Number(d), 0);
  }
  return v === 0 ? 22 : v;
}

interface ParsedDate {
  year: number;
  month: number;
  day: number;
}

function parseDate(dateStr: string): ParsedDate | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(dateStr);
  if (!m) return null;
  return { year: Number(m[1]), month: Number(m[2]), day: Number(m[3]) };
}

export interface MatrixPointResult {
  position: string;
  arcanaNumber: number;
  arcanaName: string;
  essence: string;
}

export interface PersonalMatrixResult {
  birthDate: string;
  points: MatrixPointResult[];
}

/** Matrix of Destiny core points derived from the birth date. */
export function computeMatrix(birthDate: string): PersonalMatrixResult | null {
  const d = parseDate(birthDate);
  if (!d) return null;

  const dayArc = reduceToArcana(d.day);
  const monthArc = reduceToArcana(d.month);
  const yearArc = reduceToArcana(
    String(d.year)
      .split("")
      .reduce((a, c) => a + Number(c), 0),
  );
  const purpose = reduceToArcana(dayArc + monthArc + yearArc);
  const talent = reduceToArcana(dayArc + monthArc);
  const heart = reduceToArcana(monthArc + yearArc);
  const karma = reduceToArcana(dayArc + yearArc);
  const sky = reduceToArcana(purpose + talent);
  const earth = reduceToArcana(purpose + heart);

  const make = (position: string, num: number): MatrixPointResult => {
    const a = getArcana(num);
    return {
      position,
      arcanaNumber: a.number,
      arcanaName: a.name,
      essence: a.essence,
    };
  };

  return {
    birthDate,
    points: [
      make("Портрет личности (день)", dayArc),
      make("Линия рода (месяц)", monthArc),
      make("Духовные задачи (год)", yearArc),
      make("Зона комфорта и таланты", talent),
      make("Сердце и отношения", heart),
      make("Кармический урок", karma),
      make("Небесная линия (предназначение)", purpose),
      make("Социальная реализация", sky),
      make("Земная линия (деньги и быт)", earth),
    ],
  };
}

export interface BaziPillarResult {
  name: string;
  heavenlyStem: string;
  earthlyBranch: string;
  element: string;
}

export interface BaziStarResult {
  name: string;
  description: string;
  advice: string;
  sector: string | null;
}

export interface BaziResult {
  dayMaster: string;
  dayElement: string;
  dayElementMeaning: string;
  pillars: BaziPillarResult[];
  stars: BaziStarResult[];
}

/**
 * Simplified Four Pillars computation. Uses a continuous sexagenary day
 * count anchored to a known jiazi reference date. Hour pillar uses birth time
 * when available, otherwise defaults to noon.
 */
export function computeBazi(
  birthDate: string,
  birthTime: string | null,
): BaziResult | null {
  const d = parseDate(birthDate);
  if (!d) return null;

  const utc = Date.UTC(d.year, d.month - 1, d.day);
  // Reference: 2000-01-07 was a Jia-Zi (甲子) day → stem index 0, branch index 0.
  const ref = Date.UTC(2000, 0, 7);
  const dayCount = Math.round((utc - ref) / 86400000);

  const mod = (a: number, n: number) => ((a % n) + n) % n;

  const dayStemIdx = mod(dayCount, 10);
  const dayBranchIdx = mod(dayCount, 12);

  // Year pillar — sexagenary year (1984 = Jia-Zi year).
  const yearStemIdx = mod(d.year - 1984, 10);
  const yearBranchIdx = mod(d.year - 1984, 12);

  // Month pillar — branch tied to solar month, stem derived from year stem.
  const monthBranchIdx = mod(d.month + 1, 12);
  const monthStemIdx = mod(yearStemIdx * 2 + d.month, 10);

  // Hour pillar.
  let hour = 12;
  if (birthTime) {
    const hm = /^(\d{1,2}):(\d{2})/.exec(birthTime);
    if (hm) hour = Number(hm[1]);
  }
  const hourBranchIdx = mod(Math.floor((hour + 1) / 2), 12);
  const hourStemIdx = mod(dayStemIdx * 2 + hourBranchIdx, 10);

  const stem = (i: number) => HEAVENLY_STEMS[i];
  const branch = (i: number) => EARTHLY_BRANCHES[i];

  const dayStem = stem(dayStemIdx);
  const dayElement = dayStem.element;

  const pillars: BaziPillarResult[] = [
    {
      name: "Год",
      heavenlyStem: stem(yearStemIdx).name,
      earthlyBranch: `${branch(yearBranchIdx).name} (${branch(yearBranchIdx).animal})`,
      element: stem(yearStemIdx).element,
    },
    {
      name: "Месяц",
      heavenlyStem: stem(monthStemIdx).name,
      earthlyBranch: `${branch(monthBranchIdx).name} (${branch(monthBranchIdx).animal})`,
      element: stem(monthStemIdx).element,
    },
    {
      name: "День",
      heavenlyStem: dayStem.name,
      earthlyBranch: `${branch(dayBranchIdx).name} (${branch(dayBranchIdx).animal})`,
      element: dayElement,
    },
    {
      name: "Час",
      heavenlyStem: stem(hourStemIdx).name,
      earthlyBranch: `${branch(hourBranchIdx).name} (${branch(hourBranchIdx).animal})`,
      element: stem(hourStemIdx).element,
    },
  ];

  // Pick symbolic stars deterministically from the day count.
  const starCount = 2 + mod(dayCount, 2);
  const stars: BaziStarResult[] = [];
  for (let i = 0; i < starCount; i++) {
    const s = SYMBOLIC_STARS[mod(dayCount + i * 3, SYMBOLIC_STARS.length)];
    stars.push({
      name: s.name,
      description: s.description,
      advice: s.advice,
      sector: null,
    });
  }

  return {
    dayMaster: `${dayStem.name} (${dayStem.polarity} ${dayElement})`,
    dayElement,
    dayElementMeaning: ELEMENT_MEANINGS[dayElement] ?? "",
    pillars,
    stars,
  };
}

export function computeFengShui(bedDirection: string): FlyingStarData {
  return getFlyingStar(bedDirection);
}

export interface DreamResult {
  interpretation: string;
  keywords: string[];
}

export function interpretDream(text: string): DreamResult {
  const lower = text.toLowerCase();
  const matched: { keyword: string; meaning: string }[] = [];

  for (const entry of DREAM_MEANINGS) {
    const hit = entry.keywords.find((k) => lower.includes(k));
    if (hit) matched.push({ keyword: hit, meaning: entry.meaning });
  }

  if (matched.length === 0) {
    return { interpretation: DEFAULT_DREAM_INTERPRETATION, keywords: [] };
  }

  const interpretation = matched.map((m) => m.meaning).join("\n\n");
  const keywords = Array.from(new Set(matched.map((m) => m.keyword)));
  return { interpretation, keywords };
}

export interface DailyForecastResult {
  arcanaNumber: number;
  arcanaName: string;
  baziElement: string;
  hasWarning: boolean;
  synthesisText: string;
  matrix: ArcanaData;
  bazi: BaziResult;
  fengShui: FlyingStarData | null;
  conflicts: string[];
  warnings: string[];
}

/** Arcana of the day combines birth date with the current date. */
export function computeArcanaOfDay(birthDate: string, today: string): number {
  const b = parseDate(birthDate);
  const t = parseDate(today);
  if (!b || !t) return reduceToArcana((t?.day ?? 1) + (t?.month ?? 1));
  return reduceToArcana(b.day + b.month + t.day + t.month);
}

const ELEMENT_DAY_ENERGY: Record<string, string> = {
  Дерево: "день роста и новых начинаний — действуйте мягко, но настойчиво",
  Огонь: "день вдохновения и общения — делитесь теплом и идеями",
  Земля: "день стабильности и заботы — наведите порядок и укрепите основы",
  Металл: "день ясности и дисциплины — завершайте дела и принимайте решения",
  Вода: "день интуиции и гибкости — прислушивайтесь к себе и течению",
};

export function computeDailyForecast(
  birthDate: string,
  birthTime: string | null,
  bedDirection: string | null,
  today: string,
): DailyForecastResult | null {
  const matrixOk = parseDate(birthDate);
  if (!matrixOk) return null;

  const arcanaNum = computeArcanaOfDay(birthDate, today);
  const arcana = getArcana(arcanaNum);
  const bazi = computeBazi(birthDate, birthTime);
  if (!bazi) return null;

  const fengShui = bedDirection ? computeFengShui(bedDirection) : null;

  const conflicts: string[] = [];
  const warnings: string[] = [];

  // Synthesis: detect tension between arcana tone and feng shui star.
  if (fengShui?.isUnfavorable) {
    warnings.push(
      `Фэн-шуй: ваше спальное направление (${fengShui.direction}) под влиянием неблагоприятной звезды «${fengShui.starName}». ${fengShui.recommendation}`,
    );
  }

  const negativeArcana = [13, 15, 16, 18].includes(arcanaNum);
  if (negativeArcana && fengShui?.isUnfavorable) {
    conflicts.push(
      "Сегодня энергия Аркана дня и фэн-шуй спальни усиливают друг друга в сторону перемен и испытаний. Будьте особенно бережны к себе и не принимайте резких решений.",
    );
  } else if (negativeArcana) {
    conflicts.push(
      "Аркан дня несёт энергию трансформации. Используйте её осознанно: отпускайте старое, но не торопите события.",
    );
  }

  const hasWarning = warnings.length > 0 || conflicts.length > 0;

  const elementEnergy =
    ELEMENT_DAY_ENERGY[bazi.dayElement] ?? "день внутреннего баланса";

  const synthesisText = [
    `Сегодня вами управляет Аркан «${arcana.name}» (№${arcana.number}). ${arcana.essence}`,
    `По системе Бацзы ваша стихия дня — ${bazi.dayElement}: это ${elementEnergy}.`,
    fengShui
      ? `Фэн-шуй спального направления (${fengShui.direction}): ${fengShui.influence}`
      : `Укажите направление кровати в профиле, чтобы добавить к прогнозу анализ фэн-шуй.`,
    `Совет дня: ${arcana.affirmation} Поддержите себя напитком «${arcana.cocktail}» и аффирмацией.`,
  ].join("\n\n");

  return {
    arcanaNumber: arcana.number,
    arcanaName: arcana.name,
    baziElement: bazi.dayElement,
    hasWarning,
    synthesisText,
    matrix: arcana,
    bazi,
    fengShui,
    conflicts,
    warnings,
  };
}

export function todayString(): string {
  const now = new Date();
  const y = now.getUTCFullYear();
  const m = String(now.getUTCMonth() + 1).padStart(2, "0");
  const d = String(now.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export { ARCANA };
