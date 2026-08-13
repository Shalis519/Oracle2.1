import {
  useGetNatalChart,
  getGetNatalChartQueryKey,
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { Sparkles, AlertCircle } from "lucide-react";
import NatalWheel from "@/components/natal-wheel";

const VS = "\uFE0E";
const glyph = (s: string) => (s ? s + VS : s);

const ROMAN = [
  "I",
  "II",
  "III",
  "IV",
  "V",
  "VI",
  "VII",
  "VIII",
  "IX",
  "X",
  "XI",
  "XII",
];
const toRoman = (n: number) => ROMAN[n - 1] ?? String(n);

export default function AstrologyPage() {
  const {
    data: chart,
    isLoading,
    error,
  } = useGetNatalChart({
    query: { retry: false, queryKey: getGetNatalChartQueryKey() },
  });

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const errStatus = (error as { status?: number } | null)?.status;

  if (error && errStatus !== 400) {
    return (
      <div className="p-4 md:p-6 max-w-3xl mx-auto space-y-8">
        <div className="flex flex-col items-center text-center space-y-4 mt-8">
          <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center text-destructive">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-serif font-bold">
            Не удалось построить карту
          </h1>
          <p className="text-muted-foreground max-w-md">
            Произошла ошибка при расчёте натальной карты. Пожалуйста, попробуйте
            обновить страницу чуть позже.
          </p>
        </div>
      </div>
    );
  }

  const isMissingData = errStatus === 400 || !chart;
  const angleKeyByHouse: Record<number, string> = {
    1: "ascendant",
    4: "imumcoeli",
    7: "descendant",
    10: "midheaven",
  };
  const displayedAspects = chart?.aspects.filter(
    (a) =>
      a.body1Symbol !== "☊" &&
      a.body1Symbol !== "☋" &&
      a.body2Symbol !== "☊" &&
      a.body2Symbol !== "☋"
  ) ?? [];

  if (isMissingData) {
    return (
      <div className="p-4 md:p-6 max-w-3xl mx-auto space-y-8">
        <div className="flex flex-col items-center text-center space-y-4 mt-8">
          <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center text-destructive">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-serif font-bold">Данные не заполнены</h1>
          <p className="text-muted-foreground max-w-md">
            Для построения натальной карты необходимы дата, точное время и место
            рождения (с координатами). Пожалуйста, укажите их в настройках
            профиля.
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

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-2xl font-serif font-bold mb-1 flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-primary" />
          Западная астрология
        </h1>
        <p className="text-sm text-muted-foreground">
          Натальная карта: система домов Плацидус, тропический зодиак.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_320px] gap-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
        >
          <Card className="bg-card/40 backdrop-blur-md border-primary/20">
            <CardContent className="p-3 md:p-5">
              <NatalWheel
                bodies={chart.bodies}
                angles={chart.angles}
                houses={chart.houses}
                aspects={chart.aspects}
              />
            </CardContent>
          </Card>
        </motion.div>

        <div className="space-y-6">
          <Card className="bg-card/40 backdrop-blur-md">
            <CardHeader className="pb-2">
              <CardTitle className="font-serif text-lg">Планеты</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border">
                {chart.bodies.map((b) => (
                  <div
                    key={b.key}
                    className="flex items-center justify-between px-4 py-2 text-sm"
                  >
                    <span className="flex items-center gap-2">
                      <span className={`relative inline-flex items-center justify-center w-5 text-primary ${b.key === "sun" ? "text-xl" : "text-lg"}`}>
                        {glyph(b.symbol)}
                        {b.retrograde && (
                          <span
                            className="absolute left-[calc(100%-1px)] top-[calc(50%+5px)] text-[6px] leading-none font-normal text-muted-foreground"
                            aria-label="Ретроградное движение"
                          >
                            R
                          </span>
                        )}
                      </span>
                      <span>{b.name}</span>
                    </span>
                    <span className="flex items-center gap-1.5 text-muted-foreground">
                      <span className="text-secondary">{glyph(b.signSymbol)}</span>
                      <span className="tabular-nums">{b.degreeInSign}</span>
                      {b.house && (
                        <span className="text-xs text-muted-foreground/70">
                          · {toRoman(b.house)} дом
                        </span>
                      )}

                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        <Card className="bg-card/40 backdrop-blur-md h-fit self-start">
          <CardHeader className="pb-2">
            <CardTitle className="font-serif text-lg">Дома (Плацидус)</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="grid grid-cols-2 divide-y divide-border">
              {chart.houses.map((h) => {
                const angle = chart.angles.find((a) => a.key === angleKeyByHouse[h.number]);
                return (
                  <div
                    key={h.number}
                    className="flex items-center justify-between px-4 py-2 text-sm border-b border-border"
                  >
                    <span className="flex items-center gap-2 text-muted-foreground">
                      {angle ? (
                        <span className="font-semibold text-primary">
                          {angle.abbr === "ASC" ? "Asc" : angle.abbr === "DSC" ? "Dsc" : angle.abbr} ({toRoman(h.number)})
                        </span>
                      ) : (
                        <span>{toRoman(h.number)} дом</span>
                      )}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="text-secondary">{glyph(h.signSymbol)}</span>
                      <span className="tabular-nums text-muted-foreground">
                        {h.degreeInSign}
                      </span>
                    </span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/40 backdrop-blur-md">
          <CardHeader className="pb-2">
            <CardTitle className="font-serif text-lg">Аспекты</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {displayedAspects.length === 0 ? (
              <p className="px-4 py-3 text-sm text-muted-foreground">
                Значимых аспектов не найдено.
              </p>
            ) : (
              <div className="divide-y divide-border max-h-[420px] overflow-y-auto">
                {displayedAspects.map((a, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between px-4 py-2 text-sm"
                  >
                    <span className="flex items-center gap-1.5">
                      <span className={`text-primary w-5 text-center ${a.body1 === "sun" ? "text-xl" : "text-base"}`}>
                        {glyph(a.body1Symbol)}
                      </span>
                      <span className="text-muted-foreground">{glyph(a.typeSymbol)}</span>
                      <span className={`text-primary w-5 text-center ${a.body2 === "sun" ? "text-xl" : "text-base"}`}>
                        {glyph(a.body2Symbol)}
                      </span>
                    </span>
                    <span className="flex items-center gap-2 text-muted-foreground">
                      <span>{a.type}</span>
                      <span className="text-xs text-muted-foreground/60 tabular-nums">
                        орб {a.orb}°
                      </span>
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <p className="text-xs text-muted-foreground/60 text-center">
        Точность расчёта — до угловых минут. Часовой пояс определяется
        автоматически по координатам места рождения.
      </p>
    </div>
  );
}
