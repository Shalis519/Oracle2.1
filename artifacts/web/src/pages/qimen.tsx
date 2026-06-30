import { useState } from "react";
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
import { Footprints, Compass, ScrollText, Target } from "lucide-react";

interface QimenWalk {
  date: string;
  name: string;
  goal: string;
  direction: string;
  hour: string;
  intention: string;
}

const WALK_RULES: string[] = [
  "Выходите точно в указанный двухчасовой интервал (час). Раньше или позже энергия уже другая.",
  "Двигайтесь в указанном направлении от своего дома или текущей точки. Пройдите ощутимое расстояние, не разворачивайтесь сразу.",
  "Перед выходом чётко, вслух озвучьте своё намерение по теме активации.",
  "Будьте активны и вовлечены: прогулка должна быть осознанной, а не формальной.",
  "Не совмещайте в одной прогулке цели, которые противоречат друг другу.",
];

const SAMPLE_WALKS: QimenWalk[] = [
  {
    date: "3 июля",
    name: "Нефритовая Леди",
    goal: "знакомства, романтические встречи, приятная компания",
    direction: "СЗ (северо-запад)",
    hour: "час Петуха (17:00–19:00)",
    intention:
      "Обязательно озвучь своё намерение в данной теме. Будь активным.",
  },
];

function WalkCard({ walk }: { walk: QimenWalk }) {
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
              Структура «{walk.name}»
            </CardTitle>
            <span className="shrink-0 rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-medium text-emerald-300">
              {walk.date}
            </span>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-start gap-2 text-sm">
            <Target className="w-4 h-4 mt-0.5 shrink-0 text-emerald-400/80" />
            <p className="leading-relaxed">
              <span className="font-medium">Цель:</span> {walk.goal}.
            </p>
          </div>
          <div className="flex items-start gap-2 text-sm">
            <Compass className="w-4 h-4 mt-0.5 shrink-0 text-emerald-400/80" />
            <p className="leading-relaxed">
              Двигайся на{" "}
              <span className="font-semibold text-emerald-300">
                {walk.direction}
              </span>{" "}
              в {walk.hour}.
            </p>
          </div>
          <p className="text-sm italic text-muted-foreground border-l-2 border-emerald-500/50 pl-3 py-1">
            {walk.intention}
          </p>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default function QimenPage() {
  const [rulesOpen, setRulesOpen] = useState(false);
  const walks = SAMPLE_WALKS;

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
              Индивидуальные структуры по благоприятным направлениям и часам.
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

      {walks.length > 0 ? (
        <div className="space-y-4">
          <p className="text-xs text-muted-foreground">
            Пример формата. Персональные структуры появятся здесь после
            подключения расчётов.
          </p>
          {walks.map((walk, i) => (
            <WalkCard key={i} walk={walk} />
          ))}
        </div>
      ) : (
        <Card className="bg-card/40 backdrop-blur-md">
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            Сейчас доступных структур нет. Загляните позже — структуры
            появляются по благоприятным дням.
          </CardContent>
        </Card>
      )}
    </div>
  );
}
