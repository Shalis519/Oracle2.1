import { logger } from "./logger";
import { type TransitAspect } from "./astrology";
import {
  getEntity,
  getEntityThemes,
  findRelation,
  type EntityRelation,
  type EntityProfile,
} from "./semanticEngine";

/*
 * Генератор прогноза СТРОГО из сущностей онтологии (Oracle Studio).
 *
 * Каждый смысловой фрагмент текста берётся из данных, которые администратор
 * вносит в Studio: описания связей (relation.description), профили планет,
 * знаков и домов (keyMeanings, emotions, recommendations, warnings),
 * темы с весами. В коде остаются только:
 *  - грамматическая механика русского языка (падежи имён, предлог «в/во»);
 *  - соединительные конструкции («Сегодня…», «Одновременно…») для склейки.
 * Никаких зашитых описательных шаблонов, советов или эмоций.
 */

/* ─── Грамматическая механика (не контент) ─── */

/** Предлог «в» / «во» для предложного падежа знака (во Льве, в Раке). */
function inSignPrep(sign: string): string {
  if (sign.toLowerCase().startsWith("ль")) return `во ${sign}`;
  return `в ${sign}`;
}

/** Предложный падеж знаков зодиака (в Овне, во Льве). */
const SIGN_PREPOSITIONAL: Record<string, string> = {
  "Овен": "Овне",
  "Телец": "Тельце",
  "Близнецы": "Близнецах",
  "Рак": "Раке",
  "Лев": "Льве",
  "Дева": "Деве",
  "Весы": "Весах",
  "Скорпион": "Скорпионе",
  "Стрелец": "Стрельце",
  "Козерог": "Козероге",
  "Водолей": "Водолее",
  "Рыбы": "Рыбах",
};

function signInPrepositional(sign: string): string {
  const p = SIGN_PREPOSITIONAL[sign];
  if (!p) return `в ${sign}`;
  return p.toLowerCase().startsWith("ль") ? `во ${p}` : `в ${p}`;
}

/** Творительный падеж имён небесных тел (с Ураном, с Венерой). */
const BODY_INSTRUMENTAL: Record<string, string> = {
  "северный узел": "Северным узлом",
  "южный узел": "Южным узлом",
  "хирон": "Хироном",
  "плутон": "Плутоном",
  "нептун": "Нептуном",
  "уран": "Ураном",
  "сатурн": "Сатурном",
  "юпитер": "Юпитером",
  "марс": "Марсом",
  "венера": "Венерой",
  "меркурий": "Меркурием",
  "луна": "Луной",
  "солнце": "Солнцем",
};

function bodyInstrumental(name: string): string {
  return BODY_INSTRUMENTAL[name.toLowerCase()] ?? name;
}

/** Винительный падеж названий аспектов (образует оппозицию). */
function aspectAccusative(aspect: string): string {
  const a = aspect.toLowerCase();
  if (a === "оппозиция") return "оппозицию";
  return a;
}

/* ─── Астрологическая механика аспектов (не контент) ─── */

