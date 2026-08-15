import {
  pgTable,
  serial,
  integer,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export const chatReadStateTable = pgTable(
  "chat_read_state",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id").notNull(),
    lastReadMessageId: integer("last_read_message_id").notNull().default(0),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [uniqueIndex("chat_read_state_user_id_idx").on(table.userId)],
);

export type ChatReadState = typeof chatReadStateTable.$inferSelect;
