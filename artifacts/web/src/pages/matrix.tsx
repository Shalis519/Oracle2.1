import { useGetMatrix, getGetMatrixQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { Layers, AlertCircle } from "lucide-react";

export default function MatrixPage() {
  const { data: matrix, isLoading, error } = useGetMatrix({ query: { retry: false, queryKey: getGetMatrixQueryKey() } });

  if (isLoading) {
    return <div className="flex h-[50vh] items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>;
  }

  const isMissingData = error?.status === 400 || !matrix;

  if (isMissingData) {
    return (
      <div className="p-6 md:p-10 max-w-3xl mx-auto space-y-8 flex flex-col items-center text-center mt-12">
        <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center text-destructive mb-4">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h1 className="text-3xl font-serif font-bold">Данные не заполнены</h1>
        <p className="text-muted-foreground max-w-md">
          Для расчета Матрицы Судьбы необходима дата вашего рождения. Пожалуйста, заполните ее в настройках профиля.
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
          <Layers className="text-primary" />
          Матрица Судьбы
        </h1>
        <p className="text-muted-foreground">Кармический портрет на основе 22 старших арканов.</p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {matrix.points.map((point, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ duration: 0.5, delay: i * 0.1 }}
          >
            <Card className="bg-card/40 backdrop-blur-md h-full border-border hover:border-primary/50 transition-colors">
              <CardHeader className="pb-2">
                <div className="text-sm font-medium text-muted-foreground mb-1">{point.position}</div>
                <CardTitle className="font-serif text-xl flex items-center gap-2">
                  <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/20 text-primary text-sm">
                    {point.arcanaNumber}
                  </span>
                  {point.arcanaName}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed">{point.essence}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
