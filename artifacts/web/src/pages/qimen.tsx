import { useState } from "react";
import { Link } from "wouter";
import { useGetQimen, getGetQimenQueryKey } from "@workspace/api-client-react";
import type { QimenStructure, JiFuWish } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { motion } from "framer-motion";
import {
  Footprints,
  Compass,
  ScrollText,
  Target,
  Eye,
  Sparkles,
  AlertCircle,
  Info,
} from "lucide-react";

const WALK_RULES: string[] = [
  "Выходите точно в указанный двухчасовой интервал (час). Раньше или позже энергия уже другая.",
  "Двигайтесь в указанном направлении от своего дома или текущей точки. Пройдите ощутимое расстояние, не разворачивайтесь сразу.",
  "Перед выходом чётко, вслух озвучьте своё намерение по теме активации.",
  "Будьте активны и вовлечены: прогулка должна быть осознанной, а не формальной.",
  "Не совмещайте в одной прогулке цели, которые противоречат друг другу.",
];

const JIFU_INFO =
  "Дух Джи Фу помогает исполнять просьбы и желания. Сила взаимодействия, учитывает совпадение сектора по году, месяцу, дню и часу. Мах 4 балла.";

const MONTHS_RU = [
  "января", "февраля", "марта", "апреля", "мая", "июня",
  "июля", "августа", "сентября", "октября", "ноября", "декабря",
];

function formatDate(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  if (!m) return iso;
  return `${Number(m[3])} ${MONTHS_RU[Number(m[2]) - 1]}`;
}

function StructureCard({ s }: { s: QimenStructure }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="bg-card/40 backdrop-blur-md border-emerald-500/30">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between gap-3">
            <CardTitle className="font-serif text-lg">
              Структура «{s.structureName}»
            </CardTitle>
            <span className="shrink-0 rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-medium text-emerald-300">
              {formatDate(s.date)}
            </span>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-start gap-2 text-sm">
            <Target className="w-4 h-4 mt-0.5 shrink-0 text-emerald-400/80" />
            <p className="leading-relaxed">
              <span className="font-medium">Цель:</span> {s.goal}.
            </p>
          </div>
          <div className="flex items-start gap-2 text-sm">
            <Compass className="w-4 h-4 mt-0.5 shrink-0 text-emerald-400/80" />
            <p className="leading-relaxed">
              Сектор{" "}
              <span className="font-semibold text-emerald-300">
                {s.direction}
              </span>{" "}
              в {s.hourLabel}.
            </p>
          </div>
          <div className="flex items-start gap-2 text-sm">
            <Sparkles className="w-4 h-4 mt-0.5 shrink-0 text-emerald-400/80" />
            <p className="leading-relaxed">
              <span className="font-medium">Активация:</span> {s.activation}.{" "}
              <span className="text-muted-foreground">
                {s.starName}, {s.wonderName}.
              </span>
            </p>
          </div>

          <div className="rounded-lg bg-emerald-500/5 border border-emerald-500/15 p-3 space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-emerald-300/90">
              <Eye className="w-3.5 h-3.5" />
              Знаки
            </div>
            <ul className="list-disc list-outside space-y-1 pl-5 text-sm leading-relaxed">
              {s.signs.map((sign, i) => (
                <li key={i}>{sign}</li>
              ))}
            </ul>
          </div>

          <p className="text-sm leading-relaxed border-l-2 border-emerald-500/50 pl-3 py-1">
            <span className="font-medium">Результат:</span> {s.result}
          </p>

          {s.note ? (
            <p className="text-xs italic text-muted-foreground">{s.note}</p>
          ) : null}
        </CardContent>
      </Card>
    </motion.div>
  );
}

