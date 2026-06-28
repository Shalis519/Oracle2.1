import { ARCANA, getArcana, type ArcanaData } from "./data/arcana";
import {
  HEAVENLY_STEMS,
  EARTHLY_BRANCHES,
  ELEMENT_MEANINGS,
  SYMBOLIC_STARS,
} from "./data/bazi";
import { getFlyingStar, type FlyingStarData } from "./data/fengshui";
import { DREAM_MEANINGS, DEFAULT_DREAM_INTERPRETATION } from "./data/dreams";
import { Solar } from "lunar-typescript";

// Canonical order of the ten Heavenly Stems (天干) and twelve Earthly Branches
// (地支). Indices align 1:1 with HEAVENLY_STEMS / EARTHLY_BRANCHES.
const GAN_CN = "甲乙丙丁戊己庚辛壬癸".split("");
const ZHI_CN = "子丑寅卯辰巳午未申酉戌亥".split("");

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
 * Four Pillars (四柱八字) computation backed by the `lunar-typescript` library,
 * which derives the sexagenary pillars from real solar terms (节气) and the
 * Lichun (立春) year boundary — so the year and month pillars are accurate for
 * dates near term boundaries. The hour pillar uses the birth time when
 * available, otherwise defaults to noon. The returned Chinese stem/branch
 * characters are mapped back to our Russian content arrays by canonical index.
 */
export function computeBazi(
  birthDate: string,
  birthTime: string | null,
): BaziResult | null {
  const d = parseDate(birthDate);
  if (!d) return null;
  // Guard against malformed-but-regex-valid dates (e.g. 2020-13-40) before
  // handing them to the calendar library, which throws on out-of-range input.
  if (d.month < 1 || d.month > 12 || d.day < 1 || d.day > 31) return null;

  const mod = (a: number, n: number) => ((a % n) + n) % n;

  let hour = 12;
  let minute = 0;
  if (birthTime) {
    const hm = /^(\d{1,2}):(\d{2})/.exec(birthTime);
    if (hm) {
      const h = Number(hm[1]);
      const m = Number(hm[2]);
      // Ignore an unparseable time rather than failing the whole chart.
      if (h >= 0 && h <= 23 && m >= 0 && m <= 59) {
        hour = h;
        minute = m;
      }
    }
  }

  // The calendar library throws on impossible dates; treat any failure as
  // "cannot compute" so callers get a clean null instead of a 500.
  let yearStemIdx: number,
    yearBranchIdx: number,
    monthStemIdx: number,
    monthBranchIdx: number,
    dayStemIdx: number,
    dayBranchIdx: number,
    hourStemIdx: number,
    hourBranchIdx: number;
  try {
    const solar = Solar.fromYmdHms(d.year, d.month, d.day, hour, minute, 0);
    const eightChar = solar.getLunar().getEightChar();

    const ganIdx = (c: string) => GAN_CN.indexOf(c);
    const zhiIdx = (c: string) => ZHI_CN.indexOf(c);

    yearStemIdx = ganIdx(eightChar.getYearGan());
    yearBranchIdx = zhiIdx(eightChar.getYearZhi());
    monthStemIdx = ganIdx(eightChar.getMonthGan());
    monthBranchIdx = zhiIdx(eightChar.getMonthZhi());
    dayStemIdx = ganIdx(eightChar.getDayGan());
    dayBranchIdx = zhiIdx(eightChar.getDayZhi());
    hourStemIdx = ganIdx(eightChar.getTimeGan());
    hourBranchIdx = zhiIdx(eightChar.getTimeZhi());
  } catch {
    return null;
  }

  // Surface an unexpected character mapping as a failure rather than silently
  // defaulting to 甲/子 and producing a wrong chart.
  if (
    [
      yearStemIdx,
      yearBranchIdx,
      monthStemIdx,
      monthBranchIdx,
      dayStemIdx,
      dayBranchIdx,
      hourStemIdx,
      hourBranchIdx,
    ].some((i) => i < 0)
  ) {
    return null;
  }

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

  // Pick symbolic stars deterministically from the sexagenary day index.
  const daySeed = mod(dayStemIdx * 12 + dayBranchIdx, 60);
  const starCount = 2 + mod(daySeed, 2);
  const stars: BaziStarResult[] = [];
  for (let i = 0; i < starCount; i++) {
    const s = SYMBOLIC_STARS[mod(daySeed + i * 3, SYMBOLIC_STARS.length)];
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
