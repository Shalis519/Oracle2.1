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
 * Литературные фрагменты прогноза. Служебная семантика и веса остаются
 * в ontology_* и используются для выбора факторов; эта таблица отвечает
 * только за готовые фразы в заданном контексте.
 */
export const forecastTextTemplatesTable = pgTable(
  "forecast_text_templates",
  {
    id: serial("id").primaryKey(),
    category: text("category").notNull(),
    context: text("context").notNull(),
    key: text("key").notNull(),
    title: text("title").notNull(),
    text: text("text").notNull().default("В разработке"),
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
    uniqueIndex("forecast_text_template_context_key_unique").on(
      table.category,
      table.context,
      table.key,
    ),
  ],
);

export const insertForecastTextTemplateSchema = createInsertSchema(
  forecastTextTemplatesTable,
).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertForecastTextTemplate = z.infer<
  typeof insertForecastTextTemplateSchema
>;
export type ForecastTextTemplate = typeof forecastTextTemplatesTable.$inferSelect;
