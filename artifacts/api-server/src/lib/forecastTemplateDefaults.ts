export interface ForecastTemplateDefault {
  category: string;
  context: string;
  key: string;
  title: string;
  text: string;
}

export const FORECAST_TEMPLATE_DEFAULTS: ForecastTemplateDefault[] = [
  {
    category: "entity",
    context: "transit",
    key: "mercury",
    title: "Меркурий в транзитном контексте",
    text: "Вашему мышлению, речи и способам обмена информацией",
  },
  {
    category: "entity",
    context: "natal",
    key: "chiron",
    title: "Хирон в натальном контексте",
    text: "чувствительности к оценке, необходимости соединить разные стороны опыта и поиску выхода из внутреннего противоречия",
  },
  {
    category: "aspect",
    context: "square",
    key: "default",
    title: "Квадрат",
    text: "создаёт напряжение между двумя способами реагировать и требует найти более устойчивый способ их согласовать",
  },
  {
    category: "house",
    context: "transit",
    key: "1",
    title: "Транзитная планета в 1-м доме",
    text: "личными желаниями, самовыражением и готовностью заявлять о себе",
  },
  {
    category: "house",
    context: "natal",
    key: "10",
    title: "Натальная планета в 10-м доме",
    text: "карьерой, статусом, профессиональными целями и общественной оценкой",
  },
  {
    category: "composition",
    context: "square",
    key: "default",
    title: "Сборка напряжённого аспекта",
    text: "Транзит усиливает внимание к {transitEntity}. Эта активность связана с {transitHouse}. Квадрат к натальному {natalPlanet} затрагивает {natalEntity}; {aspectMeaning}. В натальном доме тема связана с {natalHouse}.",
  },
];

export function forecastTemplateKey(category: string, context: string, key: string): string {
  return `${category}:${context}:${key}`;
}

export const FORECAST_TEMPLATE_DEFAULTS_BY_KEY = new Map(
  FORECAST_TEMPLATE_DEFAULTS.map((row) => [forecastTemplateKey(row.category, row.context, row.key), row]),
);
