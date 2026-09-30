import { currentTerm, nextTerm } from "./calendar";

export type VictoryLevel = "month" | "month_day" | "day_hour";

export interface VictoryComponent {
  name: string;
  source: "month" | "day" | "hour";
}

export interface QimenThreeVictory {
  id: string;
  level: VictoryLevel;
  levelLabel: string;
  badge: string;
  targetSectorName: string;
  targetPalace: number;
  direction: string;
  date: string;
  dateBadge: string;
  hourLabel: string;
  instruction: string;
  door: string;
  deity: string;
  isBirdInNest: boolean;
  goal: string;
  variantCode?: "B1" | "B2" | "B3" | "B4" | "B5" | "B6";
  variantName?: string;
}

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
  dayPalaces?: Record<number, ChartPalaceInfo>;
}

export interface PalaceChartInfo extends ChartPalaceInfo {}

export const PALACE_DIRECTIONS: Record<number, { sector: string; direction: string }> = {
  1: { sector: "Север (Кань 坎)", direction: "Север" },
  2: { sector: "Юго-Запад (Кунь 坤)", direction: "Юго-Запад" },
  3: { sector: "Восток (Чжэнь 震)", direction: "Восток" },
  4: { sector: "Юго-Восток (Сюнь 巽)", direction: "Юго-Восток" },
  6: { sector: "Северо-Запад (Цянь 乾)", direction: "Северо-Запад" },
  7: { sector: "Запад (Дуй 兑)", direction: "Запад" },
  8: { sector: "Северо-Восток (Гэнь 艮)", direction: "Северо-Восток" },
  9: { sector: "Юг (Ли 离)", direction: "Юг" },
};

export const PALACE_BASE_STAR_NAME: Record<number, string> = {
  1: "天蓬", // Тянь Пэн (Север)
  2: "天芮", // Тянь Жуй (Юго-Запад)
  3: "天冲", // Тянь Чун (Восток)
  4: "天辅", // Тянь Фу (Юго-Восток)
  6: "天心", // Тянь Синь (Северо-Запад)
  7: "天柱", // Тянь Чжу (Запад)
  8: "天任", // Тянь Жэнь (Северо-Восток)
  9: "天英", // Тянь Ин (Юг)
};

export const STAR_ORIGINAL_PALACE: Record<string, number> = {
  "天蓬": 1,
  "天芮": 2,
  "天禽": 2,
  "天冲": 3,
  "天辅": 4,
  "天心": 6,
  "天柱": 7,
  "天任": 8,
  "天英": 9,
};

function normalizeName(val: any): string {
  if (!val) return "";
  if (typeof val === "string") return val;
  if (typeof val === "object" && val.name) return String(val.name);
  return "";
}

function checkHasShengMen(doorName: string): boolean {
  const d = doorName.toLowerCase();
  return d.includes("生") || d.includes("рожд") || d.includes("жизн");
}

function checkHasJiuTian(deityName: string): boolean {
  const d = deityName.toLowerCase();
  return d.includes("九天") || d.includes("девят") || d.includes("небес");
}

function checkHasZhiFu(deityName: string): boolean {
  const d = deityName.toLowerCase();
  return d.includes("值符") || d.includes("главн") || d.includes("чжи фу");
}

function checkBirdInNest(hStem?: string, eStem?: string): boolean {
  const h = hStem || "";
  const e = eStem || "";
  return (h === "丙" || h === "Bing") && (e === "戊" || e === "Wu" || e === "甲" || e === "Jia");
}

