import { logger } from "./logger";
import { type TransitAspect } from "./astrology";
import {
  getEntity,
  getEntityThemes,
  findRelation,
  type EntityRelation,
  type EntityProfile,
} from "./semanticEngine";
import {
  aspectAccusative,
  buildHouseThemes,
  buildPersonalInfluence,
  buildPrimaryFocus,
  buildSignThemes,
  buildTransitOpening,
  bodyInstrumental,
  ensureSentence,
  firstSentence,
  formatList,
  lowerFirst,
  profileListText,
  plantForTea,
  relationToPersonalInfluence,
  renderParagraphs,
  signInPrepositional,
  toAccusativeThemes,
  toPersonalThemes,
} from "./forecastLanguage";

/*
 * Генератор прогноза СТРОГО из сущностей онтологии (Oracle Studio).
 *
 * Каждый смысловой фрагмент текста берётся из данных, которые администратор
 * вносит в Studio: описания связей (relation.description), профили планет,
 * знаков и домов (keyMeanings, emotions, recommendations, warnings),
 * темы с весами. В коде остаются только:
 *  - грамматическая механика русского языка (падежи имён, предлог «в/во»);
 *  - типизированные русские шаблоны предложений и грамматический адаптер;
 *  - соединительные конструкции для переходов между смысловыми блоками.
 * Описания, темы, советы и эмоции не зашиваются в генератор и приходят из Oracle Studio.
 */

/* ─── Грамматическая механика (не контент) ─── */

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

interface ThemeEvidence {
  name: string;
  score: number;
  sources: string[];
}

