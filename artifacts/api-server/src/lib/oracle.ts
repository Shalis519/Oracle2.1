import { ARCANA, getArcana, type ArcanaData } from "./data/arcana";
import {
  HEAVENLY_STEMS,
  EARTHLY_BRANCHES,
  ELEMENT_MEANINGS,
  SYMBOLIC_STARS,
} from "./data/bazi";
import {
  getFlyingStar,
  getStarByNumber,
  FLY_ORDER_DIRECTIONS,
  flyingStarYear,
  type FlyingStarData,
} from "./data/fengshui";
import { DREAM_MEANINGS, DEFAULT_DREAM_INTERPRETATION } from "./data/dreams";
import { Solar } from "lunar-typescript";
import { selectTopTransits } from "./transitScore";
import { futuristicGenerator } from "./futuristicGenerator";
import {
  buildFullMatrixNumbers,
  type FullMatrixPointId,
} from "./matrixDestinyCore";
import { db, motivationPhrasesTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";

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

export interface BirthLocationContext {
  latitude?: number | null;
  longitude?: number | null;
  timezone?: string | null;
}

function parseBirthClock(birthTime: string | null): { hour: number; minute: number } {
  if (!birthTime) return { hour: 12, minute: 0 };
  const hm = /^(\d{1,2}):(\d{2})/.exec(birthTime);
  if (!hm) return { hour: 12, minute: 0 };
  const hour = Number(hm[1]);
  const minute = Number(hm[2]);
  return hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59
    ? { hour, minute }
    : { hour: 12, minute: 0 };
}

/**
 * Canonical birth chart moment shared by BaZi and all personal activations.
 * The profile stores the civil local birth time selected together with the city;
 * coordinates and timezone travel with the context and must not be silently
 * replaced by the sandbox timezone or converted a second time.
 */
export function getBirthEightChar(
  birthDate: string,
  birthTime: string | null,
  _location?: BirthLocationContext,
) {
  const d = parseDate(birthDate);
  if (!d || d.month < 1 || d.month > 12 || d.day < 1 || d.day > 31) return null;
  const { hour, minute } = parseBirthClock(birthTime);
  try {
    return Solar.fromYmdHms(d.year, d.month, d.day, hour, minute, 0)
      .getLunar()
      .getEightChar();
  } catch {
    return null;
  }
}

function parseDate(dateStr: string): ParsedDate | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(dateStr);
  if (!m) return null;
  return { year: Number(m[1]), month: Number(m[2]), day: Number(m[3]) };
}

export interface MatrixPointResult {
  id: FullMatrixPointId;
  section: "diagonal" | "direct" | "line" | "purpose";
  position: string;
  arcanaNumber: number;
  arcanaName: string;
  essence: string;
  strength: string;
  practice: string;
  formula: string;
}

export interface PersonalMatrixResult {
  birthDate: string;
  calculationVersion: "full-wheel-v1";
  points: MatrixPointResult[];
}

const MATRIX_ARCANA_THEMES: Record<number, string> = {
  1: "Ваша сильная сторона здесь - инициатива, самостоятельное решение и готовность начать.",
  2: "Ваша сильная сторона здесь - наблюдательность, чувство момента и бережное внимание к нюансам.",
  3: "Ваша сильная сторона здесь - созидание, забота и умение развивать ценное шаг за шагом.",
  4: "Ваша сильная сторона здесь - порядок, границы и ответственность за выбранную опору.",
  5: "Ваша сильная сторона здесь - знания, ценности и способность делиться понятным опытом.",
  6: "Ваша сильная сторона здесь - зрелый выбор, честный диалог и умение строить взаимность.",
  7: "Ваша сильная сторона здесь - движение к цели, дисциплина и верность выбранному курсу.",
  8: "Ваша сильная сторона здесь - спокойная сила, выдержка и управление энергией без давления.",
  9: "Ваша сильная сторона здесь - вдумчивость, глубина и умение находить ответ без спешки.",
  10: "Ваша сильная сторона здесь - гибкость, чувство цикла и готовность замечать возможности.",
  11: "Ваша сильная сторона здесь - соразмерность, честная оценка и ответственность за решение.",
  12: "Ваша сильная сторона здесь - пауза, переосмысление и способность увидеть ситуацию иначе.",
  13: "Ваша сильная сторона здесь - обновление, завершение лишнего и готовность начать новый этап.",
  14: "Ваша сильная сторона здесь - гармония, спокойный ритм и соединение разных сторон жизни.",
  15: "Ваша сильная сторона здесь - честность с желаниями и умение распоряжаться ресурсами осознанно.",
  16: "Ваша сильная сторона здесь - смелость пересмотреть то, что перестало работать, и построить заново.",
  17: "Ваша сильная сторона здесь - вдохновение, творческий взгляд и надежда, подкреплённая действием.",
  18: "Ваша сильная сторона здесь - чувствительность, воображение и умение замечать тонкие сигналы.",
  19: "Ваша сильная сторона здесь - открытость, радость от результата и право проявляться заметно.",
  20: "Ваша сильная сторона здесь - честный пересмотр прошлого и способность выбирать главное.",
  21: "Ваша сильная сторона здесь - умение завершать циклы, собирать опыт и расширять горизонт.",
  22: "Ваша сильная сторона здесь - открытость новому, первый шаг и разумный эксперимент.",
};

