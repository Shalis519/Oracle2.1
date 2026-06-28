import { useGetBazi, getGetBaziQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { Compass, AlertCircle, Star } from "lucide-react";

export default function BaziPage() {
  const { data: bazi, isLoading, error } = useGetBazi({ query: { retry: false, queryKey: getGetBaziQueryKey() } });

  if (isLoading) {
    return <div className="flex h-[50vh] items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>;
  }

  const isMissingData = error?.status === 400 || !bazi;

  if (isMissingData) {
    return (
      <div className="p-6 md:p-10 max-w-3xl mx-auto space-y-8 flex flex-col items-center text-center mt-12">
        <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center text-destructive mb-4">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h1 className="text-3xl font-serif font-bold">Данные не заполнены</h1>
        <p className="text-muted-foreground max-w-md">
          Для расчета карты Бацзы необходима дата вашего рождения. Пожалуйста, заполните ее в настройках профиля.
        </p>
        <Link href="/profile">
          <Button size="lg" className="mt-4">Перейти в профиль</Button>
        </Link>
      </div>
    );
  }

  // Traditional display order, right-to-left: Hour, Day, Month, Year.
  const orderedPillars = [...bazi.pillars].reverse();

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
        <Card className="bg-card/40 backdrop-blur-md overflow-hidden">
          <div className="grid grid-cols-4 divide-x divide-border">
            {orderedPillars.map((pillar, i) => {
              const isDay = pillar.name === "День";
              return (
                <div key={i} className="flex flex-col text-center">
                  <div
                    className={`py-1.5 text-[11px] font-semibold uppercase tracking-wide ${
                      isDay ? "bg-primary/20 text-primary" : "bg-muted/60 text-muted-foreground"
                    }`}
                  >
                    {pillar.name}
                  </div>
                  <div className="py-3 px-1 border-t border-border">
                    <div className={`font-serif font-bold leading-tight ${isDay ? "text-primary text-lg" : "text-base"}`}>
                      {pillar.heavenlyStem}
                    </div>
                    <div className="text-[10px] text-muted-foreground mt-0.5">{pillar.element}</div>
                  </div>
                  <div className="py-3 px-1 border-t border-border bg-muted/20">
                    <div className="font-serif font-bold text-base leading-tight">{pillar.earthlyBranch}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </motion.div>

      <Card className="bg-card/40 backdrop-blur-md border-primary/20">
        <CardHeader className="pb-2">
          <CardTitle className="font-serif text-lg">Господин дня: {bazi.dayMaster}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <span className="inline-block px-2.5 py-0.5 rounded-full bg-primary/20 text-primary text-xs font-medium">
            Элемент: {bazi.dayElement}
          </span>
          <p className="text-sm leading-relaxed text-muted-foreground">{bazi.dayElementMeaning}</p>
        </CardContent>
      </Card>

      <div>
        <h2 className="text-lg font-serif font-bold mb-3 flex items-center gap-2">
          <Star className="w-5 h-5 text-secondary" />
          Символические звезды
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {bazi.stars.map((star, i) => (
            <Card key={i} className="bg-card/40 backdrop-blur-md">
              <CardHeader className="pb-1.5">
                <CardTitle className="font-serif text-base text-secondary">{star.name}</CardTitle>
                {star.sector && <span className="text-xs text-muted-foreground">Сектор: {star.sector}</span>}
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-sm">{star.description}</p>
                <p className="text-sm italic text-muted-foreground border-l-2 border-secondary/50 pl-3 py-1">
                  {star.advice}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
