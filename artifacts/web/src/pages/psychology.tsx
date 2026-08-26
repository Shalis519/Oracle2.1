import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
  Pause,
  Play,
  RotateCcw,
  Save,
  ShieldCheck,
  Trash2,
  Volume2,
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

const DAILY_PRACTICE_COUNT = 3;

type GuidanceAudio = {
  instruction: string;
  file: string;
};

const GUIDANCE_AUDIO: Record<string, Record<string, GuidanceAudio>> = {
  "cognitive-rehearsal": {
    result: {
      instruction:
        "Опишите один конкретный результат, которого Вы хотите достичь. Не пытайтесь решить всё сразу.",
      file: "cognitive-rehearsal-result.wav",
    },
    scene: {
      instruction:
        "Представьте очень короткий момент после завершённого действия. Не оценивайте образ, просто отметьте детали, которые приходят.",
      file: "cognitive-rehearsal-scene.wav",
    },
    state: {
      instruction:
        "Выберите чувство, с которым Вы хотите действовать. Достаточно одного или двух слов.",
      file: "cognitive-rehearsal-state.wav",
    },
    nextStep: {
      instruction:
        "Запишите один небольшой шаг, который можно реально выполнить сегодня.",
      file: "cognitive-rehearsal-next-step.wav",
    },
  },
  "pause-before-response": {
    situation: {
      instruction:
        "Коротко опишите событие или разговор, который вызывает напряжение.",
      file: "pause-before-response-situation.wav",
    },
    reaction: {
      instruction:
        "Отделите сам факт ситуации от первой мысли, эмоции или импульса.",
      file: "pause-before-response-reaction.wav",
    },
    influence: {
      instruction:
        "Запишите, на что Вы действительно можете повлиять в этой ситуации.",
      file: "pause-before-response-influence.wav",
    },
    nextStep: {
      instruction:
        "Сформулируйте один конкретный шаг, который поможет Вам действовать без лишнего давления.",
      file: "pause-before-response-next-step.wav",
    },
  },
  "intention-anchor": {
    intention: {
      instruction:
        "Выберите одну достижимую цель и запишите её в позитивной, понятной форме.",
      file: "intention-anchor-intention.wav",
    },
    importance: {
      instruction:
        "Налейте обычную питьевую воду. Несколько минут спокойно удерживайте внимание на смысле Вашей формулировки.",
      file: "intention-anchor-importance.wav",
    },
    water: {
      instruction:
        "Выпейте воду как нейтральное завершение короткой паузы внимания. Вода не обладает особыми свойствами в рамках этой практики.",
      file: "intention-anchor-water.wav",
    },
    nextStep: {
      instruction:
        "Запишите один реальный шаг на сегодня, который приблизит Вас к намерению.",
      file: "intention-anchor-next-step.wav",
    },
  },
  "what-matters-now": {
    feeling: {
      instruction:
        "Остановитесь на минуту и выберите слово или короткую фразу, которая точнее всего описывает Ваше состояние сейчас.",
      file: "what-matters-now-feeling.wav",
    },
    need: {
      instruction:
        "Спросите себя, чего Вам сейчас может не хватать: ясности, отдыха, поддержки, времени, разговора, порядка или чего-то другого.",
      file: "what-matters-now-need.wav",
    },
    support: {
      instruction:
        "Запишите один доступный способ поддержать себя в ближайшее время. Не нужно решать всю ситуацию сразу.",
      file: "what-matters-now-support.wav",
    },
    nextStep: {
      instruction:
        "Выберите одно небольшое действие, которое можно выполнить сегодня.",
      file: "what-matters-now-next-step.wav",
    },
  },
  "desire-without-negation": {
    avoid: {
      instruction:
        "Запишите то, чего Вы сейчас не хотите или от чего пытаетесь уйти. Формулировка может быть любой.",
      file: "desire-without-negation-avoid.wav",
    },
    direction: {
      instruction:
        "Спросите себя: если убрать нежелательное, что я хотел(а) бы видеть вместо этого? Сформулируйте ответ простыми словами.",
      file: "desire-without-negation-direction.wav",
    },
    signal: {
      instruction:
        "Выберите один признак, по которому Вы поймёте, что движетесь в нужную сторону. Это должен быть результат, связанный с Вашими действиями.",
      file: "desire-without-negation-signal.wav",
    },
    nextStep: {
      instruction:
        "Запишите одно небольшое действие, которое поможет приблизиться к выбранному направлению.",
      file: "desire-without-negation-next-step.wav",
    },
  },
  "one-delayed-step": {
    task: {
      instruction:
        "Выберите одно дело, к которому Вам трудно приступить. Не берите весь большой проект.",
      file: "one-delayed-step-task.wav",
    },
    barrier: {
      instruction:
        "Спросите себя, что делает начало трудным: неопределённость, усталость, страх оценки, нехватка времени или другое препятствие.",
      file: "one-delayed-step-barrier.wav",
    },
    smallStep: {
      instruction:
        "Превратите задачу в действие, которое можно начать и закончить примерно за десять минут.",
      file: "one-delayed-step-small-step.wav",
    },
    nextStep: {
      instruction:
        "Выберите время или обстоятельство, в котором Вы попробуете сделать этот маленький шаг.",
      file: "one-delayed-step-next-step.wav",
    },
  },
  "support-and-boundaries": {
    situation: {
      instruction:
        "Выберите один контакт или ситуацию, в которой Вам сейчас особенно нужна ясность.",
      file: "support-and-boundaries-situation.wav",
    },
    support: {
      instruction:
        "Запишите, какая поддержка могла бы быть полезна: внимание, информация, помощь, время, тишина или другое.",
      file: "support-and-boundaries-support.wav",
    },
    boundary: {
      instruction:
        "Сформулируйте, что Вам важно сохранить: время, личное пространство, темп, право отказаться или право подумать.",
      file: "support-and-boundaries-boundary.wav",
    },
    phrase: {
      instruction:
        "Напишите короткую фразу от первого лица, которую Вы могли бы использовать в разговоре.",
      file: "support-and-boundaries-phrase.wav",
    },
    nextStep: {
      instruction:
        "Выберите одно действие: подготовить разговор, попросить о помощи, ответить позже или обозначить границу.",
      file: "support-and-boundaries-next-step.wav",
    },
  },
  "voice-in-important-conversation": {
    pause: {
      instruction:
        "Сядьте удобно. Сделайте два обычных спокойных вдоха и выдоха. Не нужно менять темп дыхания или терпеть дискомфорт.",
      file: "voice-in-important-conversation-pause.wav",
    },
    important: {
      instruction:
        "Подумайте, что Вам важно сказать в одном разговоре. Это может быть просьба, чувство, вопрос или предложение.",
      file: "voice-in-important-conversation-important.wav",
    },
    phrase: {
      instruction:
        "Сформулируйте фразу от первого лица без обвинения другого человека.",
      file: "voice-in-important-conversation-phrase.wav",
    },
    readiness: {
      instruction:
        "Спросите себя, что поможет Вам чувствовать больше опоры: заметки, пауза, время на подготовку или разговор с поддерживающим человеком.",
      file: "voice-in-important-conversation-readiness.wav",
    },
    nextStep: {
      instruction: "Выберите один небольшой шаг к разговору.",
      file: "voice-in-important-conversation-next-step.wav",
    },
  },
  "parts-before-financial-decision": {
    question: {
      instruction:
        "Назовите финансовый вопрос, который требует внимания. Не указывайте лишние личные данные.",
      file: "parts-before-financial-decision-question.wav",
    },
    caution: {
      instruction:
        "Запишите, чего опасается Ваша осторожная часть. Её задача может состоять в защите от риска.",
      file: "parts-before-financial-decision-caution.wav",
    },
    aspiration: {
      instruction:
        "Запишите, к чему стремится другая часть: больше ясности, роста, свободы, порядка или уверенности.",
      file: "parts-before-financial-decision-aspiration.wav",
    },
    criterion: {
      instruction:
        "Сформулируйте правило, которое уважает обе позиции. Например: сначала собрать данные, не принимать решение в спешке или обсудить вопрос со специалистом.",
      file: "parts-before-financial-decision-criterion.wav",
    },
    nextStep: {
      instruction:
        "Выберите действие по подготовке: проверить условия, составить список вопросов или отложить решение до нужной информации.",
      file: "parts-before-financial-decision-next-step.wav",
    },
  },
  "my-suitable-day": {
    day: {
      instruction:
        "Подумайте не об идеальном будущем, а о реалистичном дне, после которого Вы чувствуете больше устойчивости.",
      file: "my-suitable-day-day.wav",
    },
    element: {
      instruction:
        "Отметьте один элемент, который особенно поддерживает Вас: сон, еда, движение, тишина, общение, работа в спокойном темпе или другое.",
      file: "my-suitable-day-element.wav",
    },
    smallVersion: {
      instruction:
        "Выберите короткий и осуществимый вариант этого элемента на ближайшие дни.",
      file: "my-suitable-day-small-version.wav",
    },
    nextStep: {
      instruction: "Назначьте конкретное время или условие для этого действия.",
      file: "my-suitable-day-next-step.wav",
    },
  },
  "small-experiment": {
    interest: {
      instruction:
        "Вспомните действие, навык или опыт, который вызывает любопытство.",
      file: "small-experiment-interest.wav",
    },
    doubt: {
      instruction:
        "Запишите одну мысль, которая останавливает Вас. Не спорьте с ней, просто назовите её.",
      file: "small-experiment-doubt.wav",
    },
    experiment: {
      instruction:
        "Уменьшите эксперимент до короткой и безопасной пробы без обязательства продолжать.",
      file: "small-experiment-experiment.wav",
    },
    observation: {
      instruction:
        "Решите, что Вы хотите заметить после попытки: интерес, удобство, сложность, настроение или новую информацию о себе.",
      file: "small-experiment-observation.wav",
    },
    nextStep: {
      instruction:
        "Выберите время для эксперимента или действие по подготовке к нему.",
      file: "small-experiment-next-step.wav",
    },
  },
};