const MATRIX_ARCANA_ACTIONS: Record<number, string> = {
  1: "Сделайте первый небольшой шаг по задаче, которую давно откладываете.",
  2: "Перед ответом дайте себе короткую паузу и запишите, что Вы действительно заметили.",
  3: "Выделите время на один творческий или заботливый шаг для себя либо близкого дела.",
  4: "Выберите одну границу или правило, которое сделает ситуацию яснее.",
  5: "Сформулируйте один вывод из опыта и поделитесь им простыми словами.",
  6: "Назовите свой выбор прямо и обсудите его без попытки угадать чужие ожидания.",
  7: "Определите ближайшую цель и доведите до конца один конкретный этап.",
  8: "Направьте напряжение в безопасное действие: прогулку, тренировку или спокойный разговор.",
  9: "Запланируйте время без шума, а затем запишите один вывод, который пришёл.",
  10: "Проверьте, какая перемена уже началась, и выберите один способ к ней адаптироваться.",
  11: "Сверьте решение с фактами и интересами всех, кого оно затрагивает.",
  12: "Поставьте срок для паузы и заранее назначьте следующий небольшой шаг.",
  13: "Закройте одну незавершённую задачу или освободите место для нового этапа.",
  14: "Верните себе ровный ритм через сон, еду, отдых и посильный темп дел.",
  15: "Проверьте, что Вы хотите на самом деле, и откажитесь от одного импульсивного действия.",
  16: "Назовите одну неработающую конструкцию и составьте реалистичный план её пересмотра.",
  17: "Превратите вдохновляющую идею в маленькое действие с конкретным сроком.",
  18: "Отделите факты от тревожных предположений и обсудите их с человеком, которому доверяете.",
  19: "Позвольте себе показать результат и поблагодарите себя за завершённый этап.",
  20: "Пересмотрите один повторяющийся сценарий и выберите более честный способ ответить на него.",
  21: "Подведите итог завершённого дела и решите, что из опыта Вы берёте дальше.",
  22: "Попробуйте новый безопасный формат или начните то, для чего достаточно первого шага.",
};

const MATRIX_POINT_COPY: Record<
  FullMatrixPointId,
  { position: string; essence: string; practice: string }
> = {
  day: {
    position: "Визитная карточка",
    essence: "Эта зона показывает Ваш привычный способ проявляться, принимать решения и обозначать свои потребности.",
    practice: "Перед ближайшим важным выбором сначала назовите свою потребность, а затем выберите действие, которое её поддержит.",
  },
  month: {
    position: "Главный талант",
    essence: "Эта зона показывает, как Вы воспринимаете опыт, учитесь и находите опору в своих ценностях.",
    practice: "Выберите одну тему, которую хотите понять глубже, и уделите ей спокойное внимание в течение недели.",
  },
  year: {
    position: "Задача души",
    essence: "Эта зона помогает увидеть, как накопленный опыт отражается в делах, окружении и повседневной жизни.",
    practice: "Заметьте одну привычку, которая поддерживает Вас в реальности, и повторите её осознанно на этой неделе.",
  },
  foundation: {
    position: "Кармический хвост",
    essence: "Эта зона связывает Ваши качества, ценности и опыт с тем, как Вы действуете в реальной жизни.",
    practice: "Разбейте важную задачу на один посильный шаг и сделайте его сегодня, не дожидаясь идеального момента.",
  },
  center: {
    position: "Зона комфорта",
    essence: "Эта зона показывает, что помогает Вам восстанавливаться, чувствовать внутреннюю опору и действовать без внутреннего надрыва.",
    practice: "Отметьте, какое действие действительно возвращает Вам силы, и заранее выделите для него время в ближайшие дни.",
  },
  directTopLeft: {
    position: "Род матери: духовная сфера",
    essence: "Зона предлагает посмотреть на семейные ценности, слова и убеждения, которые могли прийти по материнской линии.",
    practice: "Вспомните одну поддерживающую мысль из семейного опыта и решите, как применить её в своей жизни без повторения чужих сценариев.",
  },
  directTopRight: {
    position: "Род отца: духовная сфера",
    essence: "Зона предлагает посмотреть на семейные ценности, слова и убеждения, которые могли прийти по отцовской линии.",
    practice: "Вспомните один полезный пример из семейного опыта и выберите, как использовать его по-своему в текущей ситуации.",
  },
  directBottomRight: {
    position: "Род матери: материальная сфера",
    essence: "Зона касается привычек в быту, действиях, границах и обращении с ресурсами, которые Вы связываете с материнской линией.",
    practice: "Выберите одну бытовую или финансовую привычку, которую хотите оставить, изменить или сделать более удобной для себя.",
  },
  directBottomLeft: {
    position: "Род отца: материальная сфера",
    essence: "Зона касается привычек в быту, действиях, границах и обращении с ресурсами, которые Вы связываете с отцовской линией.",
    practice: "Выберите один практический навык, который укрепит Вашу самостоятельность, и примените его в ближайшем деле.",
  },
  heaven: {
    position: "Линия Неба",
    essence: "Эта зона связана с внутренним потенциалом, смыслом и тем, что вдохновляет Вас развиваться.",
    practice: "Сформулируйте одну ценность, которую хотите проживать на этой неделе, и подберите поступок в её поддержку.",
  },
  earth: {
    position: "Линия Земли",
    essence: "Эта зона связана с практической стороной жизни: действиями, устойчивостью, бытом и воплощением идей.",
    practice: "Выберите одну задачу, добавьте к ней конкретный срок и сделайте первый шаг, который можно проверить.",
  },
  personalPurpose: {
    position: "Личное предназначение",
    essence: "Эта зона подсказывает, какое внутреннее качество или навык полезно развивать для более цельного пути.",
    practice: "Спросите себя: «Что я хочу научиться делать увереннее?» и выберите один небольшой шаг для развития этого навыка.",
  },
  fatherLine: {
    position: "Род отца",
    essence: "Эта линия помогает заметить способы действовать, защищать себя и принимать поддержку, которые Вы связываете с отцовской ветвью семьи.",
    practice: "Отделите факт из семейной истории от собственного выбора и решите, какой способ действия хотите сохранить или изменить.",
  },
  motherLine: {
    position: "Род матери",
    essence: "Эта линия помогает заметить способы строить близость, заботиться и делать выбор, которые Вы связываете с материнской ветвью семьи.",
    practice: "Подумайте, какой семейный сценарий хотите прожить иначе, и выберите один уважительный шаг в сторону нового опыта.",
  },
  socialPurpose: {
    position: "Социальное предназначение",
    essence: "Эта зона помогает увидеть, какие качества, знания или опыт Вы можете проявлять рядом с людьми, в работе и сообществе.",
    practice: "Назовите один полезный вклад, который можете сделать в своей текущей роли, и воплотите его в конкретном действии.",
  },
  spiritualPurpose: {
    position: "Духовное предназначение",
    essence: "Эта зона соединяет личный рост с тем, как Вы хотите быть полезны другим и жить в согласии со своими ценностями.",
    practice: "Когда появится непростой выбор, назовите свою главную ценность и проверьте, поддерживает ли её выбранное решение.",
  },
  planetaryPurpose: {
    position: "Планетарное предназначение",
    essence: "Эта зона предлагает посмотреть шире: какую ценность Вы можете создавать для команды, сообщества или своего окружения.",
    practice: "Выберите небольшой поступок, который сделает общее пространство яснее, добрее или полезнее для других.",
  },
};

