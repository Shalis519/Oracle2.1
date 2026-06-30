import {
  pgTable,
  text,
  serial,
  boolean,
  date,
  timestamp,
  doublePrecision,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const usersTable = pgTable("users", {
  id: serial("id").primaryKey(),
  clerkUserId: text("clerk_user_id").notNull().unique(),
  name: text("name").notNull().default(""),
  city: text("city"),
  cityLatitude: doublePrecision("city_latitude"),
  cityLongitude: doublePrecision("city_longitude"),
  cityTimezone: text("city_timezone"),
  birthDate: date("birth_date", { mode: "string" }),
  birthTime: text("birth_time"),
  birthPlace: text("birth_place"),
  birthLatitude: doublePrecision("birth_latitude"),
  birthLongitude: doublePrecision("birth_longitude"),
  birthTimezone: text("birth_timezone"),
  photoPath: text("photo_path"),
  bedDirection: text("bed_direction"),
  avatarType: text("avatar_type"),
  notificationsEnabled: boolean("notifications_enabled").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const insertUserSchema = createInsertSchema(usersTable).omit({
  id: true,
  createdAt: true,
});
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof usersTable.$inferSelect;
