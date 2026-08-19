import { eq } from "drizzle-orm";
import { db, forecastTextTemplatesTable } from "@workspace/db";
import type { NatalChart } from "./astrology";
import { ensureForecastTemplateSeeds } from "./runtimeSchema";
import { splitMoneyCardText } from "./moneyTextFormatting";

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
    source: "Деньги в натальной карте";
    includedHouses: number[];
    note: string;
  };
};

type MoneyStudioRow = {
  context: string;
  key: string;
  title: string;
  text: string;
};

const MONEY_HOUSES = [2, 5, 8, 11] as const;
const HOUSE_ROMAN: Record<number, string> = { 2: "II", 5: "V", 8: "VIII", 11: "XI" };
const ROMAN_HOUSE: Record<string, number> = { II: 2, V: 5, VIII: 8, XI: 11 };
const RULER_BODIES: Record<string, string[]> = {
  aries: ["mars"], taurus: ["venus"], gemini: ["mercury"], cancer: ["moon"],
  leo: ["sun"], virgo: ["mercury"], libra: ["venus"], scorpio: ["pluto"],
  sagittarius: ["jupiter"], capricorn: ["saturn"], aquarius: ["saturn", "uranus"],
  pisces: ["jupiter", "neptune"],
};

function houseSign(chart: NatalChart, house: number): string | undefined {
  return chart.houses.find((item) => item.number === house)?.signKey;
}

function bodyHouse(chart: NatalChart, bodyKey: string): number | undefined {
  return chart.bodies.find((item) => item.key === bodyKey)?.house ?? undefined;
}

function parentHouse(row: MoneyStudioRow): number | null {
  if (row.context === "house") {
    return Number(row.key.split(":").pop()) || null;
  }
  if (row.context === "house-sign") {
    const house = Number(row.key.split(":")[1]);
    return Number.isFinite(house) ? house : null;
  }
  if (row.context === "planet-house") {
    return Number(row.key.split(":").pop()) || null;
  }
  const rulerMatch = row.key.match(/^ruler-house:(II|V|VIII|XI):/);
  if (rulerMatch) return ROMAN_HOUSE[rulerMatch[1]] ?? null;
  return null;
}

function sectionOrder(row: MoneyStudioRow): number {
  if (row.context.startsWith("ruler-house-")) return 0;
  if (row.context === "house") return 1;
  if (row.context === "house-sign") return 2;
  if (row.context === "planet-house") return 3;
  return 9;
}

async function loadMoneyStudioRows(): Promise<MoneyStudioRow[]> {
  await ensureForecastTemplateSeeds();
  return db
    .select({
      context: forecastTextTemplatesTable.context,
      key: forecastTextTemplatesTable.key,
      title: forecastTextTemplatesTable.title,
      text: forecastTextTemplatesTable.text,
    })
    .from(forecastTextTemplatesTable)
    .where(eq(forecastTextTemplatesTable.category, "money"))
    .then((rows) => rows.filter((row) => row.text.trim() && row.text.trim() !== "В разработке"));
}

function activeKeys(chart: NatalChart): Set<string> {
  const keys = new Set<string>();
  for (const house of MONEY_HOUSES) {
    keys.add(`house:${house}`);
    const sign = houseSign(chart, house);
    if (house === 2 && sign) keys.add(`house-sign:2:${sign}`);
    for (const body of chart.bodies) {
      if ((house === 2 || house === 8) && body.house === house) {
        keys.add(`planet-house:${body.key}:${house}`);
      }
    }
    const rulers = RULER_BODIES[sign ?? ""] ?? [];
    const context = `ruler-house-${house === 2 ? "II" : house === 5 ? "V" : house === 8 ? "VIII" : "XI"}`;
    for (const ruler of rulers) {
      const rulerPosition = bodyHouse(chart, ruler);
      if (rulerPosition) keys.add(`ruler-house:${house === 2 ? "II" : house === 5 ? "V" : house === 8 ? "VIII" : "XI"}:${rulerPosition}`);
    }
    void context;
  }
  return keys;
}

export async function computeMoneyFormula(chart: NatalChart): Promise<MoneyFormulaResult> {
  const [rows, keys] = await Promise.all([loadMoneyStudioRows(), Promise.resolve(activeKeys(chart))]);
  const activeRows = rows.filter((row) => keys.has(row.key));
  const sections = MONEY_HOUSES.flatMap((house) => {
    const group = activeRows
      .filter((row) => parentHouse(row) === house)
      .sort((a, b) => sectionOrder(a) - sectionOrder(b));
    if (group.length === 0) return [];

    const base = group.find((row) => row.context === "house");
    const paragraphs = group.flatMap((row) => {
      const textParagraphs = splitMoneyCardText(row.text);
      if (row === base) return textParagraphs;
      return [`${row.title}:\n${textParagraphs.join("\n")}`];
    });

    return [{
      key: `house:${house}`,
      title: base?.title ?? `${house}-й дом`,
      paragraphs,
    }];
  });

  return {
    formula: "money",
    formulaLabel: "Денежные дома",
    title: "Денежные дома вашей натальной карты",
    sections,
    methodology: {
      houseSystem: "Placidus",
      source: "Деньги в натальной карте",
      includedHouses: [...MONEY_HOUSES],
      note: "Расчёт определяет активные показатели натальной карты, а интерпретации подбираются из карточек Oracle Studio, перенесённых из полного PDF «Деньги в натальной карте». Образец Ильи используется только для порядка и оформления результата.",
    },
  };
}
