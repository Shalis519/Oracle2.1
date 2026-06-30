import {
  pgTable,
  text,
  serial,
  integer,
  boolean,
  date,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const notepadItemsTable = pgTable(
  "notepad_items",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id").notNull(),
    date: date("date", { mode: "string" }).notNull(),
    source: text("source").notNull().default("manual"),
    refKey: text("ref_key"),
    text: text("text").notNull().default(""),
    done: boolean("done").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    uniqueIndex("notepad_auto_unique")
      .on(t.userId, t.date, t.source, t.refKey)
      .where(sql`${t.source} <> 'manual'`),
  ],
);

export const insertNotepadItemSchema = createInsertSchema(
  notepadItemsTable,
).omit({
  id: true,
  createdAt: true,
});
export type InsertNotepadItem = z.infer<typeof insertNotepadItemSchema>;
export type NotepadItem = typeof notepadItemsTable.$inferSelect;
