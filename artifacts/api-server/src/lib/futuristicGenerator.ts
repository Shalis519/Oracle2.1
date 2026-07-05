import { logger } from "./logger";
import {
  getEntity,
  getEntityThemes,
  findRelation,
  type EntityRelation,
  type EntityProfile,
} from "./semanticEngine";

export interface TransitContext {
  planet: string;
  sign: string;
  house: number;
  aspect: string;
  aspectPlanet?: string;
  orb: number;
  currentDate: Date;
  motivationPhrase?: string;
}

/** Astrological daily motion in degrees/day (approximate mean values). */
const ASTROLOGICAL_SPEED: Record<string, number> = {
  "Луна": 13.2,
  "Меркурий": 1.2,
  "Венера": 1.0,
  "Марс": 0.52,
  "Юпитер": 0.08,
  "Сатурн": 0.03,
  "Уран": 0.01,
  "Нептун": 0.006,
  "Плутон": 0.004,
  "Солнце": 1.0,
};

export interface TransitDuration {
  duration: number;
  unit: "hours" | "days" | "weeks" | "months";
  text: string;
  urgency: "срочно" | "скоро" | "в ближайшее время" | "постепенно" | "длительно";
  peakDate: Date;
}

export function calculateTransitDuration(
  planet: string,
  orb: number,
  currentDate: Date = new Date(),
): TransitDuration {
  const speed = ASTROLOGICAL_SPEED[planet] ?? 0.5;
  const orbDegrees = Math.abs(orb);
  const totalDays = orbDegrees / speed;

  let duration: number;
  let unit: "hours" | "days" | "weeks" | "months";
  let text: string;
  let urgency: TransitDuration["urgency"];

  if (totalDays < 1) {
    duration = Math.max(1, Math.round(totalDays * 24));
    unit = "hours";
    text = `${duration} ${declension(duration, ["час", "часа", "часов"])}`;
    urgency = "срочно";
  } else if (totalDays < 7) {
    duration = Math.round(totalDays);
    unit = "days";
    text = `${duration} ${declension(duration, ["день", "дня", "дней"])}`;
    urgency = "скоро";
  } else if (totalDays < 30) {
    duration = Math.max(1, Math.round(totalDays / 7));
    unit = "weeks";
    text = `${duration} ${declension(duration, ["неделю", "недели", "недель"])}`;
    urgency = "в ближайшее время";
  } else {
    duration = Math.max(1, Math.round(totalDays / 30));
    unit = "months";
    text = `${duration} ${declension(duration, ["месяца", "месяцев", "месяцев"])}`;
    urgency = "постепенно";
  }

  const peakDate = new Date(currentDate);
  const halfDurationMs = (totalDays / 2) * 24 * 60 * 60 * 1000;
  peakDate.setTime(peakDate.getTime() + halfDurationMs);

  return { duration, unit, text, urgency, peakDate };
}

function getDayPart(hours: number): string {
  if (hours >= 5 && hours <= 11) return "в первой половине дня";
  if (hours >= 12 && hours <= 16) return "во второй половине дня";
  if (hours >= 17 && hours <= 20) return "вечером";
  return "ночью";
}

function declension(count: number, forms: [string, string, string]): string {
  const n = Math.abs(count) % 100;
  const n1 = n % 10;
  if (n > 10 && n < 20) return forms[2];
  if (n1 > 1 && n1 < 5) return forms[1];
  if (n1 === 1) return forms[0];
  return forms[2];
}

/**
 * Полная система склонения тем во все 6 падежей.
 * Падежи: nominative (именительный), genitive (родительный),
 * dative (дательный), accusative (винительный), instrumental (творительный),
 * prepositional (предложный).
 */
