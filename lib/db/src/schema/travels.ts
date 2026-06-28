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

export const travelsTable = pgTable("travels", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  countryCode: text("country_code").notNull(),
  countryName: text("country_name").notNull(),
  visited: boolean("visited").notNull().default(false),
  wishlist: boolean("wishlist").notNull().default(false),
  visitedDate: date("visited_date", { mode: "string" }),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const insertTravelSchema = createInsertSchema(travelsTable).omit({
  id: true,
  createdAt: true,
});
export type InsertTravel = z.infer<typeof insertTravelSchema>;
export type Travel = typeof travelsTable.$inferSelect;
