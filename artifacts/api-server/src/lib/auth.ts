import { getAuth } from "@clerk/express";
import { verifyToken } from "@clerk/backend";
import type { Request, Response, NextFunction } from "express";
import { eq } from "drizzle-orm";
import { db, usersTable, type User } from "@workspace/db";
import { logger } from "./logger";

declare global {
  namespace Express {
    interface Request {
      clerkUserId?: string;
      localUser?: User;
    }
  }
}

export async function getOrCreateUser(clerkUserId: string): Promise<User> {
  const [existing] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.clerkUserId, clerkUserId));
  if (existing) return existing;

  const [created] = await db
    .insert(usersTable)
    .values({ clerkUserId, role: "user" })
    .onConflictDoNothing({ target: usersTable.clerkUserId })
    .returning();

  if (created) return created;

  const [again] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.clerkUserId, clerkUserId));
  if (!again) {
    throw new Error(`Failed to provision user for clerkUserId=${clerkUserId}`);
  }
  return again;
}

export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const auth = getAuth(req);
  let clerkUserId = auth?.userId;

  if (!clerkUserId) {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;

    if (token) {
      try {
        const payload = await verifyToken(token, {
          secretKey: process.env.CLERK_SECRET_KEY,
        });
        clerkUserId = payload.sub ?? null;
        logger.info({ userId: clerkUserId }, "Bearer token verified manually");
      } catch (err) {
        logger.warn({ err }, "Bearer token verification failed");
      }
    }
  }

  if (!clerkUserId) {
    logger.warn(
      { path: req.path, authHeader: req.headers.authorization?.slice(0, 20) },
      "No clerkUserId — returning 401"
    );
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  req.clerkUserId = clerkUserId;
  req.localUser = await getOrCreateUser(clerkUserId);
  next();
}

export async function requireAdmin(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  if (!req.localUser) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  if (req.localUser.role !== "admin") {
    res.status(403).json({ error: "Forbidden" });
    return;
  }
  next();
}
