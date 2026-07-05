import { pgTable, text, boolean, timestamp } from "drizzle-orm/pg-core";

export const motivationPhrasesTable = pgTable("motivation_phrases", {
  id: text("id").primaryKey().default("gen_random_uuid()"),
  phrase: text("phrase").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type MotivationPhrase = typeof motivationPhrasesTable.$inferSelect;
export type NewMotivationPhrase = typeof motivationPhrasesTable.$inferInsert;
