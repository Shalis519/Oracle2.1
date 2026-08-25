import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Pencil, Plus, Trash2 } from "lucide-react";

type PracticeStep = {
  id: string;
  title: string;
  instruction: string;
  fieldLabel?: string | null;
  fieldPlaceholder?: string | null;
  optional?: boolean;
};

type PsychologyPracticeAdmin = {
  id: number;
  slug: string;
  title: string;
  summary: string;
  outcome: string;
  durationMinutes: number;
  steps: PracticeStep[];
  safetyNote: string;
  sourceNote?: string | null;
  isActive: boolean;
  sortOrder: number;
};

const EMPTY_STEPS: PracticeStep[] = [
  {
    id: "step-1",
    title: "Первый шаг",
    instruction: "Опишите задание для пользователя.",
    fieldLabel: "Моя запись",
    fieldPlaceholder: "Введите текст",
    optional: false,
  },
];

const DEFAULT_SAFETY_NOTE =
  "Эта практика предназначена для самонаблюдения и не заменяет помощь психолога, психотерапевта или врача.";

const API = "https://aether-oracle-api.onrender.com/api";

async function adminFetch(path: string, options?: RequestInit) {
  const token = await (window as any).Clerk?.session?.getToken();
  return fetch(`${API}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options?.headers ?? {}),
    },
  });
}

function blankForm() {
  return {
    slug: "new-practice",
    title: "Новая практика",
    summary: "Короткое описание практики.",
    outcome: "Пользователь выберет следующий шаг.",
    durationMinutes: 5,
    stepsJson: JSON.stringify(EMPTY_STEPS, null, 2),
    safetyNote: DEFAULT_SAFETY_NOTE,
    sourceNote: "",
    isActive: false,
    sortOrder: 100,
  };
}

export function PsychologyPracticeAdminPanel() {
  const { toast } = useToast();
  const [practices, setPractices] = useState<PsychologyPracticeAdmin[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<PsychologyPracticeAdmin | null>(null);
  const [form, setForm] = useState(blankForm);

  const loadPractices = async () => {
    setLoading(true);
    try {
      const response = await adminFetch("/admin/psychology/practices");
      const data = await response.json();
      setPractices(response.ok && Array.isArray(data) ? data : []);
    } catch {
      setPractices([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadPractices();
  }, []);

  const openCreate = () => {
    setEditing(null);
    setForm(blankForm());
    setEditorOpen(true);
  };

  const openEdit = (practice: PsychologyPracticeAdmin) => {
    setEditing(practice);
    setForm({
      slug: practice.slug,
      title: practice.title,
      summary: practice.summary,
      outcome: practice.outcome,
      durationMinutes: practice.durationMinutes,
      stepsJson: JSON.stringify(practice.steps, null, 2),
      safetyNote: practice.safetyNote,
      sourceNote: practice.sourceNote ?? "",
      isActive: practice.isActive,
      sortOrder: practice.sortOrder,
    });
    setEditorOpen(true);
  };

  const savePractice = async () => {
    let steps: PracticeStep[];
    try {
      const parsed = JSON.parse(form.stepsJson);
      if (!Array.isArray(parsed) || parsed.length === 0) throw new Error();
      steps = parsed;
    } catch {
      toast({
        title: "Проверьте JSON шагов",
        description: "Нужен непустой массив шагов практики.",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      const response = await adminFetch(
        editing
          ? `/admin/psychology/practices/${editing.id}`
          : "/admin/psychology/practices",
        {
          method: editing ? "PUT" : "POST",
          body: JSON.stringify({
            slug: form.slug,
            title: form.title,
            summary: form.summary,
            outcome: form.outcome,
            durationMinutes: Number(form.durationMinutes),
            steps,
            safetyNote: form.safetyNote,
            sourceNote: form.sourceNote || null,
            isActive: form.isActive,
            sortOrder: Number(form.sortOrder),
          }),
        },
      );
      if (!response.ok) {
        const error = await response.json().catch(() => null);
        toast({
          title: "Ошибка сохранения",
          description: error?.error ?? "Проверьте заполнение полей.",
          variant: "destructive",
        });
        return;
      }
      setEditorOpen(false);
      setEditing(null);
      await loadPractices();
      toast({ title: "Практика сохранена" });
    } finally {
      setSaving(false);
    }
  };

  const deletePractice = async (practice: PsychologyPracticeAdmin) => {
    if (
      !confirm(
        "Удалить практику? Если с ней есть личные записи, удаление будет заблокировано для их сохранности.",
      )
    ) {
      return;
    }
    const response = await adminFetch(
      `/admin/psychology/practices/${practice.id}`,
      {
        method: "DELETE",
      },
    );
    if (response.ok) {
      await loadPractices();
      toast({ title: "Практика удалена" });
      return;
    }
    const error = await response.json().catch(() => null);
    toast({
      title: "Практика не удалена",
      description:
        error?.error ??
        "Не удалось удалить практику. Скройте её из публикации.",
      variant: "destructive",
    });
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="font-serif">Практики психологии</CardTitle>
          <p className="text-sm text-muted-foreground">
            Каталог можно менять без изменения кода. Личные записи пользователей
            не удаляются вместе с практикой.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">
              Всего практик: {practices.length}
            </p>
            <Button onClick={openCreate}>
              <Plus className="mr-2 h-4 w-4" /> Добавить практику
            </Button>
          </div>
          {loading ? (
            <p className="text-sm text-muted-foreground">Загрузка практик...</p>
          ) : practices.length === 0 ? (
            <p className="text-sm text-muted-foreground">Практик пока нет.</p>
          ) : (
            <div className="space-y-3">
              {practices.map((practice) => (
                <div
                  key={practice.id}
                  className="space-y-3 rounded-lg border border-border p-4"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-medium">{practice.title}</p>
                        <Badge
                          variant={practice.isActive ? "default" : "outline"}
                        >
                          {practice.isActive ? "Опубликована" : "Скрыта"}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {practice.durationMinutes} мин. · порядок{" "}
                          {practice.sortOrder}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Код: {practice.slug} · шагов: {practice.steps.length}
                      </p>
                    </div>
                    <div className="flex shrink-0 gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openEdit(practice)}
                      >
                        <Pencil className="mr-1 h-4 w-4" /> Изменить
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-destructive hover:text-destructive"
                        onClick={() => deletePractice(practice)}
                        title="Удалить практику"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {practice.summary}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Источник: {practice.sourceNote || "Не указан"}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={editorOpen}
        onOpenChange={(open) => {
          setEditorOpen(open);
          if (!open) setEditing(null);
        }}
      >
        <DialogContent className="max-h-[88vh] max-w-3xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editing ? "Изменить практику" : "Новая практика"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label>Код</Label>
                <Input
                  value={form.slug}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      slug: event.target.value,
                    }))
                  }
                  placeholder="short-practice-code"
                />
              </div>
              <div>
                <Label>Порядок показа</Label>
                <Input
                  type="number"
                  value={form.sortOrder}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      sortOrder: Number(event.target.value),
                    }))
                  }
                />
              </div>
              <div className="md:col-span-2">
                <Label>Название</Label>
                <Input
                  value={form.title}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      title: event.target.value,
                    }))
                  }
                />
              </div>
              <div>
                <Label>Длительность, минут</Label>
                <Input
                  type="number"
                  min="1"
                  value={form.durationMinutes}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      durationMinutes: Number(event.target.value),
                    }))
                  }
                />
              </div>
              <div className="flex items-end">
                <Button
                  type="button"
                  variant={form.isActive ? "default" : "outline"}
                  className="w-full"
                  onClick={() =>
                    setForm((current) => ({
                      ...current,
                      isActive: !current.isActive,
                    }))
                  }
                >
                  {form.isActive
                    ? "Опубликована для пользователей"
                    : "Скрыта от пользователей"}
                </Button>
              </div>
            </div>
            <div>
              <Label>Краткое описание</Label>
              <Textarea
                rows={3}
                value={form.summary}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    summary: event.target.value,
                  }))
                }
              />
            </div>
            <div>
              <Label>Результат практики</Label>
              <Textarea
                rows={3}
                value={form.outcome}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    outcome: event.target.value,
                  }))
                }
              />
            </div>
            <div>
              <Label>Шаги практики в JSON</Label>
              <Textarea
                rows={14}
                className="font-mono text-xs"
                value={form.stepsJson}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    stepsJson: event.target.value,
                  }))
                }
              />
              <p className="mt-1 text-xs text-muted-foreground">
                Каждый шаг содержит id, title и instruction. Для текстового
                ответа можно добавить fieldLabel, fieldPlaceholder и optional.
              </p>
            </div>
            <div>
              <Label>Граница безопасности</Label>
              <Textarea
                rows={3}
                value={form.safetyNote}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    safetyNote: event.target.value,
                  }))
                }
              />
            </div>
            <div>
              <Label>Источник или примечание</Label>
              <Input
                value={form.sourceNote}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    sourceNote: event.target.value,
                  }))
                }
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setEditorOpen(false)}>
                Отмена
              </Button>
              <Button onClick={savePractice} disabled={saving}>
                {saving ? "Сохранение..." : "Сохранить"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
