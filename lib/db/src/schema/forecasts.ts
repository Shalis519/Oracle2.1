import {
  pgTable,
  text,
  serial,
  integer,
  boolean,
  date,
  jsonb,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const forecastsTable = pgTable("daily_forecasts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  date: date("date", { mode: "string" }).notNull(),
  arcanaNumber: integer("arcana_number").notNull(),
  arcanaName: text("arcana_name").notNull(),
  hasWarning: boolean("has_warning").notNull().default(false),
  synthesisText: text("synthesis_text").notNull(),
  payload: jsonb("payload").notNull(),
  version: integer("version").notNull().default(1),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
}, (table) => [
  uniqueIndex("daily_forecasts_user_date_unique").on(table.userId, table.date),
]);

export const insertForecastSchema = createInsertSchema(forecastsTable).omit({
  id: true,
  createdAt: true,
});
export type InsertForecast = z.infer<typeof insertForecastSchema>;
export type Forecast = typeof forecastsTable.$inferSelect;
