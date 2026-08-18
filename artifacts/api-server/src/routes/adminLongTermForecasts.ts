import { Router, type IRouter } from "express";
import { and, desc, eq } from "drizzle-orm";
import { Document, HeadingLevel, Packer, Paragraph, TextRun } from "docx";
import { db, contactsTable } from "@workspace/db";
import { longTermForecastsTable } from "@workspace/db/schema";
import { requireAdmin, requireAuth } from "../lib/auth";
import { computeSecondaryLunationWindows, computeSecondaryProgressionAspectWindows, computeSecondaryProgressionWindows, computeSecondaryProgressions, computeSolarArcDirections, type SecondaryProgressionWindow } from "../lib/progressions";
import { computeNatalChart, computeTransits, type NatalChartInput } from "../lib/astrology";
import { renderProgressionEventWindows } from "../lib/progressionLiterary";

const router: IRouter = Router();

function parseDate(value: unknown, field: string): Date {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new Error(`Некорректное поле ${field}`);
  const date = new Date(`${value}T12:00:00.000Z`);
  if (Number.isNaN(date.getTime())) throw new Error(`Некорректное поле ${field}`);
  return date;
}

async function parseInput(body: Record<string, unknown>, userId: number): Promise<{ input: NatalChartInput; birthSnapshot: Record<string, unknown> }> {
  const contactId = typeof body.contactId === "number" ? body.contactId : Number(body.contactId);
  let birth = body.birthSnapshot as Record<string, unknown> | undefined;
  if (Number.isInteger(contactId) && contactId > 0) {
    const [contact] = await db.select().from(contactsTable).where(and(eq(contactsTable.id, contactId), eq(contactsTable.userId, userId)));
    if (!contact) throw new Error("Выбранный контакт не найден");
    if (!contact.birthDate || !contact.birthTime || !contact.birthPlace) throw new Error("Заполните в карточке контакта дату, точное время и город рождения");
    if (contact.birthLatitude == null || contact.birthLongitude == null || !contact.birthTimezone) {
      throw new Error("Город контакта не выбран из встроенной базы. Откройте карточку контакта и заново выберите город рождения");
    }
    const latitude = contact.birthLatitude;
    const longitude = contact.birthLongitude;
    const timezone = contact.birthTimezone;
    const [year, month, day] = contact.birthDate.split("-").map(Number);
    const [hour, minute] = contact.birthTime.slice(0, 5).split(":").map(Number);
    birth = { year, month, day, hour, minute, latitude, longitude, timezone, city: contact.birthPlace, birthPlace: contact.birthPlace };
  }
  if (!birth || typeof birth !== "object") throw new Error("Укажите данные рождения или выберите сохранённый контакт");
  const required = ["year", "month", "day", "hour", "minute", "latitude", "longitude"];
  for (const key of required) if (typeof birth[key] !== "number" || !Number.isFinite(birth[key])) throw new Error(`Некорректное поле рождения: ${key}`);
  return {
    input: {
      year: Number(birth.year), month: Number(birth.month), day: Number(birth.day),
      hour: Number(birth.hour), minute: Number(birth.minute), second: typeof birth.second === "number" ? birth.second : 0,
      latitude: Number(birth.latitude), longitude: Number(birth.longitude),
      timezone: typeof birth.timezone === "string" ? birth.timezone : null,
    },
    birthSnapshot: birth,
  };
}

function serialize(row: typeof longTermForecastsTable.$inferSelect) {
  return { ...row, createdAt: row.createdAt.toISOString(), updatedAt: row.updatedAt.toISOString() };
}

function isoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function formatDisplayDate(value: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  return match ? `${match[3]}.${match[2]}.${match[1]}` : value;
}

function formatBirthDate(snapshot: Record<string, unknown>): string {
  const day = Number(snapshot.day);
  const month = Number(snapshot.month);
  const year = Number(snapshot.year);
  if (![day, month, year].every(Number.isFinite)) return "дата рождения не указана";
  return `${String(day).padStart(2, "0")}.${String(month).padStart(2, "0")}.${year}`;
}

