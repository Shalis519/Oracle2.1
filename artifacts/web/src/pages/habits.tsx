import { useState } from "react";
import { useListTasks, useCreateTask, useUpdateTask, getListTasksQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { ListTodo, Plus, CheckCircle2, Circle } from "lucide-react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";

export default function HabitsPage() {
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const { data: tasks, isLoading } = useListTasks({ date });
  const createTask = useCreateTask();
  const updateTask = useUpdateTask();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [newTaskText, setNewTaskText] = useState("");
  const [newTaskType, setNewTaskType] = useState("routine");

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskText.trim()) return;

    createTask.mutate(
      { data: { taskText: newTaskText, taskType: newTaskType, date, isDailyGoal: true } },
      {
        onSuccess: () => {
          setNewTaskText("");
          toast({ title: "Привычка добавлена" });
          queryClient.invalidateQueries({ queryKey: getListTasksQueryKey() });
        }
      }
    );
  };

  const toggleComplete = (id: number, currentStatus: boolean) => {
    updateTask.mutate(
      { id, data: { isCompleted: !currentStatus } },
      {
        onSuccess: () => queryClient.invalidateQueries({ queryKey: getListTasksQueryKey() })
      }
    );
  };

  return (
    <div className="p-6 md:p-10 max-w-4xl mx-auto space-y-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-serif font-bold mb-2 flex items-center gap-3">
            <ListTodo className="text-success" />
            Трекер привычек
          </h1>
          <p className="text-muted-foreground">Ежедневные ритуалы и задачи.</p>
        </div>
        <div className="flex items-center gap-2">
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-auto bg-card" />
        </div>
      </motion.div>

      <Card className="bg-card/40 backdrop-blur-md shadow-sm">
        <CardContent className="pt-6">
          <form onSubmit={handleCreate} className="flex gap-2">
            <Input 
              placeholder="Новая привычка или ритуал..." 
              value={newTaskText} 
              onChange={(e) => setNewTaskText(e.target.value)}
              className="flex-1"
            />
            <Button type="submit" disabled={createTask.isPending} className="bg-success text-white hover:bg-success/90">
              <Plus className="w-5 h-5" />
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="space-y-4 mt-8">
        {isLoading ? (
          <div className="flex justify-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-success"></div></div>
        ) : tasks && tasks.length > 0 ? (
          <div className="grid gap-3">
            {tasks.map((task, i) => (
              <motion.div key={task.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}>
                <Card className={`overflow-hidden transition-colors ${task.isCompleted ? 'bg-success/5 border-success/30' : 'bg-card/40'}`}>
                  <div className="flex items-center p-4 gap-4">
                    <button 
                      onClick={() => toggleComplete(task.id, task.isCompleted)}
                      className={`rounded-full transition-colors ${task.isCompleted ? 'text-success' : 'text-muted-foreground hover:text-success/70'}`}
                    >
                      {task.isCompleted ? <CheckCircle2 className="w-6 h-6" /> : <Circle className="w-6 h-6" />}
                    </button>
                    <div className="flex-1">
                      <span className={`text-lg transition-all ${task.isCompleted ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                        {task.taskText}
                      </span>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center p-12 border border-dashed border-border rounded-xl text-muted-foreground">
            Нет задач на выбранный день. Добавьте свои первые ритуалы.
          </div>
        )}
      </div>
    </div>
  );
}
