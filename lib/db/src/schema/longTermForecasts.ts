import {
  date,
  integer,
  jsonb,
  pgTable,
  serial,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const longTermForecastsTable = pgTable("long_term_forecasts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id"),
  clientName: text("client_name").notNull(),
  periodType: text("period_type").notNull(),
  dateFrom: date("date_from", { mode: "string" }).notNull(),
  dateTo: date("date_to", { mode: "string" }).notNull(),
  status: text("status").notNull().default("draft"),
  title: text("title").notNull(),
  introText: text("intro_text").notNull().default(""),
  birthSnapshot: jsonb("birth_snapshot").notNull(),
  blocks: jsonb("blocks").notNull().default([]),
  calculationPayload: jsonb("calculation_payload").notNull().default({}),
  version: integer("version").notNull().default(1),
  createdBy: text("created_by").notNull(),
  updatedBy: text("updated_by").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertLongTermForecastSchema = createInsertSchema(longTermForecastsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type LongTermForecast = typeof longTermForecastsTable.$inferSelect;
export type InsertLongTermForecast = z.infer<typeof insertLongTermForecastSchema>;
