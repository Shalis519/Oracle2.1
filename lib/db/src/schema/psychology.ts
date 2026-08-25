import {
  boolean,
  integer,
  jsonb,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export type PsychologyPracticeStep = {
  id: string;
  title: string;
  instruction: string;
  fieldLabel?: string;
  fieldPlaceholder?: string;
  optional?: boolean;
};

export type PsychologyReflectionAnswers = Record<string, string>;

export const psychologyPracticesTable = pgTable(
  "psychology_practices",
  {
    id: serial("id").primaryKey(),
    slug: text("slug").notNull(),
    title: text("title").notNull(),
    summary: text("summary").notNull(),
    outcome: text("outcome").notNull(),
    durationMinutes: integer("duration_minutes").notNull().default(5),
    steps: jsonb("steps")
      .$type<PsychologyPracticeStep[]>()
      .notNull()
      .default([]),
    safetyNote: text("safety_note").notNull(),
    sourceNote: text("source_note"),
    isActive: boolean("is_active").notNull().default(true),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [uniqueIndex("psychology_practices_slug_unique").on(table.slug)],
);

export const psychologyReflectionsTable = pgTable("psychology_reflections", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  practiceId: integer("practice_id")
    .notNull()
    .references(() => psychologyPracticesTable.id),
  answers: jsonb("answers")
    .$type<PsychologyReflectionAnswers>()
    .notNull()
    .default({}),
  nextStep: text("next_step"),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const insertPsychologyPracticeSchema = createInsertSchema(
  psychologyPracticesTable,
).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPsychologyReflectionSchema = createInsertSchema(
  psychologyReflectionsTable,
).omit({
  id: true,
  userId: true,
  createdAt: true,
  updatedAt: true,
});

export type PsychologyPractice = typeof psychologyPracticesTable.$inferSelect;
export type PsychologyReflection =
  typeof psychologyReflectionsTable.$inferSelect;
export type InsertPsychologyPractice = z.infer<
  typeof insertPsychologyPracticeSchema
>;
export type InsertPsychologyReflection = z.infer<
  typeof insertPsychologyReflectionSchema
>;
