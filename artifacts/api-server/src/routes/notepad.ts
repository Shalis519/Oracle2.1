import { Router, type IRouter } from "express";
import { and, eq, inArray } from "drizzle-orm";
import {
  db,
  notepadItemsTable,
  contactsTable,
  type NotepadItem,
} from "@workspace/db";
import {
  GetNotepadResponse,
  CreateNotepadItemBody,
  CreateNotepadItemResponse,
  UpdateNotepadItemParams,
  UpdateNotepadItemBody,
  UpdateNotepadItemResponse,
  DeleteNotepadItemParams,
} from "@workspace/api-zod";
import { requireAuth } from "../lib/auth";
import {
  todayString,
  isSpendingDay,
  computeNobleHelperActivation,
} from "../lib/oracle";
import { getActivationsForDate } from "../lib/data/activations";
import { hasPeachActivationOnDate } from "../lib/peachBlossom";
import { computeVtalkivanieActivation } from "../lib/vtalkivanie";
import { computeVtalkivanieMoneyActivation } from "../lib/vtalkivanieMoney";
import { computePersonalPostHorseActivation } from "../lib/personalPostHorse";
import { daysUntilBirthday } from "../lib/dates";
import { computeLunarForProfile, lunarReturnStartsToday, lunarReturnSummaryText } from "../lib/lunarReturn";
import { computeNatalChart } from "../lib/astrology";

const router: IRouter = Router();

function serialize(item: NotepadItem) {
  return {
    id: item.id,
    date: item.date,
    source: item.source,
    text: item.text,
    done: item.done,
  };
}

type AutoItem = { source: string; refKey: string; text: string };

async function buildAutoItems(
  userId: number,
  date: string,
  birthDate: string | null,
  birthTime: string | null,
  birthLocation: {
    latitude: number | null;
    longitude: number | null;
    timezone: string | null;
    city: string | null;
    cityLatitude: number | null;
    cityLongitude: number | null;
    cityTimezone: string | null;
    birthPlace: string | null;
  },
): Promise<AutoItem[]> {
  const auto: AutoItem[] = [];

  if (getActivationsForDate(date).length > 0) {
    auto.push({
      source: "activation",
      refKey: "activation",
      text: "Сделай активизацию, подробности во вкладке Бацзы",
    });
  }

  if (birthDate && isSpendingDay(birthDate, birthTime, date)) {
    auto.push({
      source: "spending",
      refKey: "spending",
      text: "День трат: запланируйте добровольные траты, подробности во вкладке Бацзы",
    });
  }

  if (birthDate) {
    if (hasPeachActivationOnDate(birthDate, birthTime, date, birthLocation)) {
      auto.push({
        source: "bazi-peach",
        refKey: "peach",
        text: "Цветок Персика: проведите активацию сегодня, подробности во вкладке Бацзы",
      });
    }

    const reminderDate = new Date(`${date}T12:00:00`);
    const noble = computeNobleHelperActivation(birthDate, birthTime, reminderDate, birthLocation);
    if (noble?.date === date) {
      auto.push({
        source: "bazi-noble",
        refKey: "noble",
        text: "Благородный помощник: проведите активацию сегодня, подробности во вкладке Бацзы",
      });
    }

    const vtalkivanie = computeVtalkivanieActivation(birthDate, birthTime, reminderDate, birthLocation);
    if (vtalkivanie?.date === date) {
      auto.push({
        source: "bazi-vtalkivanie",
        refKey: "vtalkivanie",
        text: "Вталкивание людей: проведите активацию сегодня, подробности во вкладке Бацзы",
      });
    }

    const vtalkivanieMoney = computeVtalkivanieMoneyActivation(birthDate, birthTime, reminderDate, birthLocation);
    if (vtalkivanieMoney?.date === date) {
      auto.push({
        source: "bazi-vtalkivanie-money",
        refKey: "vtalkivanie-money",
        text: "Вталкивание денег: проведите активацию сегодня, подробности во вкладке Бацзы",
      });
    }

    const personalPostHorse = computePersonalPostHorseActivation(birthDate, birthTime, reminderDate, birthLocation);
    if (personalPostHorse?.date === date) {
      auto.push({
        source: "bazi-personal-post-horse",
        refKey: "personal-post-horse",
        text: `Личная Путешествующая лошадь: сектор ${personalPostHorse.mountain}, подробности во вкладке Бацзы`,
      });
    }

    const lunarReturn = computeLunarForProfile(
      {
        birthDate,
        birthTime,
        birthPlace: birthLocation.birthPlace,
        birthLatitude: birthLocation.latitude,
        birthLongitude: birthLocation.longitude,
        birthTimezone: birthLocation.timezone,
        city: birthLocation.city,
        cityLatitude: birthLocation.cityLatitude,
        cityLongitude: birthLocation.cityLongitude,
        cityTimezone: birthLocation.cityTimezone,
      },
      date,
      (input) => computeNatalChart(input),
    );
    if (lunarReturnStartsToday(lunarReturn, date)) {
      auto.push({
        source: "western-lunar-return",
        refKey: `lunar-return:${lunarReturn!.returnDate}`,
        text: lunarReturnSummaryText(),
      });
    }
  }

  const contacts = await db
    .select()
    .from(contactsTable)
    .where(
      and(eq(contactsTable.userId, userId), eq(contactsTable.isActive, true)),
    );

  for (const c of contacts) {
    if (!c.birthDate || c.deathDate) continue;
    if (daysUntilBirthday(c.birthDate) === 0) {
      auto.push({
        source: "birthday",
        refKey: String(c.id),
        text: `Поздравь с днем рождения (${c.name})`,
      });
    }
  }

  return auto;
}

