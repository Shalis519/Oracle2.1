import { Router, type IRouter } from "express";
import { and, eq, desc } from "drizzle-orm";
import {
  db,
  contactsTable,
  familyConnectionsTable,
  usersTable,
  type Contact,
  type FamilyConnection,
} from "@workspace/db";
import {
  ListContactsResponse,
  CreateContactBody,
  CreateContactResponse,
  ListUpcomingBirthdaysResponse,
  GetContactParams,
  GetContactResponse,
  UpdateContactParams,
  UpdateContactBody,
  UpdateContactResponse,
  DeleteContactParams,
  ListFamilyConnectionsResponse,
  CreateFamilyConnectionBody,
  CreateFamilyConnectionResponse,
  DeleteFamilyConnectionParams,
} from "@workspace/api-zod";
import { requireAuth } from "../lib/auth";
import { daysUntilBirthday, turningAge } from "../lib/dates";
import { calculateSynastry, resolveContactBirthLocation } from "../lib/synastry";

const router: IRouter = Router();

function serialize(c: Contact) {
  return {
    id: c.id,
    name: c.name,
    city: c.city,
    birthDate: c.birthDate,
    birthTime: c.birthTime,
    deathDate: c.deathDate,
    phone: c.phone,
    email: c.email,
    relationshipType: c.relationshipType,
    gender: c.gender,
    birthPlace: c.birthPlace,
    notes: c.notes,
    notificationDays: c.notificationDays,
    synastryEnabled: c.synastryEnabled,
    synastryStatus: c.synastryStatus,
    synastryCalculatedAt: c.synastryCalculatedAt?.toISOString() ?? null,
    synastryInputHash: c.synastryInputHash,
    synastryData: c.synastryData,
    isActive: c.isActive,
    createdAt: c.createdAt.toISOString(),
  };
}

function serializeConnection(c: FamilyConnection) {
  return {
    id: c.id,
    contactId1: c.contactId1,
    contactId2: c.contactId2,
    connectionType: c.connectionType,
    createdAt: c.createdAt.toISOString(),
  };
}

router.get("/contacts", requireAuth, async (req, res): Promise<void> => {
  const rows = await db
    .select()
    .from(contactsTable)
    .where(eq(contactsTable.userId, req.localUser!.id))
    .orderBy(desc(contactsTable.createdAt));
  res.json(ListContactsResponse.parse(rows.map(serialize)));
});

router.post("/contacts", requireAuth, async (req, res): Promise<void> => {
  const parsed = CreateContactBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [row] = await db
    .insert(contactsTable)
    .values({ ...parsed.data, userId: req.localUser!.id })
    .returning();
  res.status(201).json(CreateContactResponse.parse(serialize(row)));
});

router.get("/contacts/birthdays", requireAuth, async (req, res): Promise<void> => {
  const rows = await db
    .select()
    .from(contactsTable)
    .where(
      and(
        eq(contactsTable.userId, req.localUser!.id),
        eq(contactsTable.isActive, true),
      ),
    );

  const upcoming = rows
    .filter((c) => c.birthDate && !c.deathDate)
    .map((c) => ({
      contactId: c.id,
      name: c.name,
      birthDate: c.birthDate as string,
      daysUntil: daysUntilBirthday(c.birthDate as string),
      turningAge: turningAge(c.birthDate as string),
    }))
    .filter((c) => c.daysUntil !== null && c.daysUntil <= 7)
    .sort((a, b) => (a.daysUntil ?? 0) - (b.daysUntil ?? 0));

  res.json(ListUpcomingBirthdaysResponse.parse(upcoming));
});

router.get("/contacts/:id", requireAuth, async (req, res): Promise<void> => {
  const params = GetContactParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [row] = await db
    .select()
    .from(contactsTable)
    .where(
      and(
        eq(contactsTable.id, params.data.id),
        eq(contactsTable.userId, req.localUser!.id),
      ),
    );
  if (!row) {
    res.status(404).json({ error: "Контакт не найден." });
    return;
  }
  res.json(GetContactResponse.parse(serialize(row)));
});

router.patch("/contacts/:id", requireAuth, async (req, res): Promise<void> => {
  const params = UpdateContactParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const body = UpdateContactBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }
  const [existing] = await db
    .select()
    .from(contactsTable)
    .where(and(
      eq(contactsTable.id, params.data.id),
      eq(contactsTable.userId, req.localUser!.id),
    ));
  if (!existing) {
    res.status(404).json({ error: "Контакт не найден." });
    return;
  }
  const sourceChanged = ["birthDate", "birthTime", "birthPlace", "city"].some((key) => key in body.data);
  const synastryReset = body.data.synastryEnabled === false
    ? { synastryStatus: "disabled", synastryCalculatedAt: null, synastryInputHash: null, synastryData: null }
    : sourceChanged && existing.synastryEnabled
      ? { synastryStatus: "stale", synastryCalculatedAt: null, synastryInputHash: null, synastryData: null }
      : body.data.synastryEnabled === true && !existing.synastryEnabled
        ? { synastryStatus: "pending" }
        : {};
  const [row] = await db
    .update(contactsTable)
    .set({ ...body.data, ...synastryReset })
    .where(eq(contactsTable.id, params.data.id))
    .returning();
  if (!row) {
    res.status(404).json({ error: "Контакт не найден." });
    return;
  }
  res.json(UpdateContactResponse.parse(serialize(row)));
});

