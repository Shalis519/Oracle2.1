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

  return (
    <div className="p-6 md:p-10 max-w-5xl mx-auto space-y-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <h1 className="text-4xl font-serif font-bold mb-2 flex items-center gap-3">
          <Compass className="text-primary" />
          Бацзы
        </h1>
        <p className="text-muted-foreground">Четыре столпа судьбы и энергетический потенциал.</p>
      </motion.div>

      <Card className="bg-card/40 backdrop-blur-md border-primary/20 shadow-lg mb-8">
        <CardHeader>
          <CardTitle className="font-serif text-2xl">Господин Дня: {bazi.dayMaster}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3 mb-4">
            <span className="px-3 py-1 rounded-full bg-primary/20 text-primary text-sm font-medium">
              Элемент: {bazi.dayElement}
            </span>
          </div>
          <p className="text-lg leading-relaxed">{bazi.dayElementMeaning}</p>
        </CardContent>
      </Card>

      <h2 className="text-2xl font-serif font-bold mb-4">Четыре столпа</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {bazi.pillars.map((pillar, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: i * 0.1 }}>
            <Card className="bg-card/40 backdrop-blur-md h-full text-center py-4">
              <CardHeader className="pb-2 pt-2">
                <CardTitle className="text-sm text-muted-foreground">{pillar.name}</CardTitle>
              </CardHeader>
              <CardContent className="pb-2 space-y-2">
                <div className="text-xl font-serif font-bold">{pillar.heavenlyStem}</div>
                <div className="text-xl font-serif font-bold">{pillar.earthlyBranch}</div>
                <div className="text-xs text-muted-foreground mt-2">{pillar.element}</div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <h2 className="text-2xl font-serif font-bold mb-4 flex items-center gap-2">
        <Star className="w-6 h-6 text-secondary" />
        Символические звезды
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {bazi.stars.map((star, i) => (
          <Card key={i} className="bg-card/40 backdrop-blur-md">
            <CardHeader className="pb-2">
              <CardTitle className="font-serif text-xl text-secondary">{star.name}</CardTitle>
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
  );
}
