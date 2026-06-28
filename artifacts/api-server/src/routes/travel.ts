import { Router, type IRouter } from "express";
import { and, eq } from "drizzle-orm";
import { db, travelsTable, type Travel } from "@workspace/db";
import {
  ListTravelsResponse,
  CreateTravelBody,
  CreateTravelResponse,
  GetTravelStatsResponse,
  UpdateTravelParams,
  UpdateTravelBody,
  UpdateTravelResponse,
  DeleteTravelParams,
} from "@workspace/api-zod";
import { requireAuth } from "../lib/auth";

const router: IRouter = Router();

function serialize(t: Travel) {
  return {
    id: t.id,
    countryCode: t.countryCode,
    countryName: t.countryName,
    visited: t.visited,
    wishlist: t.wishlist,
    visitedDate: t.visitedDate,
    notes: t.notes,
    createdAt: t.createdAt.toISOString(),
  };
}

router.get("/travels", requireAuth, async (req, res): Promise<void> => {
  const rows = await db
    .select()
    .from(travelsTable)
    .where(eq(travelsTable.userId, req.localUser!.id))
    .orderBy(travelsTable.id);
  res.json(ListTravelsResponse.parse(rows.map(serialize)));
});

router.post("/travels", requireAuth, async (req, res): Promise<void> => {
  const parsed = CreateTravelBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [existing] = await db
    .select()
    .from(travelsTable)
    .where(
      and(
        eq(travelsTable.userId, req.localUser!.id),
        eq(travelsTable.countryCode, parsed.data.countryCode),
      ),
    );

  if (existing) {
    const [updated] = await db
      .update(travelsTable)
      .set({
        countryName: parsed.data.countryName,
        visited: parsed.data.visited ?? existing.visited,
        wishlist: parsed.data.wishlist ?? existing.wishlist,
        visitedDate: parsed.data.visitedDate ?? existing.visitedDate,
        notes: parsed.data.notes ?? existing.notes,
      })
      .where(eq(travelsTable.id, existing.id))
      .returning();
    res.status(201).json(CreateTravelResponse.parse(serialize(updated)));
    return;
  }

  const [row] = await db
    .insert(travelsTable)
    .values({
      userId: req.localUser!.id,
      countryCode: parsed.data.countryCode,
      countryName: parsed.data.countryName,
      visited: parsed.data.visited ?? false,
      wishlist: parsed.data.wishlist ?? false,
      visitedDate: parsed.data.visitedDate ?? null,
      notes: parsed.data.notes ?? null,
    })
    .returning();
  res.status(201).json(CreateTravelResponse.parse(serialize(row)));
});

router.get("/travels/stats", requireAuth, async (req, res): Promise<void> => {
  const rows = await db
    .select()
    .from(travelsTable)
    .where(eq(travelsTable.userId, req.localUser!.id));
  res.json(
    GetTravelStatsResponse.parse({
      visitedCount: rows.filter((r) => r.visited).length,
      wishlistCount: rows.filter((r) => r.wishlist).length,
    }),
  );
});

router.patch("/travels/:id", requireAuth, async (req, res): Promise<void> => {
  const params = UpdateTravelParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const body = UpdateTravelBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }
  const [row] = await db
    .update(travelsTable)
    .set(body.data)
    .where(
      and(
        eq(travelsTable.id, params.data.id),
        eq(travelsTable.userId, req.localUser!.id),
      ),
    )
    .returning();
  if (!row) {
    res.status(404).json({ error: "Запись не найдена." });
    return;
  }
  res.json(UpdateTravelResponse.parse(serialize(row)));
});

router.delete("/travels/:id", requireAuth, async (req, res): Promise<void> => {
  const params = DeleteTravelParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [row] = await db
    .delete(travelsTable)
    .where(
      and(
        eq(travelsTable.id, params.data.id),
        eq(travelsTable.userId, req.localUser!.id),
      ),
    )
    .returning();
  if (!row) {
    res.status(404).json({ error: "Запись не найдена." });
    return;
  }
  res.sendStatus(204);
});

export default router;
