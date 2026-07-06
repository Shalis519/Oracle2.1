import { pgTable, text, boolean, timestamp, uniqueIndex } from "drizzle-orm/pg-core";

export const motivationPhrasesTable = pgTable(
  "motivation_phrases",
  {
    id: text("id").primaryKey().default("gen_random_uuid()"),
    phrase: text("phrase").notNull(),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("motivation_phrases_phrase_unique").on(table.phrase),
  ],
);

export type MotivationPhrase = typeof motivationPhrasesTable.$inferSelect;
export type NewMotivationPhrase = typeof motivationPhrasesTable.$inferInsert;
