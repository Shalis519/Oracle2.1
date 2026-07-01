import {
  useGetBazi,
  getGetBaziQueryKey,
  useGetPeachBlossom,
  getGetPeachBlossomQueryKey,
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { Compass, AlertCircle, Sparkles, Coins, Flower2, CalendarHeart } from "lucide-react";
import BaziHoursCalculator from "@/components/bazi-hours-calculator";

const MONTHS_GENITIVE = [
  "января",
  "февраля",
  "марта",
  "апреля",
  "мая",
  "июня",
  "июля",
  "августа",
  "сентября",
  "октября",
  "ноября",
  "декабря",
];

function formatSpendingDays(dates: string[]): string {
  const groups: { month: number; year: number; days: number[] }[] = [];
  for (const iso of dates) {
    const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
    if (!m) continue;
    const year = Number(m[1]);
    const month = Number(m[2]) - 1;
    const day = Number(m[3]);
    const last = groups[groups.length - 1];
    if (!last || last.month !== month || last.year !== year) {
      groups.push({ month, year, days: [day] });
    } else {
      last.days.push(day);
    }
  }
  return groups
    .map((g) => `${g.days.join(", ")} ${MONTHS_GENITIVE[g.month]}`)
    .join(", ");
}

export default function BaziPage() {
  const { data: bazi, isLoading, error } = useGetBazi({ query: { retry: false, queryKey: getGetBaziQueryKey() } });
  const { data: peach } = useGetPeachBlossom({ query: { retry: false, queryKey: getGetPeachBlossomQueryKey() } });

  if (isLoading) {
    return <div className="flex h-[50vh] items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>;
  }

  const isMissingData = error?.status === 400 || !bazi;

  if (isMissingData) {
    return (
      <div className="p-4 md:p-6 max-w-3xl mx-auto space-y-8">
        <div className="flex flex-col items-center text-center space-y-4 mt-8">
          <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center text-destructive">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-serif font-bold">Данные не заполнены</h1>
          <p className="text-muted-foreground max-w-md">
            Для расчета карты Бацзы необходима дата вашего рождения. Пожалуйста, заполните ее в настройках профиля.
          </p>
          <Link href="/profile">
            <Button size="lg" className="mt-2">Перейти в профиль</Button>
          </Link>
        </div>

        <BaziHoursCalculator />
      </div>
    );
  }

  // Traditional display order, right-to-left: Hour, Day, Month, Year.
  const orderedPillars = [...bazi.pillars].reverse();

  const formatDate = (iso: string) => {
    const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
    return m ? `${m[3]}.${m[2]}.${m[1]}` : iso;
  };
  // The activation holds until the day before the next Bazi month begins.
  const formatEnd = (iso: string) => {
    const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
    if (!m) return iso;
    const dt = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
    dt.setDate(dt.getDate() - 1);
    const dd = String(dt.getDate()).padStart(2, "0");
    const mm = String(dt.getMonth() + 1).padStart(2, "0");
    return `${dd}.${mm}.${dt.getFullYear()}`;
  };

  const promo = bazi.promotionActivation;
  const noble = bazi.nobleHelperActivation;

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <h1 className="text-2xl font-serif font-bold mb-1 flex items-center gap-2">
          <Compass className="w-6 h-6 text-primary" />
          Бацзы
        </h1>
        <p className="text-sm text-muted-foreground">Четыре столпа судьбы и энергетический потенциал.</p>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <Card className="bg-card/40 backdrop-blur-md overflow-hidden w-full max-w-[260px]">
          <div className="grid grid-cols-4 divide-x divide-border">
            {orderedPillars.map((pillar, i) => {
              const isDay = pillar.name === "День";
              const [branchName, branchRest] = pillar.earthlyBranch.split(" (");
              const branchAnimal = branchRest ? branchRest.replace(")", "") : "";
              return (
                <div key={i} className="flex flex-col text-center">
                  <div
                    className={`py-1 text-[10px] font-semibold uppercase tracking-wide ${
                      isDay ? "bg-primary/20 text-primary" : "bg-muted/60 text-muted-foreground"
                    }`}
                  >
                    {pillar.name}
                  </div>
                  <div className="py-2 px-0.5 border-t border-border">
                    <div className={`font-serif font-bold leading-tight ${isDay ? "text-primary text-base" : "text-sm"}`}>
                      {pillar.heavenlyStem}
                    </div>
                    <div className="text-[9px] text-muted-foreground mt-0.5 leading-tight">{pillar.element}</div>
                  </div>
                  <div className="py-2 px-0.5 border-t border-border bg-muted/20">
                    <div className="font-serif font-bold text-sm leading-tight">{branchName}</div>
                    {branchAnimal && (
                      <div className="text-[9px] text-muted-foreground mt-0.5 leading-tight">{branchAnimal}</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </motion.div>

      {promo && (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <Card className="bg-card/40 backdrop-blur-md border-primary/30">
            <CardHeader className="pb-2">
              <CardTitle className="font-serif text-lg flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                Активизация «Удача продвижения»
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm leading-relaxed">
                Активизация в секторе{" "}
                <span className="font-semibold text-primary">
                  {promo.direction}
                  {promo.degrees ? ` (${promo.degrees})` : ""}
                </span>{" "}
                весь период с {formatDate(promo.periodStart)} по {formatEnd(promo.periodEnd)}.
              </p>

              <div>
                <p className="text-sm font-medium mb-1">Помогает:</p>
                <ul className="list-disc list-inside space-y-0.5 text-sm text-muted-foreground">
                  {promo.helps.map((h, i) => (
                    <li key={i}>{h}</li>
                  ))}
                </ul>
              </div>

              <p className="text-sm italic text-muted-foreground border-l-2 border-primary/50 pl-3 py-1">
                {promo.recommendation}
              </p>

              {promo.hours.length > 0 && (
                <div>
                  <p className="text-sm font-medium mb-1">
                    Благоприятные часы (двухчасовки)
                    {promo.nobleDate ? ` в день Благородного (${formatDate(promo.nobleDate)})` : ""}:
                  </p>
                  <ul className="list-disc list-inside space-y-0.5 text-sm text-muted-foreground">
                    {promo.hours.map((h, i) => (
                      <li key={i}>
                        {h.animal} ({h.period}) — {h.reason}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}

      {noble && (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <Card className="bg-card/40 backdrop-blur-md border-secondary/30">
            <CardHeader className="pb-2">
              <CardTitle className="font-serif text-lg flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-secondary" />
                Активизация «Благородный помощник»
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm leading-relaxed">
                <span className="font-medium">Цель:</span> {noble.goal}.
              </p>

              <p className="text-sm leading-relaxed text-muted-foreground">{noble.taichi}</p>

              <p className="text-sm leading-relaxed">
                {noble.daysUntil === 0
                  ? `Сегодня (${formatDate(noble.date)}) — день Благородного`
                  : noble.daysUntil === 1
                    ? `Завтра (${formatDate(noble.date)}) — день Благородного`
                    : `${formatDate(noble.date)} (через ${noble.daysUntil} дн.) — день Благородного`}{" "}
                ({noble.animal}). В секторе{" "}
                <span className="font-semibold text-secondary">
                  {noble.sector} ({noble.degrees})
                </span>{" "}
                проведите уборку и позвоните в колокольчик. Озвучьте намерение по цели. Весь процесс должен занять не менее 15 минут.
              </p>

              {noble.daysUntil > 0 && (
                <p className="text-sm leading-relaxed text-secondary/90">
                  Подготовьтесь заранее: активизация состоится через {noble.daysUntil}{" "}
                  {noble.daysUntil === 1 ? "день" : noble.daysUntil < 5 ? "дня" : "дней"}.
                </p>
              )}

              <div>
                <p className="text-sm font-medium mb-1">Благоприятные часы (двухчасовки):</p>
                <ul className="list-disc list-inside space-y-0.5 text-sm text-muted-foreground">
                  {noble.hours.map((h, i) => (
                    <li key={i}>
                      {h.animal} ({h.period}) — {h.reason}
                    </li>
                  ))}
                </ul>
              </div>

              {noble.caution && (
                <p className="text-sm italic text-muted-foreground border-l-2 border-destructive/50 pl-3 py-1">
                  {noble.caution}
                </p>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}

      {bazi.spendingDays.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <Card className="bg-card/40 backdrop-blur-md border-amber-500/30">
            <CardHeader className="pb-2">
              <CardTitle className="font-serif text-lg flex items-center gap-2">
                <Coins className="w-5 h-5 text-amber-500" />
                Грабитель богатства
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-relaxed">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="font-semibold underline decoration-dotted underline-offset-4 cursor-help">
                      Дни трат
                    </span>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs text-sm leading-relaxed">
                    Запланируйте «добровольные траты»: оплатите счета, совершайте покупки, займитесь благотворительностью, делайте подарки. Это «подкармливает» денежную энергию.
                  </TooltipContent>
                </Tooltip>
                : {formatSpendingDays(bazi.spendingDays)}.
              </p>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {peach && (
        <>
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <Card className="bg-card/40 backdrop-blur-md border-rose-500/30">
              <CardHeader className="pb-2">
                <CardTitle className="font-serif text-lg flex items-center gap-2">
                  <Flower2 className="w-5 h-5 text-rose-400" />
                  Цветок Персика
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Ветвь года:{" "}
                  <span className="font-medium text-foreground">
                    {peach.yearBranch.zh} {peach.yearBranch.ru}
                  </span>
                  {"  ·  "}
                  Ветвь дня:{" "}
                  <span className="font-medium text-foreground">
                    {peach.dayBranch.zh} {peach.dayBranch.ru}
                  </span>
                </p>

                <div className="space-y-1">
                  {peach.overview.lines.map((l, i) => (
                    <p key={i} className="text-sm leading-relaxed">
                      {l}
                    </p>
                  ))}
                  {peach.overview.bullets.length > 0 && (
                    <ul className="list-disc list-inside space-y-0.5 text-sm text-muted-foreground pt-1">
                      {peach.overview.bullets.map((b, i) => (
                        <li key={i}>{b}</li>
                      ))}
                    </ul>
                  )}
                </div>

                {peach.flowers.map((f, i) => (
                  <div key={i} className="rounded-lg border border-rose-500/20 bg-rose-500/5 p-3 space-y-2">
                    <p className="font-serif font-semibold text-rose-300">
                      Цветок Персика{f.scopeLabel ? ` ${f.scopeLabel}` : ""} — {f.animal}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Сектор {f.sector} ({f.degrees})
                    </p>
                    <p className="text-sm leading-relaxed">{f.intro}</p>
                    <p className="text-sm leading-relaxed">{f.body}</p>
                    <p className="text-sm italic text-muted-foreground border-l-2 border-rose-500/50 pl-3 py-1">
                      Тёмная сторона: {f.darkSide}
                    </p>
                    <p className="text-xs text-muted-foreground">{f.keywords}</p>
                    <p className="text-sm leading-relaxed">{f.magnetism}</p>
                    <p className="text-sm leading-relaxed">{f.boostPeople}</p>
                    <p className="text-sm italic text-muted-foreground">{f.note}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <Card className="bg-card/40 backdrop-blur-md border-rose-500/30">
              <CardHeader className="pb-2">
                <CardTitle className="font-serif text-lg flex items-center gap-2">
                  <CalendarHeart className="w-5 h-5 text-rose-400" />
                  Благоприятные дни активизации
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {peach.favorableDays.map((fd, i) => (
                  <div key={i} className="space-y-1.5">
                    <p className="text-sm font-medium">
                      Цветок Персика{fd.scopeLabel ? ` ${fd.scopeLabel}` : ""} — {fd.animal}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Сектор {fd.sector} ({fd.degrees})
                    </p>
                    {fd.pairs.length > 0 ? (
                      <ul className="space-y-0.5 text-sm text-muted-foreground">
                        {fd.pairs.map((p, j) => (
                          <li key={j}>
                            {p.date}: {p.time}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-muted-foreground">В ближайшие 30 дней подходящих дней нет.</p>
                    )}
                    {fd.note && (
                      <p className="text-sm italic text-muted-foreground border-l-2 border-rose-500/50 pl-3 py-1">
                        {fd.note}
                      </p>
                    )}
                  </div>
                ))}
                <div className="space-y-1 pt-1">
                  {peach.favorableFooter.map((line, i) => (
                    <p key={i} className="text-xs text-muted-foreground">
                      {line}
                    </p>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <Dialog>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start gap-2 border-rose-500/30 text-rose-300 hover:text-rose-200 hover:bg-rose-500/10"
                >
                  <Sparkles className="w-5 h-5 text-rose-400" />
                  Активизация Цветок Персика
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="font-serif flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-rose-400" />
                    Активизация Цветок Персика
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <p className="text-sm leading-relaxed">{peach.activation.intro}</p>

                  <div className="space-y-3">
                    {peach.activation.methods.map((m, i) => (
                      <div key={i} className="space-y-1">
                        <p className="text-sm font-medium">{m.title}</p>
                        {m.body && (
                          <p className="text-sm leading-relaxed text-muted-foreground">{m.body}</p>
                        )}
                        {m.bullets.length > 0 && (
                          <ul className="list-disc list-inside space-y-0.5 text-sm text-muted-foreground">
                            {m.bullets.map((b, j) => (
                              <li key={j}>{b}</li>
                            ))}
                          </ul>
                        )}
                        {m.extra && <p className="text-sm italic text-muted-foreground">{m.extra}</p>}
                      </div>
                    ))}
                  </div>

                  {[peach.activation.conditions, peach.activation.warnings, peach.activation.placement].map(
                    (blk, i) => (
                      <div key={i}>
                        <p className="text-sm font-medium mb-1">{blk.title}</p>
                        <ul className="list-disc list-inside space-y-0.5 text-sm text-muted-foreground">
                          {blk.bullets.map((b, j) => (
                            <li key={j}>{b}</li>
                          ))}
                        </ul>
                      </div>
                    ),
                  )}

                  <div>
                    <p className="text-sm font-medium mb-1">{peach.activation.whenToStart.title}</p>
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      {peach.activation.whenToStart.text}
                    </p>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </motion.div>
        </>
      )}

      <BaziHoursCalculator />
    </div>
  );
}