function JiFuWishCard({ w }: { w: JiFuWish }) {
  const scales: string[] = ["час"];
  if (w.matchDay) scales.push("день");
  if (w.matchMonth) scales.push("месяц");
  if (w.matchYear) scales.push("год");

  const hourWindow = w.hourLabel.match(/\(([^)]*)\)/)?.[0] ?? "";

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Card className="bg-card/40 backdrop-blur-md border-amber-400/30">
        <CardContent className="py-4 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <p className="text-sm leading-relaxed">
              Джи Фу в час{" "}
              <span className="font-semibold text-amber-200">{w.hourAnimalGen}</span>
              {hourWindow ? ` ${hourWindow}` : ""} сидеть спиной на{" "}
              <span className="font-semibold text-amber-200">{w.directionLoc}</span>. Сила
              взаимодействия с ним{" "}
              <span className="font-semibold text-amber-200">{w.strength} балла</span>.
            </p>
            <span className="shrink-0 rounded-full bg-amber-400/15 px-3 py-1 text-xs font-medium text-amber-200">
              {formatDate(w.date)}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Compass className="w-3.5 h-3.5 text-amber-300/70" />
              {w.direction}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs text-muted-foreground">Совпадение секторов:</span>
            {scales.map((label) => (
              <span
                key={label}
                className="rounded-full bg-amber-400/10 px-2 py-0.5 text-xs text-amber-200/90"
              >
                {label}
              </span>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default function QimenPage() {
  const [rulesOpen, setRulesOpen] = useState(false);
  const [jifuInfoOpen, setJifuInfoOpen] = useState(false);
  const { data, isLoading } = useGetQimen({
    query: { retry: false, queryKey: getGetQimenQueryKey() },
  });

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const hasBirthDate = data?.hasBirthDate ?? false;
  const structures = data?.structures ?? [];
  const jiFuWishes = data?.jiFuWishes ?? [];
  const windowDays = data?.windowDays ?? 14;

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-serif font-bold mb-1">
              Ци Мэнь Дунь Цзя
            </h1>
            <p className="text-sm text-muted-foreground">
              Индивидуальные структуры по благоприятным направлениям и часам
              {data?.birthYearAnimal ? ` (год — ${data.birthYearAnimal})` : ""}.
            </p>
          </div>
          <Dialog open={rulesOpen} onOpenChange={setRulesOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="shrink-0 gap-2">
                <ScrollText className="w-4 h-4" />
                Правила прогулок
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle className="font-serif flex items-center gap-2">
                  <ScrollText className="w-5 h-5 text-emerald-400" />
                  Правила прогулок
                </DialogTitle>
              </DialogHeader>
              <ol className="list-decimal list-outside space-y-2 pl-5 text-sm leading-relaxed">
                {WALK_RULES.map((rule, i) => (
                  <li key={i}>{rule}</li>
                ))}
              </ol>
            </DialogContent>
          </Dialog>
        </div>
      </motion.div>

      {/* Исполнение желаний с Джи Фу — универсально, без привязки к дате рождения */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-amber-300" />
          <h2 className="text-xl font-serif font-semibold">
            <Dialog open={jifuInfoOpen} onOpenChange={setJifuInfoOpen}>
              <DialogTrigger asChild>
                <button
                  type="button"
                  className="inline-flex items-center gap-1.5 underline decoration-dotted decoration-amber-300/60 underline-offset-4 hover:text-amber-200 transition-colors"
                >
                  Исполнение желаний с Джи Фу
                  <Info className="w-4 h-4 text-amber-300/80" />
                </button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle className="font-serif flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-amber-300" />
                    Исполнение желаний с Джи Фу
                  </DialogTitle>
                </DialogHeader>
                <p className="text-sm leading-relaxed">{JIFU_INFO}</p>
              </DialogContent>
            </Dialog>
          </h2>
        </div>

        {jiFuWishes.length > 0 ? (
          <div className="space-y-3">
            {jiFuWishes.map((w, i) => (
              <JiFuWishCard key={`${w.date}-${w.hourBranch}-${i}`} w={w} />
            ))}
          </div>
        ) : (
          <Card className="bg-card/40 backdrop-blur-md">
            <CardContent className="py-8 text-center text-sm text-muted-foreground">
              На сегодня сильных совпадений сектора Джи Фу не найдено.
            </CardContent>
          </Card>
        )}
      </section>

      {/* Персональные структуры «Три Генерала» — требуют дату рождения */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Footprints className="w-5 h-5 text-emerald-400" />
          <h2 className="text-xl font-serif font-semibold">
            Структуры «Три Генерала»
          </h2>
        </div>

        {!hasBirthDate ? (
          <Card className="bg-card/40 backdrop-blur-md">
            <CardContent className="py-8 flex flex-col items-center text-center space-y-4">
              <div className="w-14 h-14 rounded-full bg-destructive/10 flex items-center justify-center text-destructive">
                <AlertCircle className="w-7 h-7" />
              </div>
              <p className="text-muted-foreground max-w-md text-sm">
                Персональные структуры рассчитываются по дате вашего рождения.
                Пожалуйста, заполните её в настройках профиля.
              </p>
              <Link href="/profile">
                <Button size="lg" className="mt-1">
                  Перейти в профиль
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : structures.length > 0 ? (
          <div className="space-y-4">
            {structures.map((s, i) => (
              <StructureCard key={`${s.date}-${s.hourBranch}-${s.dom}-${i}`} s={s} />
            ))}
          </div>
        ) : (
          <Card className="bg-card/40 backdrop-blur-md">
            <CardContent className="py-10 text-center text-sm text-muted-foreground">
              На ближайшие {windowDays} дней благоприятных структур не найдено.
              Загляните позже — структуры появляются по благоприятным дням и часам.
            </CardContent>
          </Card>
        )}
      </section>
    </div>
  );
}
