export type { QimenThreeVictory, VictoryComponent, VictoryLevel } from "./threeVictories";
import { computeThreeVictories, type DayHourCheckItem, type ChartPalaceInfo } from "./threeVictories";
// Qi Men Dun Jia — public entry: scan an N-day window for personal walk structures.
import {
  BRANCH_ANIMAL_RU,
  BRANCH_ANIMAL_RU_GEN,
  BRANCH_HOUR_WINDOW,
  CHRONOLOGICAL_HOUR_SLOTS,
  BRANCHES,
  clashesBranch,
  PALACES,
  STEMS,
} from "./constants";
import { Solar } from "lunar-typescript";
import {
  birthYearBranch,
  birthYearStem,
  birthYearRepresentativeStem,
  dayInfo,
  xunInfo,
} from "./calendar";
import { buildChart, buildPeriodMap, type PalaceCell } from "./chart";
import { monthJoeyYapJuForDate, monthPillarForDate, dayJoeyYapJuForDate } from "./ju";
import {
  detectDragonTurnsHead,
  detectFlyingBirdFallsIntoCave,
  detectFiveBattalions,
  detectTigerDun,
  detectWindDun,
  TIGER_DUN_GOAL,
  WIND_DUN_GOAL,
  detectThreeGenerals,
  detectThreeMystics,
  detectJadeMaiden,
  detectNobleHelperDoor,
  type NobleHelperKind,
} from "./structures";
import { computeJiFuWishes, type JiFuWish } from "./jifu";
import { DOOR_NAME_RU, STEM_NAME_RU } from "../../data/qimen/maidens";
import { GENERALS_STAR_NAME } from "../../data/qimen/threeGenerals";
import { isLateZiClock } from "./birthTime";

export type { JiFuWish } from "./jifu";

const MAIDEN_DAYS = 2;
const THREE_GENERALS_DAYS = 3;
const NOBLE_HELPER_DAYS = 2;

const NOBLE_HELPER_GOALS: Record<NobleHelperKind, string> = {
  yang: "используйте данную структуру, если Вам необходимо реализовать публичные цели: маркетинг, пиар, продажи, запуск новых товаров, карьерный рост, превзойти конкурентов, добиться публичного продвижения и вопросов, которые должны стать известны широкому кругу людей.",
  yin: "используйте данную структуру, если Вам необходимо решить вопросы, связанные, с семейными делами, приватным общением, тайной информацией, решить внутренние конфликты в коллективе, оплатить счета, улучшить контроль и наладить взаимодействие внутри организации.",
};

const DRAGON_GOALS_BY_DOOR: Record<string, string> = {
  "生门": "Масштабный рост благосостояния, долгосрочные инвестиции, покупка недвижимости, запуск крупного доходного бизнеса, стратегическое приумножение капитала.",
  "开门": "Карьерный триумф, назначение на высокую должность, регистрация компании, выход на новые рынки, стратегические соглашения с властью и топ-менеджментом.",
  "休门": "Обретение влиятельных покровителей на годы вперед, долгосрочные семейные союзы, фундаментальное партнерство, гармонизация жизни.",
  "景门": "Глобальное признание, создание личного бренда, победа в престижных премиях и конкурсах, выход на широкую публичную аудиторию.",
  "杜门": "Создание надежной системы безопасности активов, долгосрочные научные исследования, защита бизнеса от недружественных поглощений.",
  "伤门": "Завоевание лидерства на высококонкурентных рынках, взыскание крупных долгов, победа в затяжных судебных процессах.",
  "惊门": "Устранение стратегических конкурентов, защита компании в кризисных ситуациях, победа в жестких переговорах на самом высоком уровне.",
  "死门": "Приобретение земли и масштабных земельных участков, глубокая реструктуризация бизнеса, отсечение старых убыточных направлений.",
};

const BIRD_GOALS_BY_DOOR: Record<string, string> = {
  "景门": "В статике: размещение рекламы, подача заявок в конкурсах, публикации, привлечение внимания. На прогулке: знакомства, произвести яркое впечатление.",
  "生门": "В статике и на прогулке: финансовая удача без усилий, прибыль, быстрые сделки, продажи, подписание договоров.",
  "开门": "В статике и на прогулке: карьерный рост, легкий старт бизнеса, решение вопросов с руководством и госорганами.",
  "休门": "В статике и на прогулке: примирение, мягкие переговоры, привлечение помощи влиятельных лиц.",
  "杜门": "В статике: скрытое планирование, защита активов. На прогулке: быть невидимым и незаметным для окружающих, не встретить знакомых, избежать внимания.",
  "伤门": "В статике: взыскание долгов, победа в жесткой конкурентной борьбе, подача исков и претензий.",
  "惊门": "В статике: психологическое давление на конкурентов, подавить соперников своей мощью и силой, победа в дебатах.",
  "死门": "В статике: фиксация позиций, покупка недвижимости или земли, завершение бесперспективных процессов.",
};

const STRUCTURE_NAME = "Три Генерала";
const STRUCTURE_GOAL = "Деньги, доход, материальное благополучие";

export interface QimenStructure {
  date: string; // ISO yyyy-mm-dd
  dayGanZhi: string;
  hourBranch: number;
  hourLabel: string; // "час Лошади (11:00–13:00)"
  structure: "three_generals";
  structureName: string;
  goal: string;
  direction: string;
  dom: string;
  wonder: string;
  wonderName: string;
  star: string;
  starName: string;
  door: string;
  activation: string;
  signs: string[];
  result: string;
  note?: string;
  supportRelation?: "same" | "supports";
  supportMessage?: string;
  resonance?: string[];
  specialNote?: string;
}

export interface QimenJadeMaiden {
  date: string;
  dayGanZhi: string;
  hourBranch: number;
  hourLabel: string;
  direction: string;
  dir: string;
  dom: string;
  heavenStem: string;
  heavenStemName: string;
  earthStem: string;
  earthStemName: string;
  door: string;
  doorName: string;
  isMainGate: boolean;
  supportRelation?: "same" | "supports";
  supportMessage?: string;
  resonance?: string[];
  specialNote?: string;
}

