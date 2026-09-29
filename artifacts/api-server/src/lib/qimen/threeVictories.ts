import { QimenThreeVictory, QimenBirthChart, QimenMonthChart } from "@workspace/api-spec";
import { PALACE_NAMES, STARS } from "./constants";
import { currentTerm, nextTerm } from "./calendar";

// Названия секторов и направлений по дворцам (1..9)
const PALACE_DIRECTIONS: Record<number, { sector: string; direction: string }> = {
  1: { sector: "Север (Кань 1)", direction: "север" },
  2: { sector: "Юго-Запад (Кунь 2)", direction: "юго-запад" },
  3: { sector: "Восток (Чжэнь 3)", direction: "восток" },
  4: { sector: "Юго-Восток (Сюнь 4)", direction: "юго-восток" },
  5: { sector: "Центр (5)", direction: "центр" },
  6: { sector: "Северо-Запад (Цянь 6)", direction: "северо-запад" },
  7: { sector: "Запад (Дуй 7)", direction: "запад" },
  8: { sector: "Северо-Восток (Гэнь 8)", direction: "северо-восток" },
  9: { sector: "Юг (Ли 9)", direction: "юг" },
};

// Базовая звезда каждого земного дворца
const PALACE_BASE_STAR_NAME: Record<number, string> = {
  1: "天蓬",
  2: "天芮",
  3: "天冲",
  4: "天辅",
  5: "天禽",
  6: "天心",
  7: "天柱",
  8: "天任",
  9: "天英",
};

// Исходный домашний дворец звезды
const STAR_ORIGINAL_PALACE: Record<string, number> = {
  "天蓬": 1,
  "天芮": 2,
  "天禽": 2, // Тянь Цинь базируется в Кунь 2
  "天冲": 3,
  "天辅": 4,
  "天心": 6,
  "天柱": 7,
  "天任": 8,
  "天英": 9,
};

export interface ChartPalaceInfo {
  palace: number;
  doorName?: string;
  deityName?: string;
  heavenStem?: string;
  earthStem?: string;
  starName?: string;
}

export interface DayHourCheckItem {
  date: Date;
  dateBadge: string;
  hourLabel: string;
  level: "month_day" | "day_hour";
  levelLabel: string;
  palaces: Record<number, ChartPalaceInfo>;
}

