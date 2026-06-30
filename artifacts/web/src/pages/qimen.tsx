import { useState } from "react";
import { Link } from "wouter";
import { useGetQimen, getGetQimenQueryKey } from "@workspace/api-client-react";
import type { QimenStructure } from "@workspace/api-client-react";
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
} from "lucide-react";

const WALK_RULES: string[] = [
  "Выходите точно в указанный двухчасовой интервал (час). Раньше или позже энергия уже другая.",
  "Двигайтесь в указанном направлении от своего дома или текущей точки. Пройдите ощутимое расстояние, не разворачивайтесь сразу.",
  "Перед выходом чётко, вслух озвучьте своё намерение по теме активации.",
  "Будьте активны и вовлечены: прогулка должна быть осознанной, а не формальной.",
  "Не совмещайте в одной прогулке цели, которые противоречат друг другу.",
];

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
            <CardTitle className="font-serif text-lg flex items-center gap-2">
              <Footprints className="w-5 h-5 text-emerald-400" />
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
              Двигайся на{" "}
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

export default function QimenPage() {
  const [rulesOpen, setRulesOpen] = useState(false);
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

  if (data && !data.hasBirthDate) {
    return (
      <div className="p-4 md:p-6 max-w-3xl mx-auto">
        <div className="flex flex-col items-center text-center space-y-4 mt-8">
          <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center text-destructive">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-serif font-bold">Данные не заполнены</h1>
          <p className="text-muted-foreground max-w-md">
            Персональные структуры Ци Мэнь рассчитываются по дате вашего
            рождения. Пожалуйста, заполните её в настройках профиля.
          </p>
          <Link href="/profile">
            <Button size="lg" className="mt-2">
              Перейти в профиль
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const structures = data?.structures ?? [];

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-serif font-bold mb-1 flex items-center gap-2">
              <Footprints className="w-6 h-6 text-emerald-400" />
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

      {structures.length > 0 ? (
        <div className="space-y-4">
          {structures.map((s, i) => (
            <StructureCard key={`${s.date}-${s.hourBranch}-${s.dom}-${i}`} s={s} />
          ))}
        </div>
      ) : (
        <Card className="bg-card/40 backdrop-blur-md">
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            На ближайшие {data?.windowDays ?? 14} дней благоприятных структур не
            найдено. Загляните позже — структуры появляются по благоприятным
            дням и часам.
          </CardContent>
        </Card>
      )}
    </div>
  );
}
