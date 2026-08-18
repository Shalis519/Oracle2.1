import { logger } from "./logger";
import { eq } from "drizzle-orm";
import { db, forecastTextTemplatesTable } from "@workspace/db";
import { type TransitAspect } from "./astrology";
import { ensureForecastTemplateSeeds } from "./runtimeSchema";
function forecastTemplateKey(category: string, context: string, key: string): string {
  return `${category}:${context}:${key}`;
}
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
  bodyDative,
  bodyInstrumental,
  natalBodyInstrumental,
  ensureSentence,
  colorShades,
  firstSentence,
  formatList,
  formatHouse5Themes,
  lowerFirst,
  profileListText,
  plantForTea,
  relationToPersonalInfluence,
  renderParagraphs,
  signInPrepositional,
  transitBodyPhrase,
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

interface ForecastTemplateRow {
  category: string;
  context: string;
  key: string;
  text: string;
  sourceNote: string | null;
  isActive: boolean;
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
  if (t.natalHouse && (t.natalHouse !== t.transitHouse || t.natalHouse === 5)) {
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

// Шаблонная сборка использует литературные формулировки из Oracle Studio.
const ENABLE_CONTEXTUAL_FORECAST_TEMPLATES = true;

const ASPECT_TEMPLATE_KEYS: Record<string, string> = {
  "соединение": "conjunction",
  "секстиль": "sextile",
  "квадрат": "square",
  "тригон": "trine",
  "оппозиция": "opposition",
};
const BODY_TEMPLATE_KEYS: Record<string, string> = {
  "солнце": "sun",
  "луна": "moon",
  "меркурий": "mercury",
  "венера": "venus",
  "марс": "mars",
  "юпитер": "jupiter",
  "сатурн": "saturn",
  "уран": "uranus",
  "нептун": "neptune",
  "плутон": "pluto",
  "хирон": "chiron",
};
function bodyTemplateKey(body: string): string {
  return BODY_TEMPLATE_KEYS[body.trim().toLowerCase()] ?? body.trim().toLowerCase();
}

function renderForecastTemplate(text: string, values: Record<string, string>): string {
  return text.replace(/\{([a-zA-Z0-9_]+)\}/g, (full, key: string) => values[key] ?? full);
}

function hasUnresolvedTemplateTokens(text: string): boolean {
  return /\{[a-zA-Z0-9_]+\}/.test(text);
}

function resolveTemplateHouses(t: TransitAspect): { transitHouse: number | null; natalHouse: number | null } {
  return { transitHouse: t.transitHouse, natalHouse: t.natalHouse };
}

async function loadForecastTemplateSet(t: TransitAspect): Promise<ForecastTemplateRow[] | null> {
  const aspectKey = ASPECT_TEMPLATE_KEYS[t.type.toLowerCase()] ?? t.typeKey?.toLowerCase();
  const houses = resolveTemplateHouses(t);
  if (!aspectKey || !houses.transitHouse || !houses.natalHouse) return null;
  let rows: ForecastTemplateRow[] = [];
  try {
    await ensureForecastTemplateSeeds();
    rows = await db
      .select({ category: forecastTextTemplatesTable.category, context: forecastTextTemplatesTable.context, key: forecastTextTemplatesTable.key, text: forecastTextTemplatesTable.text, sourceNote: forecastTextTemplatesTable.sourceNote, isActive: forecastTextTemplatesTable.isActive })
      .from(forecastTextTemplatesTable)
      .where(eq(forecastTextTemplatesTable.isActive, true));
  } catch (error) {
    logger.warn({ error }, "forecast templates unavailable in Oracle Studio");
  }
  const required = [
    ["entity", "transit", bodyTemplateKey(t.transitBody)],
    ["entity", "natal", bodyTemplateKey(t.natalBody)],
    ["aspect", aspectKey, "default"],
    ["house", "transit", String(houses.transitHouse)],
    ["house", "natal", String(houses.natalHouse)],
    ["composition", aspectKey, "default"],
  ] as const;
  const byKey = new Map(rows.map((row) => [forecastTemplateKey(row.category, row.context, row.key), row]));
  const selected = required
    .map(([category, context, key]) => byKey.get(forecastTemplateKey(category, context, key)) ?? null)
    .filter((row): row is ForecastTemplateRow => Boolean(row && row.text.trim() && row.text.trim() !== "В разработке"));
  if (selected.length !== required.length) {
    const missing = required
      .filter(([category, context, key]) => !byKey.has(forecastTemplateKey(category, context, key)))
      .map(([category, context, key]) => `${category}:${context}:${key}`);
    logger.warn({
      transitBody: t.transitBody,
      natalBody: t.natalBody,
      aspect: aspectKey,
      transitHouse: houses.transitHouse,
      natalHouse: houses.natalHouse,
      missing,
    }, "forecast template set incomplete in Oracle Studio");
  }
  return selected.length === required.length ? selected : null;
}

async function describeContextualMainTransit(s: TransitSemantics): Promise<string[] | null> {
  const t = s.transit;
  const houses = resolveTemplateHouses(t);
  const rows = await loadForecastTemplateSet(t);
  if (!rows) return null;
  const get = (category: string, context: string, key: string) => rows.find((row) => row.category === category && row.context === context && row.key === key)?.text ?? "";
  const aspectKey = ASPECT_TEMPLATE_KEYS[t.type.toLowerCase()] ?? t.typeKey?.toLowerCase();
  const composition = get("composition", aspectKey, `${bodyTemplateKey(t.transitBody)}:${bodyTemplateKey(t.natalBody)}`) || get("composition", aspectKey, "default");
  const natalHouseThemeNames = houses.natalHouse === 5
    ? s.themeEvidence
        .filter((evidence) => evidence.sources.includes("Дом 5"))
        .map((evidence) => evidence.name)
    : [];
  if (houses.natalHouse === 5 && natalHouseThemeNames.length === 0) return null;
  const natalHouseThemes = houses.natalHouse === 5
    ? formatHouse5Themes(natalHouseThemeNames, "instrumental")
    : get("house", "natal", String(houses.natalHouse));
  const rendered = renderForecastTemplate(composition, {
    transitEntity: get("entity", "transit", bodyTemplateKey(t.transitBody)),
    natalPlanet: bodyDative(t.natalBody),
    natalEntity: get("entity", "natal", bodyTemplateKey(t.natalBody)),
    aspectName: t.type,
    aspectMeaning: get("aspect", aspectKey, "default"),
    transitHouse: get("house", "transit", String(houses.transitHouse)),
    natalHouse: natalHouseThemes,
  });
  if (hasUnresolvedTemplateTokens(rendered)) return null;
  return [
    buildTransitOpening({ transitBody: t.transitBody, transitSign: t.transitSign, aspect: t.type, natalBody: t.natalBody, natalSign: t.natalSign, transitHouse: houses.transitHouse, natalHouse: houses.natalHouse }),
    ensureSentence(rendered),
  ];
}

function normalizeRelationDescription(description: string): string {
  return relationToPersonalInfluence(description) ?? ensureSentence(description);
}

async function describeMainTransit(s: TransitSemantics): Promise<string[] | null> {
  const contextual = ENABLE_CONTEXTUAL_FORECAST_TEMPLATES ? await describeContextualMainTransit(s) : null;
  if (contextual) return contextual;
  if (s.relation?.description?.trim()) {
    return [
      buildTransitOpening({
        transitBody: s.transit.transitBody,
        transitSign: s.transit.transitSign,
        aspect: s.transit.type,
        natalBody: s.transit.natalBody,
        natalSign: s.transit.natalSign,
        transitHouse: s.transit.transitHouse,
        natalHouse: s.transit.natalHouse,
      }),
      normalizeRelationDescription(s.relation.description),
    ];
  }
  return null;
}

async function describeSecondaryTransit(s: TransitSemantics, index: number): Promise<string | null> {
  const connective = index === 0 ? "Одновременно" : "Кроме того,";
  const contextual = await describeContextualMainTransit(s);
  if (contextual?.[1]) {
    return `${connective} ${lowerFirst(contextual[1])}`;
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
  if (plant) parts.push(`приготовьте чай с ${plantForTea(plant)}`);
  if (crystal) parts.push(`выберите кристалл «${lowerFirst(crystal)}»`);
  if (jewelry) parts.push(`наденьте украшение «${lowerFirst(jewelry)}»`);
  if (color) parts.push(`добавьте в образ ${colorShades(color)}`);

  return `Мягкая рекомендация дня: ${parts.join(" или ")}.`;
}

function buildAdvice(main: TransitSemantics): string | null {
  const candidates =
    main.polarity === "negative"
      ? [
          main.planetProfile?.recommendations,
          main.natalPlanetProfile?.recommendations,
        ]
      : [
          main.planetProfile?.recommendations,
          main.natalPlanetProfile?.recommendations,
          main.signProfile?.recommendations,
        ];

  for (const c of candidates) {
      if (typeof c === "string" && c.trim()) return `Можно поддержать себя так: ${lowerFirst(ensureSentence(c))}`;
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

      // Абзац 1: главный транзит. Без Studio-композиции или relation.description
      // не подставляем keyMeaningsArr и не создаём скрытый fallback.
      const mainDescription = await describeMainTransit(main);
      if (!mainDescription) {
        logger.warn(
          { transit: `${main.transit.transitBody} ${main.transit.type} ${main.transit.natalBody}` },
          "no literary interpretation for main transit",
        );
        return null;
      }
      paragraphs.push(mainDescription.join(" "));

      // Абзацы 2-3: дополнительные транзиты с той же строгой сборкой Studio.
      const secondaryLines = await Promise.all(
        picked.slice(1).map((s, i) => describeSecondaryTransit(s, i)),
      );
      for (const line of secondaryLines) {
        if (line) paragraphs.push(ensureSentence(line));
      }

      // Совет дня из профилей.
      const advice = buildAdvice(main);
      if (advice) paragraphs.push(advice);

      // Мягкая символическая рекомендация из соответствий главной планеты.
      const softRecommendation = buildSoftRecommendation(main, date);
      if (softRecommendation) paragraphs.push(softRecommendation);

      // Мотивационная фраза из Studio — последним предложением.
      if (motivationPhrase?.trim()) {
        paragraphs.push(ensureSentence(motivationPhrase));
      }

      return renderParagraphs(paragraphs);
    } catch (error) {
      logger.error({ error }, "error generating forecast");
      return null;
    }
  }
}

export const futuristicGenerator = new FuturisticGenerator();