/** Полярность аспекта: гармоничный / напряжённый / нейтральный. */
export function getAspectPolarity(aspect: string): "positive" | "negative" | "neutral" {
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

/** Модификатор веса тем: гармоничные аспекты усиливают, напряжённые приглушают. */
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

/* ─── Внутренние структуры ─── */

interface TransitSemantics {
  transit: TransitAspect;
  polarity: "positive" | "negative" | "neutral";
  /** Темы транзита по убыванию веса (планета + знак + дом). */
  themes: string[];
  relation: EntityRelation | null;
  planetProfile: EntityProfile | null;
  natalPlanetProfile: EntityProfile | null;
  signProfile: EntityProfile | null;
  natalSignProfile: EntityProfile | null;
  houseProfile: EntityProfile | null;
  natalHouseProfile: EntityProfile | null;
  /** Есть ли достаточно данных онтологии, чтобы описать транзит. */
  hasContent: boolean;
}

/** Детерминированный выбор элемента массива по дате (стабильно в течение дня). */
function pickByDate<T>(arr: T[], date: Date, salt = 0): T | null {
  if (!arr || arr.length === 0) return null;
  const seed = date.getUTCFullYear() * 372 + (date.getUTCMonth() + 1) * 31 + date.getUTCDate() + salt;
  return arr[seed % arr.length] ?? null;
}

/** Первое предложение (или весь текст, если одно) — для кратких вторичных упоминаний. */
function firstSentence(text: string): string {
  const trimmed = text.trim();
  const m = /^[^.!?]+[.!?]/.exec(trimmed);
  return m ? m[0].trim() : trimmed;
}

/** Завершить фрагмент точкой, если админ не поставил знак конца предложения. */
function ensureSentence(text: string): string {
  const t = text.trim();
  if (!t) return t;
  return /[.!?…]$/.test(t) ? t : `${t}.`;
}

/** Строчная первая буква (для вставки после двоеточия/тире). */
function lowerFirst(text: string): string {
  return text.charAt(0).toLowerCase() + text.slice(1);
}

/* ─── Сбор семантики транзита из онтологии ─── */

async function resolveTransitThemes(t: TransitAspect): Promise<string[]> {
  const [planetThemes, signThemes, transitHouseThemes, natalHouseThemes] = await Promise.all([
    getEntityThemes(t.transitBody),
    getEntityThemes(t.transitSign),
    t.transitHouse ? getEntityThemes(`Дом ${t.transitHouse}`) : Promise.resolve([]),
    t.natalHouse && t.natalHouse !== t.transitHouse
      ? getEntityThemes(`Дом ${t.natalHouse}`)
      : Promise.resolve([]),
  ]);

  const modifier = getAspectModifier(t.type);
  const scoreMap = new Map<string, number>();
  for (const th of planetThemes) {
    scoreMap.set(th.themeName, (scoreMap.get(th.themeName) ?? 0) + th.weight * 1.0 * modifier);
  }
  for (const th of signThemes) {
    scoreMap.set(th.themeName, (scoreMap.get(th.themeName) ?? 0) + th.weight * 0.5 * modifier);
  }
  // Дом, по которому идёт транзитная планета, — главная сфера проявления.
  for (const th of transitHouseThemes) {
    scoreMap.set(th.themeName, (scoreMap.get(th.themeName) ?? 0) + th.weight * 0.8 * modifier);
  }
  for (const th of natalHouseThemes) {
    scoreMap.set(th.themeName, (scoreMap.get(th.themeName) ?? 0) + th.weight * 0.7 * modifier);
  }

  return Array.from(scoreMap.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([name]) => name);
}

async function loadTransitSemantics(t: TransitAspect): Promise<TransitSemantics> {
  const [relation, themes, planetEntity, natalPlanetEntity, signEntity, natalSignEntity, houseEntity, natalHouseEntity] =
    await Promise.all([
      findRelation(t.transitBody, t.natalBody, t.type),
      resolveTransitThemes(t),
      getEntity(t.transitBody),
      getEntity(t.natalBody),
      getEntity(t.transitSign),
      getEntity(t.natalSign),
      t.transitHouse ? getEntity(`Дом ${t.transitHouse}`) : Promise.resolve(null),
      t.natalHouse ? getEntity(`Дом ${t.natalHouse}`) : Promise.resolve(null),
    ]);

  const planetProfile = planetEntity?.profile ?? null;
  const signProfile = signEntity?.profile ?? null;
  const natalHouseProfile = natalHouseEntity?.profile ?? null;

  // Есть ли ХОТЬ КАКОЙ-ТО контент онтологии, из которого можно построить текст:
  // описание связи, профиль транзитной планеты, профиль её знака, профиль дома
  // натальной планеты или темы с весами. Честный отказ — только когда пусто всё.
  const profileHasText = (p: EntityProfile | null): boolean =>
    Boolean(
      p &&
        (p.keyMeanings?.trim() ||
          p.keyMeaningsArr?.length ||
          p.positiveEmotions?.length ||
          p.negativeEmotions?.length ||
          p.recommendations?.trim() ||
          p.warnings?.trim() ||
          p.lifeThemes?.length),
    );

  const hasContent = Boolean(
    relation?.description?.trim() ||
      profileHasText(planetProfile) ||
      profileHasText(signProfile) ||
      profileHasText(houseEntity?.profile ?? null) ||
      profileHasText(natalHouseProfile) ||
      themes.length > 0,
  );

  return {
    transit: t,
    polarity: getAspectPolarity(t.type),
    themes,
    relation,
    planetProfile,
    natalPlanetProfile: natalPlanetEntity?.profile ?? null,
    signProfile: signEntity?.profile ?? null,
    natalSignProfile: natalSignEntity?.profile ?? null,
    houseProfile: houseEntity?.profile ?? null,
    natalHouseProfile: natalHouseEntity?.profile ?? null,
    hasContent,
  };
}

/* ─── Совместимость транзитов ─── */

/**
 * Два транзита противоречат друг другу, если их полярности противоположны
 * (гармоничный против напряжённого) И их ведущие темы пересекаются:
 * нельзя в одном тексте звать к действию и предостерегать в одной и той же
 * сфере жизни. Разные сферы — можно: «в общении легко, в финансах осторожно».
 */
function contradicts(a: TransitSemantics, b: TransitSemantics): boolean {
  const opposite =
    (a.polarity === "positive" && b.polarity === "negative") ||
    (a.polarity === "negative" && b.polarity === "positive");
  if (!opposite) return false;
  const topA = new Set(a.themes.slice(0, 3));
  return b.themes.slice(0, 3).some((th) => topA.has(th));
}

/* ─── Построение текста ─── */

function describeMainTransit(s: TransitSemantics, date: Date): string[] {
  const t = s.transit;
  const parts: string[] = [];

  // Фактическое астрономическое вступление — полная цепочка связи (механика, не контент):
  // транзитная планета в знаке → идёт по натальному дому → аспект → натальная планета в знаке → в её доме.
  const transitPath = t.transitHouse ? `, проходя по Вашему ${t.transitHouse}-му дому,` : "";
  const natalPlace = t.natalHouse ? ` в ${t.natalHouse}-м доме` : "";
  parts.push(
    `Сегодня ${t.transitBody} ${signInPrepositional(t.transitSign)}${transitPath} образует ${aspectAccusative(t.type)} с ${bodyInstrumental(t.natalBody)} ${signInPrepositional(t.natalSign)}${natalPlace}.`,
  );

  // Ядро смысла — описание связи, внесённое администратором.
  if (s.relation?.description?.trim()) {
    parts.push(ensureSentence(s.relation.description));
  }

  // Ключевые значения транзитной планеты (если связь не описана — это ядро).
  if (!s.relation?.description?.trim()) {
    const km = s.planetProfile?.keyMeanings?.trim();
    if (km) {
      parts.push(`${t.transitBody} приносит: ${ensureSentence(lowerFirst(km))}`);
    } else if (s.planetProfile?.keyMeaningsArr?.length) {
      parts.push(`${t.transitBody} приносит: ${s.planetProfile.keyMeaningsArr.slice(0, 3).join(", ").toLowerCase()}.`);
    }
  }

  // Топ-темы транзита по весам (планета + знак + дом) — фокус дня.
  const topThemes = s.themes.slice(0, 2);
  if (topThemes.length > 0) {
    const focus = topThemes.map((th) => th.toLowerCase()).join(" и ");
    parts.push(`В фокусе дня — ${focus}.`);
  }

  // Окраска знака транзитной планеты.
  const signKm = s.signProfile?.keyMeanings?.trim();
  if (signKm) {
    parts.push(`Знак придаёт этому влиянию свой оттенок: ${ensureSentence(lowerFirst(signKm))}`);
  }

  // Сфера, по которой идёт транзитная планета, — натальный дом транзита.
  if (t.transitHouse && s.houseProfile) {
    const thKm = s.houseProfile.keyMeanings?.trim();
    const thTheme = s.houseProfile.lifeThemes?.[0];
    if (thKm) {
      parts.push(`Транзит проходит через сферу ${t.transitHouse}-го дома: ${ensureSentence(lowerFirst(thKm))}`);
    } else if (thTheme) {
      parts.push(`Транзит активирует сферу ${t.transitHouse}-го дома — ${thTheme.toLowerCase()}.`);
    }
  }

  // Сфера жизни — дом натальной планеты (если это другой дом).
  if (t.natalHouse && s.natalHouseProfile && t.natalHouse !== t.transitHouse) {
    const houseKm = s.natalHouseProfile.keyMeanings?.trim();
    const houseTheme = s.natalHouseProfile.lifeThemes?.[0];
    if (houseKm) {
      parts.push(`События разворачиваются в сфере ${t.natalHouse}-го дома: ${ensureSentence(lowerFirst(houseKm))}`);
    } else if (houseTheme) {
      parts.push(`Затронута сфера ${t.natalHouse}-го дома — ${houseTheme.toLowerCase()}.`);
    }
  }

  // Эмоциональный слой из профиля планеты, по полярности аспекта.
  const emotions =
    s.polarity === "negative"
      ? s.planetProfile?.negativeEmotions
      : s.planetProfile?.positiveEmotions;
  const emotion = emotions && emotions.length > 0 ? pickByDate(emotions, date, 1) : null;
  if (emotion) {
    parts.push(`Сегодня Вы можете почувствовать ${emotion.toLowerCase()}.`);
  }

  return parts;
}

function describeSecondaryTransit(s: TransitSemantics, index: number): string | null {
  const t = s.transit;
  const connective = index === 0 ? "Одновременно" : "Кроме того,";
  const head = `${connective} ${t.transitBody} образует ${aspectAccusative(t.type)} с ${bodyInstrumental(t.natalBody)}`;

  if (s.relation?.description?.trim()) {
    return `${head}: ${lowerFirst(firstSentence(s.relation.description))}`;
  }
  const km = s.planetProfile?.keyMeanings?.trim();
  if (km) {
    return `${head} — в игру вступает ${lowerFirst(firstSentence(km))}`;
  }
  if (s.planetProfile?.keyMeaningsArr?.length) {
    return `${head} — акцент на: ${s.planetProfile.keyMeaningsArr.slice(0, 2).join(", ").toLowerCase()}.`;
  }
  if (s.themes.length > 0) {
    return `${head} — в фокусе ${s.themes[0].toLowerCase()}.`;
  }
  return null;
}

/** Совет дня из профилей доминирующего транзита (по полярности). */
function buildAdvice(main: TransitSemantics): string | null {
  const candidates =
    main.polarity === "negative"
      ? [
          main.planetProfile?.warnings,
          main.natalPlanetProfile?.warnings,
          main.planetProfile?.recommendations,
        ]
      : [
          main.planetProfile?.recommendations,
          main.natalPlanetProfile?.recommendations,
          main.signProfile?.recommendations,
        ];

  for (const c of candidates) {
    if (typeof c === "string" && c.trim()) return ensureSentence(c);
  }
  return null;
}

/* ─── Публичный API ─── */

export class FuturisticGenerator {
  /**
   * Строит прогноз дня из до 3 совместимых транзитов.
   * @param ranked — транзиты, отсортированные по силе (см. selectTopTransits)
   * @param date — дата прогноза (для детерминированного выбора в течение дня)
   * @param motivationPhrase — мотивационная фраза из Studio (в конец текста)
   * @returns текст прогноза или null, если онтология не заполнена для главного транзита
   */
  async generate(
    ranked: TransitAspect[],
    date: Date,
    motivationPhrase?: string,
  ): Promise<string | null> {
    try {
      if (ranked.length === 0) return null;

      const semantics = await Promise.all(ranked.map(loadTransitSemantics));

      // Главный транзит обязан иметь данные в онтологии — иначе честный отказ.
      const main = semantics[0];
      if (!main.hasContent) {
        logger.warn(
          { transit: `${main.transit.transitBody} ${main.transit.type} ${main.transit.natalBody}` },
          "ontology has no content for main transit",
        );
        return null;
      }

      // Отбор до 2 дополнительных: с данными и не противоречащих уже выбранным.
      const picked: TransitSemantics[] = [main];
      for (const s of semantics.slice(1)) {
        if (picked.length >= 3) break;
        if (!s.hasContent) continue;
        if (picked.some((p) => contradicts(p, s))) continue;
        picked.push(s);
      }

      const paragraphs: string[] = [];

      // Абзац 1: главный транзит.
      paragraphs.push(describeMainTransit(main, date).join(" "));

      // Абзацы 2-3: дополнительные транзиты, коротко.
      picked.slice(1).forEach((s, i) => {
        const line = describeSecondaryTransit(s, i);
        if (line) paragraphs.push(ensureSentence(line));
      });

      // Совет дня из профилей.
      const advice = buildAdvice(main);
      if (advice) paragraphs.push(advice);

      // Мотивационная фраза из Studio — последним предложением.
      if (motivationPhrase?.trim()) {
        paragraphs.push(ensureSentence(motivationPhrase));
      }

      return paragraphs.join("\n\n");
    } catch (error) {
      logger.error({ error }, "error generating forecast");
      return null;
    }
  }
}

export const futuristicGenerator = new FuturisticGenerator();