export interface QimenThreeMystic {
  date: string;
  dayGanZhi: string;
  hourBranch: number;
  hourLabel: string;
  direction: string;
  dir: string;
  dom: string;
  wonder: "乙" | "丙" | "丁";
  wonderName: string;
  earthStem: string;
  earthStemName: string;
  goal: string;
  star: string;
  starName: string;
  door: string;
  doorName: string;
  activation: string;
  supportRelation?: "same" | "supports";
  supportMessage?: string;
  resonance?: string[];
  specialNote?: string;
}

export interface QimenFiveBattalion {
  date: string;
  dayGanZhi: string;
  hourBranch: number;
  hourLabel: string;
  direction: string;
  dir: string;
  dom: string;
  heavenStem: string;
  heavenStemName: string;
  earthStem: string;
  earthStemName: string;
  door: string;
  doorName: string;
  goal: string;
}

export interface QimenWindDun {
  date: string;
  dayGanZhi: string;
  hourBranch: number;
  hourLabel: string;
  direction: string;
  dir: string;
  dom: string;
  heavenStem: string;
  heavenStemName: string;
  earthStem: string;
  earthStemName: string;
  door: string;
  doorName: string;
  deity: string;
  deityName?: string;
  goal: string;
  supportRelation: "same" | "supports";
  supportMessage: string;
}

export interface QimenNobleHelperDoor {
  date: string;
  dayGanZhi: string;
  hourBranch: number;
  hourLabel: string;
  direction: string;
  dir: string;
  dom: string;
  nobleKind: NobleHelperKind;
  nobleBranch: string;
  heavenStem: string;
  heavenStemName: string;
  deity: string;
  deityName: string;
  goal: string;
}

export interface QimenDragonTurnsHead {
  date: string;
  dayGanZhi: string;
  hourBranch: number;
  hourLabel: string;
  direction: string;
  dir: string;
  dom: string;
  heavenStem: string;
  heavenStemName: string;
  earthStem: string;
  earthStemName: string;
  door: string;
  doorName: string;
  goal: string;
  supportRelation: "same" | "supports";
  supportMessage: string;
}

export interface QimenBirdInNest {
  date: string;
  dayGanZhi: string;
  hourBranch: number;
  hourLabel: string;
  direction: string;
  dir: string;
  dom: string;
  heavenStem: string;
  heavenStemName: string;
  earthStem: string;
  earthStemName: string;
  door: string;
  doorName: string;
  goal: string;
  supportRelation: "same" | "supports";
  supportMessage: string;
}

export interface QimenTigerDun {
  date: string;
  dayGanZhi: string;
  hourBranch: number;
  hourLabel: string;
  direction: string;
  dir: string;
  dom: string;
  variant: 1 | 2 | 3 | 4;
  heavenStem: string;
  heavenStemName: string;
  earthStem: string;
  earthStemName: string;
  earthStemRequired: boolean;
  door: string;
  doorName: string;
  star: string;
  starName: string;
  goal: string;
  supportRelation: "same" | "supports";
  supportMessage: string;
}

export interface QimenBirthChartCell {
  palace: number;
  direction: string;
  trigram: string;
  earthStem: string;
  heavenStem: string;
  hiddenHeavenStem: string;
  hiddenEarthStem: string;
  star: string;
  pairedStar?: string;
  door: string;
  deity: string;
  isVoid: boolean;
  isDestinyPalace?: boolean;
}

export interface QimenBirthChart {
  hourGz: string;
  ju: number;
  yin: boolean;
  fuYin: boolean;
  zhiFuStar: string;
  zhiShiDoor: string;
  zhiFuPalace: number;
  zhiShiPalace: number;
  destinyPalace: number | null;
  cells: QimenBirthChartCell[];
}

export interface QimenMonthChart {
  monthGz: string;
  ju: number;
  yin: boolean;
  fuYin: boolean;
  zhiFuStar: string;
  zhiShiDoor: string;
  zhiFuPalace: number;
  zhiShiPalace: number;
  cells: QimenBirthChartCell[];
}

export interface QimenResult {
  hasBirthDate: boolean;
  birthYearAnimal: string | null;
  windowDays: number;
  maidenWindowDays: number;
  structures: QimenStructure[];
  jiFuWishes: JiFuWish[];
  jadeMaidens: QimenJadeMaiden[];
  threeMystics: QimenThreeMystic[];
  fiveBattalions: QimenFiveBattalion[];
  windDuns: QimenWindDun[];
  tigerDuns: QimenTigerDun[];
  birdsInNest: QimenBirdInNest[];
  threeVictories: QimenThreeVictory[];
  dragonsTurnHead: QimenDragonTurnsHead[];
  nobleHelperDoors: QimenNobleHelperDoor[];
  birthChart: QimenBirthChart | null;
  monthChart: QimenMonthChart;
}

export interface ComputeOptions {
  birthDate?: string | null; // ISO yyyy-mm-dd
  birthTime?: string | null; // "HH:MM" (affects 立春 year-pillar boundary)
  from?: Date;
  timezone?: string | null; // user's current location timezone
  birthTimezone?: string | null;
  birthLongitude?: number | null;
  days?: number;
  tigerDunDays?: number;
}

function localCalendarNoon(
  timezone?: string | null,
  instant = new Date(),
): Date {
  if (!timezone)
    return new Date(
      instant.getFullYear(),
      instant.getMonth(),
      instant.getDate(),
      12,
      0,
      0,
    );
  try {
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone: timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).formatToParts(instant);
    const values = Object.fromEntries(
      parts.map((part) => [part.type, part.value]),
    );
    return new Date(
      Number(values.year),
      Number(values.month) - 1,
      Number(values.day),
      12,
      0,
      0,
    );
  } catch {
    return new Date(
      instant.getFullYear(),
      instant.getMonth(),
      instant.getDate(),
      12,
      0,
      0,
    );
  }
}


function buildDayChart(date: Date) {
  const dInfo = dayInfo(date);
  const pillar = {
    stem: dInfo.stem,
    branch: dInfo.branch,
    label: `${STEMS[dInfo.stem]} ${BRANCHES[dInfo.branch]}`,
  };
  return buildPeriodMap(date, "day", pillar, dayJoeyYapJuForDate(date));
}

