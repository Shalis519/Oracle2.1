import { eq } from "drizzle-orm";
import { db, forecastTextTemplatesTable } from "@workspace/db";
import { ensureForecastTemplateSeeds } from "./runtimeSchema";
import type { ProgressionAspectWindow, ProgressionLunationWindow, SecondaryProgressionWindow } from "./progressions";

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
  return text.replace(/\{([a-zA-Z0-9_]+)\}/g, (full, key: string) => values[key] ?? full);
}

function hasUnresolvedTokens(text: string): boolean {
  return /\{[a-zA-Z0-9_]+\}/.test(text);
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

function usable(row: ProgressionTemplateRow | undefined): row is ProgressionTemplateRow {
  return Boolean(row && row.isActive && row.text.trim() && row.text.trim() !== "В разработке");
}

function selectRequired(rows: ProgressionTemplateRow[], requirements: Array<[string, string, string]>): Map<string, ProgressionTemplateRow> | null {
  const byKey = new Map(rows.map((row) => [templateKey(row.category, row.context, row.key), row]));
  const selected = new Map<string, ProgressionTemplateRow>();
  for (const [category, context, key] of requirements) {
    const row = byKey.get(templateKey(category, context, key));
    if (!usable(row)) return null;
    selected.set(templateKey(category, context, key), row);
  }
  return selected;
}

function get(selected: Map<string, ProgressionTemplateRow>, category: string, context: string, key: string): string {
  return selected.get(templateKey(category, context, key))?.text ?? "";
}

export async function renderProgressionWindow(window: SecondaryProgressionWindow): Promise<string | null> {
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
    const rendered = renderTemplate(get(selected, "progression", "moon_sign", "default"), {
      sourceBody: phrase,
      sourceSign: window.sourceSign,
      signThemes: get(selected, "progression_sign", "moon", window.sourceSignKey),
      startDate: window.startDate,
      endDate: window.endDate,
    });
    return hasUnresolvedTokens(rendered) ? null : rendered.trim();
  }

  if (window.targetHouse == null) return null;
  const selected = selectRequired(rows, [
    ["progression", "ingress_house_cusp", "default"],
    ["progression_entity", "body", window.sourceBodyKey],
    ["house", "natal", String(window.targetHouse)],
  ]);
  if (!selected) return null;
  const rendered = renderTemplate(get(selected, "progression", "ingress_house_cusp", "default"), {
    sourceBody: phrase,
    bodyThemes: get(selected, "progression_entity", "body", window.sourceBodyKey),
    targetHouse: String(window.targetHouse),
    startDate: window.startDate,
    peakDate: window.peakDate,
    endDate: window.endDate,
    orb: `${window.orb}°`,
    houseThemes: get(selected, "house", "natal", String(window.targetHouse)),
  });
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
  return phase === "applying" ? "сходящейся" : phase === "separating" ? "расходящейся" : "точной";
}

export async function renderProgressionAspectWindow(window: ProgressionAspectWindow): Promise<string | null> {
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
  if (!selected) return null;
  const rendered = renderTemplate(get(selected, "progression", "major_aspect", window.aspectKey), {
    sourceBody,
    targetBody,
    sourceThemes: get(selected, "progression_entity", "body", window.sourceBodyKey),
    targetThemes: get(selected, "entity", "natal", window.targetBodyKey),
    aspect,
    phase: phaseLabel(window.phase),
    startDate: window.startDate,
    peakDate: window.peakDate,
    endDate: window.endDate,
  });
  return hasUnresolvedTokens(rendered) ? null : rendered.trim();
}

export async function renderProgressionLunationWindow(window: ProgressionLunationWindow): Promise<string | null> {
  const targetBody = natalBodyPhrase(window.natalContactBodyKey);
  const aspect = aspectLabel(window.natalContactAspect);
  if (!targetBody || !aspect) return null;
  const rows = await loadRows();
  const selected = selectRequired(rows, [
    ["progression", "lunation", window.eventType],
    ["entity", "natal", window.natalContactBodyKey],
  ]);
  if (!selected) return null;
  const rendered = renderTemplate(get(selected, "progression", "lunation", window.eventType), {
    startDate: window.startDate,
    peakDate: window.peakDate,
    endDate: window.endDate,
    natalContactBody: targetBody,
    natalContactAspect: aspect,
    natalContactThemes: get(selected, "entity", "natal", window.natalContactBodyKey),
  });
  return hasUnresolvedTokens(rendered) ? null : rendered.trim();
}

export async function renderProgressionWindows(windows: SecondaryProgressionWindow[]): Promise<string | null> {
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
): Promise<string | null> {
  const rendered: string[] = [];
  for (const window of windows) {
    const text = await renderProgressionWindow(window);
    if (text) rendered.push(text);
  }
  for (const window of aspectWindows) {
    const text = await renderProgressionAspectWindow(window);
    if (text) rendered.push(text);
  }
  for (const window of lunationWindows) {
    const text = await renderProgressionLunationWindow(window);
    if (text) rendered.push(text);
  }
  return rendered.length ? rendered.join("\n\n") : null;
}