async function reconcileAutoItems(
  userId: number,
  date: string,
  birthDate: string | null,
  birthTime: string | null,
  birthLocation: {
    latitude: number | null;
    longitude: number | null;
    timezone: string | null;
    city: string | null;
    cityLatitude: number | null;
    cityLongitude: number | null;
    cityTimezone: string | null;
    birthPlace: string | null;
  },
): Promise<void> {
  const desired = await buildAutoItems(userId, date, birthDate, birthTime, birthLocation);

  const existing = await db
    .select()
    .from(notepadItemsTable)
    .where(
      and(
        eq(notepadItemsTable.userId, userId),
        eq(notepadItemsTable.date, date),
        inArray(notepadItemsTable.source, [
          "activation",
          "birthday",
          "spending",
          "bazi-peach",
          "bazi-noble",
          "bazi-vtalkivanie",
          "bazi-vtalkivanie-money",
          "bazi-personal-post-horse",
          "western-lunar-return",
        ]),
      ),
    );

  const desiredKeys = new Set(desired.map((d) => `${d.source}:${d.refKey}`));

  for (const d of desired) {
    const match = existing.find(
      (e) => e.source === d.source && e.refKey === d.refKey,
    );
    if (!match) {
      await db
        .insert(notepadItemsTable)
        .values({
          userId,
          date,
          source: d.source,
          refKey: d.refKey,
          text: d.text,
        })
        .onConflictDoNothing();
    } else if (match.text !== d.text) {
      await db
        .update(notepadItemsTable)
        .set({ text: d.text })
        .where(eq(notepadItemsTable.id, match.id));
    }
  }

  const staleIds = existing
    .filter((e) => !desiredKeys.has(`${e.source}:${e.refKey}`))
    .map((e) => e.id);
  if (staleIds.length > 0) {
    await db
      .delete(notepadItemsTable)
      .where(inArray(notepadItemsTable.id, staleIds));
  }
}

router.get("/notepad/today", requireAuth, async (req, res): Promise<void> => {
  const user = req.localUser!;
  const userId = user.id;
  const date = todayString();
  await reconcileAutoItems(
    userId,
    date,
    user.birthDate,
    user.birthTime,
    {
      latitude: user.birthLatitude,
      longitude: user.birthLongitude,
      timezone: user.birthTimezone,
      city: user.city,
      cityLatitude: user.cityLatitude,
      cityLongitude: user.cityLongitude,
      cityTimezone: user.cityTimezone,
      birthPlace: user.birthPlace,
    },
  );
  const rows = await db
    .select()
    .from(notepadItemsTable)
    .where(
      and(
        eq(notepadItemsTable.userId, userId),
        eq(notepadItemsTable.date, date),
      ),
    )
    .orderBy(notepadItemsTable.id);
  res.json(GetNotepadResponse.parse(rows.map(serialize)));
});

router.post("/notepad", requireAuth, async (req, res): Promise<void> => {
  const parsed = CreateNotepadItemBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [row] = await db
    .insert(notepadItemsTable)
    .values({
      userId: req.localUser!.id,
      date: todayString(),
      source: "manual",
      text: parsed.data.text ?? "",
    })
    .returning();
  res.status(201).json(CreateNotepadItemResponse.parse(serialize(row)));
});

router.patch("/notepad/:id", requireAuth, async (req, res): Promise<void> => {
  const params = UpdateNotepadItemParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const body = UpdateNotepadItemBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }

  const [existing] = await db
    .select()
    .from(notepadItemsTable)
    .where(
      and(
        eq(notepadItemsTable.id, params.data.id),
        eq(notepadItemsTable.userId, req.localUser!.id),
      ),
    );
  if (!existing) {
    res.status(404).json({ error: "Заметка не найдена." });
    return;
  }

  const updates: { done?: boolean; text?: string } = {};
  if (body.data.done !== undefined) updates.done = body.data.done;
  if (body.data.text !== undefined && existing.source === "manual") {
    updates.text = body.data.text;
  }

  if (Object.keys(updates).length === 0) {
    res.json(UpdateNotepadItemResponse.parse(serialize(existing)));
    return;
  }

  const [row] = await db
    .update(notepadItemsTable)
    .set(updates)
    .where(
      and(
        eq(notepadItemsTable.id, params.data.id),
        eq(notepadItemsTable.userId, req.localUser!.id),
      ),
    )
    .returning();
  res.json(UpdateNotepadItemResponse.parse(serialize(row)));
});

router.delete("/notepad/:id", requireAuth, async (req, res): Promise<void> => {
  const params = DeleteNotepadItemParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  await db
    .delete(notepadItemsTable)
    .where(
      and(
        eq(notepadItemsTable.id, params.data.id),
        eq(notepadItemsTable.userId, req.localUser!.id),
        eq(notepadItemsTable.source, "manual"),
      ),
    );
  res.status(204).end();
});

export default router;
