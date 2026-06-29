import { Router, type IRouter } from "express";
import { desc } from "drizzle-orm";
import { clerkClient } from "@clerk/express";
import { db, messagesTable, type Message } from "@workspace/db";
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
