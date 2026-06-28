import { useGetDashboard, useGetTodayForecast, useSubmitFeedback, useGetProfile, getGetTodayForecastQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useUser } from "@clerk/react";
import { WeatherClock } from "@/components/weather-clock";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";
import { BookOpen, Star, AlertTriangle, CheckCircle, Flame } from "lucide-react";
import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

export default function DashboardPage() {
  const { data: dashboard, isLoading: dashboardLoading } = useGetDashboard();
  const { data: forecast, isLoading: forecastLoading } = useGetTodayForecast();
  const { data: profile } = useGetProfile();
  const { user } = useUser();
  const submitFeedback = useSubmitFeedback();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const [accuracy, setAccuracy] = useState("good");
  const [comment, setComment] = useState("");

  const handleFeedback = (e: React.FormEvent) => {
    e.preventDefault();
    if (!forecast) return;
    submitFeedback.mutate(
      { id: forecast.id, data: { accuracy, comment } },
      {
        onSuccess: () => {
          toast({ title: "Отзыв сохранен" });
          queryClient.invalidateQueries({ queryKey: getGetTodayForecastQueryKey() });
        }
      }
    );
  };

  if (dashboardLoading || forecastLoading) {
    return <div className="p-8 flex justify-center items-center h-[50vh]"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>;
  }

  return (
    <div className="p-6 md:p-10 max-w-5xl mx-auto space-y-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          {user?.imageUrl && (
            <img src={user.imageUrl} alt="" className="w-14 h-14 rounded-full border border-border object-cover shrink-0" />
          )}
          <div>
            <h1 className="text-3xl md:text-4xl font-serif font-bold mb-1">
              {user?.firstName ? `Здравствуйте, ${user.firstName}` : "Оракул Дня"}
            </h1>
            <p className="text-muted-foreground">Ежедневный синтез энергий для осознанного дня.</p>
          </div>
        </div>
        <WeatherClock city={profile?.city} />
      </motion.div>

      {dashboard && !dashboard.profileComplete && (
        <Card className="bg-destructive/10 border-destructive/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-destructive flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Профиль не заполнен
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">Заполните дату, время и место рождения в настройках, чтобы Оракул смог рассчитать ваши энергии.</p>
          </CardContent>
        </Card>
      )}

      {forecast ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card className="bg-card/40 backdrop-blur-md shadow-lg border-primary/20">
              <CardHeader>
                <CardTitle className="font-serif text-2xl flex items-center gap-2 text-primary">
                  <Star className="w-6 h-6" />
                  Синтез дня
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  {forecast.synthesisText.split("\n").filter((p: string) => p.trim()).map((para: string, i: number) => (
                    <p key={i} className="leading-relaxed text-lg">{para}</p>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-4 mt-6">
                  <div className="p-4 rounded-xl bg-background border border-border">
                    <p className="text-sm text-muted-foreground mb-1">Аркан</p>
                    <p className="font-bold font-serif text-xl">{forecast.arcanaName}</p>
                  </div>
                  <div className="p-4 rounded-xl bg-background border border-border">
                    <p className="text-sm text-muted-foreground mb-1">Элемент Бацзы</p>
                    <p className="font-bold font-serif text-xl">{forecast.baziElement}</p>
                  </div>
                </div>
                {forecast.warnings && forecast.warnings.length > 0 && (
                  <div className="mt-4 p-4 rounded-xl bg-destructive/10 border border-destructive/20">
                    <h4 className="font-bold text-destructive mb-2 flex items-center gap-2">
                      <Flame className="w-4 h-4" /> Предупреждения
                    </h4>
                    <ul className="list-disc list-inside text-sm text-destructive-foreground pl-4 space-y-1">
                      {forecast.warnings.map((w: string, i: number) => <li key={i}>{w}</li>)}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="bg-card/40 backdrop-blur-md">
              <CardHeader>
                <CardTitle className="font-serif">Обратная связь</CardTitle>
                <CardDescription>Насколько точным оказался прогноз?</CardDescription>
              </CardHeader>
              <CardContent>
                {forecast.feedback ? (
                  <div className="flex items-center gap-2 text-success">
                    <CheckCircle className="w-5 h-5" />
                    <span>Отзыв сохранен. Спасибо!</span>
                  </div>
                ) : (
                  <form onSubmit={handleFeedback} className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Точность</label>
                      <Select value={accuracy} onValueChange={setAccuracy}>
                        <SelectTrigger className="w-[200px]">
                          <SelectValue placeholder="Оцените точность" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="good">В точку</SelectItem>
                          <SelectItem value="neutral">Частично совпало</SelectItem>
                          <SelectItem value="bad">Не совпало</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Заметки (необязательно)</label>
                      <Textarea value={comment} onChange={e => setComment(e.target.value)} placeholder="Что именно откликнулось?" />
                    </div>
                    <Button type="submit" disabled={submitFeedback.isPending}>Отправить</Button>
                  </form>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="bg-card/40 backdrop-blur-md">
              <CardHeader>
                <CardTitle className="font-serif">Активность</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Вода</span>
                    <span>{dashboard?.waterProgress} / {dashboard?.waterTarget} стаканов</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500" style={{ width: `${Math.min(100, ((dashboard?.waterProgress || 0) / (dashboard?.waterTarget || 1)) * 100)}%` }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Шаги</span>
                    <span>{dashboard?.stepsProgress} / {dashboard?.stepsTarget} шагов</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-green-500" style={{ width: `${Math.min(100, ((dashboard?.stepsProgress || 0) / (dashboard?.stepsTarget || 1)) * 100)}%` }}></div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card/40 backdrop-blur-md">
              <CardHeader>
                <CardTitle className="font-serif flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-secondary" />
                  Дни рождения
                </CardTitle>
              </CardHeader>
              <CardContent>
                {dashboard?.upcomingBirthdaysCount ? (
                  <p className="text-sm text-muted-foreground">Ближайших дней рождения: <strong>{dashboard.upcomingBirthdaysCount}</strong></p>
                ) : (
                  <p className="text-sm text-muted-foreground">В ближайшие 7 дней именинников нет.</p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      ) : (
        <Card className="bg-card/40 backdrop-blur-md p-8 text-center">
          <p className="text-muted-foreground mb-4">Прогноз на сегодня пока недоступен.</p>
        </Card>
      )}
    </div>
  );
}