function buildMonthChart(date: Date): QimenMonthChart {
  const pillar = monthPillarForDate(date);
  const chart = buildPeriodMap(
    date,
    "month",
    pillar,
    monthJoeyYapJuForDate(date),
  );
  const cells = Object.values(chart.cells).map((cell: PalaceCell) => ({
    palace: cell.palace,
    direction: PALACES[cell.palace].dir,
    trigram: PALACES[cell.palace].trigram,
    earthStem: cell.earthStem,
    heavenStem: cell.heavenStem,
    hiddenHeavenStem: cell.hiddenHeavenStem,
    hiddenEarthStem: cell.hiddenEarthStem,
    star: cell.star,
    pairedStar: cell.pairedStar,
    door: cell.door,
    deity: cell.deity,
    isVoid: cell.isVoid,
  }));
  return {
    monthGz: pillar.label,
    ju: chart.ju.ju,
    yin: chart.ju.yin,
    fuYin: chart.fuYin,
    zhiFuStar: chart.zhiFuStar,
    zhiShiDoor: chart.zhiShiDoor,
    zhiFuPalace: chart.zhiFuPalace,
    zhiShiPalace: chart.zhiShiPalace,
    cells,
  };
}

function buildBirthChart(
  birthDate?: string | null,
  birthTime?: string | null,
  _birthTimezone?: string | null,
  _birthLongitude?: number | null,
): QimenBirthChart | null {
  if (!birthDate) return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(birthDate);
  if (!match) return null;
  const civilTime = birthTime ?? "12:00";
  const [chartYear, chartMonth, chartDay] = birthDate.split("-").map(Number);
  const [hour, minute] = civilTime.split(":").map(Number);
  if (![chartYear, chartMonth, chartDay, hour, minute].every(Number.isFinite))
    return null;

  // The personal Qimen hour must be identical to BaZi: lunar-typescript receives
  // the civil birth date/time and supplies the canonical hour branch. The
  // longitude/solar-time diagnostic path is intentionally not used here.
  let hourBranch = -1;
  try {
    const eightChar = Solar.fromYmdHms(
      chartYear,
      chartMonth,
      chartDay,
      hour,
      minute,
      0,
    )
      .getLunar()
      .getEightChar();
    hourBranch = BRANCHES.indexOf(
      eightChar.getTimeZhi() as (typeof BRANCHES)[number],
    );
  } catch {
    return null;
  }
  if (hourBranch < 0) return null;

  const date = new Date(chartYear, chartMonth - 1, chartDay, hour, minute, 0);
  if (Number.isNaN(date.getTime())) return null;
  const lateZi = isLateZiClock(birthDate, civilTime);
  const chart = buildChart(date, hourBranch, lateZi);
  const calendarDate = date;
  // Дворец Судьбы: дворец НС дня рождения в небесной тарелке.
  const day = dayInfo(calendarDate);
  const destinyStem =
    day.stem === 0 ? STEMS[xunInfo(day.index).yiStem] : STEMS[day.stem];
  const destinyCell = Object.values(chart.cells).find(
    (cell: PalaceCell) => cell.heavenStem === destinyStem,
  );
  const destinyPalace = destinyCell?.palace ?? null;
  const cells = Object.values(chart.cells).map((cell: PalaceCell) => ({
    palace: cell.palace,
    isDestinyPalace: cell.palace === destinyPalace,
    direction: PALACES[cell.palace].dir,
    trigram: PALACES[cell.palace].trigram,
    earthStem: cell.earthStem,
    heavenStem: cell.heavenStem,
    hiddenHeavenStem: cell.hiddenHeavenStem,
    hiddenEarthStem: cell.hiddenEarthStem,
    star: cell.star,
    pairedStar: cell.pairedStar,
    door: cell.door,
    deity: cell.deity,
    isVoid: cell.isVoid,
  }));
  return {
    hourGz: chart.hourGz,
    ju: chart.ju.ju,
    yin: chart.ju.yin,
    fuYin: chart.fuYin,
    zhiFuStar: chart.zhiFuStar,
    zhiShiDoor: chart.zhiShiDoor,
    zhiFuPalace: chart.zhiFuPalace,
    zhiShiPalace: chart.zhiShiPalace,
    destinyPalace,
    cells,
  };
}

const ELEMENT_NAME_RU_LOWER: Record<string, string> = {
  wood: "дерево",
  fire: "огонь",
  earth: "земля",
  metal: "металл",
  water: "вода",
};


function getPeachBlossomPalace(yearBranch: number): number {
  // Обезьяна (8), Крыса (0), Дракон (4) -> Петух (Запад, дворец 7)
  if ([8, 0, 4].includes(yearBranch)) return 7;
  // Свинья (11), Кролик (3), Коза (7) -> Крыса (Север, дворец 1)
  if ([11, 3, 7].includes(yearBranch)) return 1;
  // Тигр (2), Лошадь (6), Собака (10) -> Кролик (Восток, дворец 3)
  if ([2, 6, 10].includes(yearBranch)) return 3;
  // Змея (5), Петух (9), Бык (1) -> Лошадь (Юг, дворец 9)
  if ([5, 9, 1].includes(yearBranch)) return 9;
  return -1;
}

function jadeMaidenSupportMessage(
  relation: "same" | "supports",
  structureElement: string,
  personElement: string,
): string {
  const structure = ELEMENT_NAME_RU_LOWER[structureElement] ?? structureElement;
  const person = ELEMENT_NAME_RU_LOWER[personElement] ?? personElement;
  const prefix = `Дворец структуры - стихия ${structure}. Личный дворец НС вашего года в этой часовой карте - стихия ${person}.`;
  return relation === "same"
    ? `${prefix} Для вас эта прогулка благоприятна.`
    : `${prefix} Дворец структуры поддерживает ваш личный дворец по кругу У-Син. Для вас эта прогулка благоприятна.`;
}

