import { logger } from "./logger";
import { getEntity, getEntityThemes, findRelation, type EntityTheme, type EntityRelation } from "./semanticEngine";
import { type TransitAspect } from "./astrology";

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
  peakDate.setDate(peakDate.getDate() + Math.round(totalDays / 2));

  return { duration, unit, text, urgency, peakDate };
}

function declension(count: number, forms: [string, string, string]): string {
  const n = Math.abs(count) % 100;
  const n1 = n % 10;
  if (n > 10 && n < 20) return forms[2];
  if (n1 > 1 && n1 < 5) return forms[1];
  if (n1 === 1) return forms[0];
  return forms[2];
}

/** Склонение тем на простой контекст (творительный / предложный). */
function declineTheme(theme: string, caseName: "nominative" | "instrumental" = "nominative"): string {
  if (caseName === "nominative") return theme;
  const instrumental: Record<string, string> = {
    "Учёба": "Учёбой",
    "Любовь": "Любовью",
    "Творчество": "Творчеством",
    "Общение": "Общением",
    "Свобода": "Свободой",
    "Гармония": "Гармонией",
    "Красота": "Красотой",
    "Отношения": "Отношениями",
    "Деньги": "Деньгами",
    "Карьера": "Карьерой",
    "Здоровье": "Здоровьем",
    "Духовность": "Духовностью",
  };
  return instrumental[theme] || theme;
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

/** Weighted theme intersection across planet, house, sign, aspect. */
function resolveThemes(
  planet: string,
  sign: string,
  house: number,
  aspect: string,
): { primary: string; secondary: string; aspectModifier: number; aspectPolarity: "positive" | "negative" | "neutral" } | null {
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

  return {
    primary: scored[0][0],
    secondary: scored[1]?.[0] ?? scored[0][0],
    aspectModifier,
    aspectPolarity,
  };
}

export class FuturisticGenerator {
  generate(context: TransitContext): string | null {
    try {
      const planetProfile = getEntity(context.planet);
      if (!planetProfile) {
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

      return this.buildText(themes, relation, durationData, context);
    } catch (error) {
      logger.error({ error, context }, "error generating forecast");
      return null;
    }
  }

  private buildText(
    themes: { primary: string; secondary: string; aspectModifier: number; aspectPolarity: "positive" | "negative" | "neutral" },
    relation: EntityRelation | null,
    durationData: TransitDuration,
    context: TransitContext,
  ): string {
    const parts: string[] = [];
    const primaryTheme = themes.primary;
    const secondaryTheme = themes.secondary;
    const durationText = durationData.text;
    const peakDate = durationData.peakDate.toLocaleDateString("ru-RU", {
      day: "numeric",
      month: "long",
      hour: "2-digit",
      minute: "2-digit",
    });
    const futurePeriod = this.getFuturePeriod(context);

    // ===== 1. Бифуркация =====
    parts.push(`Сейчас Вы стоите на развилке между "${primaryTheme}" и "${secondaryTheme}".`);

    // Aspect tonal flavour
    if (themes.aspectPolarity === "positive") {
      parts.push("Энергия течёт свободно и естественно. То, что задумано, получится легко.");
    } else if (themes.aspectPolarity === "negative") {
      parts.push("Требуется осознанный выбор и усилие. Напряжённость — не враг, а топливо для роста.");
    } else {
      parts.push("Время для важных решений. Точка бифуркации открывается — выбирайте свой путь.");
    }

    // Вариативная фраза выбора
    if (relation?.futuristic) {
      const fut = relation.futuristic as Record<string, unknown>;
      const archetype = String(fut.archetype ?? relation.description ?? "энергия");
      const bif = (fut.bifurcation ?? {}) as Record<string, string>;
      const oldPattern = bif.oldPattern ?? "старый шаблон";
      const newPossibility = bif.newPossibility ?? "новая возможность";
      parts.push(`${archetype} подсвечивает Ваш старый шаблон "${oldPattern}",`);
      parts.push(`а ${context.aspectPlanet} открывает путь к "${newPossibility}".`);
    } else {
      const choicePhrases = [
        `Ваш выбор: остаться в привычном ${primaryTheme.toLowerCase()} или шагнуть в ${secondaryTheme.toLowerCase()}.`,
        `Сейчас Вы выбираете между ${primaryTheme.toLowerCase()} и ${secondaryTheme.toLowerCase()}.`,
        `Что для Вас важнее: ${primaryTheme.toLowerCase()} или ${secondaryTheme.toLowerCase()}?`,
      ];
      parts.push(pickRandom(choicePhrases));
    }

    // ===== 2. Окно возможностей (единственное упоминание времени) =====
    const futOp = (relation?.futuristic?.opportunity ?? {}) as Record<string, string>;
    const opportunityDesc =
      futOp.description ?? `в моменте, когда ${primaryTheme.toLowerCase()} встретится с ${declineTheme(secondaryTheme, "instrumental").toLowerCase()}`;

    const futurePhrases = [
      `То, что Вы решите сейчас, откликнется ${futurePeriod}.`,
      `Этот выбор повлияет на Вашу жизнь ${futurePeriod}.`,
      `Сегодняшнее решение станет фундаментом для перемен ${futurePeriod}.`,
      `Последствия этого выбора Вы почувствуете ${futurePeriod}.`,
    ];

    parts.push(`Идея, которая придёт ${opportunityDesc} (пик аспекта: ${peakDate}), — это не случайность.`);
    parts.push(pickRandom(futurePhrases));
    parts.push(`Если Вы её проигнорируете, мир не рухнет.`);
    parts.push(`Но если запишете и начнёте делать — ${futurePeriod} Вы не узнаете свою жизнь.`);
    parts.push("");

    // ===== 3. Таймер + срочность =====
    const futTimer = (relation?.futuristic?.timer ?? {}) as Record<string, string>;
    const action = futTimer.action ?? `сделать выбор в пользу ${primaryTheme.toLowerCase()}`;

    parts.push(`У Вас есть ${durationText}, чтобы ${action}.`);

    if (durationData.urgency === "срочно") {
      parts.push("Действуйте прямо сейчас! Время на исходе.");
    } else if (durationData.urgency === "скоро") {
      parts.push("Время идёт, не откладывайте на завтра.");
    } else {
      parts.push("У Вас есть время обдумать решение.");
    }

    parts.push("");

    // ===== 4. Мотивационная фраза =====
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

    parts.push("");

    // ===== 5. Вопрос-маяк =====
    const futBeacon = (relation?.futuristic?.beacon ?? {}) as Record<string, string>;
    const beacon = futBeacon.question ?? "Что бы Вы делали, если бы знали, что не можете провалиться?";
    parts.push(beacon);

    return parts.join("\n");
  }

  private getFuturePeriod(context: TransitContext): string {
    if (!context.aspectPlanet) return "в будущем";

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
