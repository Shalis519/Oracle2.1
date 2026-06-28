import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, usersTable } from "@workspace/db";
import {
  GetProfileResponse,
  UpdateProfileBody,
  UpdateProfileResponse,
} from "@workspace/api-zod";
import { requireAuth } from "../lib/auth";

const router: IRouter = Router();

function serialize(user: {
  id: number;
  name: string;
  birthDate: string | null;
  birthTime: string | null;
  birthPlace: string | null;
  photoPath: string | null;
  bedDirection: string | null;
  avatarType: string | null;
  notificationsEnabled: boolean;
  createdAt: Date;
}) {
  return {
    id: user.id,
    name: user.name,
    birthDate: user.birthDate,
    birthTime: user.birthTime,
    birthPlace: user.birthPlace,
    photoPath: user.photoPath,
    bedDirection: user.bedDirection,
    avatarType: user.avatarType,
    notificationsEnabled: user.notificationsEnabled,
    createdAt: user.createdAt.toISOString(),
  };
}

router.get("/profile", requireAuth, async (req, res): Promise<void> => {
  res.json(GetProfileResponse.parse(serialize(req.localUser!)));
});

router.put("/profile", requireAuth, async (req, res): Promise<void> => {
  const parsed = UpdateProfileBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [updated] = await db
    .update(usersTable)
    .set(parsed.data)
    .where(eq(usersTable.id, req.localUser!.id))
    .returning();

  res.json(UpdateProfileResponse.parse(serialize(updated)));
});

export default router;