function threeGeneralsSupportMessage(
  relation: "same" | "supports",
  structureElement: string,
  personElement: string,
): string {
  const structure = ELEMENT_NAME_RU_LOWER[structureElement] ?? structureElement;
  const person = ELEMENT_NAME_RU_LOWER[personElement] ?? personElement;
  const prefix = `Дворец структуры - стихия ${structure}. Личный дворец НС вашего года в этой часовой карте - стихия ${person}.`;
  return relation === "same"
    ? `${prefix} Для вас эта структура благоприятна.`
    : `${prefix} Дворец структуры поддерживает ваш личный дворец по кругу У-Син. Для вас эта структура благоприятна.`;
}

function threeMysticsSupportMessage(
  relation: "same" | "supports",
  structureElement: string,
  personElement: string,
): string {
  const structure = ELEMENT_NAME_RU_LOWER[structureElement] ?? structureElement;
  const person = ELEMENT_NAME_RU_LOWER[personElement] ?? personElement;
  const basis = `Дворец структуры - стихия «${structure}». Личный дворец НС вашего года в этой часовой карте - стихия «${person}».`;
  return relation === "same"
    ? `${basis} Для вас эта активация благополучна.`
    : `${basis} Дворец структуры поддерживает ваш личный дворец по кругу У-Син, поэтому активация для вас поддерживающая.`;
}

function hourLabel(hourBranch: number, lateZi = false): string {
  if (hourBranch === 0) {
    return `час ${lateZi ? "Поздней" : "Ранней"} Крысы (${lateZi ? "23:00–00:00" : "00:00–01:00"})`;
  }
  return `час ${BRANCH_ANIMAL_RU_GEN[hourBranch]} (${BRANCH_HOUR_WINDOW[hourBranch]})`;
}

/**
 * Compute personal "Три Генерала" walk structures over a window starting at `from`.
 * Days where the user's birth-year branch 六冲-clashes the day branch are skipped.
 */
