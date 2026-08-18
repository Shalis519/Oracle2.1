import { eq } from "drizzle-orm";
import { db, forecastTextTemplatesTable } from "@workspace/db";
import { ensureForecastTemplateSeeds } from "./runtimeSchema";

interface TransitTemplateRow {
  category: string;
  context: string;
  key: string;
  text: string;
  isActive: boolean;
}

const ASPECT_KEYS: Record<string, string> = {
  conjunction: "соединение",
  opposition: "оппозиция",
  square: "квадрат",
  trine: "тригон",
  sextile: "секстиль",
};

function displayDate(value: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  return match ? `${match[3]}.${match[2]}.${match[1]}` : value;
}

function renderTemplate(text: string, values: Record<string, string>): string {
  return text.replace(/\{([a-zA-Z0-9_]+)\}/g, (full, key: string) => values[key] ?? full);
}

function hasUnresolvedTokens(text: string): boolean {
  return /\{[a-zA-Z0-9_]+\}/.test(text);
}

async function loadRows(): Promise<TransitTemplateRow[]> {
  await ensureForecastTemplateSeeds();
  return db.select({
    category: forecastTextTemplatesTable.category,
    context: forecastTextTemplatesTable.context,
    key: forecastTextTemplatesTable.key,
    text: forecastTextTemplatesTable.text,
    isActive: forecastTextTemplatesTable.isActive,
  }).from(forecastTextTemplatesTable).where(eq(forecastTextTemplatesTable.isActive, true));
}

export async function renderLongTermTransit(
  technicalLine: string,
  transitBodyKey: string,
  aspectKey: string,
  natalBodyKey: string,
  startDate: string,
  endDate: string,
  transitHouse: string,
  natalHouse: string,
): Promise<string | null> {
  if (!ASPECT_KEYS[aspectKey] || !["uranus", "neptune", "pluto"].includes(transitBodyKey)) return null;
  const rows = await loadRows();
  const key = `${transitBodyKey}:${aspectKey}:${natalBodyKey}`;
  const row = rows.find((item) => item.isActive && item.category === "long_term_transit" && item.context === "major_aspect" && item.key === key && item.text.trim() && item.text.trim() !== "В разработке");
  if (!row) return null;
  const rendered = renderTemplate(row.text, {
    technicalLine,
    startDate: displayDate(startDate),
    endDate: displayDate(endDate),
    transitHouse,
    natalHouse,
    aspectName: ASPECT_KEYS[aspectKey],
  });
  return hasUnresolvedTokens(rendered) ? null : rendered.trim();
}
