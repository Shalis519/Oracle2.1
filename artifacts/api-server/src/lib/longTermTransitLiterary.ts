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

const SLOW_BODY_THEMES: Record<string, string> = {
  uranus:
    "перемен, свободы, нестандартных решений и необходимости обновить привычный порядок",
  neptune:
    "тонкого восприятия, идеализации, интуиции и проверки границ между впечатлением и фактом",
  pluto:
    "глубокой перестройки, контроля, освобождения от прежних моделей и изменения отношения к силе",
};

const NATAL_BODY_THEMES: Record<string, string> = {
  sun: "самооценки, воли и личного направления",
  moon: "эмоциональных потребностей, безопасности и привычных реакций",
  mercury: "мышления, речи, обучения и обмена информацией",
  venus: "отношений, ценностей и способов строить обмен с людьми",
  mars: "действий, инициативы, защиты интересов и распределения энергии",
  jupiter: "убеждений, роста, обучения и поиска смысла",
  saturn: "ответственности, границ, обязательств и долгосрочных целей",
  uranus: "свободы, перемен и права действовать по-своему",
  neptune: "идеалов, доверия, интуиции и эмоциональной восприимчивости",
  pluto: "контроля, кризисов, силы и глубокой внутренней трансформации",
};

const ASPECT_MEANINGS: Record<string, string> = {
  conjunction:
    "Соединение усиливает общую тему двух факторов и делает её заметнее в повседневных решениях.",
  opposition:
    "Оппозиция проявляет тему через полярность: собственная позиция может сталкиваться с противоположным взглядом, человеком или обстоятельством.",
  square:
    "Квадрат создаёт напряжение между двумя способами реагировать и требует найти более устойчивый способ их согласовать.",
  trine:
    "Тригон облегчает проявление качеств обеих планет и создаёт условия для естественного развития темы.",
  sextile:
    "Секстиль открывает возможность соединить качества обеих планет через собственное действие и внимательное использование обстоятельств.",
};

function fallbackLiteraryText(
  technicalLine: string,
  transitBodyKey: string,
  aspectKey: string,
  natalBodyKey: string,
): string {
  const transitTheme =
    SLOW_BODY_THEMES[transitBodyKey] ??
    "постепенных изменений и перестройки привычных реакций";
  const natalTheme =
    NATAL_BODY_THEMES[natalBodyKey] ??
    "личной реакции, решений и способов взаимодействия с миром";
  const aspectMeaning =
    ASPECT_MEANINGS[aspectKey] ??
    "Аспект делает взаимодействие двух факторов заметнее и предлагает наблюдать за его проявлениями без фатальных выводов.";
  return `${technicalLine}\n\nПсихологически этот период может сделать заметнее темы ${transitTheme}, связанные с натальной сферой ${natalTheme}. ${aspectMeaning} Событийно тема может проявляться в областях, указанных в технической строке, но не является гарантированным событием. Практическая задача периода — замечать повторяющиеся реакции, проверять решения фактами и постепенно выстраивать более устойчивый способ действовать.`;
}

function displayDate(value: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  return match ? `${match[3]}.${match[2]}.${match[1]}` : value;
}

function renderTemplate(text: string, values: Record<string, string>): string {
  return text.replace(
    /\{([a-zA-Z0-9_]+)\}/g,
    (full, key: string) => values[key] ?? full,
  );
}

function hasUnresolvedTokens(text: string): boolean {
  return /\{[a-zA-Z0-9_]+\}/.test(text);
}

async function loadRows(): Promise<TransitTemplateRow[]> {
  await ensureForecastTemplateSeeds();
  return db
    .select({
      category: forecastTextTemplatesTable.category,
      context: forecastTextTemplatesTable.context,
      key: forecastTextTemplatesTable.key,
      text: forecastTextTemplatesTable.text,
      isActive: forecastTextTemplatesTable.isActive,
    })
    .from(forecastTextTemplatesTable)
    .where(eq(forecastTextTemplatesTable.isActive, true));
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
  if (
    !ASPECT_KEYS[aspectKey] ||
    !["sun", "moon", "mercury", "venus", "mars", "jupiter", "saturn", "uranus", "neptune", "pluto"].includes(transitBodyKey)
  )
    return null;
  const rows = await loadRows();
  const key = `${transitBodyKey}:${aspectKey}:${natalBodyKey}`;
  const row = rows.find(
    (item) =>
      item.isActive &&
      item.category === "long_term_transit" &&
      item.context === "major_aspect" &&
      item.key === key &&
      item.text.trim() &&
      item.text.trim() !== "В разработке",
  );
  if (!row) return "В разработке";
  const rendered = renderTemplate(row.text, {
    technicalLine,
    startDate: displayDate(startDate),
    endDate: displayDate(endDate),
    transitHouse,
    natalHouse,
    aspectName: ASPECT_KEYS[aspectKey],
  });
  return hasUnresolvedTokens(rendered) ? "В разработке" : rendered.trim();
}
