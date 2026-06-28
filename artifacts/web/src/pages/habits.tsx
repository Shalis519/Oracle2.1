import { useState } from "react";
import { useListTasks, useCreateTask, useUpdateTask, getListTasksQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { ListTodo, Plus, CheckCircle2, Circle, Droplets, Footprints, Minus } from "lucide-react";
import { format } from "date-fns";

const WATER_TARGET = 8;
const STEPS_TARGET = 10000;

export default function HabitsPage() {
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const { data: tasks, isLoading } = useListTasks({ date });
  const createTask = useCreateTask();
  const updateTask = useUpdateTask();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [newTaskText, setNewTaskText] = useState("");

  const invalidate = () => queryClient.invalidateQueries({ queryKey: getListTasksQueryKey() });

  const water = tasks?.find((t) => t.taskType === "water");
  const steps = tasks?.find((t) => t.taskType === "steps");
  const routineTasks = tasks?.filter((t) => t.taskType !== "water" && t.taskType !== "steps") ?? [];

  const setMetric = (type: "water" | "steps", label: string, target: number, nextValue: number) => {
    const value = Math.max(0, nextValue);
    const existing = type === "water" ? water : steps;
    if (existing) {
      updateTask.mutate({ id: existing.id, data: { actualValue: value } }, { onSuccess: invalidate });
    } else {
      createTask.mutate(
        { data: { taskText: label, taskType: type, date, targetValue: target, actualValue: value, isDailyGoal: true } },
        { onSuccess: invalidate },
      );
    }
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskText.trim()) return;
    createTask.mutate(
      { data: { taskText: newTaskText, taskType: "routine", date, isDailyGoal: true } },
      {
        onSuccess: () => {
          setNewTaskText("");
          toast({ title: "Привычка добавлена" });
          invalidate();
        },
      },
    );
  };

  const toggleComplete = (id: number, currentStatus: boolean) => {
    updateTask.mutate({ id, data: { isCompleted: !currentStatus } }, { onSuccess: invalidate });
  };

  const waterValue = water?.actualValue ?? 0;
  const waterTarget = water?.targetValue ?? WATER_TARGET;
  const stepsValue = steps?.actualValue ?? 0;
  const stepsTarget = steps?.targetValue ?? STEPS_TARGET;

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-serif font-bold mb-1 flex items-center gap-2">
            <ListTodo className="text-success w-6 h-6" />
            Трекер привычек
          </h1>
          <p className="text-sm text-muted-foreground">Вода, шаги и ежедневные ритуалы.</p>
        </div>
        <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-auto bg-card" />
      </motion.div>

      {/* Вода и шаги */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <MetricCard
          icon={<Droplets className="w-5 h-5 text-primary" />}
          title="Вода"
          unit="стак."
          value={waterValue}
          target={waterTarget}
          color="bg-primary"
          onDecrement={() => setMetric("water", "Вода", WATER_TARGET, waterValue - 1)}
          onIncrement={() => setMetric("water", "Вода", WATER_TARGET, waterValue + 1)}
          onSet={(v) => setMetric("water", "Вода", WATER_TARGET, v)}
        />
        <MetricCard
          icon={<Footprints className="w-5 h-5 text-success" />}
          title="Шаги"
          unit="шаг."
          value={stepsValue}
          target={stepsTarget}
          color="bg-success"
          step={500}
          onDecrement={() => setMetric("steps", "Шаги", STEPS_TARGET, stepsValue - 500)}
          onIncrement={() => setMetric("steps", "Шаги", STEPS_TARGET, stepsValue + 500)}
          onSet={(v) => setMetric("steps", "Шаги", STEPS_TARGET, v)}
        />
      </div>

      {/* Добавить ритуал */}
      <Card className="bg-card/40 backdrop-blur-md">
        <CardContent className="pt-4">
          <form onSubmit={handleCreate} className="flex gap-2">
            <Input
              placeholder="Новая привычка или ритуал..."
              value={newTaskText}
              onChange={(e) => setNewTaskText(e.target.value)}
              className="flex-1"
            />
            <Button type="submit" disabled={createTask.isPending} className="bg-success text-white hover:bg-success/90">
              <Plus className="w-4 h-4" />
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="space-y-3">
        {isLoading ? (
          <div className="flex justify-center p-8"><div className="animate-spin rounded-full h-7 w-7 border-b-2 border-success"></div></div>
        ) : routineTasks.length > 0 ? (
          <div className="grid gap-2">
            {routineTasks.map((task, i) => (
              <motion.div key={task.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}>
                <Card className={`overflow-hidden transition-colors ${task.isCompleted ? "bg-success/5 border-success/30" : "bg-card/40"}`}>
                  <div className="flex items-center p-3 gap-3">
                    <button
                      onClick={() => toggleComplete(task.id, task.isCompleted)}
                      className={`rounded-full transition-colors ${task.isCompleted ? "text-success" : "text-muted-foreground hover:text-success/70"}`}
                    >
                      {task.isCompleted ? <CheckCircle2 className="w-5 h-5" /> : <Circle className="w-5 h-5" />}
                    </button>
                    <span className={`flex-1 transition-all ${task.isCompleted ? "line-through text-muted-foreground" : "text-foreground"}`}>
                      {task.taskText}
                    </span>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center p-8 border border-dashed border-border rounded-xl text-sm text-muted-foreground">
            Нет ритуалов на выбранный день. Добавьте свой первый ритуал.
          </div>
        )}
      </div>
    </div>
  );
}

interface MetricCardProps {
  icon: React.ReactNode;
  title: string;
  unit: string;
  value: number;
  target: number;
  color: string;
  step?: number;
  onDecrement: () => void;
  onIncrement: () => void;
  onSet: (value: number) => void;
}

function MetricCard({ icon, title, unit, value, target, color, onDecrement, onIncrement, onSet }: MetricCardProps) {
  const pct = Math.min(100, target > 0 ? Math.round((value / target) * 100) : 0);
  return (
    <Card className="bg-card/40 backdrop-blur-md">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 font-medium">
            {icon}
            {title}
          </div>
          <span className="text-xs text-muted-foreground">цель: {target.toLocaleString("ru-RU")} {unit}</span>
        </div>

        <div className="flex items-end gap-2">
          <Input
            type="number"
            value={value}
            min={0}
            onChange={(e) => onSet(Number(e.target.value) || 0)}
            className="w-24 text-lg font-bold bg-background"
          />
          <span className="text-sm text-muted-foreground pb-2">/ {target.toLocaleString("ru-RU")} {unit}</span>
        </div>

        <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
          <div className={`h-full ${color} transition-all duration-500`} style={{ width: `${pct}%` }} />
        </div>

        <div className="flex gap-2">
          <Button type="button" variant="outline" size="sm" className="flex-1" onClick={onDecrement}>
            <Minus className="w-4 h-4" />
          </Button>
          <Button type="button" variant="outline" size="sm" className="flex-1" onClick={onIncrement}>
            <Plus className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
