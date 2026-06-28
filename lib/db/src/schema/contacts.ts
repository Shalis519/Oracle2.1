import {
  pgTable,
  text,
  serial,
  integer,
  boolean,
  date,
  timestamp,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const contactsTable = pgTable("contacts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  name: text("name").notNull(),
  city: text("city"),
  birthDate: date("birth_date", { mode: "string" }),
  deathDate: date("death_date", { mode: "string" }),
  phone: text("phone"),
  email: text("email"),
  relationshipType: text("relationship_type"),
  gender: text("gender"),
  birthPlace: text("birth_place"),
  notes: text("notes"),
  notificationDays: integer("notification_days").notNull().default(1),
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
