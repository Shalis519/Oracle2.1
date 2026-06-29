import {
  useGetJournal,
  useUpdateJournal,
  getGetJournalQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { Plus, Trash2, Sparkles } from "lucide-react";

type Row = Record<string, string>;

type FieldDef = {
  key: string;
  label: string;
  type: "date" | "text";
  placeholder?: string;
};

const UNSET = "unset";

function ListSection({
  title,
  description,
  fields,
  rows,
  onChange,
  addLabel,
}: {
  title: string;
  description: string;
  fields: FieldDef[];
  rows: Row[];
  onChange: (rows: Row[]) => void;
  addLabel: string;
}) {
  const addRow = () =>
    onChange([...rows, Object.fromEntries(fields.map((f) => [f.key, ""]))]);
  const updateRow = (i: number, key: string, value: string) =>
    onChange(rows.map((r, idx) => (idx === i ? { ...r, [key]: value } : r)));
  const removeRow = (i: number) =>
    onChange(rows.filter((_, idx) => idx !== i));

  return (
    <div className="space-y-3">
      <div>
        <Label className="text-base">{title}</Label>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground italic">Записей пока нет.</p>
      ) : (
        <div className="space-y-3">
          {rows.map((row, i) => (
            <div
              key={i}
              className="flex flex-col sm:flex-row gap-3 items-start sm:items-end rounded-lg border border-border bg-background/30 p-3"
            >
              {fields.map((f) => (
                <div key={f.key} className="space-y-1 flex-1 w-full">
                  <Label className="text-xs text-muted-foreground">
                    {f.label}
                  </Label>
                  <Input
                    type={f.type}
                    placeholder={f.placeholder}
                    value={row[f.key] ?? ""}
                    onChange={(e) => updateRow(i, f.key, e.target.value)}
                  />
                </div>
              ))}
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="text-destructive hover:text-destructive hover:bg-destructive/10 shrink-0"
                onClick={() => removeRow(i)}
                aria-label="Удалить запись"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
      <Button type="button" variant="outline" size="sm" onClick={addRow}>
        <Plus className="h-4 w-4 mr-2" />
        {addLabel}
      </Button>
    </div>
  );
}

const emptyState = {
  marriageDate: "",
  divorceDate: "",
  lastMenstruationDate: "",
  heightCm: "",
  weightKg: "",
  bloodType: UNSET,
  smoking: UNSET,
  chronicConditions: "",
  allergies: "",
  fears: "",
  children: [] as Row[],
  relocations: [] as Row[],
  jobChanges: [] as Row[],
  losses: [] as Row[],
};

function keepRows(rows: Row[], requiredKeys: string[]): Row[] {
  return rows.filter((r) =>
    requiredKeys.every((k) => (r[k] ?? "").trim().length > 0),
  );
}

export default function JournalPage() {
  const { data: journal, isLoading } = useGetJournal({
    query: { queryKey: getGetJournalQueryKey() },
  });
  const updateJournal = useUpdateJournal();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [form, setForm] = useState(emptyState);

  useEffect(() => {
    if (!journal) return;
    setForm({
      marriageDate: journal.marriageDate ?? "",
      divorceDate: journal.divorceDate ?? "",
      lastMenstruationDate: journal.lastMenstruationDate ?? "",
      heightCm: journal.heightCm != null ? String(journal.heightCm) : "",
      weightKg: journal.weightKg != null ? String(journal.weightKg) : "",
      bloodType: journal.bloodType ?? UNSET,
      smoking:
        journal.smoking == null ? UNSET : journal.smoking ? "yes" : "no",
      chronicConditions: journal.chronicConditions ?? "",
      allergies: journal.allergies ?? "",
      fears: journal.fears ?? "",
      children: (journal.children ?? []).map((c) => ({
        date: c.date ?? "",
        name: c.name ?? "",
      })),
      relocations: (journal.relocations ?? []).map((r) => ({
        date: r.date ?? "",
        city: r.city ?? "",
      })),
      jobChanges: (journal.jobChanges ?? []).map((j) => ({
        date: j.date ?? "",
        field: j.field ?? "",
      })),
      losses: (journal.losses ?? []).map((l) => ({
        date: l.date ?? "",
        who: l.who ?? "",
      })),
    });
  }, [journal]);

  const setField = (key: keyof typeof emptyState, value: string | Row[]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parseInt10 = (v: string) => {
      const n = parseInt(v, 10);
      return Number.isFinite(n) ? n : null;
    };
    updateJournal.mutate(
      {
        data: {
          marriageDate: form.marriageDate || null,
          divorceDate: form.divorceDate || null,
          lastMenstruationDate: form.lastMenstruationDate || null,
          heightCm: form.heightCm ? parseInt10(form.heightCm) : null,
          weightKg: form.weightKg ? parseInt10(form.weightKg) : null,
          bloodType: form.bloodType === UNSET ? null : form.bloodType,
          smoking:
            form.smoking === UNSET ? null : form.smoking === "yes",
          chronicConditions: form.chronicConditions || null,
          allergies: form.allergies || null,
          fears: form.fears || null,
          children: keepRows(form.children, ["date"]) as { date: string; name?: string }[],
          relocations: keepRows(form.relocations, ["date", "city"]) as { date: string; city: string }[],
          jobChanges: keepRows(form.jobChanges, ["date", "field"]) as { date: string; field: string }[],
          losses: keepRows(form.losses, ["date", "who"]) as { date: string; who: string }[],
        },
      },
      {
        onSuccess: () => {
          toast({ title: "Дневник сохранён" });
          queryClient.invalidateQueries({ queryKey: getGetJournalQueryKey() });
        },
        onError: () => {
          toast({ title: "Ошибка при сохранении", variant: "destructive" });
        },
      },
    );
  };

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-10 max-w-4xl mx-auto space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-4xl font-serif font-bold mb-2">Мой дневник</h1>
        <p className="text-muted-foreground">
          Опрос по всем сферам жизни. Все поля заполнять не обязательно. Эти
          данные дополняют ваш прогноз, западную астрологию, Матрицу Судьбы и
          Бацзы и в дальнейшем будут взаимодействовать с натальной картой.
        </p>
      </motion.div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <Card className="bg-card/40 backdrop-blur-md border-border shadow-lg">
          <CardHeader>
            <CardTitle className="font-serif text-2xl">
              Ключевые события
            </CardTitle>
            <CardDescription>
              Поворотные даты вашей жизни для синтеза прогнозов.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="marriageDate">Дата брака</Label>
                <Input
                  id="marriageDate"
                  type="date"
                  value={form.marriageDate}
                  onChange={(e) => setField("marriageDate", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="divorceDate">Дата развода</Label>
                <Input
                  id="divorceDate"
                  type="date"
                  value={form.divorceDate}
                  onChange={(e) => setField("divorceDate", e.target.value)}
                />
              </div>
            </div>

            <ListSection
              title="Роды (даты детей)"
              description="Даты рождения детей. Имя — по желанию."
              addLabel="Добавить ребёнка"
              fields={[
                { key: "date", label: "Дата", type: "date" },
                {
                  key: "name",
                  label: "Имя (по желанию)",
                  type: "text",
                  placeholder: "Имя ребёнка",
                },
              ]}
              rows={form.children}
              onChange={(rows) => setField("children", rows)}
            />

            <ListSection
              title="Переезды"
              description="Даты переездов и города."
              addLabel="Добавить переезд"
              fields={[
                { key: "date", label: "Дата", type: "date" },
                {
                  key: "city",
                  label: "Город",
                  type: "text",
                  placeholder: "Город",
                },
              ]}
              rows={form.relocations}
              onChange={(rows) => setField("relocations", rows)}
            />

            <ListSection
              title="Смена работы"
              description="Даты и сфера деятельности."
              addLabel="Добавить смену работы"
              fields={[
                { key: "date", label: "Дата", type: "date" },
                {
                  key: "field",
                  label: "Сфера",
                  type: "text",
                  placeholder: "Сфера деятельности",
                },
              ]}
              rows={form.jobChanges}
              onChange={(rows) => setField("jobChanges", rows)}
            />

            <ListSection
              title="Потери близких"
              description="Даты и кого вы потеряли."
              addLabel="Добавить запись"
              fields={[
                { key: "date", label: "Дата", type: "date" },
                {
                  key: "who",
                  label: "Кто",
                  type: "text",
                  placeholder: "Кем приходился(ась)",
                },
              ]}
              rows={form.losses}
              onChange={(rows) => setField("losses", rows)}
            />
          </CardContent>
        </Card>

        <Card className="bg-card/40 backdrop-blur-md border-border shadow-lg">
          <CardHeader>
            <CardTitle className="font-serif text-2xl">
              Здоровье и тело
            </CardTitle>
            <CardDescription>
              Физические данные для будущего анализа натальной карты.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="heightCm">Рост (см)</Label>
                <Input
                  id="heightCm"
                  type="number"
                  inputMode="numeric"
                  placeholder="170"
                  value={form.heightCm}
                  onChange={(e) => setField("heightCm", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="weightKg">Вес (кг)</Label>
                <Input
                  id="weightKg"
                  type="number"
                  inputMode="numeric"
                  placeholder="65"
                  value={form.weightKg}
                  onChange={(e) => setField("weightKg", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Группа крови</Label>
                <Select
                  value={form.bloodType}
                  onValueChange={(v) => setField("bloodType", v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Не указано" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={UNSET}>Не указано</SelectItem>
                    <SelectItem value="A">A</SelectItem>
                    <SelectItem value="B">B</SelectItem>
                    <SelectItem value="O">O</SelectItem>
                    <SelectItem value="AB">AB</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Курите</Label>
                <Select
                  value={form.smoking}
                  onValueChange={(v) => setField("smoking", v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Не указано" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={UNSET}>Не указано</SelectItem>
                    <SelectItem value="yes">Да</SelectItem>
                    <SelectItem value="no">Нет</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="lastMenstruationDate">
                Дата начала последней менструации
              </Label>
              <Input
                id="lastMenstruationDate"
                type="date"
                className="md:max-w-xs"
                value={form.lastMenstruationDate}
                onChange={(e) =>
                  setField("lastMenstruationDate", e.target.value)
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="chronicConditions">
                Хронические заболевания
              </Label>
              <Textarea
                id="chronicConditions"
                placeholder="Опишите, если есть"
                value={form.chronicConditions}
                onChange={(e) =>
                  setField("chronicConditions", e.target.value)
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="allergies">Аллергии</Label>
              <Textarea
                id="allergies"
                placeholder="Опишите, если есть"
                value={form.allergies}
                onChange={(e) => setField("allergies", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="fears">Страхи (фобии)</Label>
              <Textarea
                id="fears"
                placeholder="Опишите, если есть"
                value={form.fears}
                onChange={(e) => setField("fears", e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center gap-3">
          <Button type="submit" disabled={updateJournal.isPending}>
            <Sparkles className="h-4 w-4 mr-2" />
            Сохранить дневник
          </Button>
        </div>
      </form>
    </div>
  );
}
