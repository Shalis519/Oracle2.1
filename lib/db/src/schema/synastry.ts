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

/**
 * Интерпретации общего движка синастрии.
 * Геометрия аспекта и орбис рассчитываются кодом, а тексты редактируются в Oracle Studio.
 */
export const synastryInterpretationsTable = pgTable(
  "synastry_interpretations",
  {
    id: serial("id").primaryKey(),
    categoryKey: text("category_key").notNull(),
    sourceBody: text("source_body").notNull(),
    targetBody: text("target_body").notNull(),
    aspectKey: text("aspect_key").notNull(),
    directionKey: text("direction_key").notNull().default("neutral"),
    title: text("title").notNull(),
    text: text("text").notNull().default("В разработке"),
    keywords: text("keywords").array().notNull().default([]),
    sourceNote: text("source_note"),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("synastry_interpretation_unique").on(
      table.categoryKey,
      table.sourceBody,
      table.targetBody,
      table.aspectKey,
      table.directionKey,
    ),
  ],
);

export const insertSynastryInterpretationSchema = createInsertSchema(
  synastryInterpretationsTable,
).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertSynastryInterpretation = z.infer<
  typeof insertSynastryInterpretationSchema
>;
export type SynastryInterpretation =
  typeof synastryInterpretationsTable.$inferSelect;