export function computeThreeVictories(params: {
  birthChart: any;
  monthChart?: any;
  monthCharts?: any[];
  daysAndHours?: DayHourCheckItem[];
  now?: Date;
}): QimenThreeVictory[] {
  const { birthChart, monthChart, monthCharts = [], daysAndHours = [], now = new Date() } = params;
  if (!birthChart) {
    return [];
  }

  const allMonths = monthCharts.length > 0 ? monthCharts : (monthChart ? [monthChart] : []);
  const destinyPalace = birthChart.destinyPalace || 0;
  const destinyInfo = PALACE_DIRECTIONS[destinyPalace] || { sector: `Дворец ${destinyPalace}`, direction: "своему дворцу" };

  let zhiFuPalace = 0;
  let shengMenPalace = 0;
  let jiuTianPalace = 0;
  const starPositionsInBirth: Record<string, number> = {};
  const palaceStarInBirth: Record<number, string> = {};

  const rawBirthCells = birthChart.cells || birthChart.palaces || [];
  const birthList: any[] = Array.isArray(rawBirthCells) ? rawBirthCells : Object.values(rawBirthCells);

  for (const cell of birthList) {
    const p = Number(cell.palace);
    if (!p) continue;
    const deity = normalizeName(cell.deity);
    const door = normalizeName(cell.door);
    const star = normalizeName(cell.star);

    if (checkHasZhiFu(deity)) {
      zhiFuPalace = p;
    }
    if (checkHasJiuTian(deity)) {
      jiuTianPalace = p;
    }
    if (checkHasShengMen(door)) {
      shengMenPalace = p;
    }
    if (star) {
      starPositionsInBirth[star] = p;
      palaceStarInBirth[p] = star;
    }
  }

  // В1: Сектор Божественного Света
  const baseStarOfZhiFuPalace = PALACE_BASE_STAR_NAME[zhiFuPalace];
  const divineLightPalace = (baseStarOfZhiFuPalace && starPositionsInBirth[baseStarOfZhiFuPalace]) || zhiFuPalace;

  // В3: Родное положение звезды рядом с Главным Духом в натале
  const starInZhiFuPalace = palaceStarInBirth[zhiFuPalace] || "";
  const baseHomeOfZhiFuStar = STAR_ORIGINAL_PALACE[starInZhiFuPalace] || zhiFuPalace;

  const results: QimenThreeVictory[] = [];
  const addedKeys = new Set<string>();

  function addVictory(v: QimenThreeVictory) {
    const key = `${v.variantCode}_${v.level}_${v.targetPalace}_${v.dateBadge}_${v.hourLabel}`;
    if (!addedKeys.has(key)) {
      addedKeys.add(key);
      results.push(v);
    }
  }

  // Определение целей и инструкций для 6 вариантов (В1 - В6)
  const variantsConfig = [
    {
      code: "B1" as const,
      name: "Вариант 1 — Божественный Свет",
      targetPalace: divineLightPalace,
      requiredDoor: "shengMen",
      requiredDeity: "jiuTian",
      badgeText: "Врата Жизни + Дух 9 Небес",
      doorLabel: "Врата Жизни (生门)",
      deityLabel: "Дух Девять Небес (九天)",
      instruction: (targetSector: string) =>
        `Выполняется в секторе Божественного Света (${targetSector}) спиной к своему Дворцу Рождения (${destinyInfo.sector}). Зайдите в этот сектор, повернитесь спиной к Дворцу Судьбы, сформулируйте намерение и обратитесь к Высшим Силам.`,
      goal: "Обращение к Высшим Силам, материализация намерений, мощный прорыв и исполнение задуманного (самый сильный вариант)",
    },
    {
      code: "B2" as const,
      name: "Вариант 2 — Сектор Главного Духа",
      targetPalace: zhiFuPalace,
      requiredDoor: "shengMen",
      requiredDeity: "jiuTian",
      badgeText: "Врата Жизни + Дух 9 Небес",
      doorLabel: "Врата Жизни (生门)",
      deityLabel: "Дух Девять Небес (九天)",
      instruction: (targetSector: string) =>
        `Разместитесь в секторе Главного Духа натала (${targetSector}). Спиной к Дворцу Судьбы можно вставать, можно не вставать. Сформулируйте намерение и обратитесь к Высшим Силам.`,
      goal: "Прямая связь с Главным Духом натала, стратегическая защита и материализация планов",
    },
    {
      code: "B3" as const,
      name: "Вариант 3 — Родной дом Звезды Главного Духа",
      targetPalace: baseHomeOfZhiFuStar,
      requiredDoor: "shengMen",
      requiredDeity: "jiuTian",
      badgeText: "Врата Жизни + Дух 9 Небес",
      doorLabel: "Врата Жизни (生门)",
      deityLabel: "Дух Девять Небес (九天)",
      instruction: (targetSector: string) =>
        `Разместитесь в секторе родного дома Звезды Главного Духа (${targetSector}) спиной к стене этого сектора, сформулируйте намерение и обратитесь к Высшим Силам.`,
      goal: "Активация природной силы ведущей звезды карты, получение мощного ресурса и поддержки",
    },
    {
      code: "B4" as const,
      name: "Вариант 4 — Сектор Врат Рождения",
      targetPalace: shengMenPalace,
      requiredDoor: "shengMen",
      requiredDeity: "both_jiuTian_zhiFu",
      badgeText: "Дух 9 Небес + Главный Дух",
      doorLabel: "Врата Жизни (生门)",
      deityLabel: "Дух Девять Небес + Главный Дух",
      instruction: (targetSector: string) =>
        `Разместитесь в секторе Врат Жизни натала (${targetSector}) спиной к стене сектора, сформулируйте финансовые или жизненные цели и обратитесь к Высшим Силам.`,
      goal: "Финансовый прорыв, открытие денежных каналов, приток прибыли и материальный рост",
    },
    {
      code: "B5" as const,
      name: "Вариант 5 — Сектор Девяти Небес",
      targetPalace: jiuTianPalace,
      requiredDoor: "shengMen",
      requiredDeity: "zhiFu",
      badgeText: "Врата Жизни + Главный Дух",
      doorLabel: "Врата Жизни (生门)",
      deityLabel: "Главный Дух (值符)",
      instruction: (targetSector: string) =>
        `Разместитесь в секторе Духа Девяти Небес натала (${targetSector}) спиной к стене сектора, обратитесь к Высшим Силам для стремительного взлёта и реализации замыслов.`,
      goal: "Стремительный карьерный и социальный взлёт, поддержка в высоких инстанциях",
    },
    {
      code: "B6" as const,
      name: "Вариант 6 — Дворец Судьбы",
      targetPalace: destinyPalace,
      requiredDoor: "shengMen",
      requiredDeity: "either_jiuTian_zhiFu",
      badgeText: "Врата Жизни + Дух 9 Небес / Главный Дух",
      doorLabel: "Врата Жизни (生门)",
      deityLabel: "Дух Девять Небес / Главный Дух",
      instruction: (targetSector: string) =>
        `Разместитесь в секторе своего Дворца Судьбы (${targetSector}) спиной к стене сектора. Находитесь в покое и гармонии, концентрируясь на желаемом результате.`,
      goal: "Личная гармонизация, базовая защита и энергетическая поддержка судьбы",
    },
  ];

  // Helper для извлечения ячеек из структуры месяца/дня
  function extractPalaceMap(chart: any): Record<number, ChartPalaceInfo> {
    const map: Record<number, ChartPalaceInfo> = {};
    if (!chart) return map;
    const rawCells = chart.cells || chart.palaces || [];
    const list: any[] = Array.isArray(rawCells) ? rawCells : Object.values(rawCells);
    for (const cell of list) {
      const p = Number(cell.palace);
      if (!p || p === 5) continue;
      map[p] = {
        palace: p,
        doorName: normalizeName(cell.door),
        deityName: normalizeName(cell.deity),
        heavenStem: cell.heavenStem || "",
        earthStem: cell.earthStem || "",
        starName: normalizeName(cell.star),
      };
    }
    return map;
  }

  // --- 1. ПРОВЕРКА УРОВНЯ "МЕСЯЦ" (на 3 месяца вперёд) ---
  for (const mChart of allMonths) {
    const mDate = new Date(mChart.date || now);
    const curJie = currentTerm(mDate);
    const nxtJie = nextTerm(mDate);
    const startDayStr = curJie ? `${curJie.date.getDate()} ${getMonthGenitive(curJie.date.getMonth())}` : "";
    const endDayStr = nxtJie ? `${nxtJie.date.getDate()} ${getMonthGenitive(nxtJie.date.getMonth())}` : "";
    const monthDateBadge = (startDayStr && endDayStr) ? `с ${startDayStr} по ${endDayStr}` : `${getMonthName(mDate.getMonth())} ${mDate.getFullYear()}`;

    const mMap = extractPalaceMap(mChart);

    for (const cfg of variantsConfig) {
      const p = cfg.targetPalace;
      if (!p || p === 5) continue;
      const cell = mMap[p];
      if (!cell) continue;

      const hasSheng = checkHasShengMen(cell.doorName || "");
      const hasJiu = checkHasJiuTian(cell.deityName || "");
      const hasZhi = checkHasZhiFu(cell.deityName || "");
      const isBird = checkBirdInNest(cell.heavenStem, cell.earthStem);

      let matched = false;
      let activeDeityLabel = cfg.deityLabel;

      // КРИТИЧЕСКОЕ ПРАВИЛО: В целевом дворце (targetPalace) карты периода
      // ОБЯЗАТЕЛЬНО должны стоять Врата Жизни (生门). Если в targetPalace стоят
      // другие врата (Смерть, Ранение, Открытие и т.д.) — структура НЕ формируется.
      if (!hasSheng) continue;

      if (cfg.code === "B1" || cfg.code === "B2" || cfg.code === "B3") {
        matched = hasSheng && hasJiu;
      } else if (cfg.code === "B4") {
        matched = hasSheng && ((hasJiu && hasZhi) || hasJiu || hasZhi);
      } else if (cfg.code === "B5") {
        matched = hasSheng && hasZhi;
      } else if (cfg.code === "B6") {
        matched = hasSheng && (hasJiu || hasZhi);
        activeDeityLabel = hasJiu ? "Дух Девять Небес (九天)" : "Главный Дух (值符)";
      }

      if (matched) {
        const targetInfo = PALACE_DIRECTIONS[p] || { sector: `Дворец ${p}`, direction: "сектор" };
        addVictory({
          id: `tv_${cfg.code.toLowerCase()}_month_${p}_${mDate.getFullYear()}_${mDate.getMonth()}`,
          level: "month",
          levelLabel: "Месячная структура",
          badge: `${cfg.name}: ${cfg.badgeText}`,
          targetSectorName: targetInfo.sector,
          targetPalace: p,
          direction: targetInfo.direction,
          date: mDate.toISOString(),
          dateBadge: monthDateBadge,
          hourLabel: "в течение всего месяца",
          instruction: cfg.instruction(targetInfo.sector),
          door: cfg.doorLabel,
          deity: activeDeityLabel,
          isBirdInNest: isBird,
          goal: cfg.goal,
          variantCode: cfg.code,
          variantName: cfg.name,
        });
      }
    }
  }

  // --- 2. ПРОВЕРКА УРОВНЕЙ "МЕСЯЦ + ДЕНЬ" И "ДЕНЬ + ЧАС" ---
  const currentMonthMap = allMonths.length > 0 ? extractPalaceMap(allMonths[0]) : {};

  for (const item of daysAndHours) {
    const itemDate = new Date(item.date);
    const dayMap = item.dayPalaces || {};
    const hourMap = item.palaces || {};

    for (const cfg of variantsConfig) {
      const p = cfg.targetPalace;
      if (!p || p === 5) continue;
      const targetInfo = PALACE_DIRECTIONS[p] || { sector: `Дворец ${p}`, direction: "сектор" };

      // А. Проверка в пределах часа (когда в самом часе сошлись оба оператора)
      const hCell = hourMap[p];
      if (hCell) {
        const hasSheng = checkHasShengMen(hCell.doorName || "");
        const hasJiu = checkHasJiuTian(hCell.deityName || "");
        const hasZhi = checkHasZhiFu(hCell.deityName || "");
        const isBird = checkBirdInNest(hCell.heavenStem, hCell.earthStem);

        let hourMatched = false;

        // КРИТИЧЕСКОЕ ПРАВИЛО: В целевом дворце карты ЧАСА обязательно Врата Жизни (生门).
        if (!hasSheng) {
          hourMatched = false;
        } else if (cfg.code === "B1" || cfg.code === "B2" || cfg.code === "B3") {
          hourMatched = hasJiu;
        } else if (cfg.code === "B4") {
          hourMatched = hasJiu || hasZhi;
        } else if (cfg.code === "B5") {
          hourMatched = hasZhi;
        } else if (cfg.code === "B6") {
          hourMatched = hasJiu || hasZhi;
        }

        if (hourMatched) {
          addVictory({
            id: `tv_${cfg.code.toLowerCase()}_hour_${p}_${itemDate.getTime()}`,
            level: "day_hour",
            levelLabel: "День + Час",
            badge: `${cfg.name}: ${cfg.badgeText}`,
            targetSectorName: targetInfo.sector,
            targetPalace: p,
            direction: targetInfo.direction,
            date: itemDate.toISOString(),
            dateBadge: item.dateBadge,
            hourLabel: item.hourLabel,
            instruction: cfg.instruction(targetInfo.sector),
            door: cfg.doorLabel,
            deity: cfg.deityLabel,
            isBirdInNest: isBird,
            goal: cfg.goal,
            variantCode: cfg.code,
            variantName: cfg.name,
          });
        }
      }

      // Б. Синхронизация "День + Час": один оператор в Дне, второй в Часе
      const dCell = dayMap[p];
      if (dCell && hCell) {
        const dSheng = checkHasShengMen(dCell.doorName || "");
        const dJiu = checkHasJiuTian(dCell.deityName || "");
        const dZhi = checkHasZhiFu(dCell.deityName || "");

        const hSheng = checkHasShengMen(hCell.doorName || "");
        const hJiu = checkHasJiuTian(hCell.deityName || "");
        const hZhi = checkHasZhiFu(hCell.deityName || "");

        let comboMatched = false;
        let badgeDesc = "";

        // КРИТИЧЕСКОЕ ПРАВИЛО: Врата Жизни (生门) ОБЯЗАТЕЛЬНО должны стоять
        // в целевом дворце карты ЧАСА (оперативная карта периода), где
        // активируется структура. Без них в варианте структура не формируется.
        const shengOk = hSheng;

        if (!shengOk) {
          comboMatched = false;
        } else if (cfg.code === "B1" || cfg.code === "B2" || cfg.code === "B3") {
          if (hJiu) {
            comboMatched = true;
            badgeDesc = "Врата Жизни (Час) + 9 Небес (Час)";
          } else if (dSheng && hJiu) {
            comboMatched = true;
            badgeDesc = "Врата Жизни (День) + 9 Небес (Час)";
          }
        } else if (cfg.code === "B4") {
          // Требуются Духи в целевом дворце + Врата Жизни в карте часа.
          if (hJiu && hZhi) {
            comboMatched = true;
            badgeDesc = "Врата Жизни (Час) + 9 Небес и Главный Дух (Час)";
          } else if (dJiu && hZhi) {
            comboMatched = true;
            badgeDesc = "9 Небес (День) + Главный Дух (Час)";
          } else if (dZhi && hJiu) {
            comboMatched = true;
            badgeDesc = "Главный Дух (День) + 9 Небес (Час)";
          }
        } else if (cfg.code === "B5") {
          if (hZhi) {
            comboMatched = true;
            badgeDesc = "Врата Жизни (Час) + Главный Дух (Час)";
          } else if (dSheng && hZhi) {
            comboMatched = true;
            badgeDesc = "Врата Жизни (День) + Главный Дух (Час)";
          } else if (dZhi && hSheng) {
            comboMatched = true;
            badgeDesc = "Главный Дух (День) + Врата Жизни (Час)";
          }
        } else if (cfg.code === "B6") {
          if (hJiu || hZhi) {
            comboMatched = true;
            badgeDesc = `Врата Жизни (Час) + ${hJiu ? "9 Небес" : "Главный Дух"} (Час)`;
          } else if (dSheng && (hJiu || hZhi)) {
            comboMatched = true;
            badgeDesc = `Врата Жизни (День) + ${hJiu ? "9 Небес" : "Главный Дух"} (Час)`;
          } else if ((dJiu || dZhi) && hSheng) {
            comboMatched = true;
            badgeDesc = `${dJiu ? "9 Небес" : "Главный Дух"} (День) + Врата Жизни (Час)`;
          }
        }

        if (comboMatched) {
          const isBird = checkBirdInNest(hCell.heavenStem, hCell.earthStem) || checkBirdInNest(dCell.heavenStem, dCell.earthStem);
          addVictory({
            id: `tv_${cfg.code.toLowerCase()}_dhcombo_${p}_${itemDate.getTime()}`,
            level: "day_hour",
            levelLabel: "День + Час",
            badge: `${cfg.name}: ${badgeDesc}`,
            targetSectorName: targetInfo.sector,
            targetPalace: p,
            direction: targetInfo.direction,
            date: itemDate.toISOString(),
            dateBadge: item.dateBadge,
            hourLabel: item.hourLabel,
            instruction: cfg.instruction(targetInfo.sector),
            door: cfg.doorLabel,
            deity: cfg.deityLabel,
            isBirdInNest: isBird,
            goal: cfg.goal,
            variantCode: cfg.code,
            variantName: cfg.name,
          });
        }
      }

      // В. Синхронизация "Месяц + День": один оператор в Месяце, второй в Дне
      const mCell = currentMonthMap[p];
      if (mCell && dCell) {
        const mSheng = checkHasShengMen(mCell.doorName || "");
        const mJiu = checkHasJiuTian(mCell.deityName || "");
        const mZhi = checkHasZhiFu(mCell.deityName || "");

        const dSheng = checkHasShengMen(dCell.doorName || "");
        const dJiu = checkHasJiuTian(dCell.deityName || "");
        const dZhi = checkHasZhiFu(dCell.deityName || "");

        let monthDayMatched = false;
        let mdBadge = "";

        // КРИТИЧЕСКОЕ ПРАВИЛО: Врата Жизни (生门) ОБЯЗАТЕЛЬНО должны стоять
        // в целевом дворце карты МЕСЯЦА (оперативная карта периода для
        // уровня month_day). Без них структура не формируется.
        const shengOk = mSheng;

        if (!shengOk) {
          monthDayMatched = false;
        } else if (cfg.code === "B1" || cfg.code === "B2" || cfg.code === "B3") {
          if (mJiu) {
            monthDayMatched = true;
            mdBadge = "Врата Жизни (Месяц) + 9 Небес (Месяц)";
          } else if (mSheng && dJiu) {
            monthDayMatched = true;
            mdBadge = "Врата Жизни (Месяц) + 9 Небес (День)";
          }
        } else if (cfg.code === "B4") {
          if (mJiu && mZhi) {
            monthDayMatched = true;
            mdBadge = "Врата Жизни (Месяц) + 9 Небес и Главный Дух (Месяц)";
          } else if (mJiu && dZhi) {
            monthDayMatched = true;
            mdBadge = "9 Небес (Месяц) + Главный Дух (День)";
          } else if (mZhi && dJiu) {
            monthDayMatched = true;
            mdBadge = "Главный Дух (Месяц) + 9 Небес (День)";
          }
        } else if (cfg.code === "B5") {
          if (mZhi) {
            monthDayMatched = true;
            mdBadge = "Врата Жизни (Месяц) + Главный Дух (Месяц)";
          } else if (mSheng && dZhi) {
            monthDayMatched = true;
            mdBadge = "Врата Жизни (Месяц) + Главный Дух (День)";
          } else if (mZhi && dSheng) {
            monthDayMatched = true;
            mdBadge = "Главный Дух (Месяц) + Врата Жизни (День)";
          }
        } else if (cfg.code === "B6") {
          if (mJiu || mZhi) {
            monthDayMatched = true;
            mdBadge = `Врата Жизни (Месяц) + ${mJiu ? "9 Небес" : "Главный Дух"} (Месяц)`;
          } else if (mSheng && (dJiu || dZhi)) {
            monthDayMatched = true;
            mdBadge = `Врата Жизни (Месяц) + ${dJiu ? "9 Небес" : "Главный Дух"} (День)`;
          } else if ((mJiu || mZhi) && dSheng) {
            monthDayMatched = true;
            mdBadge = `${mJiu ? "9 Небес" : "Главный Дух"} (Месяц) + Врата Жизни (День)`;
          }
        }

        if (monthDayMatched) {
          const isBird = checkBirdInNest(dCell.heavenStem, dCell.earthStem);
          addVictory({
            id: `tv_${cfg.code.toLowerCase()}_monthday_${p}_${itemDate.getTime()}`,
            level: "month_day",
            levelLabel: "Месяц + День",
            badge: `${cfg.name}: ${mdBadge}`,
            targetSectorName: targetInfo.sector,
            targetPalace: p,
            direction: targetInfo.direction,
            date: itemDate.toISOString(),
            dateBadge: item.dateBadge,
            hourLabel: "в течение всего дня",
            instruction: cfg.instruction(targetInfo.sector),
            door: cfg.doorLabel,
            deity: cfg.deityLabel,
            isBirdInNest: isBird,
            goal: cfg.goal,
            variantCode: cfg.code,
            variantName: cfg.name,
          });
        }
      }
    }
  }

  return results;
}

function getMonthName(monthIndex: number): string {
  const months = [
    "Январь", "Февраль", "Март", "Апрель", "Май", "Июнь",
    "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"
  ];
  return months[monthIndex] || "";
}

function getMonthGenitive(monthIndex: number): string {
  const months = [
    "января", "февраля", "марта", "апреля", "мая", "июня",
    "июля", "августа", "сентября", "октября", "ноября", "декабря"
  ];
  return months[monthIndex] || "";
}