export function computeQimenStructures(opts: ComputeOptions = {}): QimenResult {
  const days = opts.days ?? 14;
  const tigerDunDays = opts.tigerDunDays ?? days;
  const from = localCalendarNoon(opts.timezone, opts.from ?? new Date());
  const hasBirthDate = !!opts.birthDate;
  const yearBranch = hasBirthDate
    ? birthYearBranch(opts.birthDate!, opts.birthTime)
    : -1;
  const yearStem = hasBirthDate
    ? birthYearStem(opts.birthDate!, opts.birthTime)
    : -1;
  const representativeYearStem = hasBirthDate
    ? birthYearRepresentativeStem(opts.birthDate!, opts.birthTime)
    : -1;

  // Джи Фу is universal (no personal/六冲 gate) and shown for the current day only.
  const jiFuWishes = computeJiFuWishes(from, 1);
  const birthChart = buildBirthChart(
    opts.birthDate,
    opts.birthTime,
    opts.birthTimezone ?? opts.timezone,
    opts.birthLongitude,
  );
  const wealthPalace = opts.birthTime
    ? birthChart?.cells.find((cell) => cell.door === "生门")?.palace
    : undefined;
  const monthChart = buildMonthChart(from);

  // «Три Мистика» — персональная домашняя активация. Карточка публикуется
  // только после проверки пользы сектора по НС года рождения пользователя.
  const threeMystics: QimenThreeMystic[] = [];
  if (hasBirthDate && yearStem >= 0) {
    const mysticsStart = new Date(
      from.getFullYear(),
      from.getMonth(),
      from.getDate(),
      12,
      0,
      0,
    );
    for (let d = 0; d < MAIDEN_DAYS; d++) {
      const date = new Date(mysticsStart);
      date.setDate(mysticsStart.getDate() + d);
      for (const slot of CHRONOLOGICAL_HOUR_SLOTS) {        // Календарный день для пользователя:
        const displayDate = date;
        // Карта Ци Мэнь: для поздней Крысы (23:00-00:00) китайские сутки наступают в 23:00 (следующий день)
        const chartDate =
          slot.branch === 0 && slot.lateZi
            ? new Date(
                date.getFullYear(),
                date.getMonth(),
                date.getDate() + 1,
                12,
                0,
                0,
              )
            : date;
        const slotDate = chartDate;
        const slotDay = dayInfo(slotDate);
        const slotDayGz = STEMS[slotDay.stem] + BRANCHES[slotDay.branch];
        for (const hit of detectThreeMystics(
          slotDate,
          slot.branch,
          slot.lateZi,
          yearStem,
          representativeYearStem,
        )) {
          const support = hit.support!;
          threeMystics.push({
            date: dayInfo(displayDate).iso,
            dayGanZhi: slotDayGz,
            hourBranch: slot.branch,
            hourLabel: hourLabel(slot.branch, slot.lateZi),
            direction: hit.direction,
            dir: PALACES[hit.palace].dir,
            dom: hit.dom,
            wonder: hit.wonder,
            wonderName: hit.wonderName,
            earthStem: hit.earthStem,
            earthStemName: STEM_NAME_RU[hit.earthStem] ?? hit.earthStem,
            goal: hit.goal,
            star: hit.star,
            starName: hit.starName,
            door: hit.door,
            doorName: DOOR_NAME_RU[hit.door] ?? hit.door,
            activation: hit.activation,
            supportRelation:
              support.relation === "same" || support.relation === "supports"
                ? support.relation
                : undefined,
            supportMessage:
              support.relation === "same" || support.relation === "supports"
                ? threeMysticsSupportMessage(
                    support.relation,
                    support.structureElement,
                    support.personElement,
                  )
                : undefined,
          });
        }
      }
    }
  }

  // Нефритовая Дева публикуется только после личной проверки пользы по НС года.
  const jadeMaidens: QimenJadeMaiden[] = [];
  if (hasBirthDate && yearStem >= 0) {
    const mStart = new Date(
      from.getFullYear(),
      from.getMonth(),
      from.getDate(),
      12,
      0,
      0,
    );
    for (let d = 0; d < MAIDEN_DAYS; d++) {
      const date = new Date(mStart);
      date.setDate(mStart.getDate() + d);
      const day = dayInfo(date);
      // Последний слот 子 относится к следующему календарному дню:
      // поздняя Крыса 23:00–00:00 завершает текущие сутки, а ранняя
      // Крыса 00:00–01:00 открывает следующие. Поэтому слот и карта
      // должны получать собственную календарную дату.
      for (const slot of CHRONOLOGICAL_HOUR_SLOTS) {        // Календарный день для пользователя:
        const displayDate = date;
        // Карта Ци Мэнь: для поздней Крысы (23:00-00:00) китайские сутки наступают в 23:00 (следующий день)
        const chartDate =
          slot.branch === 0 && slot.lateZi
            ? new Date(
                date.getFullYear(),
                date.getMonth(),
                date.getDate() + 1,
                12,
                0,
                0,
              )
            : date;
        const slotDate = chartDate;
        const slotDay = dayInfo(slotDate);
        const slotDayGz = STEMS[slotDay.stem] + BRANCHES[slotDay.branch];
        // Для прогулки действует запрет личного столкновения: если ветвь дня
        // конфликтует с ветвью года рождения, Нефритовую Деву не публикуем.
        // Например, день Тигра исключает рождённых в год Обезьяны.
        if (hasBirthDate && clashesBranch(yearBranch, slotDay.branch)) continue;
        // Ранняя и поздняя Крыса остаются отдельными временными метками;
        // карта строится по календарной дате конкретного слота.
        const h = slot.branch;
        for (const hit of detectJadeMaiden(
          slotDate,
          h,
          slot.lateZi,
          yearStem >= 0 ? yearStem : undefined,
          representativeYearStem >= 0 ? representativeYearStem : undefined,
        )) {
          // Расчет персонального резонанса для Дин + Дин + Главные Врата
          let specialNote: string | undefined = undefined;
          const resonance: string[] = [];

          const isSupreme = hit.heavenStem === "丁" && hit.earthStem === "丁" && hit.isMainGate;
          if (isSupreme) {
            specialNote = "Высшая форма структуры: Небо Дин + Земля Дин + Главные Врата. Максимальная сила женского и мужского магнетизма, флирта и обаяния. Способность очаровать нужного человека, расположить к себе на переговорах и добиться целей через личную притягательность и красоту.";

            // 1. Дворец Судьбы (DP)
            if (birthChart?.destinyPalace && hit.palace === birthChart.destinyPalace) {
              resonance.push("✨ Попадает в ваш личный Дворец Судьбы: ваша харизма, личный магнетизм и обаяние раскрываются на максимум! Используйте эту энергию, чтобы очаровать собеседника, решить важные карьерные или деловые вопросы через флирт, дипломатию и романтический шарм.");
            }

            // 2. Дом Брака (Шесть Гармоний в натальной карте)
            const marriageCell = birthChart?.cells.find((c) => c.deity === "六合");
            if (marriageCell && hit.palace === marriageCell.palace) {
              resonance.push("💍 Попадает в ваш натальный Дом Брака (Шесть Гармоний): если вы в поиске спутника жизни — обязательно используйте данную структуру для судьбоносного знакомства. Если вы в браке — пригласите на свидание свою любовь!");
            }

            // 3. Дом Семьи (Врата Отдыха в натальной карте)
            const familyCell = birthChart?.cells.find((c) => c.door === "休门");
            if (familyCell && hit.palace === familyCell.palace) {
              resonance.push("🏡 Попадает в ваш натальный Дом Семьи (Врата Отдыха): если вы в браке — обязательно устройте семейный выход в уютное кафе или душевную прогулку. Если вы ищете партнера для жизни — структура привлекает человека для надежной, счастливой семьи.");
            }

            // 4. Цветок Персика (Цветок Романтики)
            const peachPalace = getPeachBlossomPalace(yearBranch);
            if (hit.palace === peachPalace) {
              resonance.push("🌸 Сектор совпадает с вашим личным Цветком Романтики: пик романтической притягательности и сексуальности! Время для яркого флирта, свиданий и комплиментов — вы производите неизгладимое впечатление.");
            }

            // 5. Резонанс ствола года
            if ([3, 2, 5].includes(yearStem)) {
              resonance.push("🌟 Максимальный резонанс с годом рождения: Огонь Инь структуры находится в идеальном созвучии с вашей натальной энергией.");
            }
          }

          jadeMaidens.push({
            date: dayInfo(displayDate).iso,
            dayGanZhi: slotDayGz,
            hourBranch: h,
            hourLabel: hourLabel(h, slot.lateZi),
            direction: PALACES[hit.palace].dirFull,
            dir: PALACES[hit.palace].dir,
            dom: PALACES[hit.palace].dom,
            heavenStem: hit.heavenStem,
            heavenStemName: STEM_NAME_RU[hit.heavenStem] ?? "",
            earthStem: hit.earthStem,
            earthStemName: STEM_NAME_RU[hit.earthStem] ?? "",
            door: hit.door,
            doorName: DOOR_NAME_RU[hit.door] ?? "",
            isMainGate: hit.isMainGate,
            resonance: resonance.length > 0 ? resonance : undefined,
            specialNote,
            supportRelation:
              hit.support?.relation === "same" ||
              hit.support?.relation === "supports"
                ? hit.support.relation
                : undefined,
            supportMessage:
              hit.support &&
              (hit.support.relation === "same" ||
                hit.support.relation === "supports")
                ? jadeMaidenSupportMessage(
                    hit.support.relation,
                    hit.support.structureElement,
                    hit.support.personElement,
                  )
                : undefined,
          });
        }
      }
    }
  }

  const dragonsTurnHead: QimenDragonTurnsHead[] = [];
  if (hasBirthDate && yearStem >= 0) {
    const bStart = new Date(from.getFullYear(), from.getMonth(), from.getDate(), 12, 0, 0);
    for (let d = 0; d < days; d++) {
      const date = new Date(bStart);
      date.setDate(bStart.getDate() + d);
      const day = dayInfo(date);
      if (clashesBranch(yearBranch, day.branch)) continue;

      for (const slot of CHRONOLOGICAL_HOUR_SLOTS) {
        const displayDate = date;
        const chartDate =
          slot.branch === 0 && slot.lateZi
            ? new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1, 12, 0, 0)
            : date;
        const slotDate = chartDate;
        const slotDay = dayInfo(slotDate);
        if (clashesBranch(yearBranch, slotDay.branch)) continue;
        const slotDayGz = STEMS[slotDay.stem] + BRANCHES[slotDay.branch];

        for (const hit of detectDragonTurnsHead(
          slotDate,
          slot.branch,
          slot.lateZi,
          yearStem,
          representativeYearStem,
        )) {
          const support = hit.support!;
          const heavenName = hit.isLeaderJia
            ? `${STEM_NAME_RU[hit.heavenStem] ?? hit.heavenStem} (Фу-то / 甲)`
            : (STEM_NAME_RU[hit.heavenStem] ?? hit.heavenStem);

          dragonsTurnHead.push({
            date: dayInfo(displayDate).iso,
            dayGanZhi: slotDayGz,
            hourBranch: slot.branch,
            hourLabel: hourLabel(slot.branch, slot.lateZi),
            direction: hit.direction,
            dir: PALACES[hit.palace].dir,
            dom: hit.dom,
            heavenStem: hit.heavenStem,
            heavenStemName: heavenName,
            earthStem: hit.earthStem,
            earthStemName: STEM_NAME_RU[hit.earthStem] ?? hit.earthStem,
            door: hit.door,
            doorName: DOOR_NAME_RU[hit.door] ?? hit.door,
            goal: DRAGON_GOALS_BY_DOOR[hit.door] ?? "Фундаментальный долгосрочный успех и процветание во всех сферах.",
            supportRelation: support.relation as "same" | "supports",
            supportMessage: threeMysticsSupportMessage(
              support.relation as "same" | "supports",
              support.structureElement,
              support.personElement,
            ),
          });
        }
      }
    }
  }

  const birdsInNest: QimenBirdInNest[] = [];
  if (hasBirthDate && yearStem >= 0) {
    const bStart = new Date(from.getFullYear(), from.getMonth(), from.getDate(), 12, 0, 0);
    for (let d = 0; d < days; d++) {
      const date = new Date(bStart);
      date.setDate(bStart.getDate() + d);
      const day = dayInfo(date);
      if (clashesBranch(yearBranch, day.branch)) continue;

      for (const slot of CHRONOLOGICAL_HOUR_SLOTS) {
        const displayDate = date;
        const chartDate =
          slot.branch === 0 && slot.lateZi
            ? new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1, 12, 0, 0)
            : date;
        const slotDate = chartDate;
        const slotDay = dayInfo(slotDate);
        if (clashesBranch(yearBranch, slotDay.branch)) continue;
        const slotDayGz = STEMS[slotDay.stem] + BRANCHES[slotDay.branch];

        for (const hit of detectFlyingBirdFallsIntoCave(
          slotDate,
          slot.branch,
          slot.lateZi,
          yearStem,
          representativeYearStem,
        )) {
          const support = hit.support!;
          const earthName = hit.isLeaderJia
            ? `${STEM_NAME_RU[hit.earthStem] ?? hit.earthStem} (Фу-то / 甲)`
            : (STEM_NAME_RU[hit.earthStem] ?? hit.earthStem);

          birdsInNest.push({
            date: dayInfo(displayDate).iso,
            dayGanZhi: slotDayGz,
            hourBranch: slot.branch,
            hourLabel: hourLabel(slot.branch, slot.lateZi),
            direction: hit.direction,
            dir: PALACES[hit.palace].dir,
            dom: hit.dom,
            heavenStem: hit.heavenStem,
            heavenStemName: STEM_NAME_RU[hit.heavenStem] ?? hit.heavenStem,
            earthStem: hit.earthStem,
            earthStemName: earthName,
            door: hit.door,
            doorName: DOOR_NAME_RU[hit.door] ?? hit.door,
            goal: BIRD_GOALS_BY_DOOR[hit.door] ?? "Удача без усилий, решение текущих вопросов в моменте.",
            supportRelation: support.relation as "same" | "supports",
            supportMessage: threeMysticsSupportMessage(
              support.relation as "same" | "supports",
              support.structureElement,
              support.personElement,
            ),
          });
        }
      }
    }
  }

  const structures: QimenStructure[] = [];
  const fiveBattalions: QimenFiveBattalion[] = [];
  const windDuns: QimenWindDun[] = [];
  const tigerDuns: QimenTigerDun[] = [];
  const nobleHelperDoors: QimenNobleHelperDoor[] = [];
  if (!hasBirthDate || yearBranch < 0) {
    return {
      hasBirthDate,
      birthYearAnimal: null,
      windowDays: days,
      maidenWindowDays: MAIDEN_DAYS,
      structures,
      jiFuWishes,
      jadeMaidens,
      threeMystics,
      fiveBattalions,
      windDuns,
      tigerDuns,
      birdsInNest,
      dragonsTurnHead,
      nobleHelperDoors,
      threeVictories: [],
      birthChart,
      monthChart,
    };
  }

  // «Личная дверь Великого Благородного» имеет собственное окно в 2 дня
  // и не использует фильтры других структур.
  for (let d = 0; d < NOBLE_HELPER_DAYS; d++) {
    const date = new Date(from);
    date.setDate(from.getDate() + d);
    for (const slot of CHRONOLOGICAL_HOUR_SLOTS) {
      const displayDate = date;
      const chartDate =
        slot.branch === 0 && slot.lateZi
          ? new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1, 12, 0, 0)
          : date;
      const slotDate = chartDate;
      const slotDay = dayInfo(slotDate);
      const dayGanZhi = STEMS[slotDay.stem] + BRANCHES[slotDay.branch];
      for (const hit of detectNobleHelperDoor(slotDate, slot.branch, yearStem, slot.lateZi)) {
        nobleHelperDoors.push({
          date: dayInfo(displayDate).iso,
          dayGanZhi,
          hourBranch: slot.branch,
          hourLabel: hourLabel(slot.branch, slot.lateZi),
          direction: hit.direction,
          dir: PALACES[hit.palace].dir,
          dom: hit.dom,
          nobleKind: hit.kind,
          nobleBranch: hit.nobleBranch,
          heavenStem: hit.heavenStem,
          heavenStemName: STEM_NAME_RU[hit.heavenStem] ?? hit.heavenStem,
          deity: hit.deity,
          deityName: hit.deity === "太阴" ? "Великий Инь" : "Шесть Гармоний",
          goal: NOBLE_HELPER_GOALS[hit.kind],
        });
      }
    }
  }

  const start = new Date(
    from.getFullYear(),
    from.getMonth(),
    from.getDate(),
    12,
    0,
    0,
  );
  const threeGeneralsWindowEnd = new Date(start);
  threeGeneralsWindowEnd.setDate(
    threeGeneralsWindowEnd.getDate() + THREE_GENERALS_DAYS,
  );
  for (let d = 0; d < days; d++) {
    const date = new Date(start);
    date.setDate(start.getDate() + d);
    const day = dayInfo(date);
    if (clashesBranch(yearBranch, day.branch)) continue; // personal 六冲 filter
    for (const slot of CHRONOLOGICAL_HOUR_SLOTS) {        // Календарный день для пользователя:
        const displayDate = date;
        // Карта Ци Мэнь: для поздней Крысы (23:00-00:00) китайские сутки наступают в 23:00 (следующий день)
        const chartDate =
          slot.branch === 0 && slot.lateZi
            ? new Date(
                date.getFullYear(),
                date.getMonth(),
                date.getDate() + 1,
                12,
                0,
                0,
              )
            : date;
        const slotDate = chartDate;
      const slotDay = dayInfo(slotDate);
      const slotDayGz = STEMS[slotDay.stem] + BRANCHES[slotDay.branch];
      const h = slot.branch;
      if (slotDate < threeGeneralsWindowEnd) {
        for (const hit of detectThreeGenerals(
          slotDate,
          h,
          slot.lateZi,
          yearStem,
          representativeYearStem,
        )) {
          structures.push({
            date: dayInfo(displayDate).iso,
            dayGanZhi: slotDayGz,
            hourBranch: h,
            hourLabel: hourLabel(h, slot.lateZi),
            structure: hit.structure,
            structureName: STRUCTURE_NAME,
            goal: STRUCTURE_GOAL,
            direction: hit.direction,
            dom: hit.dom,
            wonder: hit.wonder,
            wonderName: hit.wonderName,
            star: hit.star,
            starName: hit.starName,
            door: hit.door,
            activation: hit.activation,
            signs: hit.signs,
            result: hit.result,
            note: hit.note,
            supportRelation:
              hit.support?.relation === "same" ||
              hit.support?.relation === "supports"
                ? hit.support.relation
                : undefined,
            supportMessage:
              hit.support &&
              (hit.support.relation === "same" ||
                hit.support.relation === "supports")
                ? threeGeneralsSupportMessage(
                    hit.support.relation,
                    hit.support.structureElement,
                    hit.support.personElement,
                  )
                : undefined,
          });
        }
      }
      if (wealthPalace !== undefined) {
        for (const hit of detectFiveBattalions(
          slotDate,
          h,
          wealthPalace,
          slot.lateZi,
        )) {
          fiveBattalions.push({
            date: dayInfo(displayDate).iso,
            dayGanZhi: slotDayGz,
            hourBranch: h,
            hourLabel: hourLabel(h, slot.lateZi),
            direction: hit.direction,
            dir: PALACES[hit.palace].dir,
            dom: hit.dom,
            heavenStem: hit.heavenStem,
            heavenStemName: STEM_NAME_RU[hit.heavenStem] ?? hit.heavenStem,
            earthStem: hit.earthStem,
            earthStemName: STEM_NAME_RU[hit.earthStem] ?? hit.earthStem,
            door: hit.door,
            doorName: DOOR_NAME_RU[hit.door] ?? hit.door,
            goal: hit.goal,
          });
        }
      }
      if (!clashesBranch(yearBranch, slotDay.branch) && yearStem >= 0) {
        for (const hit of detectWindDun(
          slotDate,
          h,
          slot.lateZi,
          yearStem,
          representativeYearStem,
        )) {
          const support = hit.support!;
          windDuns.push({
            date: dayInfo(displayDate).iso,
            dayGanZhi: slotDayGz,
            hourBranch: h,
            hourLabel: hourLabel(h, slot.lateZi),
            direction: hit.direction,
            dir: PALACES[hit.palace].dir,
            dom: hit.dom,
            heavenStem: hit.heavenStem,
            heavenStemName: STEM_NAME_RU[hit.heavenStem] ?? hit.heavenStem,
            earthStem: hit.earthStem,
            earthStemName: STEM_NAME_RU[hit.earthStem] ?? hit.earthStem,
            door: hit.door,
            doorName: DOOR_NAME_RU[hit.door] ?? hit.door,
            deity: hit.deity,
            deityName: hit.deity === "六合" ? "Шесть Гармоний" : undefined,
            goal: WIND_DUN_GOAL,
            supportRelation: support.relation as "same" | "supports",
            supportMessage: threeMysticsSupportMessage(
              support.relation as "same" | "supports",
              support.structureElement,
              support.personElement,
            ),
          });
        }
        for (const hit of detectTigerDun(
          slotDate,
          h,
          slot.lateZi,
          yearStem,
          representativeYearStem,
        )) {
          const support = hit.support!;
          tigerDuns.push({
            date: dayInfo(displayDate).iso,
            dayGanZhi: slotDayGz,
            hourBranch: h,
            hourLabel: hourLabel(h, slot.lateZi),
            direction: hit.direction,
            dir: PALACES[hit.palace].dir,
            dom: hit.dom,
            variant: hit.variant,
            heavenStem: hit.heavenStem,
            heavenStemName: STEM_NAME_RU[hit.heavenStem] ?? hit.heavenStem,
            earthStem: hit.earthStem,
            earthStemName: STEM_NAME_RU[hit.earthStem] ?? hit.earthStem,
            earthStemRequired: hit.variant === 1 || hit.variant === 3,
            door: hit.door,
            doorName: DOOR_NAME_RU[hit.door] ?? hit.door,
            star: hit.star,
            starName: GENERALS_STAR_NAME[hit.star] ?? hit.star,
            goal: TIGER_DUN_GOAL,
            supportRelation: support.relation as "same" | "supports",
            supportMessage: threeMysticsSupportMessage(
              support.relation as "same" | "supports",
              support.structureElement,
              support.personElement,
            ),
          });
        }
      }
    }
  }

  // Тигровый Дунь публикуется на отдельном месячном горизонте. Первые
  // `days` дней уже обработаны вместе с общими структурами, поэтому здесь
  // продолжаем сканирование только с первой ещё не просмотренной даты.
  if (tigerDunDays > days && yearStem >= 0) {
    for (let d = days; d < tigerDunDays; d++) {
      const date = new Date(start);
      date.setDate(start.getDate() + d);
      const day = dayInfo(date);
      if (clashesBranch(yearBranch, day.branch)) continue;

      for (const slot of CHRONOLOGICAL_HOUR_SLOTS) {        // Календарный день для пользователя:
        const displayDate = date;
        // Карта Ци Мэнь: для поздней Крысы (23:00-00:00) китайские сутки наступают в 23:00 (следующий день)
        const chartDate =
          slot.branch === 0 && slot.lateZi
            ? new Date(
                date.getFullYear(),
                date.getMonth(),
                date.getDate() + 1,
                12,
                0,
                0,
              )
            : date;
        const slotDate = chartDate;
        const slotDay = dayInfo(slotDate);
        if (clashesBranch(yearBranch, slotDay.branch)) continue;
        const slotDayGz = STEMS[slotDay.stem] + BRANCHES[slotDay.branch];

        for (const hit of detectTigerDun(
          slotDate,
          slot.branch,
          slot.lateZi,
          yearStem,
          representativeYearStem,
        )) {
          const support = hit.support!;
          tigerDuns.push({
            date: dayInfo(displayDate).iso,
            dayGanZhi: slotDayGz,
            hourBranch: slot.branch,
            hourLabel: hourLabel(slot.branch, slot.lateZi),
            direction: hit.direction,
            dir: PALACES[hit.palace].dir,
            dom: hit.dom,
            variant: hit.variant,
            heavenStem: hit.heavenStem,
            heavenStemName: STEM_NAME_RU[hit.heavenStem] ?? hit.heavenStem,
            earthStem: hit.earthStem,
            earthStemName: STEM_NAME_RU[hit.earthStem] ?? hit.earthStem,
            earthStemRequired: hit.variant === 1 || hit.variant === 3,
            door: hit.door,
            doorName: DOOR_NAME_RU[hit.door] ?? hit.door,
            star: hit.star,
            starName: GENERALS_STAR_NAME[hit.star] ?? hit.star,
            goal: TIGER_DUN_GOAL,
            supportRelation: support.relation as "same" | "supports",
            supportMessage: threeMysticsSupportMessage(
              support.relation as "same" | "supports",
              support.structureElement,
              support.personElement,
            ),
          });
        }
      }
    }
  }


