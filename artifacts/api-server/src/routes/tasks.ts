import { Router, type IRouter } from "express";
import { and, eq } from "drizzle-orm";
import { db, tasksTable, type Task } from "@workspace/db";
import {
  ListTasksResponse,
  CreateTaskBody,
  CreateTaskResponse,
  UpdateTaskParams,
  UpdateTaskBody,
  UpdateTaskResponse,
} from "@workspace/api-zod";
import { requireAuth } from "../lib/auth";
import { todayString } from "../lib/oracle";

const router: IRouter = Router();

function serialize(t: Task) {
  return {
    id: t.id,
    date: t.date,
    taskType: t.taskType,
    taskText: t.taskText,
    targetValue: t.targetValue,
    actualValue: t.actualValue,
    isCompleted: t.isCompleted,
    isDailyGoal: t.isDailyGoal,
  };
}

router.get("/tasks", requireAuth, async (req, res): Promise<void> => {
  const date =
    typeof req.query.date === "string" && req.query.date
      ? req.query.date
      : todayString();
  const rows = await db
    .select()
    .from(tasksTable)
    .where(
      and(eq(tasksTable.userId, req.localUser!.id), eq(tasksTable.date, date)),
    )
    .orderBy(tasksTable.id);
  res.json(ListTasksResponse.parse(rows.map(serialize)));
});

router.post("/tasks", requireAuth, async (req, res): Promise<void> => {
  const parsed = CreateTaskBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [row] = await db
    .insert(tasksTable)
    .values({
      userId: req.localUser!.id,
      date: parsed.data.date ?? todayString(),
      taskType: parsed.data.taskType,
      taskText: parsed.data.taskText,
      targetValue: parsed.data.targetValue ?? 0,
      actualValue: parsed.data.actualValue ?? 0,
      isDailyGoal: parsed.data.isDailyGoal ?? false,
    })
    .returning();
  res.status(201).json(CreateTaskResponse.parse(serialize(row)));
});

router.patch("/tasks/:id", requireAuth, async (req, res): Promise<void> => {
  const params = UpdateTaskParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const body = UpdateTaskBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }
  const [row] = await db
    .update(tasksTable)
    .set(body.data)
    .where(
      and(
        eq(tasksTable.id, params.data.id),
        eq(tasksTable.userId, req.localUser!.id),
      ),
    )
    .returning();
  if (!row) {
    res.status(404).json({ error: "Задача не найдена." });
    return;
  }
  res.json(UpdateTaskResponse.parse(serialize(row)));
});

export default router;