interface TransitSemantics {
  transit: TransitAspect;
  polarity: "positive" | "negative" | "neutral";
  /** Темы транзита по убыванию веса (планета + знак + дом). */
  themes: string[];
  /** Источники, которые подтверждают каждую ведущую тему. */
  themeEvidence: ThemeEvidence[];
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

/* ─── Сбор семантики транзита из онтологии ─── */

async function resolveTransitThemes(t: TransitAspect): Promise<ThemeEvidence[]> {
  const [planetThemes, signThemes, transitHouseThemes, natalHouseThemes] = await Promise.all([
    getEntityThemes(t.transitBody),
    getEntityThemes(t.transitSign),
    t.transitHouse ? getEntityThemes(`Дом ${t.transitHouse}`) : Promise.resolve([]),
    t.natalHouse && t.natalHouse !== t.transitHouse
      ? getEntityThemes(`Дом ${t.natalHouse}`)
      : Promise.resolve([]),
  ]);

  const modifier = getAspectModifier(t.type);
  const evidenceMap = new Map<string, ThemeEvidence>();
  const addEvidence = (themeName: string, weight: number, source: string) => {
    const existing = evidenceMap.get(themeName) ?? { name: themeName, score: 0, sources: [] };
    existing.score += weight * modifier;
    if (!existing.sources.includes(source)) existing.sources.push(source);
    evidenceMap.set(themeName, existing);
  };

  for (const th of planetThemes) addEvidence(th.themeName, th.weight, t.transitBody);
  for (const th of signThemes) addEvidence(th.themeName, th.weight * 0.5, t.transitSign);
  if (t.transitHouse) {
    for (const th of transitHouseThemes) addEvidence(th.themeName, th.weight * 0.8, `Дом ${t.transitHouse}`);
  }
  if (t.natalHouse && t.natalHouse !== t.transitHouse) {
    for (const th of natalHouseThemes) addEvidence(th.themeName, th.weight * 0.7, `Дом ${t.natalHouse}`);
  }

  return Array.from(evidenceMap.values()).sort((a, b) => b.score - a.score);
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
    themes: themes.map((theme) => theme.name),
    themeEvidence: themes,
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

function normalizeRelationDescription(description: string): string {
  return relationToPersonalInfluence(description) ?? ensureSentence(description);
}

function describeMainTransit(s: TransitSemantics, date: Date): string[] {
  const t = s.transit;
  const parts: string[] = [];
  parts.push(buildTransitOpening({
    transitBody: t.transitBody,
    transitSign: t.transitSign,
    aspect: t.type,
    natalBody: t.natalBody,
    natalSign: t.natalSign,
    transitHouse: t.transitHouse,
    natalHouse: t.natalHouse,
  }));

  if (s.relation?.description?.trim()) {
    parts.push(normalizeRelationDescription(s.relation.description));
  } else {
    const fallback = formatList(profileListText(s.planetProfile));
    if (fallback) parts.push(buildPersonalInfluence(fallback));
  }

  const topEvidence = s.themeEvidence.slice(0, 2);
  if (topEvidence.length > 0) {
    const focus = formatList(topEvidence.map((theme) => theme.name));
    const sourceText = topEvidence
      .filter((theme) => theme.sources.length > 1)
      .map((theme) => `${theme.name} (${theme.sources.slice(0, 3).join(", ")})`)
      .join("; ");
    parts.push(buildPrimaryFocus(focus, sourceText || undefined));
  }

  const signThemes = profileListText(s.signProfile);
  const houseTexts: string[] = [];
  if (t.transitHouse && s.houseProfile) {
    const themes = formatList(profileListText(s.houseProfile));
    if (themes) houseTexts.push(buildHouseThemes(t.transitHouse, themes));
  }
  if (t.natalHouse && s.natalHouseProfile && t.natalHouse !== t.transitHouse) {
    const themes = formatList(profileListText(s.natalHouseProfile));
    if (themes) houseTexts.push(`Это также связывает транзит с темами ${t.natalHouse}-го дома: ${themes}`);
  }
  if (signThemes.length > 0) houseTexts.push(buildSignThemes(formatList(signThemes)));
  if (houseTexts.length > 0) parts.push(`${houseTexts.join(". ")}.`);

  const emotions = s.polarity === "negative" ? s.planetProfile?.negativeEmotions : s.planetProfile?.positiveEmotions;
  const emotion = emotions && emotions.length > 0 ? pickByDate(emotions, date, 1) : null;
  if (emotion) parts.push(`Поэтому сегодня важно учитывать своё состояние. Вы можете ощутить: ${emotion.toLowerCase()}.`);

  return parts;
}

function describeSecondaryTransit(s: TransitSemantics, index: number): string | null {
  const t = s.transit;
  const connective = index === 0 ? "Одновременно" : "Кроме того,";
  const head = `${connective} ${t.transitBody} образует ${aspectAccusative(t.type)} с ${bodyInstrumental(t.natalBody)}`;

  if (s.relation?.description?.trim()) {
    return `${head}: ${lowerFirst(firstSentence(s.relation.description))}`;
  }
  const profileThemes = formatList(profileListText(s.planetProfile), 3);
  if (profileThemes) {
    return `${head} — в центре внимания темы: ${profileThemes}.`;
  }
  if (s.themes.length > 0) {
    return `${head} — в центре внимания тема: ${s.themes[0]}.`;
  }
  return null;
}

/** Совет дня из профилей доминирующего транзита (по полярности). */
function buildSoftRecommendation(main: TransitSemantics, date: Date): string | null {
  const profile = main.planetProfile;
  if (!profile) return null;

  const plant = pickByDate(profile.plants ?? [], date, 11);
  const crystal = pickByDate(profile.crystals ?? [], date, 12);
  const jewelry = pickByDate(profile.jewelry ?? [], date, 13);
  const color = pickByDate(profile.colors ?? [], date, 14);
  if (!plant && !crystal && !jewelry && !color) return null;

  const parts: string[] = [];
  if (plant) parts.push(`приготовить чай с ${plantForTea(plant)}`);
  if (crystal) parts.push(`выбрать кристалл «${lowerFirst(crystal)}»`);
  if (jewelry) parts.push(`надеть украшение «${lowerFirst(jewelry)}»`);
  if (color) parts.push(`добавить в образ цвет «${lowerFirst(color)}»`);

  return `Мягкая рекомендация дня: если Вам откликается символическая практика, ${parts.join(" или ")}. Это не обязательное действие и не медицинская рекомендация, а способ обозначить тему дня через небольшой личный ритуал.`;
}

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
      if (typeof c === "string" && c.trim()) return `Практический акцент дня: ${lowerFirst(ensureSentence(c))}`;
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

      // Мягкая символическая рекомендация из соответствий главной планеты.
      const softRecommendation = buildSoftRecommendation(main, date);
      if (softRecommendation) paragraphs.push(softRecommendation);

      // Мотивационная фраза из Studio — последним предложением.
      if (motivationPhrase?.trim()) {
        paragraphs.push(`Фраза дня: ${lowerFirst(ensureSentence(motivationPhrase))}`);
      }

      return renderParagraphs(paragraphs);
    } catch (error) {
      logger.error({ error }, "error generating forecast");
      return null;
    }
  }
}

export const futuristicGenerator = new FuturisticGenerator();
