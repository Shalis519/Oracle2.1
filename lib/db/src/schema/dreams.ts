import {
  pgTable,
  text,
  serial,
  integer,
  date,
  timestamp,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const dreamsTable = pgTable("dreams", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  date: date("date", { mode: "string" }).notNull(),
  dreamText: text("dream_text").notNull(),
  interpretation: text("interpretation").notNull(),
  keywords: text("keywords").array().notNull().default([]),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const insertDreamSchema = createInsertSchema(dreamsTable).omit({
  id: true,
  createdAt: true,
});
export type InsertDream = z.infer<typeof insertDreamSchema>;
export type Dream = typeof dreamsTable.$inferSelect;