function formatBirthTime(snapshot: Record<string, unknown>): string {
  const hour = Number(snapshot.hour);
  const minute = Number(snapshot.minute);
  if (![hour, minute].every(Number.isFinite)) return "время не указано";
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

function periodLabel(periodType: string): string {
  if (periodType === "1m") return "1 месяц";
  if (periodType === "3m") return "3 месяца";
  if (periodType === "6m") return "6 месяцев";
  return periodType;
}

function exportBlockOrder(block: Record<string, unknown>): number {
  const order: Record<string, number> = { "solar-arc": 0, secondary: 1, transits: 2 };
  return typeof block.id === "string" ? (order[block.id] ?? 99) : 99;
}

function exportBlockTitle(block: Record<string, unknown>): string {
  if (block.id === "solar-arc") return "Длительные дирекции";
  if (block.id === "secondary") return "Прогрессии";
  if (block.id === "transits") return "Транзиты";
  return typeof block.title === "string" && block.title.trim() ? block.title : "Прогнозный период";
}

function buildForecastTimeline(
  input: NatalChartInput,
  natal: ReturnType<typeof computeNatalChart>,
  dateFrom: Date,
  dateTo: Date,
) {
  const timeline: Array<Record<string, unknown>> = [];
  const cursor = new Date(dateFrom);
  const end = new Date(dateTo);
  while (cursor <= end && timeline.length < 32) {
    const date = isoDate(cursor);
    const transit = withoutExcludedLongTermBodies(computeTransits(natal, date, input.latitude, input.longitude, input.timezone, { excludedBodies: ["moon"], excludedNatalBodies: ["chiron", "lilith", "northnode", "southnode"] }));
    const progressions = withoutExcludedLongTermBodies(computeSecondaryProgressions(input, cursor));
    const directions = withoutExcludedLongTermBodies(computeSolarArcDirections(input, cursor));
    timeline.push({
      date,
      transit,
      progressions: {
        targetDate: progressions.targetDate,
        progressedDate: progressions.progressedDate,
        ageYears: progressions.ageYears,
        solarArc: progressions.solarArc,
        aspects: progressions.aspects.slice(0, 12),
      },
      directions: {
        targetDate: directions.targetDate,
        solarArc: directions.solarArc,
        aspects: directions.aspects.slice(0, 12),
      },
    });
    cursor.setUTCDate(cursor.getUTCDate() + 7);
  }
  return timeline;
}

const LONG_TERM_EXCLUDED_BODY_KEYS = new Set(["chiron", "lilith", "northnode", "southnode"]);

function withoutExcludedLongTermBodies<T extends object>(result: T): T;
function withoutExcludedLongTermBodies<T extends object>(result: T | null): T | null;
function withoutExcludedLongTermBodies<T extends object>(result: T | null): T | null {
  if (!result) return result;
  const source = result as { aspects?: unknown; points?: unknown };
  const aspects = Array.isArray(source.aspects)
    ? source.aspects.filter((aspect) => {
      if (!aspect || typeof aspect !== "object") return true;
      const item = aspect as Record<string, unknown>;
      return ![item.sourceBodyKey, item.targetBodyKey, item.transitBodyKey, item.natalBodyKey, item.natalContactBodyKey]
        .some((key) => LONG_TERM_EXCLUDED_BODY_KEYS.has(String(key)));
    })
    : source.aspects;
  const points = Array.isArray(source.points)
    ? source.points.filter((point) => !LONG_TERM_EXCLUDED_BODY_KEYS.has(String((point as Record<string, unknown>).key)))
    : source.points;
  return { ...result, aspects, points } as T;
}

const ASPECT_LABELS: Record<string, string> = {
  conjunction: "соединение",
  opposition: "оппозиция",
  trine: "тригон",
  square: "квадрат",
  sextile: "секстиль",
  quincunx: "квинконс",
};

function buildDraftBlockTexts(timeline: Array<Record<string, unknown>>, progressionWindows: SecondaryProgressionWindow[]) {
  const transitLines: string[] = [];
  const progressionLines: string[] = [];
  const directionLines: string[] = [];
  for (const window of progressionWindows) {
    if (window.eventType === "sign_ingress") {
      progressionLines.push(`${formatDisplayDate(window.startDate)} — ${formatDisplayDate(window.endDate)}: прогрессивная Луна в ${window.sourceSign}; длительный эмоционально-психологический фон.`);
    } else {
      progressionLines.push(`${formatDisplayDate(window.startDate)} — ${formatDisplayDate(window.endDate)}: прогрессивный ${window.sourceBody} — влияние на куспид ${window.targetHouse}-го дома, точность ${formatDisplayDate(window.peakDate)}, орбис ${window.orb}°.`);
    }
  }
  for (const point of timeline) {
    const date = String(point.date);
    const transit = point.transit as { aspects?: Array<Record<string, unknown>> } | null;
    for (const aspect of transit?.aspects ?? []) {
      transitLines.push(`${formatDisplayDate(date)}: транзитный ${String(aspect.transitBody)} образует ${String(aspect.type).toLowerCase()} с ${String(aspect.natalBody)}; дом транзита — ${String(aspect.transitHouse ?? "не указан")}, орбис — ${String(aspect.orb)}°.`);
    }
    const progressions = point.progressions as { aspects?: Array<Record<string, unknown>> } | undefined;
    for (const aspect of progressions?.aspects ?? []) {
      progressionLines.push(`${formatDisplayDate(date)}: прогрессивный ${String(aspect.sourceBody)} образует ${ASPECT_LABELS[String(aspect.aspectKey)] ?? String(aspect.aspectKey)} к ${String(aspect.targetBody)}; орбис — ${String(aspect.orb)}°.`);
    }
    const directions = point.directions as { aspects?: Array<Record<string, unknown>> } | undefined;
    for (const aspect of directions?.aspects ?? []) {
      directionLines.push(`${formatDisplayDate(date)}: направленный ${String(aspect.sourceBody)} образует ${ASPECT_LABELS[String(aspect.aspectKey)] ?? String(aspect.aspectKey)} к ${String(aspect.targetBody)}; орбис — ${String(aspect.orb)}°.`);
    }
  }
  const draft = (lines: string[], empty: string) => lines.length ? lines.slice(0, 24).join("\\n") : empty;
  return {
    transits: draft(transitLines, "За выбранный период значимые транзитные аспекты не выделены."),
    progressions: draft(progressionLines, "За выбранный период точные аспекты вторичных прогрессий не выделены."),
    directions: draft(directionLines, "За выбранный период точные аспекты солнечных дуг не выделены."),
  };
}

router.get("/admin/long-term-forecasts", requireAuth, requireAdmin, async (req, res): Promise<void> => {
  const userId = typeof req.query.userId === "string" ? Number(req.query.userId) : undefined;
  const rows = await db.select().from(longTermForecastsTable)
    .where(userId ? eq(longTermForecastsTable.userId, userId) : undefined)
    .orderBy(desc(longTermForecastsTable.updatedAt));
  res.json({ forecasts: rows.map(serialize) });
});

router.post("/admin/long-term-forecasts/calculate", requireAuth, requireAdmin, async (req, res): Promise<void> => {
  try {
    const body = req.body as Record<string, unknown>;
    const { input } = await parseInput(body, req.localUser!.id);
    const dateFrom = parseDate(body.dateFrom, "dateFrom");
    const dateTo = parseDate(body.dateTo, "dateTo");
    if (dateTo < dateFrom) throw new Error("Дата окончания не может быть раньше даты начала");
    const natal = computeNatalChart(input);
    const progressions = withoutExcludedLongTermBodies(computeSecondaryProgressions(input, dateFrom));
    const progressionWindows = computeSecondaryProgressionWindows(input, dateFrom, dateTo, natal)
      .filter((window) => !LONG_TERM_EXCLUDED_BODY_KEYS.has(window.sourceBodyKey));
    const progressionAspectWindows = computeSecondaryProgressionAspectWindows(input, dateFrom, dateTo, natal)
      .filter((window) => !LONG_TERM_EXCLUDED_BODY_KEYS.has(window.sourceBodyKey) && !LONG_TERM_EXCLUDED_BODY_KEYS.has(window.targetBodyKey));
    const progressionLunationWindows = computeSecondaryLunationWindows(input, dateFrom, dateTo, natal)
      .filter((window) => !LONG_TERM_EXCLUDED_BODY_KEYS.has(window.natalContactBodyKey));
    const progressionText = await renderProgressionEventWindows(progressionWindows, progressionAspectWindows, progressionLunationWindows);
    const directions = withoutExcludedLongTermBodies(computeSolarArcDirections(input, dateFrom));
    const transit = withoutExcludedLongTermBodies(computeTransits(natal, String(body.dateFrom), input.latitude, input.longitude, input.timezone, { excludedBodies: ["moon"], excludedNatalBodies: ["chiron", "lilith", "northnode", "southnode"] }));
    const timeline = buildForecastTimeline(input, natal, dateFrom, dateTo);
    res.json({ dateFrom: String(body.dateFrom), dateTo: String(body.dateTo), natal, progressions, progressionWindows, progressionAspectWindows, progressionLunationWindows, progressionText, directions, transit, timeline, blocks: [] });
  } catch (error) {
    res.status(400).json({ error: error instanceof Error ? error.message : "Не удалось выполнить расчёт" });
  }
});

router.post("/admin/long-term-forecasts", requireAuth, requireAdmin, async (req, res): Promise<void> => {
  try {
    const body = req.body as Record<string, unknown>;
    const dateFrom = String(body.dateFrom ?? "");
    const dateTo = String(body.dateTo ?? "");
    parseDate(dateFrom, "dateFrom"); parseDate(dateTo, "dateTo");
    if (typeof body.clientName !== "string" || !body.clientName.trim()) throw new Error("Нужно имя клиента");
    if (!["1m", "3m", "6m"].includes(String(body.periodType))) throw new Error("Период должен быть 1m, 3m или 6m");
    const { input, birthSnapshot } = await parseInput(body, req.localUser!.id);
    const natal = computeNatalChart(input);
    const parsedDateFrom = parseDate(dateFrom, "dateFrom");
    const parsedDateTo = parseDate(dateTo, "dateTo");
    const progressions = withoutExcludedLongTermBodies(computeSecondaryProgressions(input, parsedDateFrom));
    const progressionWindows = computeSecondaryProgressionWindows(input, parsedDateFrom, parsedDateTo, natal)
      .filter((window) => !LONG_TERM_EXCLUDED_BODY_KEYS.has(window.sourceBodyKey));
    const progressionAspectWindows = computeSecondaryProgressionAspectWindows(input, parsedDateFrom, parsedDateTo, natal)
      .filter((window) => !LONG_TERM_EXCLUDED_BODY_KEYS.has(window.sourceBodyKey) && !LONG_TERM_EXCLUDED_BODY_KEYS.has(window.targetBodyKey));
    const progressionLunationWindows = computeSecondaryLunationWindows(input, parsedDateFrom, parsedDateTo, natal)
      .filter((window) => !LONG_TERM_EXCLUDED_BODY_KEYS.has(window.natalContactBodyKey));
    const progressionText = await renderProgressionEventWindows(progressionWindows, progressionAspectWindows, progressionLunationWindows);
    const directions = withoutExcludedLongTermBodies(computeSolarArcDirections(input, parsedDateFrom));
    const transit = withoutExcludedLongTermBodies(computeTransits(natal, dateFrom, input.latitude, input.longitude, input.timezone, { excludedBodies: ["moon"], excludedNatalBodies: ["chiron", "lilith", "northnode", "southnode"] }));
    const timeline = buildForecastTimeline(input, natal, parsedDateFrom, parsedDateTo);
    const draftTexts = buildDraftBlockTexts(timeline, progressionWindows);
    const [row] = await db.insert(longTermForecastsTable).values({
      userId: typeof body.userId === "number" ? body.userId : null,
      clientName: body.clientName.trim(), periodType: String(body.periodType), dateFrom, dateTo,
      status: "draft", title: typeof body.title === "string" && body.title.trim() ? body.title.trim() : `Долгосрочный прогноз для ${body.clientName.trim()}`,
      introText: typeof body.introText === "string" ? body.introText : "",
      birthSnapshot,
      calculationPayload: { natal, progressions, progressionWindows, progressionAspectWindows, progressionLunationWindows, progressionText, directions, transit, timeline },
      blocks: Array.isArray(body.blocks) ? body.blocks : [
        { id: "transits", method: "Транзиты", title: "Внешние триггеры периода", text: draftTexts.transits, dateFrom, dateTo, isVisible: true },
        { id: "secondary", method: "Прогрессии", title: "Внутренняя динамика и развитие", text: progressionText ?? "Литературные шаблоны прогрессий ещё не заполнены в Oracle Studio.", dateFrom, dateTo, isVisible: true },
        { id: "solar-arc", method: "Дирекции", title: "Символические поворотные точки", text: draftTexts.directions, dateFrom, dateTo, isVisible: true },
      ],
      version: 1, createdBy: req.clerkUserId ?? "admin", updatedBy: req.clerkUserId ?? "admin",
    }).returning();
    res.status(201).json(serialize(row));
  } catch (error) {
    res.status(400).json({ error: error instanceof Error ? error.message : "Не удалось сохранить прогноз" });
  }
});

router.get("/admin/long-term-forecasts/:id", requireAuth, requireAdmin, async (req, res): Promise<void> => {
  const id = Number(req.params.id);
  const [row] = await db.select().from(longTermForecastsTable).where(eq(longTermForecastsTable.id, id));
  if (!row) { res.status(404).json({ error: "Прогноз не найден" }); return; }
  res.json(serialize(row));
});

router.put("/admin/long-term-forecasts/:id", requireAuth, requireAdmin, async (req, res): Promise<void> => {
  const id = Number(req.params.id);
  const body = req.body as Record<string, unknown>;
  const updates: Partial<typeof longTermForecastsTable.$inferInsert> = { updatedAt: new Date(), updatedBy: req.clerkUserId ?? "admin" };
  if (typeof body.title === "string") updates.title = body.title.trim();
  if (typeof body.introText === "string") updates.introText = body.introText;
  if (Array.isArray(body.blocks)) updates.blocks = body.blocks;
  if (["draft", "edited", "final"].includes(String(body.status))) updates.status = String(body.status);
  const [row] = await db.update(longTermForecastsTable).set(updates).where(eq(longTermForecastsTable.id, id)).returning();
  if (!row) { res.status(404).json({ error: "Прогноз не найден" }); return; }
  res.json(serialize(row));
});

router.get("/admin/long-term-forecasts/:id/export", requireAuth, requireAdmin, async (req, res): Promise<void> => {
  const id = Number(req.params.id);
  const [row] = await db.select().from(longTermForecastsTable).where(eq(longTermForecastsTable.id, id));
  if (!row) { res.status(404).json({ error: "Прогноз не найден" }); return; }
  const blocks = Array.isArray(row.blocks) ? row.blocks as Array<Record<string, unknown>> : [];
  const birthSnapshot = row.birthSnapshot as Record<string, unknown>;
  const city = typeof birthSnapshot.birthPlace === "string" && birthSnapshot.birthPlace.trim()
    ? birthSnapshot.birthPlace.trim()
    : typeof birthSnapshot.city === "string" && birthSnapshot.city.trim()
      ? birthSnapshot.city.trim()
      : "город не указан";
  const identityLine = `${row.clientName}, ${formatBirthDate(birthSnapshot)}, ${city}, ${formatBirthTime(birthSnapshot)}`;
  const children: Paragraph[] = [
    new Paragraph({ text: identityLine, heading: HeadingLevel.TITLE }),
    new Paragraph({ text: `Прогностика на ${periodLabel(row.periodType)}`, heading: HeadingLevel.HEADING_1 }),
  ];
  if (row.introText.trim()) children.push(new Paragraph(row.introText));
  for (const block of [...blocks].sort((a, b) => exportBlockOrder(a) - exportBlockOrder(b))) {
    if (block.isVisible === false) continue;
    const title = exportBlockTitle(block);
    const text = typeof block.text === "string" ? block.text.trim() : "";
    if (!text) continue;
    children.push(new Paragraph({ text: String(title), heading: HeadingLevel.HEADING_2 }));
    children.push(new Paragraph(text));
    if (typeof block.method === "string" && block.method.trim()) children.push(new Paragraph({ children: [new TextRun({ text: `Источник: ${block.method}`, italics: true, color: "777777" })] }));
  }
  const buffer = await Packer.toBuffer(new Document({ sections: [{ children }] }));
  const safeName = row.clientName.toLowerCase().replace(/[^a-zа-я0-9]+/gi, "-").replace(/^-|-$/g, "") || "klient";
  res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
  res.setHeader("Content-Disposition", `attachment; filename*=UTF-8''aether-oracle-prognoz-${encodeURIComponent(safeName)}-${row.dateFrom}-${row.dateTo}.docx`);
  res.send(buffer);
});

export default router;