const FULL_MATRIX_POINT_ORDER: FullMatrixPointId[] = [
  "day",
  "month",
  "year",
  "foundation",
  "center",
  "directTopLeft",
  "directTopRight",
  "directBottomRight",
  "directBottomLeft",
  "heaven",
  "earth",
  "personalPurpose",
  "fatherLine",
  "motherLine",
  "socialPurpose",
  "spiritualPurpose",
  "planetaryPurpose",
];

/** Full Matrix of Destiny wheel derived from a birth date. */
export function computeMatrix(birthDate: string): PersonalMatrixResult | null {
  const d = parseDate(birthDate);
  if (!d) return null;

  const result = buildFullMatrixNumbers(d);
  if (!result) return null;

  return {
    birthDate,
    calculationVersion: "full-wheel-v1",
    points: FULL_MATRIX_POINT_ORDER.map((id) => {
      const point = result.points[id];
      const arcana = getArcana(point.value);
      const copy = MATRIX_POINT_COPY[id];
      return {
        id,
        section: point.section,
        position: copy.position,
        arcanaNumber: arcana.number,
        arcanaName: arcana.name,
        essence: copy.essence,
        strength: MATRIX_ARCANA_THEMES[arcana.number],
        practice: `${copy.practice} ${MATRIX_ARCANA_ACTIONS[arcana.number]}`,
        formula: point.formula,
      };
    }),
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
  _location?: BirthLocationContext,
): BaziResult | null {
  const d = parseDate(birthDate);
  if (!d) return null;
  // Guard against malformed-but-regex-valid dates (e.g. 2020-13-40) before
  // handing them to the calendar library, which throws on out-of-range input.
  if (d.month < 1 || d.month > 12 || d.day < 1 || d.day > 31) return null;

  const mod = (a: number, n: number) => ((a % n) + n) % n;

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
    const eightChar = getBirthEightChar(birthDate, birthTime);
    if (!eightChar) return null;

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

/**
 * Heavenly-stem index (0..9) of the day pillar for a calendar date. Computed at
 * noon to stay clear of the late-zi-hour (晚子时) boundary, so the result is the
 * pillar for the calendar day itself regardless of time-of-day convention.
 */
function dayStemIndexForDate(dateStr: string): number | null {
  const d = parseDate(dateStr);
  if (!d) return null;
  if (d.month < 1 || d.month > 12 || d.day < 1 || d.day > 31) return null;
  try {
    const solar = Solar.fromYmdHms(d.year, d.month, d.day, 12, 0, 0);
    const idx = GAN_CN.indexOf(solar.getLunar().getEightChar().getDayGan());
    return idx < 0 ? null : idx;
  } catch {
    return null;
  }
}

/** Day-master (日主) heavenly-stem index (0..9) from a birth date/time. */
function dayMasterStemIndex(
  birthDate: string,
  birthTime: string | null,
): number | null {
  const d = parseDate(birthDate);
  if (!d) return null;
  if (d.month < 1 || d.month > 12 || d.day < 1 || d.day > 31) return null;
  let hour = 12;
  let minute = 0;
  if (birthTime) {
    const hm = /^(\d{1,2}):(\d{2})/.exec(birthTime);
    if (hm) {
      const h = Number(hm[1]);
      const m = Number(hm[2]);
      if (h >= 0 && h <= 23 && m >= 0 && m <= 59) {
        hour = h;
        minute = m;
      }
    }
  }
  try {
    const solar = Solar.fromYmdHms(d.year, d.month, d.day, hour, minute, 0);
    const idx = GAN_CN.indexOf(solar.getLunar().getEightChar().getDayGan());
    return idx < 0 ? null : idx;
  } catch {
    return null;
  }
}

/**
 * "Robber of Wealth" (劫财) stem index for a given day-master. The robber shares
 * the day-master's element but carries the opposite polarity (ян/инь). In the
 * canonical stem order each element occupies an adjacent ян/инь pair
 * (0-1 Дерево, 2-3 Огонь, ...), so flipping the lowest bit yields the robber.
 */
function robWealthStemIndex(dayStemIdx: number): number {
  return dayStemIdx ^ 1;
}

/**
 * "Дни трат" (Robber-of-Wealth days) within a window. A day is a spending day
 * when its day-pillar heavenly stem equals the user's robber-of-wealth stem.
 * Returns ISO yyyy-mm-dd dates in [fromDate, fromDate + days - 1].
 */
export function computeSpendingDays(
  birthDate: string,
  birthTime: string | null,
  fromDate: string,
  days = 30,
): string[] {
  const dm = dayMasterStemIndex(birthDate, birthTime);
  if (dm === null) return [];
  const robIdx = robWealthStemIndex(dm);
  const start = parseDate(fromDate);
  if (!start) return [];

  const result: string[] = [];
  const base = new Date(start.year, start.month - 1, start.day);
  for (let i = 0; i < days; i++) {
    const dt = new Date(base);
    dt.setDate(dt.getDate() + i);
    const iso = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(dt.getDate()).padStart(2, "0")}`;
    if (dayStemIndexForDate(iso) === robIdx) result.push(iso);
  }
  return result;
}

/** Whether a specific calendar date is a robber-of-wealth (spending) day. */
export function isSpendingDay(
  birthDate: string,
  birthTime: string | null,
  date: string,
): boolean {
  const dm = dayMasterStemIndex(birthDate, birthTime);
  if (dm === null) return false;
  return dayStemIndexForDate(date) === robWealthStemIndex(dm);
}

/**
 * Feng Shui flying-star reading for a bed direction. Returns both the year's
 * flying star at that sector (from the 2026 annual chart) and the MONTHLY flying
 * star that visits the same sector in the current Bazi month, plus a single
 * combined recommendation. The monthly star flies forward from its central seed
 * along the same Lo Shu path; on any failure it falls back to the annual star.
 */
export interface FengShuiResult {
  direction: string;
  // Годовая звезда.
  starNumber: number;
  starName: string;
  influence: string;
  isUnfavorable: boolean;
  // Месячная звезда.
  monthlyStarNumber: number;
  monthlyStarName: string;
  monthlyInfluence: string;
  monthlyIsUnfavorable: boolean;
  // Объединённая рекомендация (годовая + месячная).
  recommendation: string;
}

export function computeFengShui(
  bedDirection: string,
  today: Date = new Date(),
): FengShuiResult {
  const annual = getFlyingStar(bedDirection, flyingStarYear(today));

  // Default the monthly star to the annual one; overwrite it once the current
  // Bazi month is known.
  let monthly: FlyingStarData = annual;
  try {
    const todayEC = Solar.fromYmdHms(
      today.getFullYear(),
      today.getMonth() + 1,
      today.getDate(),
      12,
      0,
      0,
    )
      .getLunar()
      .getEightChar();
    const monthBranchIdx = ZHI_CN.indexOf(todayEC.getMonthZhi());
    const yearBranchIdx = ZHI_CN.indexOf(todayEC.getYearZhi());
    const offset = FLY_ORDER_DIRECTIONS.findIndex((direction) => direction === annual.direction);
    if (monthBranchIdx >= 0 && yearBranchIdx >= 0 && offset >= 0) {
      const monthlyNum =
        ((monthlyCenterStar(yearBranchIdx, monthBranchIdx) - 1 + offset) % 9) + 1;
      monthly = getStarByNumber(monthlyNum);
    }
  } catch {
    // Keep the annual star as the monthly fallback.
  }

  // The annual 5-yellow (У Хуан) misfortune star overrides everything: whenever
  // it lands in the sector — as the annual OR the monthly star, with any other
  // star — only its own caution recommendation is given.
  const FIVE_YELLOW = 5;
  const recommendation =
    annual.starNumber === FIVE_YELLOW || monthly.starNumber === FIVE_YELLOW
      ? getStarByNumber(FIVE_YELLOW).recommendation
      : annual.starNumber === monthly.starNumber
        ? annual.recommendation
        : `${annual.recommendation} В этом месяце сектор также под влиянием звезды «${monthly.starName}»: ${monthly.recommendation}`;

  return {
    direction: annual.direction,
    starNumber: annual.starNumber,
    starName: annual.starName,
    influence: annual.influence,
    isUnfavorable: annual.isUnfavorable,
    monthlyStarNumber: monthly.starNumber,
    monthlyStarName: monthly.starName,
    monthlyInfluence: monthly.influence,
    monthlyIsUnfavorable: monthly.isUnfavorable,
    recommendation,
  };
}

// --- "Удача продвижения" (Promotion Luck) Feng Shui activation -------------

export interface PromotionActivationResult {
  /** Promotion animal derived from the birth-year heavenly stem. */
  animal: string;
  /** Compass sector that holds the promotion animal this Bazi month. */
  direction: string;
  /** Degree span of the sector, or null for the central palace. */
  degrees: string | null;
  /** Start of the current Bazi month (inclusive), ISO yyyy-mm-dd. */
  periodStart: string;
  /** Start of the next Bazi month (the sector changes then), ISO yyyy-mm-dd. */
  periodEnd: string;
  helps: string[];
  recommendation: string;
  /** Favourable double-hours on the nearest day of the Noble (по правилу выбора часов), or [] when none falls within the lookahead window. */
  hours: NobleHelperHour[];
  /** Favourable-by-affinity hours excluded by the selection rule, with the reason. */
  avoidHours: AvoidHour[];
  /** ISO date of the nearest day of the Noble the hours apply to, or null. */
  nobleDate: string | null;
}

// Promotion animal by birth-year heavenly stem (element + polarity).
const PROMOTION_ANIMAL_BY_STEM: Record<string, string> = {
  "Дерево-Ян": "Тигр",
  "Дерево-Инь": "Кролик",
  "Огонь-Ян": "Змея",
  "Огонь-Инь": "Лошадь",
  "Земля-Ян": "Змея",
  "Земля-Инь": "Лошадь",
  "Металл-Ян": "Обезьяна",
  "Металл-Инь": "Петух",
  "Вода-Ян": "Свинья",
  "Вода-Инь": "Крыса",
};

// Twelve animals in Earthly-Branch order (子=0 … 亥=11).
const ANIMAL_ORDER = [
  "Крыса",
  "Бык",
  "Тигр",
  "Кролик",
  "Дракон",
  "Змея",
  "Лошадь",
  "Коза",
  "Обезьяна",
  "Петух",
  "Собака",
  "Свинья",
];

// Degree span (45° each) of the eight compass sectors. The centre has none.
const SECTOR_DEGREES: Record<string, string> = {
  Север: "337,5°–22,5°",
  "Северо-восток": "22,5°–67,5°",
  Восток: "67,5°–112,5°",
  "Юго-восток": "112,5°–157,5°",
  Юг: "157,5°–202,5°",
  "Юго-запад": "202,5°–247,5°",
  Запад: "247,5°–292,5°",
  "Северо-запад": "292,5°–337,5°",
};

/**
 * Central flying star for a given Bazi month. The Tiger-month (立春) seed depends
 * on the year-branch group, then the centre descends by one each month (顺布 of
 * the monthly chart), wrapping 1..9.
 */
function monthlyCenterStar(yearBranchIdx: number, monthBranchIdx: number): number {
  let start: number;
  if ([0, 6, 3, 9].includes(yearBranchIdx)) {
    start = 8; // 子午卯酉
  } else if ([4, 10, 1, 7].includes(yearBranchIdx)) {
    start = 5; // 辰戌丑未
  } else {
    start = 2; // 寅申巳亥
  }
  const monthNum = ((monthBranchIdx - 2 + 12) % 12) + 1; // Tiger month = 1
  const c = start - (monthNum - 1);
  return (((c - 1) % 9) + 9) % 9 + 1;
}

/**
 * "Удача продвижения" activation shown on the Bazi page.
 *
 * The promotion animal is fixed by the birth-year heavenly stem. Each Bazi month
 * the current month's animal is placed in the central palace and the remaining
 * animals are distributed along the Lo Shu fly path; the sector holding the
 * promotion animal is the activation sector for that month. Three animals are
 * always absent from the nine palaces — if the promotion animal is one of them,
 * there is no activation this month. The activation is also suppressed when the
 * sector carries an afflicting annual or monthly flying star (2 or 5).
 */
export function computePromotionActivation(
  birthDate: string,
  birthTime: string | null,
  today: Date = new Date(),
  location?: BirthLocationContext,
): PromotionActivationResult | null {
  const d = parseDate(birthDate);
  if (!d) return null;
  if (d.month < 1 || d.month > 12 || d.day < 1 || d.day > 31) return null;

  let promoAnimalIdx: number;
  let monthBranchIdx: number;
  let yearBranchIdx: number;
  let periodStart: string;
  let periodEnd: string;
  try {
    // Promotion animal from the BIRTH-year heavenly stem.
    const birthEC = getBirthEightChar(birthDate, birthTime, location);
    if (!birthEC) return null;
    const stem = HEAVENLY_STEMS[GAN_CN.indexOf(birthEC.getYearGan())];
    if (!stem) return null;
    const promoAnimal =
      PROMOTION_ANIMAL_BY_STEM[`${stem.element}-${stem.polarity}`];
    if (!promoAnimal) return null;
    promoAnimalIdx = ANIMAL_ORDER.indexOf(promoAnimal);

    // Current Bazi month/year (solar-term accurate) for the month chart.
    const todayLunar = Solar.fromYmdHms(
      today.getFullYear(),
      today.getMonth() + 1,
      today.getDate(),
      12,
      0,
      0,
    ).getLunar();
    const todayEC = todayLunar.getEightChar();
    monthBranchIdx = ZHI_CN.indexOf(todayEC.getMonthZhi());
    yearBranchIdx = ZHI_CN.indexOf(todayEC.getYearZhi());
    if (promoAnimalIdx < 0 || monthBranchIdx < 0 || yearBranchIdx < 0) {
      return null;
    }

    periodStart = todayLunar.getPrevJie().getSolar().toYmd();
    periodEnd = todayLunar.getNextJie().getSolar().toYmd();
  } catch {
    return null;
  }

  // Step offset of the promotion animal along the fly path. The month animal
  // sits in the centre (offset 0); offsets 9..11 fall outside the nine palaces.
  const offset = (((promoAnimalIdx - monthBranchIdx) % 12) + 12) % 12;
  if (offset > 8) return null;

  const direction = FLY_ORDER_DIRECTIONS[offset];

  // The sector work is done "в дни Благородного"; surface the favourable hours of
  // the nearest day of the Noble so the user picks a good двухчасовка for it.
  const noble = computeNobleHelperActivation(birthDate, birthTime, today, location);

  // Annual star comes from the existing 2026 chart; the monthly star flies
  // forward from its central seed along the same path.
      const annualStar = getFlyingStar(direction, flyingStarYear(today)).starNumber;

  const monthlyStar =
    ((monthlyCenterStar(yearBranchIdx, monthBranchIdx) - 1 + offset) % 9) + 1;
  if ([2, 5].includes(annualStar) || [2, 5].includes(monthlyStar)) {
    return null;
  }

  return {
    animal: ANIMAL_ORDER[promoAnimalIdx],
    direction,
    degrees: SECTOR_DEGREES[direction] ?? null,
    periodStart,
    periodEnd,
    helps: ["увеличить денежные активы", "избавиться от негатива"],
    recommendation:
      "Проводите в этом секторе много времени, делайте в нём перестановки и уборку в дни благородных.",
    hours: noble?.hours ?? [],
    avoidHours: noble?.avoidHours ?? [],
    nobleDate: noble?.date ?? null,
  };
}

// --- "Благородный помощник" (Noble Helper / 天乙贵人) activation -------------

export interface NobleHelperHour {
  /** Animal of the favourable double-hour. */
  animal: string;
  /** Clock span of the double-hour, e.g. "09:00–11:00". */
  period: string;
  /** True for the Noble's own hour (the most auspicious choice). */
  preferred: boolean;
  /** Why the hour is favourable (Russian): own hour / слияние / союз / сезон. */
  reason: string;
}

export interface NobleHelperActivationResult {
  goal: string;
  taichi: string;
  /** Animal of the Noble being activated today (= today's day branch). */
  animal: string;
  /** 24-mountain sub-sector, e.g. "Юго-восток-3". */
  sector: string;
  /** Degree span of the sub-sector, e.g. "142,5°–157,5°". */
  degrees: string;
  hours: NobleHelperHour[];
  /** Favourable-by-affinity hours excluded by the selection rule, with the reason. */
  avoidHours: AvoidHour[];
  instruction: string;
  /** Caution note when the sector falls under the year's Three Sha, else null. */
  caution: string | null;
  /** The activation day, ISO yyyy-mm-dd. */
  date: string;
  /** Whole days from today until the activation (0 = today, up to 3 ahead). */
  daysUntil: number;
}

// Noble Helper (天乙贵人) branches by birth-stem element + polarity.
const NOBLE_HELPER_BY_STEM: Record<string, string[]> = {
  "Дерево-Ян": ["Коза", "Бык"],
  "Дерево-Инь": ["Обезьяна", "Крыса"],
  "Огонь-Ян": ["Петух", "Свинья"],
  "Огонь-Инь": ["Свинья", "Петух"],
  "Земля-Ян": ["Бык", "Коза"],
  "Земля-Инь": ["Крыса", "Обезьяна"],
  "Металл-Ян": ["Бык", "Коза"],
  "Металл-Инь": ["Тигр", "Лошадь"],
  "Вода-Ян": ["Кролик", "Змея"],
  "Вода-Инь": ["Змея", "Кролик"],
};

// 24-mountain sub-sector and degree span of each Earthly Branch (index 子=0 … 亥=11).
const BRANCH_SECTOR: Record<number, { sector: string; degrees: string }> = {
  0: { sector: "Север-2", degrees: "352,5°–7,5°" },
  1: { sector: "Северо-восток-1", degrees: "22,5°–37,5°" },
  2: { sector: "Северо-восток-3", degrees: "52,5°–67,5°" },
  3: { sector: "Восток-2", degrees: "82,5°–97,5°" },
  4: { sector: "Юго-восток-1", degrees: "112,5°–127,5°" },
  5: { sector: "Юго-восток-3", degrees: "142,5°–157,5°" },
  6: { sector: "Юг-2", degrees: "172,5°–187,5°" },
  7: { sector: "Юго-запад-1", degrees: "202,5°–217,5°" },
  8: { sector: "Юго-запад-3", degrees: "232,5°–247,5°" },
  9: { sector: "Запад-2", degrees: "262,5°–277,5°" },
  10: { sector: "Северо-запад-1", degrees: "292,5°–307,5°" },
  11: { sector: "Северо-запад-3", degrees: "322,5°–337,5°" },
};

// Two-hour periods by branch index (子=0 starts at 23:00).
const TWO_HOUR_PERIODS = [
  "23:00–01:00",
  "01:00–03:00",
  "03:00–05:00",
  "05:00–07:00",
  "07:00–09:00",
  "09:00–11:00",
  "11:00–13:00",
  "13:00–15:00",
  "15:00–17:00",
  "17:00–19:00",
  "19:00–21:00",
  "21:00–23:00",
];

// Six-harmony (六合 слияние) partner of each branch by index.
const SIX_HARMONY = [1, 0, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2];
// Triple-combination frames (三合 союз).
const SAN_HE_GROUPS = [
  [8, 0, 4], // 申子辰
  [11, 3, 7], // 亥卯未
  [2, 6, 10], // 寅午戌
  [5, 9, 1], // 巳酉丑
];
// Seasonal/directional trios (三會 сезон).
const SEASONAL_GROUPS = [
  [2, 3, 4], // 寅卯辰
  [5, 6, 7], // 巳午未
  [8, 9, 10], // 申酉戌
  [11, 0, 1], // 亥子丑
];

/** Branches carrying the year's Three Sha (三煞), by the current year branch. */
function threeShaBranches(yearBranchIdx: number): number[] {
  if ([8, 0, 4].includes(yearBranchIdx)) return [5, 6, 7]; // 申子辰 → юг
  if ([2, 6, 10].includes(yearBranchIdx)) return [11, 0, 1]; // 寅午戌 → север
  if ([5, 9, 1].includes(yearBranchIdx)) return [2, 3, 4]; // 巳酉丑 → восток
  return [8, 9, 10]; // 亥卯未 → запад
}

/** Six-clash (六冲) partner of an Earthly Branch by index. */
const clashOf = (i: number): number => (i + 6) % 12;

export interface AvoidHour {
  /** Animal of the excluded double-hour. */
  animal: string;
  /** Clock span of the double-hour. */
  period: string;
  /** Why the hour is excluded from the recommendation (Russian). */
  reason: string;
}

/**
 * Selects the favourable double-hours for an activation following the mingli
 * date-selection rule (правило выбора удачных двухчасовок).
 *
 * The anchor's own hour (the day of the Noble = the day branch) is preferred;
 * additional favourable hours are those combining with the anchor via six-harmony
 * (六合 слияние), three-harmony (三合 союз) or the seasonal trio (三會 сезон).
 * An hour is excluded when it:
 *   - falls in the day pillar's void (空亡) — «пустой час»;
 *   - clashes (六冲) with the day branch (日破) — «разрушитель дня»;
 *   - clashes with the month branch (月破) — «неиспользуемый час»;
 *   - clashes with one of the user's natal branches — «нежелательный час».
 * Excluded favourable hours are returned in `avoidHours` with their reason.
 */
function selectActivationHours(opts: {
  anchorIdx: number;
  dayBranchIdx: number;
  monthBranchIdx: number;
  natalBranchIdxs: number[];
  voidBranchIdxs: number[];
}): { hours: NobleHelperHour[]; avoidHours: AvoidHour[] } {
  const { anchorIdx, dayBranchIdx, monthBranchIdx, natalBranchIdxs, voidBranchIdxs } =
    opts;

  // Candidate favourable hours, each tagged with why it is favourable. Insertion
  // order sets priority: the Noble's own hour first, then 六合 / 三合 / 三會.
  const candidates = new Map<number, string>();
  candidates.set(anchorIdx, "час самого Благородного");
  const six = SIX_HARMONY[anchorIdx];
  if (!candidates.has(six)) candidates.set(six, "слияние с Благородным");
  for (const g of SAN_HE_GROUPS) {
    if (g.includes(anchorIdx)) {
      for (const x of g) {
        if (!candidates.has(x)) candidates.set(x, "союз с Благородным");
      }
    }
  }
  for (const g of SEASONAL_GROUPS) {
    if (g.includes(anchorIdx)) {
      for (const x of g) {
        if (!candidates.has(x)) candidates.set(x, "сезон с Благородным");
      }
    }
  }

  const excludeReason = (idx: number): string | null => {
    if (voidBranchIdxs.includes(idx)) {
      return "пустой час — попадает в пустоту дня (Кун Ван)";
    }
    if (idx === clashOf(dayBranchIdx)) {
      return "разрушитель дня — столкновение с днём";
    }
    if (idx === clashOf(monthBranchIdx)) {
      return "неиспользуемый час — столкновение с месяцем";
    }
    if (natalBranchIdxs.some((n) => idx === clashOf(n))) {
      return "нежелательный час — столкновение с вашей картой";
    }
    return null;
  };

  const hours: NobleHelperHour[] = [];
  const avoidHours: AvoidHour[] = [];
  // Показываем двухчасовки по суточному циклу, как в блоке Джи Фу:
  // 01:00–03:00, 03:00–05:00, …, 21:00–23:00, затем 23:00–01:00.
  const chronologicalCandidates = [...candidates.entries()].sort(
    ([a], [b]) => (a === 0 ? 12 : a) - (b === 0 ? 12 : b),
  );
  for (const [idx, reason] of chronologicalCandidates) {
    // The Noble's own hour anchors the whole activation, so it is always offered
    // as the preferred choice; the exclusions only prune the supplementary
    // affinity hours (слияние / союз / сезон).
    if (idx === anchorIdx) {
      hours.push({
        animal: ANIMAL_ORDER[idx],
        period: TWO_HOUR_PERIODS[idx],
        preferred: true,
        reason,
      });
      continue;
    }
    const ex = excludeReason(idx);
    if (ex) {
      avoidHours.push({
        animal: ANIMAL_ORDER[idx],
        period: TWO_HOUR_PERIODS[idx],
        reason: ex,
      });
    } else {
      hours.push({
        animal: ANIMAL_ORDER[idx],
        period: TWO_HOUR_PERIODS[idx],
        preferred: false,
        reason,
      });
    }
  }
  return { hours, avoidHours };
}

/**
 * "Благородный помощник" (Noble Helper) activation shown on the Bazi page.
 *
 * The user's Noble Helpers come from the birth-year and birth-day heavenly
 * stems. An activation falls on a day whose day-branch equals one of those Noble
 * animals ("день Благородного"). To give the user time to prepare, the card is
 * published from three days before the activation up to and including the day
 * itself; the nearest upcoming activation in that window is returned. A day is
 * skipped when the Noble clashes (六冲) with the user's natal year/day branch,
 * when the sector is the year's Grand Duke (Тай Суй), or when it carries the
 * annual 5-yellow star. Sectors under the year's Three Sha activate with a
 * caution. Favourable hours are the Noble's own double-hour (always offered as
 * preferred) plus its harmony hours (六合/三合/三會); hours that are void (空亡),
 * clash the day (六冲), break the month (月破), or clash the user's natal branches
 * are excluded into avoidHours. Returns null when no activation falls within the
 * next three days — the UI then shows nothing.
 */
export function computeNobleHelperActivation(
  birthDate: string,
  birthTime: string | null,
  today: Date = new Date(),
  location?: BirthLocationContext,
): NobleHelperActivationResult | null {
  const d = parseDate(birthDate);
  if (!d) return null;
  if (d.month < 1 || d.month > 12 || d.day < 1 || d.day > 31) return null;

  let nobleIdxs: number[];
  let selfBranchIdxs: number[];
  try {
    const birthEC = getBirthEightChar(birthDate, birthTime, location);
    if (!birthEC) return null;
    const yearStem = HEAVENLY_STEMS[GAN_CN.indexOf(birthEC.getYearGan())];
    const dayStem = HEAVENLY_STEMS[GAN_CN.indexOf(birthEC.getDayGan())];
    if (!yearStem || !dayStem) return null;

    const yBranch = ZHI_CN.indexOf(birthEC.getYearZhi());
    const dBranch = ZHI_CN.indexOf(birthEC.getDayZhi());
    selfBranchIdxs = [yBranch, dBranch].filter((i) => i >= 0);

    const nobleAnimals = new Set<string>([
      ...(NOBLE_HELPER_BY_STEM[`${yearStem.element}-${yearStem.polarity}`] ?? []),
      ...(NOBLE_HELPER_BY_STEM[`${dayStem.element}-${dayStem.polarity}`] ?? []),
    ]);
    nobleIdxs = [...nobleAnimals]
      .map((a) => ANIMAL_ORDER.indexOf(a))
      .filter((i) => i >= 0);
  } catch {
    return null;
  }

  // Scan from today up to three days ahead; return the nearest activation so the
  // card appears starting three days before the activation day.
  for (let offset = 0; offset <= 3; offset++) {
    const target = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate() + offset,
    );

    let dayBranchIdx: number;
    let yearBranchIdx: number;
    let monthBranchIdx: number;
    let voidBranchIdxs: number[];
    try {
      const ec = Solar.fromYmdHms(
        target.getFullYear(),
        target.getMonth() + 1,
        target.getDate(),
        12,
        0,
        0,
      )
        .getLunar()
        .getEightChar();
      dayBranchIdx = ZHI_CN.indexOf(ec.getDayZhi());
      yearBranchIdx = ZHI_CN.indexOf(ec.getYearZhi());
      monthBranchIdx = ZHI_CN.indexOf(ec.getMonthZhi());
      // Day pillar void (空亡 Кун Ван): the two branches with no stem in the day's xun.
      voidBranchIdxs = Array.from(ec.getDayXunKong())
        .map((c) => ZHI_CN.indexOf(c))
        .filter((i) => i >= 0);
    } catch {
      continue;
    }
    if (dayBranchIdx < 0 || yearBranchIdx < 0 || monthBranchIdx < 0) continue;

    // The target day must be a "day of the Noble".
    if (!nobleIdxs.includes(dayBranchIdx)) continue;
    const nobleIdx = dayBranchIdx;

    // Skip clashes (六冲) with the user's natal year/day branch.
    if (selfBranchIdxs.some((s) => clashOf(s) === nobleIdx)) continue;

    // Skip the Grand Duke (Тай Суй) sector — the year branch.
    if (nobleIdx === yearBranchIdx) continue;

    // Skip the sector holding the annual 5-yellow misfortune star.
    const dir8 = BRANCH_SECTOR[nobleIdx].sector.replace(/-\d+$/, "");
    if (getFlyingStar(dir8, flyingStarYear(today)).starNumber === 5) continue;

    const caution = threeShaBranches(yearBranchIdx).includes(nobleIdx)
      ? "В этом году сектор попадает под влияние Трёх Ша. Активируйте мягко и осторожно, без резких перестановок."
      : null;

    // Favourable hours follow the mingli double-hour selection rule: the Noble's
    // own hour is preferred, joined by hours combining with it (六合/三合/三會),
    // minus the excluded hours (пустой / разрушитель дня / неиспользуемый / нежелательный).
    const { hours, avoidHours } = selectActivationHours({
      anchorIdx: nobleIdx,
      dayBranchIdx,
      monthBranchIdx,
      natalBranchIdxs: selfBranchIdxs,
      voidBranchIdxs,
    });

    const { sector, degrees } = BRANCH_SECTOR[nobleIdx];
    const hoursText = hours.map((h) => `${h.animal} (${h.period})`).join(", ");
    const instruction = `В секторе ${sector} (${degrees}), в один из благоприятных часов (${hoursText}) проведите уборку и позвоните в колокольчик. Озвучьте намерение по цели. Весь процесс должен занять не менее 15 минут.`;

    return {
      goal: "поиск нужных людей, защита и поддержка, решение проблем, исполнение желаний",
      taichi: "Используйте малый или большой тайчи.",
      animal: ANIMAL_ORDER[nobleIdx],
      sector,
      degrees,
      hours,
      avoidHours,
      instruction,
      caution,
      date: `${target.getFullYear()}-${String(target.getMonth() + 1).padStart(2, "0")}-${String(target.getDate()).padStart(2, "0")}`,
      daysUntil: offset,
    };
  }

  return null;
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

export interface TransitSummary {
  transitBody: string;
  natalBody: string;
  type: string;
  orb: number;
  transitHouse: number | null;
  natalHouse: number | null;
  /** Backward-compatible alias for transitHouse used by older UI clients. */
  house: number | null;
  durationDays: number;
}

export interface ForecastMatrix {
  number: number;
  name: string;
  essence: string;
}

export interface DailyForecastResult {
  arcanaNumber: number;
  arcanaName: string;
  hasWarning: boolean;
  synthesisText: string;
  matrix: ForecastMatrix;
  transits: TransitSummary[];
  cinderellaGates: import("./cinderellaGates").CinderellaGate[];
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

// Дневной текст формируется только через semanticEngine + futuristicGenerator.
// Старые жёсткие генераторы удалены, чтобы не было второго источника прозы.

/** New computeDailyForecast: uses natal chart + transits + arcana + ontology. */
export async function computeDailyForecast(
  birthDate: string,
  natalChart: import("./astrology").NatalChart | null,
  transits: import("./astrology").TransitResult | null,
  today: string,
): Promise<DailyForecastResult | null> {
  const matrixOk = parseDate(birthDate);
  if (!matrixOk) return null;

  const arcanaNum = computeArcanaOfDay(birthDate, today);
  const arcana = getArcana(arcanaNum);

  const forbiddenDailyBodies = new Set(["Хирон", "Лилит", "Северный узел", "Южный узел"]);
  const transitAspects = (transits?.aspects ?? []).filter(
    (aspect) => !forbiddenDailyBodies.has(aspect.transitBody) && !forbiddenDailyBodies.has(aspect.natalBody),
  );

  // Предупреждения и конфликты теперь формируются только из семантических
  // данных выбранных факторов, а не из жёстко заданных абзацев.
  const conflicts: string[] = [];
  const warnings: string[] = [];

  // ===== SEMANTIC FORECAST (up to 3 compatible transits, ontology-only) =====
  const rankedTransits = selectTopTransits(transitAspects);

  let synthesisText: string;

  if (rankedTransits.length === 0) {
    synthesisText = "Сегодня особенных астрологических событий не прогнозируется.";
  } else {
    const activePhrases = await db
      .select()
      .from(motivationPhrasesTable)
      .where(eq(motivationPhrasesTable.isActive, true))
      .orderBy(motivationPhrasesTable.createdAt);
    // Один и тот же пользовательский прогноз не должен менять фразу при обновлении.
    // Дата даёт стабильный индекс, поэтому фраза меняется раз в день.
    const dailyPhraseIndex = Array.from(today).reduce(
      (sum, char) => sum + char.charCodeAt(0),
      0,
    );
    const dailyPhrase = activePhrases.length
      ? activePhrases[dailyPhraseIndex % activePhrases.length]?.phrase
      : undefined;

    const forecast = await futuristicGenerator.generate(
      rankedTransits,
      new Date(today),
      dailyPhrase,
    );
    if (forecast) {
      synthesisText = forecast;
    } else {
      const main = rankedTransits[0];
      const key = `${main.transitBody} ${main.type} ${main.natalBody}`.trim();
      synthesisText = `Для транзита (${key}) пока нет семантических данных в Oracle Studio. Администратор заполняет онтологию. Прогнозы появятся после добавления данных.`;
      warnings.push("Онтология заполнена не полностью");
    }
  }

  const hasWarning = warnings.length > 0 || conflicts.length > 0;

  // UI and prose must use the same ranked candidate set; do not expose the raw orb-sorted array.
  const transitSummary: TransitSummary[] = rankedTransits.map((t) => ({
    transitBody: t.transitBody,
    natalBody: t.natalBody,
    type: t.type,
    orb: t.orb,
    transitHouse: t.transitHouse,
    natalHouse: t.natalHouse,
    house: t.transitHouse,
    durationDays: t.durationDays,
  }));

  return {
    arcanaNumber: arcana.number,
    arcanaName: arcana.name,
    hasWarning,
    synthesisText,
    matrix: { number: arcana.number, name: arcana.name, essence: arcana.essence },
    transits: transitSummary,
    cinderellaGates: transits?.cinderellaGates ?? [],
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
