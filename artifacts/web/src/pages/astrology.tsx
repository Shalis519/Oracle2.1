import { useState } from "react";
import {
  useGetNatalChart,
  getGetNatalChartQueryKey,
  useCalculatePredictiveFormula,
  useCalculateMoneyFormula,
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { Sparkles, AlertCircle, ChevronDown } from "lucide-react";
import NatalWheel from "@/components/natal-wheel";
import { formatDisplayDate } from "@/lib/dateFormat";

const VS = "\uFE0E";
const glyph = (s: string) => (s ? s + VS : s);
const formatRuDate = formatDisplayDate;

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
const renderMoneyParagraph = (paragraph: string) => {
  const match = paragraph.match(/^([^:\n]+:)([\s\S]*)$/);
  if (!match) return paragraph;
  return (
    <>
      <strong className="font-bold text-foreground">{match[1]}</strong>
      {match[2]}
    </>
  );
};

const houseRoleLabel = (role: string) => ({
  ruler: "управитель",
  retrograde_ruler: "дополнительный управитель по ретроградности",
  co_ruler: "соуправитель",
  junior_co_ruler: "младший соуправитель",
  planet_in_house: "планета в доме",
  planet_near_next_cusp: "планета у следующего куспида",
  symbolic: "символический управитель",
}[role] ?? role);

export default function AstrologyPage() {
  const [lunarRecommendationsOpen, setLunarRecommendationsOpen] = useState(false);
  const [selectedFormula, setSelectedFormula] = useState<"marriage" | "money">("marriage");
  const {
    data: chart,
    isLoading,
    error,
  } = useGetNatalChart({
    query: { retry: false, queryKey: getGetNatalChartQueryKey() },
  });
  const marriageFormula = useCalculatePredictiveFormula();
  const moneyFormula = useCalculateMoneyFormula();

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
    <div className="p-4 pb-32 md:p-6 md:pb-6 max-w-5xl mx-auto space-y-6">
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
            <details>
              <summary className="cursor-pointer list-none [&::-webkit-details-marker]:hidden">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="font-serif text-lg">Планеты</CardTitle>
                  <ChevronDown className="h-5 w-5 text-muted-foreground transition-transform duration-200 [details[open]_&]:rotate-180" />
                </CardHeader>
              </summary>
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
            </details>
          </Card>

          <Card className="bg-card/40 backdrop-blur-md h-fit self-start">
          <details>
            <summary className="cursor-pointer list-none [&::-webkit-details-marker]:hidden">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="font-serif text-lg">Дома (Плацидус)</CardTitle>
                <ChevronDown className="h-5 w-5 text-muted-foreground transition-transform duration-200 [details[open]_&]:rotate-180" />
              </CardHeader>
            </summary>
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
          </details>
        </Card>

        <Card className="bg-card/40 backdrop-blur-md">
          <details>
            <summary className="cursor-pointer list-none [&::-webkit-details-marker]:hidden">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="font-serif text-lg">Аспекты</CardTitle>
                <ChevronDown className="h-5 w-5 text-muted-foreground transition-transform duration-200 [details[open]_&]:rotate-180" />
              </CardHeader>
            </summary>
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
          </details>
        </Card>
        </div>
      </div>

      {chart.cinderellaGates && chart.cinderellaGates.length > 0 && (
        <Card className="bg-card/40 backdrop-blur-md border-primary/20">
          <CardHeader className="pb-2">
            <CardTitle className="font-serif text-lg">Врата Золушки в натальной карте</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {chart.cinderellaGates.map((gate) => (
              <div key={gate.id} className="rounded-lg border border-primary/10 bg-primary/5 p-3">
                <div className="flex items-center gap-2 font-medium text-primary">
                  <span>{glyph(gate.transitBodySymbol ?? "")}</span>
                  <span>{gate.transitBody ?? "Хирон"} - {gate.natalBody}</span>
                  <span className="text-muted-foreground">({gate.aspectType.toLowerCase()})</span>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">Орбис {gate.orb.toFixed(2)}°</p>
                <p className="mt-2 text-sm leading-relaxed">{gate.interpretation}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {chart.lunarReturn && (
        <Card className="bg-card/40 backdrop-blur-md border-primary/20">
          <CardHeader className="pb-2">
            <CardTitle className="font-serif text-lg">
              <button
                type="button"
                className="flex w-full items-center justify-between gap-3 text-left"
                onClick={() => setLunarRecommendationsOpen((open) => !open)}
                aria-expanded={lunarRecommendationsOpen}
              >
                <span>Лунар</span>
                <ChevronDown className={`h-4 w-4 transition-transform ${lunarRecommendationsOpen ? "rotate-180" : ""}`} />
              </button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p>
              <span className="font-medium">Период:</span> с {formatDisplayDate(chart.lunarReturn.periodStart)} по {formatDisplayDate(chart.lunarReturn.periodEnd)}
            </p>
            <p>
              <span className="font-medium">Момент возвращения:</span> {formatDisplayDate(chart.lunarReturn.returnDate)}, {chart.lunarReturn.returnTime}
            </p>
            <p><span className="font-medium">Город расчёта:</span> {chart.lunarReturn.location.city ?? "не указан"}</p>
            {chart.lunarReturn.warning && (
              <p className="rounded-md border border-amber-500/30 bg-amber-500/10 p-3 text-amber-200">{chart.lunarReturn.warning}</p>
            )}
            {chart.lunarReturn.ascendant && (
              <p><span className="font-medium">Асцендент лунара:</span> {chart.lunarReturn.ascendant.sign}, {chart.lunarReturn.ascendant.degreeInSign}</p>
            )}
            <p><span className="font-medium">Луна лунара:</span> {chart.lunarReturn.moon.sign}, {chart.lunarReturn.moon.degreeInSign}, {chart.lunarReturn.moon.house ? `${chart.lunarReturn.moon.house} дом` : "дом не определён"}</p>
            <p><span className="font-medium">Главные темы месяца:</span> {chart.lunarReturn.keyThemes.join(", ")}</p>
            {lunarRecommendationsOpen && (
              <div className="rounded-md border border-primary/15 bg-primary/5 px-3 pb-3 pt-3">
                <p className="mb-2 font-medium">Рекомендации лунара</p>
                <div className="space-y-2">
                  {(chart.lunarReturn.recommendations ?? ["В разработке"]).map((recommendation, index) => (
                    <p key={index} className={recommendation === "В разработке" ? "text-amber-200" : "leading-relaxed text-muted-foreground"}>{recommendation}</p>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Card className="bg-card/40 backdrop-blur-md border-primary/20">
        <CardHeader className="pb-2">
          <CardTitle className="font-serif text-lg">Прогностические формулы</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-md border border-primary/15 bg-primary/5 p-3 text-sm">
            <label htmlFor="predictive-formula" className="font-medium">Выберите формулу</label>
            <select
              id="predictive-formula"
              value={selectedFormula}
              onChange={(event) => setSelectedFormula(event.target.value as "marriage" | "money")}
              className="mt-2 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
            >
              <option value="marriage">Возможный период бракосочетания</option>
              <option value="money">Денежные дома</option>
            </select>
            <p className="mt-2 text-muted-foreground">
              Расчёт выполняется только после нажатия кнопки «Рассчитать».
            </p>
          </div>
          <Button
            type="button"
            onClick={() => selectedFormula === "money" ? moneyFormula.mutate() : marriageFormula.mutate({ data: { formula: "marriage" } })}
            disabled={selectedFormula === "money" ? moneyFormula.isPending : marriageFormula.isPending}
          >
            {(selectedFormula === "money" ? moneyFormula.isPending : marriageFormula.isPending) ? "Расчёт выполняется…" : "Рассчитать"}
          </Button>
          {selectedFormula === "money" && moneyFormula.isError && (
            <p className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
              Не удалось выполнить расчёт денежных домов. Проверьте дату, точное время и место рождения в профиле.
            </p>
          )}
          {selectedFormula === "money" && moneyFormula.data && (
            <section className="space-y-4 border-t border-border/60 pt-4">
              <h2 className="font-serif text-xl font-semibold">{moneyFormula.data.title}</h2>
              <p className="text-xs text-muted-foreground">Источник: {moneyFormula.data.methodology.source}. Дома: {moneyFormula.data.methodology.includedHouses.join(", ")}. Система домов: {moneyFormula.data.methodology.houseSystem}.</p>
              <div className="space-y-1">
                {moneyFormula.data.sections.map((section) => (
                  <section key={section.key} className="space-y-1.5 border-t border-border/60 pt-3 mt-3 first:border-t-0 first:pt-0 first:mt-0 pb-3">
                    <h3 className="font-medium">{section.title}</h3>
                    {section.paragraphs.map((paragraph, index) => (
                      <p key={`${section.key}-${index}`} className="whitespace-pre-line leading-relaxed text-sm text-muted-foreground break-words">{renderMoneyParagraph(paragraph)}</p>
                    ))}
                  </section>
                ))}
              </div>
            </section>
          )}
          {selectedFormula === "marriage" && marriageFormula.isError && (
            <p className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
              Не удалось выполнить расчёт. Проверьте данные рождения в профиле и попробуйте ещё раз.
            </p>
          )}
          {selectedFormula === "marriage" && marriageFormula.data && (
            <div className="space-y-4 text-sm">
              <section className="space-y-3">
                <h3 className="font-medium">1. Показатели брака в натальной карте</h3>
                <p className="text-muted-foreground">Элементы домов рассчитаны по иерархии Шестопалова: управитель, ретроградный управитель, соуправитель, младший соуправитель и планеты в доме. Повторные роли одной планеты не объединяются.</p>
                <div className="rounded-md border border-primary/15 bg-primary/5 p-3">
                  <p className="font-medium">Первый брак</p>
                  <p className="mt-1 text-muted-foreground">Карта: {marriageFormula.data.strictNatalProfile.sect}. Сигнификатор: {marriageFormula.data.strictNatalProfile.firstMarriageSignificatorName ?? "не определён"}.</p>
                </div>
                <div className="grid gap-2 sm:grid-cols-3">
                  {marriageFormula.data.strictNatalProfile.houses.map((house) => (
                    <div key={house.house} className="rounded-md border border-primary/15 bg-primary/5 p-3">
                      <p className="font-medium">{house.house === 5 ? "V дом" : house.house === 7 ? "VII дом" : "X дом"} · {house.sign}</p>
                      <p className="mt-1 text-xs text-muted-foreground">Протяжённость: {house.width.toFixed(2)}° ({house.large ? "большой дом" : "малый дом"})</p>
                      <div className="mt-2 space-y-1 text-xs text-muted-foreground">
                        {house.elements.length ? house.elements.map((element, index) => <p key={`${element.bodyKey}-${element.role}-${index}`}>{element.bodyName} — {houseRoleLabel(element.role)}{element.repeatedRole ? " · повторная роль" : ""}{element.auxiliary ? " · вспомогательный элемент" : ""}</p>) : <p>Элементы не определены.</p>}
                      </div>
                    </div>
                  ))}
                </div>
                {marriageFormula.data.strictNatalProfile.formulas.length > 0 ? (
                  <div className="rounded-md border border-primary/15 p-3">
                    <p className="font-medium">Формулы, подтверждённые натальными элементами</p>
                    <p className="mt-1 text-muted-foreground">{marriageFormula.data.strictNatalProfile.formulas.join(", ")}</p>
                    <div className="mt-2 space-y-1 text-muted-foreground">
                      {marriageFormula.data.strictNatalProfile.connections.map((connection) => <p key={connection.id}>{connection.formula}: {connection.fromBodyKey} ({connection.fromRole}) — {connection.toBodyKey} ({connection.toRole}){connection.relation === "shared_body" ? " · общая планета" : connection.aspect ? ` · ${connection.aspect.type}, орбис ${connection.aspect.orb.toFixed(2)}°` : ""}</p>)}
                    </div>
                  </div>
                ) : (
                  <p className="rounded-md border border-border p-3 text-muted-foreground">В строгом расчёте не сформирована полноправная связь элементов V, VII и X домов.</p>
                )}
              </section>

              <section className="space-y-3 border-t border-border/60 pt-4">
                <h3 className="font-medium">2. Первый натальный цикл</h3>
                <p className="leading-relaxed text-muted-foreground">{marriageFormula.data.natalCycle.summary}</p>
                <div className="grid gap-2 sm:grid-cols-2">
                  <div className="rounded-md border border-primary/15 bg-primary/5 p-3">
                    <p className="text-xs text-muted-foreground">Формула любви</p>
                    <p className="mt-1 font-medium">{marriageFormula.data.natalCycle.loveFormulaStatus === "confirmed" ? "подтверждена" : "не подтверждена"}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{marriageFormula.data.natalCycle.loveFormulas.length ? marriageFormula.data.natalCycle.loveFormulas.join(", ") : "Связи не найдены"}</p>
                  </div>
                  <div className="rounded-md border border-primary/15 bg-primary/5 p-3">
                    <p className="text-xs text-muted-foreground">Официальный брак</p>
                    <p className="mt-1 font-medium">{marriageFormula.data.natalCycle.officialMarriageStatus === "confirmed" ? "VII + X подтверждена" : "VII + X не подтверждена"}</p>
                    <p className="mt-1 text-xs text-muted-foreground">Связей VII + X: {marriageFormula.data.natalCycle.officialConnectionCount}</p>
                  </div>
                </div>
                <div className="rounded-md border border-border p-3 text-sm text-muted-foreground"><span className="font-medium text-foreground">Показатели безбрачия:</span> {marriageFormula.data.natalCycle.celibacyNote}</div>
              </section>

              <section className="space-y-3 border-t border-border/60 pt-4">
                <h3 className="font-medium">3. Характер брачной темы</h3>
                <p className="leading-relaxed text-muted-foreground">{marriageFormula.data.natalCharacter.summary}</p>
                <div className="grid gap-2 sm:grid-cols-3">
                  <div className="rounded-md border border-emerald-500/20 bg-emerald-500/5 p-3"><span className="text-xs text-muted-foreground">Гармоничные аспекты</span><p className="mt-1 text-lg font-medium">{marriageFormula.data.natalCharacter.harmoniousCount}</p></div>
                  <div className="rounded-md border border-amber-500/20 bg-amber-500/5 p-3"><span className="text-xs text-muted-foreground">Напряжённые аспекты</span><p className="mt-1 text-lg font-medium">{marriageFormula.data.natalCharacter.tenseCount}</p></div>
                  <div className="rounded-md border border-border p-3"><span className="text-xs text-muted-foreground">Нейтральные аспекты</span><p className="mt-1 text-lg font-medium">{marriageFormula.data.natalCharacter.neutralCount}</p></div>
                </div>
                {marriageFormula.data.natalCharacter.aspects.length > 0 && (
                  <div className="rounded-md border border-primary/15 p-3">
                    <p className="font-medium">Аспекты участников формулы</p>
                    <div className="mt-2 space-y-1 text-muted-foreground">
                      {marriageFormula.data.natalCharacter.aspects.map((aspect) => <p key={`${aspect.body1}-${aspect.body2}-${aspect.typeKey}`}>{aspect.body1} — {aspect.type.toLowerCase()} — {aspect.body2}, орбис {aspect.orb.toFixed(2)}°</p>)}
                    </div>
                  </div>
                )}
              </section>

              <section className="space-y-3 border-t border-border/60 pt-4">
                <h3 className="font-medium">4. Поиск прогностических периодов</h3>
                <p className="text-muted-foreground">Период анализа: <span className="text-foreground">{formatRuDate(marriageFormula.data.searchFrom)} — {formatRuDate(marriageFormula.data.searchTo)}</span>.</p>
                {marriageFormula.data.windows.length === 0 ? (
                  <p className="rounded-md border border-border p-3 text-muted-foreground">В заданном диапазоне не найдено окон с тремя независимыми подтверждениями.</p>
                ) : (
                  <div className="space-y-3">
                    <p className="font-medium">Возможные периоды</p>
                    {marriageFormula.data.windows.map((window) => (
                      <details key={`${window.dateFrom}-${window.dateTo}`} className="rounded-md border border-primary/15 bg-primary/5 p-3">
                        <summary className="cursor-pointer font-medium">{formatRuDate(window.dateFrom)} — {formatRuDate(window.dateTo)} · {window.confirmations} подтверждения</summary>
                        <div className="mt-3 space-y-2 text-muted-foreground">
                          {window.indicators.map((indicator) => <p key={indicator.id}>{indicator.label}{indicator.date ? ` — ${formatRuDate(indicator.date)}` : ""}{indicator.phase ? ` · ${indicator.phase === "applying" ? "сходящийся аспект" : indicator.phase === "exact" ? "точный аспект" : "расходящийся аспект"}` : ""}</p>)}
                        </div>
                      </details>
                    ))}
                  </div>
                )}
              </section>
            </div>
          )}
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground/60 text-center">
        Точность расчёта — до угловых минут. Часовой пояс определяется
        автоматически по координатам места рождения.
      </p>
    </div>
  );
}
