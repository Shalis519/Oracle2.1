import { getAuth } from "@clerk/express";
import type { Request, Response, NextFunction } from "express";
import { eq } from "drizzle-orm";
import { db, usersTable, type User } from "@workspace/db";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      clerkUserId?: string;
      localUser?: User;
    }
  }
}

/** JIT-provision a local user row keyed by the Clerk user id. */
export async function getOrCreateUser(clerkUserId: string): Promise<User> {
  const [existing] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.clerkUserId, clerkUserId));
  if (existing) return existing;

  const [created] = await db
    .insert(usersTable)
    .values({ clerkUserId })
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
  const clerkUserId =
    (auth?.sessionClaims?.userId as string | undefined) || auth?.userId;
  if (!clerkUserId) {
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