function declineTheme(
  theme: string,
  caseName: "nominative" | "genitive" | "dative" | "accusative" | "instrumental" | "prepositional" = "nominative",
): string {
  if (caseName === "nominative") return theme;

  const map: Record<string, Record<string, string>> = {
    genitive: {
      "Учёба": "учёбы",
      "Любовь": "любви",
      "Творчество": "творчества",
      "Общение": "общения",
      "Свобода": "свободы",
      "Гармония": "гармонии",
      "Красота": "красоты",
      "Отношения": "отношений",
      "Деньги": "денег",
      "Карьера": "карьеры",
      "Здоровье": "здоровья",
      "Духовность": "духовности",
      "Интеллект": "интеллекта",
      "Соседи": "соседей",
      "Братья и сёстры": "братьев и сестёр",
      "Короткие путешествия": "коротких путешествий",
      "Семья": "семьи",
      "Борьба": "борьбы",
      "Путешествия": "путешествий",
      "Перемены": "перемен",
      "Инновации": "инноваций",
      "Будущее": "будущего",
      "Независимость": "независимости",
      "Технологии": "технологий",
    },
    dative: {
      "Учёба": "учёбе",
      "Любовь": "любви",
      "Творчество": "творчеству",
      "Общение": "общению",
      "Свобода": "свободе",
      "Гармония": "гармонии",
      "Красота": "красоте",
      "Отношения": "отношениям",
      "Деньги": "деньгам",
      "Карьера": "карьере",
      "Здоровье": "здоровью",
      "Духовность": "духовности",
      "Интеллект": "интеллекту",
      "Соседи": "соседям",
      "Братья и сёстры": "братьям и сёстрам",
      "Короткие путешествия": "коротким путешествиям",
      "Семья": "семье",
      "Борьба": "борьбе",
      "Путешествия": "путешествиям",
      "Перемены": "переменам",
      "Инновации": "инновациям",
      "Будущее": "будущему",
      "Независимость": "независимости",
      "Технологии": "технологиям",
    },
    accusative: {
      "Учёба": "учёбу",
      "Любовь": "любовь",
      "Творчество": "творчество",
      "Общение": "общение",
      "Свобода": "свободу",
      "Гармония": "гармонию",
      "Красота": "красоту",
      "Отношения": "отношения",
      "Деньги": "деньги",
      "Карьера": "карьеру",
      "Здоровье": "здоровье",
      "Духовность": "духовность",
      "Интеллект": "интеллект",
      "Соседи": "соседей",
      "Братья и сёстры": "братьев и сестёр",
      "Короткие путешествия": "короткие путешествия",
      "Семья": "семью",
      "Борьба": "борьбу",
      "Путешествия": "путешествия",
      "Перемены": "перемены",
      "Инновации": "инновации",
      "Будущее": "будущее",
      "Независимость": "независимость",
      "Технологии": "технологии",
    },
    instrumental: {
      "Учёба": "учёбой",
      "Любовь": "любовью",
      "Творчество": "творчеством",
      "Общение": "общением",
      "Свобода": "свободой",
      "Гармония": "гармонией",
      "Красота": "красотой",
      "Отношения": "отношениями",
      "Деньги": "деньгами",
      "Карьера": "карьерой",
      "Здоровье": "здоровьем",
      "Духовность": "духовностью",
      "Интеллект": "интеллектом",
      "Соседи": "соседями",
      "Братья и сёстры": "братьями и сёстрами",
      "Короткие путешествия": "короткими путешествиями",
      "Семья": "семьёй",
      "Борьба": "борьбой",
      "Путешествия": "путешествиями",
      "Перемены": "переменами",
      "Инновации": "инновациями",
      "Будущее": "будущим",
      "Независимость": "независимостью",
      "Технологии": "технологиями",
    },
    prepositional: {
      "Учёба": "учёбе",
      "Любовь": "любви",
      "Творчество": "творчестве",
      "Общение": "общении",
      "Свобода": "свободе",
      "Гармония": "гармонии",
      "Красота": "красоте",
      "Отношения": "отношениях",
      "Деньги": "деньгах",
      "Карьера": "карьере",
      "Здоровье": "здоровье",
      "Духовность": "духовности",
      "Интеллект": "интеллекте",
      "Соседи": "соседях",
      "Братья и сёстры": "братьях и сёстрах",
      "Короткие путешествия": "коротких путешествиях",
      "Семья": "семье",
      "Борьба": "борьбе",
      "Путешествия": "путешествиях",
      "Перемены": "переменах",
      "Инновации": "инновациях",
      "Будущее": "будущем",
      "Независимость": "независимости",
      "Технологии": "технологиях",
    },
  };

  return map[caseName]?.[theme] || theme;
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

/** Aspect weight modifier: harmonious aspects amplify, tense aspects dampen. */
function getAspectModifier(aspect: string): number {
  const modifiers: Record<string, number> = {
    "тригон": 1.3,
    "секстиль": 1.2,
    "соединение": 1.1,
    "квадрат": 0.7,
    "оппозиция": 0.6,
    "квинконс": 0.5,
    "полуквадрат": 0.8,
    "полусекстиль": 0.9,
  };
  return modifiers[aspect.toLowerCase()] ?? 1.0;
}

/** Aspect polarity drives forecast tonal flavour. */
function getAspectPolarity(aspect: string): "positive" | "negative" | "neutral" {
  const polarities: Record<string, "positive" | "negative" | "neutral"> = {
    "тригон": "positive",
    "секстиль": "positive",
    "соединение": "neutral",
    "квадрат": "negative",
    "оппозиция": "negative",
    "квинконс": "negative",
    "полуквадрат": "negative",
    "полусекстиль": "positive",
  };
  return polarities[aspect.toLowerCase()] ?? "neutral";
}

/** Weighted theme intersection across planet, house, sign, aspect. Returns top-3. */
function resolveThemes(
  planet: string,
  sign: string,
  house: number,
  aspect: string,
): { primary: string; secondary: string; tertiary: string; all: string[]; aspectModifier: number; aspectPolarity: "positive" | "negative" | "neutral" } | null {
  const planetThemes = getEntityThemes(planet);
  const signThemes = getEntityThemes(sign);
  const houseThemes = getEntityThemes(String(house));

  if (planetThemes.length === 0) {
    return null;
  }

  const aspectModifier = getAspectModifier(aspect);
  const aspectPolarity = getAspectPolarity(aspect);

  const scoreMap = new Map<string, number>();

  for (const t of planetThemes) {
    scoreMap.set(t.themeName, (scoreMap.get(t.themeName) ?? 0) + t.weight * 1.0 * aspectModifier);
  }
  for (const t of signThemes) {
    scoreMap.set(t.themeName, (scoreMap.get(t.themeName) ?? 0) + t.weight * 0.5 * aspectModifier);
  }
  for (const t of houseThemes) {
    scoreMap.set(t.themeName, (scoreMap.get(t.themeName) ?? 0) + t.weight * 0.7 * aspectModifier);
  }

  const scored = Array.from(scoreMap.entries())
    .sort((a, b) => b[1] - a[1]);

  if (scored.length === 0) return null;

  const all = scored.map(([name]) => name);

  return {
    primary: scored[0][0],
    secondary: scored[1]?.[0] ?? scored[0][0],
    tertiary: scored[2]?.[0] ?? scored[1]?.[0] ?? scored[0][0],
    all,
    aspectModifier,
    aspectPolarity,
  };
}

/** Конкретные actionable советы по жизненным темам. */
const ADVICE_BY_THEME: Record<string, string[]> = {
  "Общение": [
    "Напишите важное сообщение, которое откладывали.",
    "Позвоните близкому человеку, с которым давно не общались.",
    "Обсудите свою идею с коллегой или другом.",
    "Ответьте на письмо, которое требует внимания.",
  ],
  "Учёба": [
    "Начните читать книгу по новой для Вас теме.",
    "Запишитесь на короткий курс или вебинар.",
    "Посмотрите лекцию по интересующей Вас теме.",
    "Выделите 30 минут для изучения чего-то нового.",
  ],
  "Интеллект": [
    "Решите задачку, которая требует нестандартного подхода.",
    "Запишите свою мысль — она может оказаться важной.",
    "Прочитайте статью вне своей обычной зоны интересов.",
    "Обсудите идею с человеком, который смотрит на мир иначе.",
  ],
  "Соседи": [
    "Обратите внимание на то, что говорят вокруг — там может быть подсказка.",
    "Познакомьтесь с кем-то из ближнего окружения.",
    "Помогите соседу с мелкой просьбой — откроется новый канал.",
    "Послушайте местные новости или разговоры — в них скрыта информация.",
  ],
  "Короткие путешествия": [
    "Смените обстановку — прогуляйтесь в незнакомом направлении.",
    "Запланируйте поездку на выходные, даже если недалеко.",
    "Поезжайте в соседний район и зайдите в новое место.",
    "Возьмите выходной и уедьте за город, даже на день.",
  ],
  "Братья и сёстры": [
    "Напишите родственнику, с которым давно не переписывались.",
    "Позвоните брату или сестре — разговор будет необычайно тёплым.",
    "Вспомните семейную историю — в ней ключ к вашему вопросу.",
    "Обсудите наследственные темы с близким по возрасту родственником.",
  ],
  "Любовь": [
    "Скажите близкому человеку то, что давно чувствуете.",
    "Потратьте время вместе, без гаджетов и отвлечений.",
    "Напишите записку с тёплыми словами.",
    "Подарите что-то символичное — не дорогое, но осмысленное.",
  ],
  "Карьера": [
    "Обновите резюме или профиль — даже если не ищете работу.",
    "Запишите свои достижения за последний месяц.",
    "Напишите коллеге с предложением о сотрудничестве.",
    "Поставьте одну конкретную профессиональную цель на сегодня.",
  ],
  "Деньги": [
    "Проверьте подписки — отмените те, что не используете.",
    "Запишите все расходы за сегодня — осознанность растёт.",
    "Изучите один финансовый инструмент, который не знали.",
    "Положите небольшую сумму в резерв — начните накопление.",
  ],
  "Творчество": [
    "Сделайте набросок или запишите мелодию — не ждите идеального момента.",
    "Пересмотрите старые работы — там есть забытые идеи.",
    "Попробуйте новый материал или инструмент.",
    "Покажите свою работу кому-то — обратная связь творит чудеса.",
  ],
  "Здоровье": [
    "Сделайте 10-минутную растяжку или прогулку.",
    "Выпейте стакан воды прямо сейчас.",
    "Лягте спать на 30 минут раньше обычного.",
    "Запишите, что Вы ели сегодня — заметите паттерн.",
  ],
  "Духовность": [
    "Потратьте 10 минут в тишине — без телефона.",
    "Запишите вопрос, который давно не даёт покоя.",
    "Прочитайте страницу из духовной или философской книги.",
    "Сделайте один осознанный жест благодарности.",
  ],
  "Свобода": [
    "Отмените одно обязательство, которое вытесняет Вас.",
    "Выделите час только для себя — без объяснений никому.",
    "Скажите «нет» тому, что Вы делаете по привычке, а не по выбору.",
    "Запишите, от чего Вы хотели бы освободиться.",
  ],
  "Борьба": [
    "Опишите конфликт на бумаге — увидите его иначе.",
    "Поговорите с оппонентом напрямую, без посредников.",
    "Выделите один шаг к решению — даже маленький.",
    "Признайте свою часть ответственности — это снимет напряжение.",
  ],
  "Путешествия": [
    "Поищите билеты — даже если не купите, мечта начинается с просмотра.",
    "Прочитайте о культуре страны, о которой не знали.",
    "Запланируйте маршрут — планирование тоже путешествие.",
    "Спросите у друга о его путешествии — вдохновитесь чужим опытом.",
  ],
  "Семья": [
    "Позвоните родителям — просто так, без повода.",
    "Спросите у старшего родственника о семейной истории.",
    "Сделайте что-то полезное для дома — мелочь, но важная.",
    "Напишите письмо члену семьи, с которым разошлись.",
  ],
  "Гармония": [
    "Приведите в порядок рабочее место — гармония начинается с пространства.",
    "Послушайте музыку, которая успокаивает Вас.",
    "Сделайте один шаг к примирению с тем, кто обидел.",
    "Потратьте время на то, что приносит радость без пользы.",
  ],
  "Красота": [
    "Посмотрите на обычную вещь как на произведение искусства.",
    "Сделайте что-то приятное для своей внешности — не из обязанности.",
    "Сфотографируйте момент, который кажется красивым.",
    "Посетите выставку, парк или просто красивый уголок города.",
  ],
  "Перемены": [
    "Сделайте одну вещь иначе, чем вчера.",
    "Запишите, что Вы хотите изменить — конкретно, одной фразой.",
    "Поговорите с человеком, который недавно что-то поменял.",
    "Отпустите одну привычку на сегодня — посмотрите, что изменится.",
  ],
  "Инновации": [
    "Попробуйте новое приложение или инструмент.",
    "Прочитайте о технологии, о которой слышали, но не изучали.",
    "Запишите идею, которая кажется безумной — она может стать проектом.",
    "Спросите у молодого человека, что он использует — откроется новый мир.",
  ],
  "Будущее": [
    "Напишите письмо себе из будущего — что бы Вы хотели сказать?",
    "Запишите одну цель на год — и первый шаг к ней.",
    "Поговорите с человеком, который уже там, где Вы хотите быть.",
    "Сделайте что-то сегодня, за что будущий Вы скажет спасибо.",
  ],
  "Независимость": [
    "Сделайте одно дело без чужой помощи.",
    "Запишите, от чего или от кого Вы зависите — и один шаг к автономии.",
    "Потратьте время в одиночестве — это не изоляция, а выбор.",
    "Примите решение, которое раньше откладывали из страха.",
  ],
  "Технологии": [
    "Организуйте файлы — цифровой порядок = ментальный порядок.",
    "Попробуйте автоматизировать рутинную задачу.",
    "Прочитайте инструкцию к гаджету — узнаете новые функции.",
    "Сделайте резервную копию важных данных.",
  ],
};

function getAdvice(theme: string): string | null {
  const list = ADVICE_BY_THEME[theme];
  if (!list || list.length === 0) return null;
  return pickRandom(list);
}

export class FuturisticGenerator {
  generate(context: TransitContext): string | null {
    try {
      const entity = getEntity(context.planet);
      if (!entity) {
        logger.warn({ planet: context.planet }, "entity not found in ontology");
        return null;
      }

      const themes = resolveThemes(context.planet, context.sign, context.house, context.aspect);
      if (!themes) {
        logger.warn({ planet: context.planet }, "no themes resolved for transit");
        return null;
      }

      const relation = context.aspectPlanet
        ? findRelation(context.planet, context.aspectPlanet)
        : null;

      const durationData = calculateTransitDuration(
        context.planet,
        context.orb,
        context.currentDate,
      );

      return this.buildText(themes, relation, durationData, context, entity.profile);
    } catch (error) {
      logger.error({ error, context }, "error generating forecast");
      return null;
    }
  }

  private buildText(
    themes: {
      primary: string;
      secondary: string;
      tertiary: string;
      all: string[];
      aspectModifier: number;
      aspectPolarity: "positive" | "negative" | "neutral";
    },
    relation: EntityRelation | null,
    durationData: TransitDuration,
    context: TransitContext,
    profile: EntityProfile | null,
  ): string {
    const parts: string[] = [];
    const primaryTheme = themes.primary;
    const secondaryTheme = themes.secondary;
    const durationText = durationData.text;
    const dayPart = getDayPart(durationData.peakDate.getHours());
    const futurePeriod = this.getFuturePeriod(context);

    // --- 1. Открытие: конкретное, без абстракций ---
    const openers = [
      `Сегодняшний день открывает возможности в сфере ${declineTheme(primaryTheme, "genitive").toLowerCase()}.`,
      `${primaryTheme} выходит на первый план — обратите на это внимание.`,
      `Энергия сегодня направлена на ${declineTheme(primaryTheme, "accusative").toLowerCase()}.`,
      `День благоприятен для ${declineTheme(primaryTheme, "genitive").toLowerCase()}.`,
    ];
    parts.push(pickRandom(openers));

    // Конкретная временная привязка: когда идея придёт
    parts.push(`Важный момент ${dayPart} — не пропустите.`);

    if (themes.all.length > 2) {
      const others = themes.all.slice(1, 4).filter((t) => t !== primaryTheme);
      if (others.length > 0) {
        const otherThemes = others.slice(0, 2).join(" и ");
        const contextPhrases = [
          `Рядом с этим — ${otherThemes.toLowerCase()}.`,
          `Также важны: ${otherThemes.toLowerCase()}.`,
          `В тени основной темы — ${otherThemes.toLowerCase()}.`,
        ];
        parts.push(pickRandom(contextPhrases));
      }
    }

    // --- 2. Эмоциональный слой из профиля ---
    let emotionPhrase: string | null = null;
    if (profile) {
      const emotions =
        themes.aspectPolarity === "negative"
          ? profile.negativeEmotions
          : profile.positiveEmotions;
      if (emotions && emotions.length > 0) {
        const picked = pickRandom(emotions).toLowerCase();
        emotionPhrase = `Сегодня Вы можете почувствовать ${picked}.`;
      }
    }
    if (emotionPhrase) {
      parts.push(emotionPhrase);
    } else {
      const fallbackEmotions = [
        "Сегодня Вы можете почувствовать интерес и любопытство.",
        "Возможно, придёт осознание, которого раньше не было.",
        "Сегодняшний день может принести ясность.",
      ];
      parts.push(pickRandom(fallbackEmotions));
    }

    // --- 3. Конкретный совет по теме ---
    const advice = getAdvice(primaryTheme);
    if (advice) {
      parts.push(advice);
    } else if (profile?.recommendations) {
      parts.push(profile.recommendations);
    }

    // Дополнительный совет по второй теме
    const advice2 = getAdvice(secondaryTheme);
    if (advice2 && advice2 !== advice) {
      parts.push(advice2);
    }

    // --- 4. Временная привязка (один раз!) ---
    const timePhrases = [
      `То, что Вы начнёте сегодня, может принести первые результаты ${futurePeriod}.`,
      `Сегодняшние шаги начнут откликаться ${futurePeriod}.`,
      `Первые признаки изменений появятся ${futurePeriod}.`,
    ];
    parts.push(pickRandom(timePhrases));

    // --- 5. Тональность аспекта + таймер ---
    if (themes.aspectPolarity === "negative") {
      if (durationData.urgency === "срочно") {
        parts.push("Действуйте прямо сейчас! Время на исходе.");
      } else if (durationData.urgency === "скоро") {
        parts.push("Время идёт, не откладывайте на завтра.");
      } else {
        parts.push("Требуется внимание, но у Вас есть время продумать.");
      }
    } else if (themes.aspectPolarity === "positive") {
      if (durationData.urgency === "срочно") {
        parts.push(`У Вас есть ${durationText}, и всё складывается быстро. Не торопитесь.`);
      } else {
        parts.push(`У Вас есть ${durationText}. Всё складывается в Вашу пользу. Действуйте, когда будет удобно.`);
      }
    } else {
      parts.push(`У Вас есть ${durationText}, чтобы обдумать решение.`);
    }

    // --- 6. Мотивация ---
    if (context.motivationPhrase) {
      parts.push(context.motivationPhrase);
    } else {
      const fallbackMotivation = [
        "Действуйте, у Вас всё получится!",
        "Верьте в себя. Вы справитесь!",
        "Это Ваш звёздный час. Вперёд!",
      ];
      parts.push(pickRandom(fallbackMotivation));
    }

    return parts.join("\n");
  }

  private getFuturePeriod(context: TransitContext): string {
    if (!context.aspectPlanet) return "в ближайшем будущем";

    const periodMap: Record<string, string> = {
      "Уран": "через год",
      "Сатурн": "через 2 года",
      "Юпитер": "через год",
      "Меркурий": "через несколько недель",
      "Венера": "через несколько месяцев",
      "Марс": "через несколько месяцев",
      "Луна": "через несколько дней",
      "Солнце": "через несколько недель",
    };

    return periodMap[context.aspectPlanet] ?? "в ближайшем будущем";
  }
}

export const futuristicGenerator = new FuturisticGenerator();
