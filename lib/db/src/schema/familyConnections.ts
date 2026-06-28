import {
  pgTable,
  text,
  serial,
  integer,
  timestamp,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const familyConnectionsTable = pgTable("family_connections", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  contactId1: integer("contact_id_1").notNull(),
  contactId2: integer("contact_id_2").notNull(),
  connectionType: text("connection_type").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const insertFamilyConnectionSchema = createInsertSchema(
  familyConnectionsTable,
).omit({
  id: true,
  createdAt: true,
});
export type InsertFamilyConnection = z.infer<
  typeof insertFamilyConnectionSchema
>;
export type FamilyConnection = typeof familyConnectionsTable.$inferSelect;