function getLocalDayKey(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function millisecondsUntilNextLocalDay(): number {
  const nextDay = new Date();
  nextDay.setHours(24, 0, 1, 0);
  return Math.max(1_000, nextDay.getTime() - Date.now());
}

function getDailyPractices(
  practices: PsychologyPractice[],
  dayKey: string,
): PsychologyPractice[] {
  if (practices.length <= DAILY_PRACTICE_COUNT) return practices;

  let seed = 0;
  for (const character of dayKey) {
    seed = (seed * 31 + character.charCodeAt(0)) >>> 0;
  }

  const shuffled = [...practices];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    seed = (seed * 1_664_525 + 1_013_904_223) >>> 0;
    const swapIndex = seed % (index + 1);
    [shuffled[index], shuffled[swapIndex]] = [
      shuffled[swapIndex],
      shuffled[index],
    ];
  }

  return shuffled.slice(0, DAILY_PRACTICE_COUNT);
}

function getGuidanceAudio(
  practice: PsychologyPractice | null,
  step: PsychologyPractice["steps"][number] | undefined,
): string | null {
  if (!practice || !step) return null;

  const guidance = GUIDANCE_AUDIO[practice.slug]?.[step.id];
  if (!guidance || guidance.instruction !== step.instruction) return null;

  return `${import.meta.env.BASE_URL}audio/psychology/${guidance.file}`;
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
  const guidanceAudioSrc = getGuidanceAudio(activePractice, activeStep);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioSourceRef = useRef<string | null>(null);
  const [isGuidancePlaying, setIsGuidancePlaying] = useState(false);
  const [hasGuidanceProgress, setHasGuidanceProgress] = useState(false);
  const [dayKey, setDayKey] = useState(getLocalDayKey);
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
  const dailyPractices = useMemo(
    () => getDailyPractices(practices, dayKey),
    [dayKey, practices],
  );

  const stopGuidanceAudio = useCallback(() => {
    audioRef.current?.pause();
    audioRef.current = null;
    audioSourceRef.current = null;
    setIsGuidancePlaying(false);
    setHasGuidanceProgress(false);
  }, []);

  const playGuidanceAudio = useCallback(
    (restart = false) => {
      if (!guidanceAudioSrc) return;

      let audio = audioRef.current;
      if (!audio || audioSourceRef.current !== guidanceAudioSrc) {
        stopGuidanceAudio();
        audio = new Audio(guidanceAudioSrc);
        audioRef.current = audio;
        audioSourceRef.current = guidanceAudioSrc;
        audio.onended = () => {
          setIsGuidancePlaying(false);
          setHasGuidanceProgress(false);
        };
        audio.onpause = () => setIsGuidancePlaying(false);
      }

      if (restart) audio.currentTime = 0;
      void audio
        .play()
        .then(() => {
          setIsGuidancePlaying(true);
          setHasGuidanceProgress(true);
        })
        .catch(() => {
          setIsGuidancePlaying(false);
          toast({
            title: "Не удалось включить голосовую инструкцию",
            variant: "destructive",
          });
        });
    },
    [guidanceAudioSrc, stopGuidanceAudio, toast],
  );

  useEffect(() => {
    const timeout = window.setTimeout(
      () => setDayKey(getLocalDayKey()),
      millisecondsUntilNextLocalDay(),
    );
    return () => window.clearTimeout(timeout);
  }, [dayKey]);

  useEffect(() => {
    stopGuidanceAudio();
  }, [activePractice?.id, stepIndex, stopGuidanceAudio]);

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
    stopGuidanceAudio();
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
            {practices.length > DAILY_PRACTICE_COUNT ? (
              <p className="mt-1 text-xs text-muted-foreground">
                Сегодня выбраны три практики. Завтра набор обновится.
              </p>
            ) : null}
          </div>
        </div>

        {practicesLoading ? (
          <div className="flex justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary" />
          </div>
        ) : dailyPractices.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-3">
            {dailyPractices.map((practice, index) => (
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
                      {reflection.nextStep?.trim() ? (
                        <p className="text-sm">
                          <span className="font-medium text-primary">
                            Следующий шаг:{" "}
                          </span>
                          {reflection.nextStep}
                        </p>
                      ) : (
                        <p className="line-clamp-2 text-sm text-muted-foreground">
                          {practiceAnswerPreview(reflection)}
                        </p>
                      )}
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
                {guidanceAudioSrc ? (
                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (isGuidancePlaying) {
                          audioRef.current?.pause();
                          return;
                        }
                        playGuidanceAudio();
                      }}
                    >
                      {isGuidancePlaying ? (
                        <Pause className="mr-2 h-4 w-4" />
                      ) : (
                        <Volume2 className="mr-2 h-4 w-4" />
                      )}
                      {isGuidancePlaying
                        ? "Пауза"
                        : hasGuidanceProgress
                          ? "Продолжить"
                          : "Прослушать инструкцию"}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9"
                      onClick={() => playGuidanceAudio(true)}
                      title="Прослушать с начала"
                      aria-label="Прослушать инструкцию с начала"
                    >
                      <RotateCcw className="h-4 w-4" />
                    </Button>
                  </div>
                ) : null}
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
