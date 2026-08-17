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
    key: "jupiter",
    title: "Юпитер в транзитном контексте",
    text: "расширению возможностей, росту, поиску смысла и уверенности в своих силах",
  },
  {
    category: "entity",
    context: "transit",
    key: "moon",
    title: "Луна в транзитном контексте",
    text: "эмоциональной реакции, внутренним переживаниям и кратким изменениям настроения",
  },
  {
    category: "entity",
    context: "natal",
    key: "pluto",
    title: "Плутон в натальном контексте",
    text: "глубоким внутренним реакциям, сильной вовлечённости и стремлению сохранять контроль",
  },
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
    category: "aspect",
    context: "conjunction",
    key: "default",
    title: "Соединение",
    text: "усиливает их совместное проявление и делает внутреннюю реакцию заметнее",
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
    context: "transit",
    key: "5",
    title: "Транзитная планета в 5-м доме",
    text: "творчеством, удовольствиями, любовью, развлечениями, детьми, спортом и конкурсами",
  },
  {
    category: "house",
    context: "natal",
    key: "5",
    title: "Натальная планета в 5-м доме",
    text: "творчеством, удовольствиями, любовью, развлечениями, детьми, спортом и конкурсами",
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
  {
    category: "composition",
    context: "conjunction",
    key: "default",
    title: "Сборка соединения Луны с Плутоном",
    text: "Эмоциональная реакция может стать интенсивнее, а внутренние переживания — заметнее в темах, связанных с {natalHouse}. Краткий лунный транзит может подсветить сильное желание проявить себя, получить отклик или сохранить контроль над ситуацией. Постарайтесь сначала понять, что именно вызвало реакцию, и только потом действовать.",
  },
];

export function forecastTemplateKey(category: string, context: string, key: string): string {
  return `${category}:${context}:${key}`;
}

export const FORECAST_TEMPLATE_DEFAULTS_BY_KEY = new Map(
  FORECAST_TEMPLATE_DEFAULTS.map((row) => [forecastTemplateKey(row.category, row.context, row.key), row]),
);
