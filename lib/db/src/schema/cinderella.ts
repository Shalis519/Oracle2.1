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

export const cinderellaInterpretationsTable = pgTable(
  "cinderella_interpretations",
  {
    id: serial("id").primaryKey(),
    pairKey: text("pair_key").notNull(),
    mode: text("mode").notNull(),
    aspectKey: text("aspect_key").notNull().default("any"),
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
    uniqueIndex("cinderella_interpretation_unique").on(
      table.pairKey,
      table.mode,
      table.aspectKey,
    ),
  ],
);

export const insertCinderellaInterpretationSchema = createInsertSchema(
  cinderellaInterpretationsTable,
).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertCinderellaInterpretation = z.infer<
  typeof insertCinderellaInterpretationSchema
>;
export type CinderellaInterpretation =
  typeof cinderellaInterpretationsTable.$inferSelect;
