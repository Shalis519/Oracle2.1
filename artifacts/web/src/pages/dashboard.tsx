import { useGetDashboard, useGetTodayForecast, useSubmitFeedback, useGetProfile, useGetTodayActivations, useListUpcomingBirthdays, getGetTodayActivationsQueryKey, getGetTodayForecastQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useUser, useClerk } from "@clerk/react";
import { WeatherClock } from "@/components/weather-clock";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";
import { BookOpen, Star, AlertTriangle, CheckCircle, Flame } from "lucide-react";
import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { userProfileAppearance } from "@/lib/clerk-appearance";
import { DailyNotepad } from "@/components/daily-notepad";

const HOUR_RANGES: Record<string, string> = {
  "Крыса": "23:00–01:00",
  "Бык": "01:00–03:00",
  "Тигр": "03:00–05:00",
  "Кролик": "05:00–07:00",
  "Дракон": "07:00–09:00",
  "Змея": "09:00–11:00",
  "Лошадь": "11:00–13:00",
  "Коза": "13:00–15:00",
  "Обезьяна": "15:00–17:00",
  "Петух": "17:00–19:00",
  "Собака": "19:00–21:00",
  "Свинья": "21:00–23:00",
};

export default function DashboardPage() {
  const { data: dashboard, isLoading: dashboardLoading } = useGetDashboard();
  const { data: forecast, isLoading: forecastLoading } = useGetTodayForecast();
  const { data: activations } = useGetTodayActivations({ query: { queryKey: getGetTodayActivationsQueryKey() } });
  const { data: birthdays } = useListUpcomingBirthdays();
  const todayBirthdays = birthdays?.filter((b) => b.daysUntil === 0) ?? [];
  const { data: profile } = useGetProfile();
  const { user } = useUser();
  const { openUserProfile } = useClerk();
  const submitFeedback = useSubmitFeedback();

  const displayName =
    profile?.name?.trim() ||
    user?.firstName ||
    user?.username ||
    user?.fullName ||
    user?.primaryEmailAddress?.emailAddress?.split("@")[0] ||
    "Гость";
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const [accuracy, setAccuracy] = useState("good");
  const [comment, setComment] = useState("");
  const [editingFeedback, setEditingFeedback] = useState(false);

  const handleFeedback = (e: React.FormEvent) => {
    e.preventDefault();
    if (!forecast) return;
    submitFeedback.mutate(
      { id: forecast.id, data: { accuracy, comment } },
      {
        onSuccess: () => {
          toast({ title: "Отзыв сохранен" });
          setEditingFeedback(false);
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
          <button
            type="button"
            onClick={() => openUserProfile({ appearance: userProfileAppearance })}
            title="Изменить фото и имя"
            aria-label="Изменить фото и имя"
            className="w-14 h-14 rounded-full border border-border overflow-hidden shrink-0 bg-muted flex items-center justify-center transition-shadow hover:ring-2 hover:ring-primary/50 focus:outline-none focus:ring-2 focus:ring-primary"
          >
            {user?.imageUrl ? (
              <img src={user.imageUrl} alt="" className="w-full h-full object-cover" />
            ) : (
              <span className="text-lg font-serif text-muted-foreground">
                {displayName.charAt(0).toUpperCase()}
              </span>
            )}
          </button>
          <div>
            <h1 className="text-3xl md:text-4xl font-serif font-bold mb-1">
              {displayName}, сегодня твой лучший день!
            </h1>
            <p className="text-muted-foreground">Ежедневный синтез энергий для осознанного дня.</p>
          </div>
        </div>
        <WeatherClock city={profile?.city} />
      </motion.div>

      <DailyNotepad />

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

      {activations && activations.items.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}>
          <Card className="bg-card/40 backdrop-blur-md shadow-lg border-secondary/30">
            <CardHeader>
              <CardTitle className="font-serif text-2xl flex items-center gap-2 text-secondary">
                <Flame className="w-6 h-6" />
                Активации дня
              </CardTitle>
              <CardDescription>Энергетические события сегодняшнего дня и часы их активации.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {activations.items.map((item, idx) => (
                <div key={idx} className="rounded-xl border border-border bg-background/60 p-5">
                  <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-1 mb-3">
                    <h3 className="font-serif font-bold text-lg text-primary">{item.title}</h3>
                    <span className="text-sm text-muted-foreground shrink-0">
                      Час {item.hour}{HOUR_RANGES[item.hour] ? ` · ${HOUR_RANGES[item.hour]}` : ""}
                    </span>
                  </div>
                  {item.audience && (
                    <p className="text-sm text-muted-foreground italic mb-3">{item.audience}</p>
                  )}
                  <div className="space-y-2">
                    {item.paragraphs.map((p, i) => (
                      <p key={i} className="leading-relaxed text-sm">{p}</p>
                    ))}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </motion.div>
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
                {forecast.feedback && !editingFeedback ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-success">
                      <CheckCircle className="w-5 h-5" />
                      <span>Отзыв сохранен. Спасибо!</span>
                    </div>
                    {forecast.feedback.comment && (
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                        {forecast.feedback.comment}
                      </p>
                    )}
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setAccuracy(forecast.feedback!.accuracy);
                        setComment(forecast.feedback!.comment ?? "");
                        setEditingFeedback(true);
                      }}
                    >
                      Дополнить или изменить
                    </Button>
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
                    <div className="flex items-center gap-2">
                      <Button type="submit" disabled={submitFeedback.isPending}>
                        {forecast.feedback ? "Сохранить изменения" : "Отправить"}
                      </Button>
                      {forecast.feedback && (
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={() => setEditingFeedback(false)}
                        >
                          Отмена
                        </Button>
                      )}
                    </div>
                  </form>
                )}
              </CardContent>
            </Card>
          </div>

          {todayBirthdays.length > 0 && (
            <div className="space-y-6">
              <Card className="bg-card/40 backdrop-blur-md">
                <CardHeader>
                  <CardTitle className="font-serif flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-secondary" />
                    Дни рождения
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {todayBirthdays.map((b) => (
                    <p key={b.contactId} className="text-sm">
                      Сегодня день рождения: <strong>{b.name}</strong>
                      {b.turningAge ? <span className="text-secondary"> ({b.turningAge} лет)</span> : null}
                    </p>
                  ))}
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      ) : (
        <Card className="bg-card/40 backdrop-blur-md p-8 text-center">
          <p className="text-muted-foreground mb-4">Прогноз на сегодня пока недоступен.</p>
        </Card>
      )}
    </div>
  );
}
