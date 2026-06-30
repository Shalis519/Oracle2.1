import {
  pgTable,
  serial,
  integer,
  text,
  date,
  boolean,
  jsonb,
  timestamp,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export type ChildBirth = { date: string; name?: string };
export type Relocation = { date: string; city: string };
export type JobChange = { date: string; field: string };
export type Loss = { date: string; who: string };
export type Marriage = { date: string; divorceDate?: string };

export const lifeJournalsTable = pgTable("life_journals", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().unique(),
  marriageDate: date("marriage_date", { mode: "string" }),
  divorceDate: date("divorce_date", { mode: "string" }),
  marriages: jsonb("marriages").$type<Marriage[]>().notNull().default([]),
  children: jsonb("children").$type<ChildBirth[]>().notNull().default([]),
  relocations: jsonb("relocations").$type<Relocation[]>().notNull().default([]),
  jobChanges: jsonb("job_changes").$type<JobChange[]>().notNull().default([]),
  losses: jsonb("losses").$type<Loss[]>().notNull().default([]),
  heightCm: integer("height_cm"),
  weightKg: integer("weight_kg"),
  bloodType: text("blood_type"),
  chronicConditions: text("chronic_conditions"),
  allergies: text("allergies"),
  smoking: boolean("smoking"),
  fears: text("fears"),
  lastMenstruationDate: date("last_menstruation_date", { mode: "string" }),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const insertLifeJournalSchema = createInsertSchema(
  lifeJournalsTable,
).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertLifeJournal = z.infer<typeof insertLifeJournalSchema>;
export type LifeJournal = typeof lifeJournalsTable.$inferSelect;
