import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  getListPsychologyPracticesQueryKey,
  getListPsychologyReflectionsQueryKey,
  useCreatePsychologyReflection,
  useDeletePsychologyReflection,
  useListPsychologyPractices,
  useListPsychologyReflections,
  useUpdatePsychologyReflection,
  type PsychologyPractice,
  type PsychologyReflection,
} from "@workspace/api-client-react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import {
  BookOpen,
  BrainCircuit,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Edit3,
  Info,
  Play,
  Save,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import { motion } from "framer-motion";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

const SECTION_SAFETY_NOTE =
  "Практики этого раздела созданы для саморефлексии и внимания к своим действиям. Они не заменяют помощь психолога, психотерапевта или врача.";

function practiceAnswerPreview(reflection: PsychologyReflection): string {
  const values = Object.values(reflection.answers)
    .map((value) => value.trim())
    .filter(Boolean);
  return values[0] ?? "Запись без текстового ответа";
}

export default function PsychologyPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { data: practices = [], isLoading: practicesLoading } =
    useListPsychologyPractices();
  const { data: reflections = [], isLoading: reflectionsLoading } =
    useListPsychologyReflections();
  const createReflection = useCreatePsychologyReflection();
  const updateReflection = useUpdatePsychologyReflection();
  const deleteReflection = useDeletePsychologyReflection();

  const [activePractice, setActivePractice] =
    useState<PsychologyPractice | null>(null);
  const [editingReflection, setEditingReflection] =
    useState<PsychologyReflection | null>(null);
  const [stepIndex, setStepIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});

  const activeStep = activePractice?.steps[stepIndex];
  const isLastStep = Boolean(
    activePractice && stepIndex === activePractice.steps.length - 1,
  );
  const hasRequiredAnswer = Boolean(
    activeStep?.fieldLabel &&
    !activeStep.optional &&
    !answers[activeStep.id]?.trim(),
  );

  const practiceMap = useMemo(
    () => new Map(practices.map((practice) => [practice.id, practice])),
    [practices],
  );

  const invalidatePsychology = () => {
    queryClient.invalidateQueries({
      queryKey: getListPsychologyPracticesQueryKey(),
    });
    queryClient.invalidateQueries({
      queryKey: getListPsychologyReflectionsQueryKey(),
    });
  };

  const openPractice = (
    practice: PsychologyPractice,
    reflection?: PsychologyReflection,
  ) => {
    setActivePractice(practice);
    setEditingReflection(reflection ?? null);
    setStepIndex(0);
    setAnswers(reflection?.answers ?? {});
  };

  const closePractice = () => {
    setActivePractice(null);
    setEditingReflection(null);
    setStepIndex(0);
    setAnswers({});
  };

  const submitReflection = () => {
    if (!activePractice) return;
    const nextStep = answers.nextStep?.trim() || null;
    const data = { practiceId: activePractice.id, answers, nextStep };
    const onSuccess = () => {
      toast({
        title: editingReflection ? "Запись обновлена" : "Практика сохранена",
        description: "Ваша личная запись доступна в разделе «Мои записи».",
      });
      invalidatePsychology();
      closePractice();
    };
    const onError = () => {
      toast({ title: "Не удалось сохранить запись", variant: "destructive" });
    };

    if (editingReflection) {
      updateReflection.mutate(
        { id: editingReflection.id, data },
        { onSuccess, onError },
      );
      return;
    }
    createReflection.mutate({ data }, { onSuccess, onError });
  };

  const removeReflection = (reflection: PsychologyReflection) => {
    if (
      !confirm(
        "Убрать эту личную запись из списка? Она не будет удалена навсегда.",
      )
    )
      return;

    deleteReflection.mutate(
      { id: reflection.id },
      {
        onSuccess: () => {
          invalidatePsychology();
          toast({ title: "Запись убрана из списка" });
        },
        onError: () =>
          toast({ title: "Не удалось удалить запись", variant: "destructive" }),
      },
    );
  };

  return (
    <div className="mx-auto max-w-6xl space-y-8 p-6 md:p-10">
      <motion.header
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className="space-y-3"
      >
        <div className="flex items-center gap-3">
          <div className="rounded-2xl border border-primary/20 bg-primary/10 p-3">
            <BrainCircuit className="h-7 w-7 text-primary" />
          </div>
          <div>
            <h1 className="font-serif text-4xl font-bold">Психология</h1>
            <p className="mt-1 text-muted-foreground">
              Практики саморефлексии и внимательного действия.
            </p>
          </div>
        </div>
      </motion.header>

      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="flex gap-3 p-5 text-sm leading-relaxed text-muted-foreground">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
          <p>{SECTION_SAFETY_NOTE}</p>
        </CardContent>
      </Card>

      <section className="space-y-4">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="font-serif text-2xl font-semibold">
              Практики на сегодня
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Выберите одну практику и пройдите её в комфортном для Вас темпе.
            </p>
          </div>
        </div>

        {practicesLoading ? (
          <div className="flex justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary" />
          </div>
        ) : practices.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-3">
            {practices.map((practice, index) => (
              <motion.div
                key={practice.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.08 }}
              >
                <Card className="flex h-full flex-col border-primary/15 bg-card/60 backdrop-blur-sm transition-colors hover:border-primary/40">
                  <CardHeader className="space-y-3">
                    <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-primary">
                        <Clock3 className="h-3.5 w-3.5" />{" "}
                        {practice.durationMinutes} мин.
                      </span>
                      <BookOpen className="h-4 w-4" />
                    </div>
                    <CardTitle className="font-serif text-xl">
                      {practice.title}
                    </CardTitle>
                    <CardDescription className="leading-relaxed">
                      {practice.summary}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="mt-auto space-y-4">
                    <div className="rounded-lg border border-border/70 bg-background/40 p-3 text-sm text-muted-foreground">
                      <span className="font-medium text-foreground">
                        Результат:{" "}
                      </span>
                      {practice.outcome}
                    </div>
                    <Button
                      className="w-full"
                      onClick={() => openPractice(practice)}
                    >
                      <Play className="mr-2 h-4 w-4" /> Начать практику
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        ) : (
          <Card className="border-dashed">
            <CardContent className="p-8 text-center text-muted-foreground">
              Практики пока не опубликованы. Проверьте раздел позже.
            </CardContent>
          </Card>
        )}
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="font-serif text-2xl font-semibold">Мои записи</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Эти записи видны только Вам. При необходимости Вы можете изменить их
            или убрать из списка.
          </p>
        </div>

        {reflectionsLoading ? (
          <div className="flex justify-center py-8">
            <div className="h-7 w-7 animate-spin rounded-full border-b-2 border-primary" />
          </div>
        ) : reflections.length > 0 ? (
          <div className="space-y-3">
            {reflections.map((reflection) => {
              const practice = practiceMap.get(reflection.practiceId);
              return (
                <Card key={reflection.id} className="bg-card/50">
                  <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0 space-y-1.5">
                      <p className="font-medium">{reflection.practiceTitle}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(
                          new Date(reflection.updatedAt),
                          "d MMMM yyyy, HH:mm",
                          { locale: ru },
                        )}
                      </p>
                      <p className="line-clamp-2 text-sm text-muted-foreground">
                        {practiceAnswerPreview(reflection)}
                      </p>
                      {reflection.nextStep ? (
                        <p className="text-sm">
                          <span className="font-medium text-primary">
                            Следующий шаг:{" "}
                          </span>
                          {reflection.nextStep}
                        </p>
                      ) : null}
                    </div>
                    <div className="flex shrink-0 gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={!practice}
                        title={
                          practice
                            ? "Изменить запись"
                            : "Практика больше не опубликована"
                        }
                        onClick={() =>
                          practice && openPractice(practice, reflection)
                        }
                      >
                        <Edit3 className="mr-2 h-4 w-4" /> Изменить
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-muted-foreground hover:text-destructive"
                        onClick={() => removeReflection(reflection)}
                        title="Убрать запись из списка"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card className="border-dashed">
            <CardContent className="p-8 text-center text-muted-foreground">
              Здесь появятся Ваши сохранённые практики и выбранные следующие
              шаги.
            </CardContent>
          </Card>
        )}
      </section>

      <Dialog
        open={Boolean(activePractice)}
        onOpenChange={(open) => !open && closePractice()}
      >
        <DialogContent className="max-h-[88vh] max-w-xl overflow-y-auto">
          {activePractice && activeStep ? (
            <>
              <DialogHeader>
                <div className="mb-2 flex items-center justify-between gap-4 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1.5">
                    <Clock3 className="h-3.5 w-3.5" />{" "}
                    {activePractice.durationMinutes} мин.
                  </span>
                  <span>
                    Шаг {stepIndex + 1} из {activePractice.steps.length}
                  </span>
                </div>
                <DialogTitle className="font-serif text-2xl">
                  {activePractice.title}
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-5 pt-2">
                <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary transition-all"
                    style={{
                      width: `${((stepIndex + 1) / activePractice.steps.length) * 100}%`,
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <h3 className="font-medium">{activeStep.title}</h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {activeStep.instruction}
                  </p>
                </div>
                {activeStep.fieldLabel ? (
                  <div className="space-y-2">
                    <label
                      className="text-sm font-medium"
                      htmlFor={`practice-step-${activeStep.id}`}
                    >
                      {activeStep.fieldLabel}
                      {activeStep.optional ? (
                        <span className="ml-1 text-muted-foreground">
                          (необязательно)
                        </span>
                      ) : null}
                    </label>
                    <Textarea
                      id={`practice-step-${activeStep.id}`}
                      value={answers[activeStep.id] ?? ""}
                      onChange={(event) =>
                        setAnswers((previous) => ({
                          ...previous,
                          [activeStep.id]: event.target.value,
                        }))
                      }
                      placeholder={
                        activeStep.fieldPlaceholder ??
                        "Запишите свои мысли, если хотите."
                      }
                      className="min-h-[112px] resize-y"
                    />
                  </div>
                ) : null}
                <Card className="border-primary/15 bg-primary/5">
                  <CardContent className="flex gap-2 p-3 text-xs leading-relaxed text-muted-foreground">
                    <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <p>{activePractice.safetyNote}</p>
                  </CardContent>
                </Card>
                <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                  <Button
                    variant="ghost"
                    onClick={() =>
                      setStepIndex((current) => Math.max(0, current - 1))
                    }
                    disabled={stepIndex === 0}
                  >
                    <ChevronLeft className="mr-1 h-4 w-4" /> Назад
                  </Button>
                  {isLastStep ? (
                    <div className="flex gap-2">
                      <Button variant="outline" onClick={closePractice}>
                        Завершить без сохранения
                      </Button>
                      <Button
                        onClick={submitReflection}
                        disabled={
                          hasRequiredAnswer ||
                          createReflection.isPending ||
                          updateReflection.isPending
                        }
                      >
                        <Save className="mr-2 h-4 w-4" /> Сохранить запись
                      </Button>
                    </div>
                  ) : (
                    <Button
                      onClick={() => setStepIndex((current) => current + 1)}
                      disabled={hasRequiredAnswer}
                    >
                      Продолжить <ChevronRight className="ml-1 h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