router.post("/contacts/:id/synastry", requireAuth, async (req, res): Promise<void> => {
  const params = GetContactParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const [contact] = await db.select().from(contactsTable).where(and(
    eq(contactsTable.id, params.data.id),
    eq(contactsTable.userId, req.localUser!.id),
  ));
  if (!contact) { res.status(404).json({ error: "Контакт не найден." }); return; }
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.localUser!.id));
  const contactLocation = resolveContactBirthLocation(contact.birthPlace);
  const missing = !user?.birthDate || !user.birthTime || user.birthLatitude == null || user.birthLongitude == null
    || !contact.birthDate || !contact.birthTime || !contactLocation;
  if (missing) {
    const [updated] = await db.update(contactsTable).set({
      synastryEnabled: true,
      synastryStatus: "insufficient_data",
      synastryCalculatedAt: null,
      synastryInputHash: null,
      synastryData: null,
    }).where(eq(contactsTable.id, contact.id)).returning();
    res.status(422).json({ contact: serialize(updated), status: "insufficient_data", error: "Для синастрии нужны дата, точное время и место рождения пользователя и контакта. Город проживания контакта не используется для построения карты." });
    return;
  }
  try {
    const result = await calculateSynastry({
      userInput: {
        year: Number(user.birthDate!.slice(0, 4)), month: Number(user.birthDate!.slice(5, 7)), day: Number(user.birthDate!.slice(8, 10)),
        hour: Number(user.birthTime!.slice(0, 2)), minute: Number(user.birthTime!.slice(3, 5)), latitude: user.birthLatitude!, longitude: user.birthLongitude!, timezone: user.birthTimezone,
      },
      contactInput: {
        year: Number(contact.birthDate!.slice(0, 4)), month: Number(contact.birthDate!.slice(5, 7)), day: Number(contact.birthDate!.slice(8, 10)),
        hour: Number(contact.birthTime!.slice(0, 2)), minute: Number(contact.birthTime!.slice(3, 5)), latitude: contactLocation!.latitude, longitude: contactLocation!.longitude, timezone: contactLocation!.timezone,
      },
      userLabel: user.name || "Пользователь",
      contactLabel: contact.name,
      userGender: user.gender,
      contactGender: contact.gender,
    });
    const [updated] = await db.update(contactsTable).set({
      synastryEnabled: true,
      synastryStatus: "ready",
      synastryCalculatedAt: new Date(result.calculatedAt),
      synastryInputHash: result.inputHash,
      synastryData: JSON.stringify(result),
    }).where(eq(contactsTable.id, contact.id)).returning();
    res.json({ contact: serialize(updated), result });
  } catch (error) {
    await db.update(contactsTable).set({ synastryEnabled: true, synastryStatus: "error" }).where(eq(contactsTable.id, contact.id));
    res.status(500).json({ error: error instanceof Error ? error.message : "Не удалось рассчитать синастрию" });
  }
});

router.delete("/contacts/:id", requireAuth, async (req, res): Promise<void> => {
  const params = DeleteContactParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [row] = await db
    .delete(contactsTable)
    .where(
      and(
        eq(contactsTable.id, params.data.id),
        eq(contactsTable.userId, req.localUser!.id),
      ),
    )
    .returning();
  if (!row) {
    res.status(404).json({ error: "Контакт не найден." });
    return;
  }
  await db
    .delete(familyConnectionsTable)
    .where(
      and(
        eq(familyConnectionsTable.userId, req.localUser!.id),
        eq(familyConnectionsTable.contactId1, params.data.id),
      ),
    );
  await db
    .delete(familyConnectionsTable)
    .where(
      and(
        eq(familyConnectionsTable.userId, req.localUser!.id),
        eq(familyConnectionsTable.contactId2, params.data.id),
      ),
    );
  res.sendStatus(204);
});

router.get("/connections", requireAuth, async (req, res): Promise<void> => {
  const rows = await db
    .select()
    .from(familyConnectionsTable)
    .where(eq(familyConnectionsTable.userId, req.localUser!.id));
  res.json(ListFamilyConnectionsResponse.parse(rows.map(serializeConnection)));
});

router.post("/connections", requireAuth, async (req, res): Promise<void> => {
  const parsed = CreateFamilyConnectionBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  if (parsed.data.contactId1 === parsed.data.contactId2) {
    res.status(400).json({ error: "Нельзя связать контакт с самим собой." });
    return;
  }

  const owned = await db
    .select({ id: contactsTable.id })
    .from(contactsTable)
    .where(eq(contactsTable.userId, req.localUser!.id));
  const ownedIds = new Set(owned.map((c) => c.id));
  if (
    !ownedIds.has(parsed.data.contactId1) ||
    !ownedIds.has(parsed.data.contactId2)
  ) {
    res.status(404).json({ error: "Контакт не найден." });
    return;
  }

  const [row] = await db
    .insert(familyConnectionsTable)
    .values({ ...parsed.data, userId: req.localUser!.id })
    .returning();
  res
    .status(201)
    .json(CreateFamilyConnectionResponse.parse(serializeConnection(row)));
});

router.delete("/connections/:id", requireAuth, async (req, res): Promise<void> => {
  const params = DeleteFamilyConnectionParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [row] = await db
    .delete(familyConnectionsTable)
    .where(
      and(
        eq(familyConnectionsTable.id, params.data.id),
        eq(familyConnectionsTable.userId, req.localUser!.id),
      ),
    )
    .returning();
  if (!row) {
    res.status(404).json({ error: "Связь не найдена." });
    return;
  }
  res.sendStatus(204);
});

export default router;
