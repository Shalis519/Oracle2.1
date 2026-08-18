import { eq } from "drizzle-orm";
import { db, forecastTextTemplatesTable } from "@workspace/db";
import { ensureForecastTemplateSeeds } from "./runtimeSchema";
import type {
  ProgressionAspectWindow,
  ProgressionLunationWindow,
  SecondaryProgressionWindow,
} from "./progressions";

interface ProgressionTemplateRow {
  category: string;
  context: string;
  key: string;
  text: string;
  isActive: boolean;
}

function templateKey(category: string, context: string, key: string): string {
  return `${category}:${context}:${key}`;
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

function displayDate(value: string | undefined): string {
  if (!value) return "";
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  return match ? `${match[3]}.${match[2]}.${match[1]}` : value;
}

function maxDate(a: string, b: string): string {
  return a > b ? a : b;
}
function minDate(a: string, b: string): string {
  return a < b ? a : b;
}

type ForecastRenderContext = { startDate: string; endDate: string };

function exactPeriodText(
  window: SecondaryProgressionWindow,
  context?: ForecastRenderContext,
): string {
  if (!window.exactStartDate || !window.exactEndDate || !context)
    return window.exactStartDate && window.exactEndDate
      ? `с ${displayDate(window.exactStartDate)} по ${displayDate(window.exactEndDate)}`
      : "точная фаза не попадает в выбранный период";
  if (window.exactEndDate < context.startDate)
    return `точное соединение уже прошло до начала выбранного периода; сейчас аспект расходится`;
  if (window.exactStartDate > context.endDate)
    return `точное соединение ожидается после выбранного периода`;
  return `с ${displayDate(maxDate(window.exactStartDate, context.startDate))} по ${displayDate(minDate(window.exactEndDate, context.endDate))}`;
}

function bodyPhrase(bodyKey: string): string | null {
  const phrases: Record<string, string> = {
    sun: "Прогрессивное Солнце",
    moon: "Прогрессивная Луна",
    mercury: "Прогрессивный Меркурий",
    venus: "Прогрессивная Венера",
    mars: "Прогрессивный Марс",
  };
  return phrases[bodyKey] ?? null;
}

async function loadRows(): Promise<ProgressionTemplateRow[]> {
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

function usable(
  row: ProgressionTemplateRow | undefined,
): row is ProgressionTemplateRow {
  return Boolean(
    row &&
    row.isActive &&
    row.text.trim() &&
    row.text.trim() !== "В разработке",
  );
}

function selectRequired(
  rows: ProgressionTemplateRow[],
  requirements: Array<[string, string, string]>,
): Map<string, ProgressionTemplateRow> | null {
  const byKey = new Map(
    rows.map((row) => [templateKey(row.category, row.context, row.key), row]),
  );
  const selected = new Map<string, ProgressionTemplateRow>();
  for (const [category, context, key] of requirements) {
    const row = byKey.get(templateKey(category, context, key));
    if (!usable(row)) return null;
    selected.set(templateKey(category, context, key), row);
  }
  return selected;
}

function get(
  selected: Map<string, ProgressionTemplateRow>,
  category: string,
  context: string,
  key: string,
): string {
  return selected.get(templateKey(category, context, key))?.text ?? "";
}

export async function renderProgressionWindow(
  window: SecondaryProgressionWindow,
  context?: ForecastRenderContext,
): Promise<string | null> {
  const phrase = bodyPhrase(window.sourceBodyKey);
  if (!phrase) return null;

  const rows = await loadRows();
  if (window.eventType === "sign_ingress") {
    if (!window.sourceSignKey || !window.sourceSign) return null;
    const selected = selectRequired(rows, [
      ["progression", "moon_sign", "default"],
      ["progression_sign", "moon", window.sourceSignKey],
    ]);
    if (!selected) return null;
    const rendered = renderTemplate(
      get(selected, "progression", "moon_sign", "default"),
      {
        sourceBody: phrase,
        sourceSign: window.sourceSign,
        signThemes: get(
          selected,
          "progression_sign",
          "moon",
          window.sourceSignKey,
        ),
        startDate: displayDate(
          context
            ? maxDate(window.startDate, context.startDate)
            : window.startDate,
        ),
        endDate: displayDate(
          context ? minDate(window.endDate, context.endDate) : window.endDate,
        ),
      },
    );
    return hasUnresolvedTokens(rendered) ? null : rendered.trim();
  }

  if (window.targetHouse == null) return null;
  const selected = selectRequired(rows, [
    ["progression", "ingress_house_cusp", "default"],
    ["progression_entity", "body", window.sourceBodyKey],
    ["house", "natal", String(window.targetHouse)],
  ]);
  const specialized = selectRequired(rows, [
    [
      "progression_ingress_house",
      `${window.sourceBodyKey}:${window.targetHouse}`,
      "default",
    ],
  ]);
  if (specialized && selected) {
    const rendered = renderTemplate(
      get(
        specialized,
        "progression_ingress_house",
        `${window.sourceBodyKey}:${window.targetHouse}`,
        "default",
      ),
      {
        sourceBody: phrase,
        bodyThemes: get(
          selected,
          "progression_entity",
          "body",
          window.sourceBodyKey,
        ),
        targetHouse: String(window.targetHouse),
        startDate: displayDate(
          context
            ? maxDate(window.startDate, context.startDate)
            : window.startDate,
        ),
        peakDate: displayDate(window.peakDate),
        endDate: displayDate(
          context ? minDate(window.endDate, context.endDate) : window.endDate,
        ),
        exactStartDate: displayDate(window.exactStartDate ?? window.peakDate),
        exactEndDate: displayDate(window.exactEndDate ?? window.peakDate),
        exactPeriodText: exactPeriodText(window, context),
        orb: `${window.orb}°`,
        houseThemes: get(
          selected,
          "house",
          "natal",
          String(window.targetHouse),
        ),
      },
    );
    return hasUnresolvedTokens(rendered) ? null : rendered.trim();
  }
  if (!selected) return null;
  const rendered = renderTemplate(
    get(selected, "progression", "ingress_house_cusp", "default"),
    {
      sourceBody: phrase,
      bodyThemes: get(
        selected,
        "progression_entity",
        "body",
        window.sourceBodyKey,
      ),
      targetHouse: String(window.targetHouse),
      startDate: displayDate(
        context
          ? maxDate(window.startDate, context.startDate)
          : window.startDate,
      ),
      peakDate: displayDate(window.peakDate),
      endDate: displayDate(
        context ? minDate(window.endDate, context.endDate) : window.endDate,
      ),
      exactStartDate: displayDate(window.exactStartDate ?? window.peakDate),
      exactEndDate: displayDate(window.exactEndDate ?? window.peakDate),
      exactPeriodText: exactPeriodText(window, context),
      orb: `${window.orb}°`,
      houseThemes: get(selected, "house", "natal", String(window.targetHouse)),
    },
  );
  return hasUnresolvedTokens(rendered) ? null : rendered.trim();
}

function aspectLabel(aspectKey: string): string | null {
  const labels: Record<string, string> = {
    conjunction: "соединение",
    sextile: "секстиль",
    square: "квадрат",
    trine: "тригон",
    opposition: "оппозиция",
  };
  return labels[aspectKey] ?? null;
}

function natalBodyPhrase(bodyKey: string): string | null {
  const phrases: Record<string, string> = {
    sun: "Солнцем",
    moon: "Луной",
    mercury: "Меркурием",
    venus: "Венерой",
    mars: "Марсом",
    jupiter: "Юпитером",
    saturn: "Сатурном",
    uranus: "Ураном",
    neptune: "Нептуном",
    pluto: "Плутоном",
    chiron: "Хироном",
  };
  return phrases[bodyKey] ?? null;
}

function phaseLabel(phase: ProgressionAspectWindow["phase"]): string {
  return phase === "applying"
    ? "сходящейся"
    : phase === "separating"
      ? "расходящейся"
      : "точной";
}

function natalTechnicalBody(bodyKey: string, instrumental: string): string {
  const adjective = bodyKey === "moon" || bodyKey === "venus" ? "натальной" : bodyKey === "sun" ? "натальным" : "натальным";
  return `${adjective} ${instrumental}`;
}

function technicalAspectFallback(window: ProgressionAspectWindow, sourceBody: string, targetBody: string, aspect: string): string {
  const period = window.startDate === window.endDate
    ? displayDate(window.startDate)
    : `с ${displayDate(window.startDate)} по ${displayDate(window.endDate)}`;
  const displayPeriod = period.startsWith("с") ? `С${period.slice(1)}` : period;
  const technicalLine = `${displayPeriod}: ${sourceBody} образует ${aspect} с ${natalTechnicalBody(window.targetBodyKey, targetBody)}; точность — ${displayDate(window.peakDate)}, фаза ${phaseLabel(window.phase)}, орбис — ${window.orb.toFixed(2)}°.`;
  return `${technicalLine}\nВ разработке`;
}

export async function renderProgressionAspectWindow(
  window: ProgressionAspectWindow,
): Promise<string | null> {
  const sourceBody = bodyPhrase(window.sourceBodyKey);
  const targetBody = natalBodyPhrase(window.targetBodyKey);
  const aspect = aspectLabel(window.aspectKey);
  if (!sourceBody || !targetBody || !aspect) return null;
  const rows = await loadRows();
  const selected = selectRequired(rows, [
    ["progression", "major_aspect", window.aspectKey],
    ["progression_entity", "body", window.sourceBodyKey],
    ["entity", "natal", window.targetBodyKey],
  ]);
  if (!selected) return technicalAspectFallback(window, sourceBody, targetBody, aspect);
  const rendered = renderTemplate(
    get(selected, "progression", "major_aspect", window.aspectKey),
    {
      sourceBody,
      targetBody,
      sourceThemes: get(
        selected,
        "progression_entity",
        "body",
        window.sourceBodyKey,
      ),
      targetThemes: get(selected, "entity", "natal", window.targetBodyKey),
      aspect,
      phase: phaseLabel(window.phase),
      startDate: displayDate(window.startDate),
      peakDate: displayDate(window.peakDate),
      endDate: displayDate(window.endDate),
    },
  );
  return hasUnresolvedTokens(rendered)
    ? technicalAspectFallback(window, sourceBody, targetBody, aspect)
    : rendered.trim();
}

export async function renderProgressionLunationWindow(
  window: ProgressionLunationWindow,
): Promise<string | null> {
  const targetBody = natalBodyPhrase(window.natalContactBodyKey);
  const aspect = aspectLabel(window.natalContactAspect);
  if (!targetBody || !aspect) return null;
  const rows = await loadRows();
  const selected = selectRequired(rows, [
    ["progression", "lunation", window.eventType],
    ["entity", "natal", window.natalContactBodyKey],
  ]);
  if (!selected) return null;
  const rendered = renderTemplate(
    get(selected, "progression", "lunation", window.eventType),
    {
      startDate: displayDate(window.startDate),
      peakDate: displayDate(window.peakDate),
      endDate: displayDate(window.endDate),
      natalContactBody: targetBody,
      natalContactAspect: aspect,
      natalContactThemes: get(
        selected,
        "entity",
        "natal",
        window.natalContactBodyKey,
      ),
    },
  );
  return hasUnresolvedTokens(rendered) ? null : rendered.trim();
}

export async function renderProgressionWindows(
  windows: SecondaryProgressionWindow[],
): Promise<string | null> {
  const rendered: string[] = [];
  for (const window of windows) {
    const text = await renderProgressionWindow(window);
    if (text) rendered.push(text);
  }
  return rendered.length ? rendered.join("\n\n") : null;
}

export async function renderProgressionEventWindows(
  windows: SecondaryProgressionWindow[],
  aspectWindows: ProgressionAspectWindow[],
  lunationWindows: ProgressionLunationWindow[],
  context?: ForecastRenderContext,
): Promise<string | null> {
  const rendered: string[] = [];
  const exactPhaseAlreadyPassed = (exactEndDate: string | undefined): boolean =>
    Boolean(context && exactEndDate && exactEndDate < context.startDate);

  for (const window of windows) {
    // Для входа прогрессивной планеты в дом используем границу точной фазы,
    // а не конец всего широкого орбиса. После экзакта аспект не включаем.
    if (exactPhaseAlreadyPassed(window.exactEndDate ?? window.peakDate))
      continue;
    const text = await renderProgressionWindow(window, context);
    if (text) rendered.push(text);
  }
  for (const window of aspectWindows) {
    // У аспектных окон отдельные exactStart/exactEnd не хранятся;
    // peakDate является датой экзакта.
    if (exactPhaseAlreadyPassed(window.peakDate)) continue;
    const text = await renderProgressionAspectWindow(window);
    if (text) rendered.push(text);
  }
  for (const window of lunationWindows) {
    if (exactPhaseAlreadyPassed(window.peakDate)) continue;
    const text = await renderProgressionLunationWindow(window);
    if (text) rendered.push(text);
  }
  return rendered.length ? rendered.join("\n\n") : null;
}
