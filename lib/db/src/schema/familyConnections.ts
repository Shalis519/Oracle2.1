import {
  pgTable,
  text,
  serial,
  integer,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { contactsTable } from "./contacts";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const familyConnectionsTable = pgTable("family_connections", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  contactId1: integer("contact_id_1")
    .notNull()
    .references(() => contactsTable.id, { onDelete: "cascade" }),
  contactId2: integer("contact_id_2")
    .notNull()
    .references(() => contactsTable.id, { onDelete: "cascade" }),
  connectionType: text("connection_type").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
}, (table) => [
  uniqueIndex("family_connections_user_pair_unique").on(
    table.userId,
    table.contactId1,
    table.contactId2,
  ),
]);

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
