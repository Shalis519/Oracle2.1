import {
  pgTable,
  text,
  serial,
  integer,
  boolean,
  date,
  time,
  timestamp,
  doublePrecision,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const contactsTable = pgTable("contacts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  name: text("name").notNull(),
  city: text("city"),
  birthDate: date("birth_date", { mode: "string" }),
  birthTime: time("birth_time"),
  deathDate: date("death_date", { mode: "string" }),
  phone: text("phone"),
  email: text("email"),
  relationshipType: text("relationship_type"),
  gender: text("gender"),
  birthPlace: text("birth_place"),
  birthLatitude: doublePrecision("birth_latitude"),
  birthLongitude: doublePrecision("birth_longitude"),
  birthTimezone: text("birth_timezone"),
  notes: text("notes"),
  notificationDays: integer("notification_days").notNull().default(1),
  synastryEnabled: boolean("synastry_enabled").notNull().default(false),
  synastryStatus: text("synastry_status").notNull().default("disabled"),
  synastryCalculatedAt: timestamp("synastry_calculated_at", { withTimezone: true }),
  synastryInputHash: text("synastry_input_hash"),
  synastryData: text("synastry_data"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const insertContactSchema = createInsertSchema(contactsTable).omit({
  id: true,
  createdAt: true,
});
export type InsertContact = z.infer<typeof insertContactSchema>;
export type Contact = typeof contactsTable.$inferSelect;
