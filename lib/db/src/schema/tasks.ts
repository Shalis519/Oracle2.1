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

export const tasksTable = pgTable("tasks", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  date: date("date", { mode: "string" }).notNull(),
  taskType: text("task_type").notNull(),
  taskText: text("task_text").notNull(),
  targetValue: integer("target_value").notNull().default(0),
  actualValue: integer("actual_value").notNull().default(0),
  isCompleted: boolean("is_completed").notNull().default(false),
  isDailyGoal: boolean("is_daily_goal").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const insertTaskSchema = createInsertSchema(tasksTable).omit({
  id: true,
  createdAt: true,
});
export type InsertTask = z.infer<typeof insertTaskSchema>;
export type Task = typeof tasksTable.$inferSelect;
