import type { NatalChart } from "./astrology";
import { activeMoneyCards, hasCompleteIlyaSet } from "./moneyCards";

export type MoneySection = {
  key: string;
  title: string;
  paragraphs: string[];
};

export type MoneyFormulaResult = {
  formula: "money";
  formulaLabel: string;
  title: string;
  sections: MoneySection[];
  methodology: {
    houseSystem: "Placidus";
    source: "Денежные дома";
    includedHouses: number[];
    note: string;
  };
};

const HOUSE_ROMAN: Record<number, string> = { 2: "II", 5: "V", 8: "VIII", 11: "XI" };
const SIGN_LOCATIVE: Record<string, string> = {
  aries: "Овне", taurus: "Тельце", gemini: "Близнецах", cancer: "Раке",
  leo: "Льве", virgo: "Деве", libra: "Весах", scorpio: "Скорпионе",
  sagittarius: "Стрельце", capricorn: "Козероге", aquarius: "Водолее", pisces: "Рыбах",
};
const BODY_NAMES: Record<string, string> = {
  sun: "Солнце", moon: "Луна", mercury: "Меркурий", venus: "Венера", mars: "Марс",
  jupiter: "Юпитер", saturn: "Сатурн", uranus: "Уран", neptune: "Нептун", pluto: "Плутон",
};

function houseTitle(chart: NatalChart, house: number): string {
  const item = chart.houses.find((entry) => entry.number === house);
  return `${HOUSE_ROMAN[house]} дом в ${SIGN_LOCATIVE[item?.signKey ?? ""] ?? item?.sign ?? "неопределённом знаке"}`;
}

function titleForCard(chart: NatalChart, card: ReturnType<typeof activeMoneyCards>[number]): string {
  if (card.kind === "house") return houseTitle(chart, card.house);
  return card.title;
}

export function computeMoneyFormula(chart: NatalChart): MoneyFormulaResult {
  const cards = activeMoneyCards(chart);
  const sections: MoneySection[] = [];
  const seenHouses = new Set<number>();

  for (const card of cards) {
    if (card.kind === "house") {
      seenHouses.add(card.house);
    }
    sections.push({
      key: card.key,
      title: titleForCard(chart, card),
      paragraphs: card.paragraphs,
    });
  }

  // The source has an итоговый текст only for the complete example set.
  // Never synthesize a new итоговый текст from partial indicators.
  if (hasCompleteIlyaSet(chart)) {
    sections.push({
      key: "summary:ilya-complete",
      title: "Итог",
      paragraphs: [
        "Ваш денежный потенциал связан с сочетанием трех основных направлений: системной и официальной работы, семейно-имущественных вопросов и образования либо международной деятельности.",
        "Наиболее подходящая финансовая стратегия: действовать последовательно, вести учет, планировать накопления, внимательно работать с документами и постепенно создавать устойчивую материальную базу. Дополнительные возможности могут открываться через недвижимость, семейные проекты, обучение, путешествия, творческие направления и работу с коллективами.",
        "В денежных вопросах важно сохранять ясность, не принимать решения только под влиянием эмоций и тщательно проверять финансовые предложения, особенно если они кажутся слишком легкими или быстро доходными. Обязательно иметь подушку безопасности.",
      ],
    });
  }

  return {
    formula: "money",
    formulaLabel: "Денежные дома",
    title: "Денежные дома вашей натальной карты",
    sections,
    methodology: {
      houseSystem: "Placidus",
      source: "Денежные дома",
      includedHouses: [2, 5, 8, 11],
      note: `Расчёт определяет активные показатели карты, а тексты подбираются из библиотеки файла «Денежные дома». Активные денежные дома: ${[...seenHouses].sort((a, b) => a - b).map((house) => HOUSE_ROMAN[house]).join(", ") || "нет карточек"}.`,
    },
  };
}

export function getBodyHouseLabel(chart: NatalChart, bodyKey: string): string {
  const body = chart.bodies.find((item) => item.key === bodyKey);
  if (!body?.house) return `${BODY_NAMES[bodyKey] ?? bodyKey} в доме не определён.`;
  return `${BODY_NAMES[bodyKey] ?? bodyKey} находится в ${HOUSE_ROMAN[body.house] ?? body.house} доме.`;
}
