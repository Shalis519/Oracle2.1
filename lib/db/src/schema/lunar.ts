import {
  pgTable,
  serial,
  text,
  boolean,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const lunarInterpretationsTable = pgTable(
  "lunar_interpretations",
  {
    id: serial("id").primaryKey(),
    category: text("category").notNull(),
    key: text("key").notNull(),
    title: text("title").notNull(),
    text: text("text").notNull().default("В разработке"),
    sourceNote: text("source_note"),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex("lunar_interpretation_category_key_unique").on(table.category, table.key)],
);

export const insertLunarInterpretationSchema = createInsertSchema(lunarInterpretationsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertLunarInterpretation = z.infer<typeof insertLunarInterpretationSchema>;
export type LunarInterpretation = typeof lunarInterpretationsTable.$inferSelect;
