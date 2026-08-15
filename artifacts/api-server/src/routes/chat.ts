import { Router, type IRouter } from "express";
import { and, desc, eq, gt, max, sql } from "drizzle-orm";
import { clerkClient } from "@clerk/express";
import {
  db,
  chatReadStateTable,
  messagesTable,
  type Message,
} from "@workspace/db";
import {
  ListChatMessagesResponse,
  SendChatMessageBody,
} from "@workspace/api-zod";
import { requireAuth } from "../lib/auth";
import { moderateMessage } from "../lib/chatModeration";

const router: IRouter = Router();

const MESSAGE_LIMIT = 200;

function serialize(m: Message, currentUserId: number) {
  return {
    id: m.id,
    authorName: m.authorName,
    authorAvatar: m.authorAvatar,
    body: m.body,
    createdAt: m.createdAt.toISOString(),
    mine: m.userId === currentUserId,
  };
}

async function resolveAuthor(
  clerkUserId: string,
  fallbackName: string,
): Promise<{ name: string; avatar: string | null }> {
  const localName = fallbackName?.trim();
  try {
    const user = await clerkClient.users.getUser(clerkUserId);
    const full = [user.firstName, user.lastName]
      .filter((p): p is string => Boolean(p && p.trim()))
      .join(" ")
      .trim();
    const name =
      localName ||
      full ||
      user.username ||
      user.primaryEmailAddress?.emailAddress?.split("@")[0] ||
      "Гость";
    return { name, avatar: user.imageUrl ?? null };
  } catch {
    return { name: localName || "Гость", avatar: null };
  }
}

router.get("/chat/messages", requireAuth, async (req, res): Promise<void> => {
  const rows = await db
    .select()
    .from(messagesTable)
    .orderBy(desc(messagesTable.createdAt))
    .limit(MESSAGE_LIMIT);
  rows.reverse();
  res.json(
    ListChatMessagesResponse.parse(
      rows.map((m) => serialize(m, req.localUser!.id)),
    ),
  );
});

router.get("/chat/unread", requireAuth, async (req, res): Promise<void> => {
  const [state] = await db
    .select({ lastReadMessageId: chatReadStateTable.lastReadMessageId })
    .from(chatReadStateTable)
    .where(eq(chatReadStateTable.userId, req.localUser!.id));

  if (!state) {
    const [latest] = await db
      .select({ id: max(messagesTable.id) })
      .from(messagesTable);
    await db
      .insert(chatReadStateTable)
      .values({ userId: req.localUser!.id, lastReadMessageId: Number(latest?.id ?? 0) })
      .onConflictDoNothing({ target: chatReadStateTable.userId });
    res.json({ unreadCount: 0 });
    return;
  }

  const [result] = await db
    .select({ count: sql<number>`count(*)` })
    .from(messagesTable)
    .where(
      and(
        gt(messagesTable.id, state?.lastReadMessageId ?? 0),
        sql`${messagesTable.userId} <> ${req.localUser!.id}`,
      ),
    );

  res.json({ unreadCount: Number(result?.count ?? 0) });
});

router.post("/chat/read", requireAuth, async (req, res): Promise<void> => {
  const messageId = Number((req.body as Record<string, unknown>)?.messageId);
  if (!Number.isInteger(messageId) || messageId < 0) {
    res.status(400).json({ error: "Invalid messageId" });
    return;
  }

  await db
    .insert(chatReadStateTable)
    .values({ userId: req.localUser!.id, lastReadMessageId: messageId })
    .onConflictDoUpdate({
      target: chatReadStateTable.userId,
      set: {
        lastReadMessageId: sql`GREATEST(${chatReadStateTable.lastReadMessageId}, ${messageId})`,
        updatedAt: new Date(),
      },
    });

  res.json({ unreadCount: 0 });
});

router.post("/chat/messages", requireAuth, async (req, res): Promise<void> => {
  const parsed = SendChatMessageBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const moderation = moderateMessage(parsed.data.body);
  if (!moderation.ok) {
    res.status(400).json({ error: moderation.error });
    return;
  }

  const author = await resolveAuthor(
    req.clerkUserId!,
    req.localUser!.name,
  );

  const [row] = await db
    .insert(messagesTable)
    .values({
      userId: req.localUser!.id,
      authorName: author.name,
      authorAvatar: author.avatar,
      body: parsed.data.body.trim(),
    })
    .returning();

  res.status(201).json(serialize(row, req.localUser!.id));
});

export default router;