export function computeThreeVictories(params: {
  birthChart: QimenBirthChart | null;
  monthChart: QimenMonthChart;
  daysAndHours?: DayHourCheckItem[];
  now?: Date;
}): QimenThreeVictory[] {
  const { birthChart, monthChart, daysAndHours = [], now = new Date() } = params;
  if (!birthChart) {
    return [];
  }

  const destinyPalace = birthChart.destinyPalace;
  const destinyInfo = PALACE_DIRECTIONS[destinyPalace] || { sector: `Дворец ${destinyPalace}`, direction: "своему дворцу" };

  // 1. Находим в натальной карте ключевые точки:
  let zhiFuPalace = 0;
  let shengMenPalace = 0;
  let jiuTianPalace = 0;
  const starPositionsInBirth: Record<string, number> = {};

  const birthCells = birthChart.cells || (birthChart as any).palaces || {};
  for (const [pStr, pData] of Object.entries(birthCells) as [string, any][]) {
    const p = Number(pStr);
    if (pData.deity === "值符" || (pData.deity && pData.deity.includes("值符"))) {
      zhiFuPalace = p;
    }
    if (pData.deity === "九天" || (pData.deity && pData.deity.includes("九天"))) {
      jiuTianPalace = p;
    }
    const door = pData.door?.name || "";
    if (door.includes("生")) {
      shengMenPalace = p;
    }
    const star = pData.star?.name || "";
    if (star) {
      starPositionsInBirth[star] = p;
    }
  }

  // Сектор Божественного Света:
  // Базовая звезда дворца Главного Духа натала -> куда она перелетела в натале
  const baseStarOfZhiFuPalace = PALACE_BASE_STAR_NAME[zhiFuPalace];
  const divineLightPalace = (baseStarOfZhiFuPalace && starPositionsInBirth[baseStarOfZhiFuPalace]) || zhiFuPalace;

  // Исходный базовый дом той звезды, которая стоит во дворце Главного Духа в натале:
  const starInZhiFuPalace = (birthCells[zhiFuPalace]?.star?.name || "");
  const baseHomeOfZhiFuStar = STAR_ORIGINAL_PALACE[starInZhiFuPalace] || zhiFuPalace;

  const results: QimenThreeVictory[] = [];

  // Вспомогательная функция проверки дворца на операторы
  function evaluatePalace(
    targetPalace: number,
    palaceData: ChartPalaceInfo,
    level: "month" | "month_day" | "day_hour",
    levelLabel: string,
    date: Date,
    dateBadge: string,
    hourLabel: string,
    uniqueSuffix: string
  ) {
    if (targetPalace <= 0 || targetPalace === 5) return;
    if (!palaceData) return;

    const door = palaceData.doorName || "";
    const deity = palaceData.deityName || "";
    const hStem = palaceData.heavenStem || "";
    const eStem = palaceData.earthStem || "";

    const dLower = (palaceData.doorName || "").toLowerCase();
    const deityLower = (palaceData.deityName || "").toLowerCase();
    const h = (palaceData.heavenStem || "");
    const e = (palaceData.earthStem || "");

    const hasShengMen = dLower.includes("生") || dLower.includes("рожд") || dLower.includes("жизн");
    const hasJiuTian = deityLower.includes("九天") || deityLower.includes("девят") || deityLower.includes("небес");
    const hasZhiFu = deityLower.includes("值符") || deityLower.includes("главн") || deityLower.includes("чжи фу");
    const isBirdInNest = (h === "丙" || h === "Bing") && (e === "戊" || e === "Wu" || e === "甲" || e === "Jia");

    const targetInfo = PALACE_DIRECTIONS[targetPalace] || { sector: `Дворец ${targetPalace}`, direction: "сектор" };

    // 1. Сектор Божественного Света
    if (targetPalace === divineLightPalace && hasShengMen && hasJiuTian) {
      results.push({
        id: `tv_divine_light_${targetPalace}_${uniqueSuffix}`,
        level,
        levelLabel,
        badge: "В ваш сектор Божественного Света прилетели Врата Рождения + Дух 9 Небес",
        targetSectorName: targetInfo.sector,
        targetPalace,
        direction: targetInfo.direction,
        date: date.toISOString(),
        dateBadge,
        hourLabel,
        instruction: `Сначала зайдите и разместитесь в указанном секторе Божественного Света (${targetInfo.sector}), и уже находясь внутри этого сектора, повернитесь спиной в сторону своего Дворца Судьбы (${destinyInfo.sector}). Сформулируйте намерение и обратитесь к Высшим Силам.`,
        door: "Врата Рождения (生门)",
        deity: "Дух Девять Небес (九天)",
        isBirdInNest,
        goal: "Обращение к Высшим Силам, материализация намерений, мощный прорыв и исполнение задуманного",
      });
      return;
    }

    // 2. Сектор Главного Духа натала
    if (targetPalace === zhiFuPalace && hasShengMen && hasJiuTian) {
      results.push({
        id: `tv_zhifu_${targetPalace}_${uniqueSuffix}`,
        level,
        levelLabel,
        badge: "В ваш сектор Главного Духа прилетели Врата Рождения + Дух 9 Небес",
        targetSectorName: targetInfo.sector,
        targetPalace,
        direction: targetInfo.direction,
        date: date.toISOString(),
        dateBadge,
        hourLabel,
        instruction: `Разместитесь в секторе ${targetInfo.sector} спиной к стене этого сектора, сформулируйте намерение и обратитесь к Высшим Силам.`,
        door: "Врата Рождения (生门)",
        deity: "Дух Девять Небес (九天)",
        isBirdInNest,
        goal: "Обращение к Высшим Силам, материализация намерений, мощный прорыв и исполнение задуманного",
      });
      return;
    }

    // 3. Исходный базовый дом звезды Главного Духа
    if (targetPalace === baseHomeOfZhiFuStar && hasShengMen && hasJiuTian) {
      results.push({
        id: `tv_base_star_${targetPalace}_${uniqueSuffix}`,
        level,
        levelLabel,
        badge: "В сектор базового дома звезды Главного Духа прилетели Врата Рождения + Дух 9 Небес",
        targetSectorName: targetInfo.sector,
        targetPalace,
        direction: targetInfo.direction,
        date: date.toISOString(),
        dateBadge,
        hourLabel,
        instruction: `Разместитесь в секторе ${targetInfo.sector} спиной к стене этого сектора, сформулируйте намерение и обратитесь к Высшим Силам.`,
        door: "Врата Рождения (生门)",
        deity: "Дух Девять Небес (九天)",
        isBirdInNest,
        goal: "Обращение к Высшим Силам, материализация намерений, мощный прорыв и исполнение задуманного",
      });
      return;
    }

    // 4. Сектор Врат Рождения натала
    if (targetPalace === shengMenPalace && hasJiuTian && hasZhiFu) {
      results.push({
        id: `tv_birth_door_${targetPalace}_${uniqueSuffix}`,
        level,
        levelLabel,
        badge: "В ваш сектор Врат Рождения прилетели Дух 9 Небес + Главный Дух",
        targetSectorName: targetInfo.sector,
        targetPalace,
        direction: targetInfo.direction,
        date: date.toISOString(),
        dateBadge,
        hourLabel,
        instruction: `Разместитесь в секторе ${targetInfo.sector} спиной к стене этого сектора, сформулируйте намерение и обратитесь к Высшим Силам.`,
        door: "Врата Рождения (生门)",
        deity: "Дух Девять Небес + Главный Дух",
        isBirdInNest,
        goal: "Обращение к Высшим Силам, материализация намерений, мощный прорыв и исполнение задуманного",
      });
      return;
    }

    // 5. Сектор Девяти Небес натала
    if (targetPalace === jiuTianPalace && hasShengMen && hasZhiFu) {
      results.push({
        id: `tv_jiutian_${targetPalace}_${uniqueSuffix}`,
        level,
        levelLabel,
        badge: "В ваш сектор Девяти Небес прилетели Врата Рождения + Главный Дух",
        targetSectorName: targetInfo.sector,
        targetPalace,
        direction: targetInfo.direction,
        date: date.toISOString(),
        dateBadge,
        hourLabel,
        instruction: `Разместитесь в секторе ${targetInfo.sector} спиной к стене этого сектора, сформулируйте намерение и обратитесь к Высшим Силам.`,
        door: "Врата Рождения (生门)",
        deity: "Главный Дух (值符)",
        isBirdInNest,
        goal: "Обращение к Высшим Силам, материализация намерений, мощный прорыв и исполнение задуманного",
      });
      return;
    }

    // 6. Дворец Судьбы
    if (targetPalace === destinyPalace && hasShengMen && (hasJiuTian || hasZhiFu)) {
      const activeDeity = hasJiuTian ? "Дух Девять Небес (九天)" : "Главный Дух (值符)";
      results.push({
        id: `tv_destiny_${targetPalace}_${uniqueSuffix}`,
        level,
        levelLabel,
        badge: `В ваш Дворец Судьбы прилетели Врата Рождения + ${hasJiuTian ? "Дух 9 Небес" : "Главный Дух"}`,
        targetSectorName: targetInfo.sector,
        targetPalace,
        direction: targetInfo.direction,
        date: date.toISOString(),
        dateBadge,
        hourLabel,
        instruction: `Разместитесь в секторе ${targetInfo.sector} спиной к стене этого сектора, сформулируйте намерение и обратитесь к Высшим Силам.`,
        door: "Врата Рождения (生门)",
        deity: activeDeity,
        isBirdInNest,
        goal: "Обращение к Высшим Силам, материализация намерений, мощный прорыв и исполнение задуманного",
      });
      return;
    }
  }

  // --- А. Проверяем месячный расклад ---
  // Месяц показывается весь текущий солнечный период
  const mDate = new Date(monthChart.date || now);
  const curJie = currentTerm(mDate);
  const nxtJie = nextTerm(mDate);

  const startDayStr = curJie ? `${curJie.date.getDate()} ${getMonthGenitive(curJie.date.getMonth())}` : "";
  const endDayStr = nxtJie ? `${nxtJie.date.getDate()} ${getMonthGenitive(nxtJie.date.getMonth())}` : "";
  const monthDateBadge = (startDayStr && endDayStr) ? `с ${startDayStr} по ${endDayStr}` : "в течение месяца";

  const mCells = monthChart.cells || (monthChart as any).palaces || {};
  for (const [pStr, pData] of Object.entries(mCells) as [string, any][]) {
    const p = Number(pStr);
    const pInfo: ChartPalaceInfo = {
      palace: p,
      doorName: pData.door?.name,
      deityName: pData.deity,
      heavenStem: pData.heavenStem,
      earthStem: pData.earthStem,
      starName: pData.star?.name,
    };
    evaluatePalace(
      p,
      pInfo,
      "month",
      "Месячная структура",
      mDate,
      monthDateBadge,
      "в течение всего месяца",
      `month_${mDate.getFullYear()}_${mDate.getMonth()}`
    );
  }

  // --- Б. Проверяем дневные и двухчасовые события ---
  const threeDaysMs = 3 * 86400 * 1000;
  for (const item of daysAndHours) {
    const itemTime = item.date.getTime();
    const diff = itemTime - now.getTime();
    // Показываем за 3 дня до начала и до окончания (допустим +2 часа)
    if (diff <= threeDaysMs && diff >= -7200 * 1000) {
      for (const [p, pInfo] of Object.entries(item.palaces)) {
        evaluatePalace(
          Number(p),
          pInfo,
          item.level,
          item.levelLabel,
          item.date,
          item.dateBadge,
          item.hourLabel,
          `dh_${item.date.getTime()}`
        );
      }
    }
  }

  return results;
}

function getMonthGenitive(monthIndex: number): string {
  const months = [
    "января", "февраля", "марта", "апреля", "мая", "июня",
    "июля", "августа", "сентября", "октября", "ноября", "декабря"
  ];
  return months[monthIndex] || "";
}
