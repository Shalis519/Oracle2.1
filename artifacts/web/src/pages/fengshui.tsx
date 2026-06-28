import { useGetFengShui, getGetFengShuiQueryKey, useGetProfile, useUpdateProfile, getGetProfileQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { Wind, AlertCircle, AlertTriangle } from "lucide-react";

const DIRECTIONS = [
  "Север",
  "Северо-восток",
  "Восток",
  "Юго-восток",
  "Юг",
  "Юго-запад",
  "Запад",
  "Северо-запад",
];

export default function FengShuiPage() {
  const { data: fengshui, isLoading, error } = useGetFengShui({ query: { retry: false, queryKey: getGetFengShuiQueryKey() } });
  const { data: profile } = useGetProfile();
  const updateProfile = useUpdateProfile();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const saveDirection = (value: string) => {
    updateProfile.mutate(
      { data: { bedDirection: value || null } },
      {
        onSuccess: () => {
          toast({ title: "Направление изголовья сохранено" });
          queryClient.invalidateQueries({ queryKey: getGetProfileQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetFengShuiQueryKey() });
        },
        onError: () => {
          toast({ title: "Ошибка при сохранении", variant: "destructive" });
        },
      },
    );
  };

  const DirectionSelector = ({ compact = false }: { compact?: boolean }) => (
    <div className={compact ? "space-y-2 max-w-xs mx-auto w-full" : "space-y-2 max-w-sm w-full"}>
      <Label htmlFor="bedDirection">Направление изголовья кровати</Label>
      <Select value={profile?.bedDirection ?? ""} onValueChange={saveDirection} disabled={updateProfile.isPending}>
        <SelectTrigger id="bedDirection">
          <SelectValue placeholder="Выберите направление" />
        </SelectTrigger>
        <SelectContent>
          {DIRECTIONS.map((d) => (
            <SelectItem key={d} value={d}>{d}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );

  if (isLoading) {
    return <div className="flex h-[50vh] items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>;
  }

  const isMissingData = error?.status === 400 || !fengshui;

  if (isMissingData) {
    return (
      <div className="p-6 md:p-10 max-w-3xl mx-auto space-y-8 flex flex-col items-center text-center mt-12">
        <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center text-destructive mb-4">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h1 className="text-3xl font-serif font-bold">Укажите направление изголовья</h1>
        <p className="text-muted-foreground max-w-md">
          Для анализа Фэн-шуй выберите направление изголовья вашей кровати. Расчет летящих звезд появится сразу после выбора.
        </p>
        <DirectionSelector compact />
      </div>
    );
  }

  return (
    <div className="p-6 md:p-10 max-w-3xl mx-auto space-y-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <h1 className="text-4xl font-serif font-bold mb-2 flex items-center gap-3">
          <Wind className="text-primary" />
          Фэн-шуй
        </h1>
        <p className="text-muted-foreground">Анализ летящих звезд для вашего пространства.</p>
      </motion.div>

      <Card className="bg-card/40 backdrop-blur-md border-border">
        <CardContent className="pt-6">
          <DirectionSelector />
        </CardContent>
      </Card>

      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6, delay: 0.1 }}>
        <Card className={`bg-card/40 backdrop-blur-md shadow-xl ${fengshui.isUnfavorable ? 'border-destructive/50' : 'border-success/50'}`}>
          <CardHeader className="text-center pb-2">
            <CardTitle className="font-serif text-xl text-muted-foreground">Направление изголовья: {fengshui.direction}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center text-center space-y-6">
            <div className={`w-32 h-32 rounded-full flex items-center justify-center border-4 ${fengshui.isUnfavorable ? 'border-destructive text-destructive' : 'border-success text-success'}`}>
              <div className="flex flex-col items-center">
                <span className="text-4xl font-bold font-serif">{fengshui.starNumber}</span>
                <span className="text-sm mt-1">{fengshui.starName}</span>
              </div>
            </div>

            {fengshui.isUnfavorable && (
              <div className="bg-destructive/10 text-destructive px-4 py-2 rounded-full flex items-center gap-2 text-sm font-medium">
                <AlertTriangle className="w-4 h-4" />
                Неблагоприятная звезда в этом году
              </div>
            )}

            <div className="space-y-4 max-w-xl mx-auto text-left">
              <div>
                <h3 className="font-bold text-lg mb-1">Влияние:</h3>
                <p className="text-muted-foreground">{fengshui.influence}</p>
              </div>
              <div className="bg-muted/50 p-4 rounded-xl border border-border">
                <h3 className="font-bold text-lg mb-1 flex items-center gap-2">
                  <Wind className="w-4 h-4" /> Рекомендация:
                </h3>
                <p>{fengshui.recommendation}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
