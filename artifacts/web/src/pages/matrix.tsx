import { useState } from "react";
import {
  useGetMatrix,
  getGetMatrixQueryKey,
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { Layers, AlertCircle, Sparkles } from "lucide-react";
import { DestinyMatrixWheel } from "@/components/matrix/destiny-matrix-wheel";

const DEFAULT_SELECTED_POINT_ID = "center";

export default function MatrixPage() {
  const {
    data: matrix,
    isLoading,
    error,
  } = useGetMatrix({
    query: { retry: false, queryKey: getGetMatrixQueryKey() },
  });
  const [selectedPointId, setSelectedPointId] = useState(
    DEFAULT_SELECTED_POINT_ID,
  );

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary" />
      </div>
    );
  }

  const isMissingData = error?.status === 400 || !matrix;

  if (isMissingData) {
    return (
      <div className="mt-12 flex max-w-3xl flex-col items-center space-y-8 p-6 text-center md:p-10">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10 text-destructive">
          <AlertCircle className="h-8 w-8" />
        </div>
        <h1 className="font-serif text-3xl font-bold">Данные не заполнены</h1>
        <p className="max-w-md text-muted-foreground">
          Для расчёта Матрицы Судьбы необходима дата Вашего рождения.
          Пожалуйста, заполните её в настройках профиля.
        </p>
        <Link href="/profile">
          <Button size="lg" className="mt-4">
            Перейти в профиль
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4 sm:p-6 md:space-y-8 md:p-10">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="flex items-start gap-3">
          <div className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary/15 text-primary">
            <Layers className="h-6 w-6" />
          </div>
          <div>
            <h1 className="font-serif text-3xl font-bold tracking-tight sm:text-4xl">
              Матрица Судьбы
            </h1>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: 0.08 }}
      >
        <DestinyMatrixWheel
          points={matrix.points}
          selectedId={selectedPointId}
          onSelect={setSelectedPointId}
        />
      </motion.div>

      <section aria-labelledby="matrix-details-heading">
        <div className="mb-4 flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <h2
            id="matrix-details-heading"
            className="font-serif text-2xl font-semibold"
          >
            Расшифровки точек
          </h2>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {matrix.points.map((point, index) => {
            const isSelected = point.id === selectedPointId;
            return (
              <motion.button
                key={`${point.id}-${point.arcanaNumber}`}
                type="button"
                onClick={() => setSelectedPointId(point.id)}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: index * 0.04 }}
                className={`group h-full rounded-2xl border p-0 text-left outline-none transition-[border-color,transform,box-shadow] duration-200 hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${
                  isSelected
                    ? "border-primary/70 bg-primary/10 shadow-[0_10px_32px_hsl(var(--primary)/0.14)]"
                    : "border-border bg-card/45 hover:border-primary/45"
                }`}
                aria-pressed={isSelected}
              >
                <Card className="h-full border-0 bg-transparent shadow-none">
                  <CardHeader className="pb-2">
                    <div className="mb-1 text-sm font-medium text-muted-foreground">
                      {point.position}
                    </div>
                    <CardTitle className="flex items-center gap-2 font-serif text-xl">
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/20 text-sm text-primary">
                        {point.arcanaNumber}
                      </span>
                      {point.arcanaName}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm leading-relaxed text-foreground/85">
                      {point.essence}
                    </p>
                  </CardContent>
                </Card>
              </motion.button>
            );
          })}
        </div>
      </section>
    </div>
  );
}