// Расчет структуры «Три Победы» (三胜)
  const threeVictoryDaysHours: DayHourCheckItem[] = [];
  const monthCharts: any[] = [];
  
  if (birthChart) {
    // 1. Месячные расклады на 3 месяца вперёд (текущий + 2 следующих)
    for (let mOffset = 0; mOffset < 3; mOffset++) {
      const mDate = new Date(from.getFullYear(), from.getMonth() + mOffset, 15, 12, 0, 0);
      const mChart = buildMonthChart(mDate);
      (mChart as any).date = mDate;
      monthCharts.push(mChart);
    }

    // 2. Дни и двухчасовки с картой дня
    const tvStart = new Date(from.getFullYear(), from.getMonth(), from.getDate(), 12, 0, 0);
    for (let d = 0; d < days; d++) {
      const date = new Date(tvStart);
      date.setDate(tvStart.getDate() + d);

      // Строим суточную карту дня
      let dayPMap: Record<number, ChartPalaceInfo> = {};
      try {
        const dChart = buildDayChart(date);
        for (let p = 1; p <= 9; p++) {
          if (p === 5) continue;
          const cell = dChart.cells[p];
          if (cell) {
            dayPMap[p] = {
              palace: p,
              doorName: cell.door?.name,
              deityName: cell.deity,
              heavenStem: cell.heavenStem,
              earthStem: cell.earthStem,
              starName: cell.star?.name,
            };
          }
        }
      } catch (e) {
        console.error("Error building day chart for Three Victories:", e);
      }

      for (const slot of CHRONOLOGICAL_HOUR_SLOTS) {
        const chartDate =
          slot.branch === 0 && slot.lateZi
            ? new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1, 12, 0, 0)
            : date;
        const slotChart = buildChart(chartDate, slot.branch, slot.lateZi);
        const pMap: Record<number, ChartPalaceInfo> = {};
        for (let p = 1; p <= 9; p++) {
          if (p === 5) continue;
          const cell = slotChart.cells[p];
          pMap[p] = {
            palace: p,
            doorName: cell.door?.name,
            deityName: cell.deity,
            heavenStem: cell.heavenStem,
            earthStem: cell.earthStem,
            starName: cell.star?.name,
          };
        }
        threeVictoryDaysHours.push({
          date: chartDate,
          dateBadge: dayInfo(date).iso,
          hourLabel: hourLabel(slot.branch, slot.lateZi),
          level: "day_hour",
          levelLabel: "День + Час",
          palaces: pMap,
          dayPalaces: dayPMap,
        });
      }
    }
  }

  const threeVictories = computeThreeVictories({
    birthChart,
    monthChart,
    monthCharts,
    daysAndHours: threeVictoryDaysHours,
    now: from,
  });

  return {
    hasBirthDate,
    birthYearAnimal: BRANCH_ANIMAL_RU[yearBranch],
    windowDays: days,
    maidenWindowDays: MAIDEN_DAYS,
    structures,
    jiFuWishes,
    jadeMaidens,
    threeMystics,
    fiveBattalions,
    windDuns,
    tigerDuns,
    nobleHelperDoors,
    dragonsTurnHead,



    birdsInNest,
    threeVictories,
    birthChart,
    monthChart,
  };
}
