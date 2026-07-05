import {
  useGetProfile,
  useUpdateProfile,
  getGetProfileQueryKey,
  useSearchCities,
  getSearchCitiesQueryKey,
  useComputeNatalChart,
  type City,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { MapPin } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

const regionNames =
  typeof Intl !== "undefined" && "DisplayNames" in Intl
    ? new Intl.DisplayNames(["ru"], { type: "region" })
    : null;

function countryRu(cc: string): string {
  try {
    return regionNames?.of(cc) ?? cc;
  } catch {
    return cc;
  }
}

export default function ProfilePage() {
  const { data: profile, isLoading } = useGetProfile();
  const updateProfile = useUpdateProfile();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const computeNatalChart = useComputeNatalChart();

  const [formData, setFormData] = useState({
    name: "",
    city: "",
    cityLatitude: null as number | null,
    cityLongitude: null as number | null,
    cityTimezone: null as string | null,
    birthDate: "",
    birthTime: "",
    birthPlace: "",
    birthLatitude: null as number | null,
    birthLongitude: null as number | null,
    birthTimezone: null as string | null,
    gender: null as string | null,
    notificationsEnabled: false,
  });

  const [birthCityOpen, setBirthCityOpen] = useState(false);
  const [birthCityQuery, setBirthCityQuery] = useState("");
  const [birthCityDebounced, setBirthCityDebounced] = useState("");

  const [cityOpen, setCityOpen] = useState(false);
  const [cityQuery, setCityQuery] = useState("");
  const [cityDebounced, setCityDebounced] = useState("");

  useEffect(() => {
    if (profile) {
      setFormData({
        name: profile.name || "",
        city: profile.city || "",
        cityLatitude: profile.cityLatitude ?? null,
        cityLongitude: profile.cityLongitude ?? null,
        cityTimezone: profile.cityTimezone ?? null,
        birthDate: profile.birthDate ? profile.birthDate.split("T")[0] : "",
        birthTime: profile.birthTime || "",
        birthPlace: profile.birthPlace || "",
        birthLatitude: profile.birthLatitude ?? null,
        birthLongitude: profile.birthLongitude ?? null,
        birthTimezone: profile.birthTimezone ?? null,
        gender: profile.gender ?? null,
        notificationsEnabled: profile.notificationsEnabled || false,
      });
    }
  }, [profile]);

  useEffect(() => {
    const t = setTimeout(() => setBirthCityDebounced(birthCityQuery.trim()), 250);
    return () => clearTimeout(t);
  }, [birthCityQuery]);

  useEffect(() => {
    const t = setTimeout(() => setCityDebounced(cityQuery.trim()), 250);
    return () => clearTimeout(t);
  }, [cityQuery]);

  const { data: birthCities, isFetching: isFetchingBirth } = useSearchCities(
    { q: birthCityDebounced },
    {
      query: {
        enabled: birthCityDebounced.length >= 2,
        queryKey: getSearchCitiesQueryKey({ q: birthCityDebounced }),
      },
    },
  );

  const { data: cities, isFetching } = useSearchCities(
    { q: cityDebounced },
    {
      query: {
        enabled: cityDebounced.length >= 2,
        queryKey: getSearchCitiesQueryKey({ q: cityDebounced }),
      },
    },
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSwitchChange = (checked: boolean) => {
    setFormData((prev) => ({ ...prev, notificationsEnabled: checked }));
  };

  const handleGenderChange = (value: string) => {
    setFormData((prev) => ({ ...prev, gender: value === prev.gender ? null : value }));
  };

  const handleSelectBirthCity = (c: City) => {
    setFormData((prev) => ({
      ...prev,
      birthPlace: `${c.name}, ${countryRu(c.country)}`,
      birthLatitude: c.lat,
      birthLongitude: c.lng,
      birthTimezone: c.timezone,
    }));
    setBirthCityOpen(false);
  };

  const handleSelectCity = (c: City) => {
    setFormData((prev) => ({
      ...prev,
      city: `${c.name}, ${countryRu(c.country)}`,
      cityLatitude: c.lat,
      cityLongitude: c.lng,
      cityTimezone: c.timezone,
    }));
    setCityOpen(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile.mutate(
      {
        data: {
          ...formData,
          city: formData.city || null,
          cityLatitude: formData.cityLatitude,
          cityLongitude: formData.cityLongitude,
          cityTimezone: formData.cityTimezone,
          birthDate: formData.birthDate || null,
          birthTime: formData.birthTime || null,
          birthPlace: formData.birthPlace || null,
          birthLatitude: formData.birthLatitude,
          birthLongitude: formData.birthLongitude,
          birthTimezone: formData.birthTimezone,
          gender: formData.gender as "мужчина" | "женщина" | null | undefined,
        },
      },
      {
        onSuccess: () => {
          toast({ title: "Профиль успешно обновлен" });
          queryClient.invalidateQueries({ queryKey: getGetProfileQueryKey() });
        },
        onError: () => {
          toast({ title: "Ошибка при сохранении", variant: "destructive" });
        },
      },
    );
  };

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const hasCoords =
    formData.birthLatitude !== null && formData.birthLongitude !== null;
  const hasCityCoords =
    formData.cityLatitude !== null && formData.cityLongitude !== null;

  return (
    <div className="p-6 md:p-10 max-w-3xl mx-auto space-y-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <h1 className="text-4xl font-serif font-bold mb-2">Настройки Профиля</h1>
        <p className="text-muted-foreground">Ваши данные для точных расчетов Оракула.</p>
      </motion.div>

      <Card className="bg-card/40 backdrop-blur-md border-border shadow-lg">
        <CardHeader>
          <CardTitle className="font-serif text-2xl">Личные данные</CardTitle>
          <CardDescription>Эти данные используются для расчетов Бацзы, Матрицы Судьбы и натальной карты. Для астрологии важны точное время и место рождения.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="name">Имя</Label>
                <Input id="name" name="name" value={formData.name} onChange={handleChange} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="birthDate">Дата рождения</Label>
                <Input id="birthDate" name="birthDate" type="date" value={formData.birthDate} onChange={handleChange} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="birthTime">Время рождения</Label>
                <Input id="birthTime" name="birthTime" type="time" value={formData.birthTime} onChange={handleChange} />
                <p className="text-xs text-muted-foreground">Чем точнее время, тем точнее асцендент и дома.</p>
              </div>
              <div className="space-y-2">
                <Label>Пол</Label>
                <RadioGroup
                  value={formData.gender ?? ""}
                  onValueChange={handleGenderChange}
                  className="flex gap-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="мужчина" id="gender-male" />
                    <Label htmlFor="gender-male">Мужчина</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="женщина" id="gender-female" />
                    <Label htmlFor="gender-female">Женщина</Label>
                  </div>
                </RadioGroup>
              </div>
              <div className="space-y-2">
                <Label>Место рождения</Label>
                <Popover open={birthCityOpen} onOpenChange={setBirthCityOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      role="combobox"
                      className="w-full justify-start font-normal"
                    >
                      <MapPin className="w-4 h-4 mr-2 text-muted-foreground shrink-0" />
                      {formData.birthPlace ? (
                        <span className="truncate">{formData.birthPlace}</span>
                      ) : (
                        <span className="text-muted-foreground">Выберите город рождения</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="p-0 w-[--radix-popover-trigger-width]">
                    <Command shouldFilter={false}>
                      <CommandInput
                        placeholder="Поиск города..."
                        value={birthCityQuery}
                        onValueChange={setBirthCityQuery}
                      />
                      <CommandList>
                        {birthCityDebounced.length < 2 ? (
                          <CommandEmpty>Введите минимум две буквы.</CommandEmpty>
                        ) : isFetchingBirth ? (
                          <CommandEmpty>Поиск...</CommandEmpty>
                        ) : !birthCities || birthCities.length === 0 ? (
                          <CommandEmpty>Ничего не найдено.</CommandEmpty>
                        ) : (
                          <CommandGroup>
                            {birthCities.map((c, i) => (
                              <CommandItem
                                key={`${c.name}-${c.lat}-${c.lng}-${i}`}
                                value={`${c.name}-${i}`}
                                onSelect={() => handleSelectBirthCity(c)}
                              >
                                <MapPin className="w-4 h-4 mr-2 text-muted-foreground shrink-0" />
                                <span className="truncate">
                                  {c.name}, {countryRu(c.country)}
                                </span>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        )}
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
                {hasCoords && (
                  <p className="text-xs text-muted-foreground tabular-nums">
                    {formData.birthLatitude!.toFixed(4)}, {formData.birthLongitude!.toFixed(4)}
                    {formData.birthTimezone ? ` · ${formData.birthTimezone}` : ""}
                  </p>
                )}
                {hasCoords && formData.birthDate && formData.birthTime && (
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    className="mt-1"
                    disabled={computeNatalChart.isPending}
                    onClick={() =>
                      computeNatalChart.mutate(undefined, {
                        onSuccess: () => {
                          toast({ title: "Натальная карта рассчитана" });
                          queryClient.invalidateQueries({ queryKey: getGetProfileQueryKey() });
                        },
                        onError: () => {
                          toast({ title: "Ошибка расчета", variant: "destructive" });
                        },
                      })
                    }
                  >
                    {computeNatalChart.isPending ? "Расчет..." : "Рассчитать натальную карту"}
                  </Button>
                )}
              </div>
              <div className="space-y-2">
                <Label>Город проживания</Label>
                <Popover open={cityOpen} onOpenChange={setCityOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      role="combobox"
                      className="w-full justify-start font-normal"
                    >
                      <MapPin className="w-4 h-4 mr-2 text-muted-foreground shrink-0" />
                      {formData.city ? (
                        <span className="truncate">{formData.city}</span>
                      ) : (
                        <span className="text-muted-foreground">Выберите город проживания</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="p-0 w-[--radix-popover-trigger-width]">
                    <Command shouldFilter={false}>
                      <CommandInput
                        placeholder="Поиск города..."
                        value={cityQuery}
                        onValueChange={setCityQuery}
                      />
                      <CommandList>
                        {cityDebounced.length < 2 ? (
                          <CommandEmpty>Введите минимум две буквы.</CommandEmpty>
                        ) : isFetching ? (
                          <CommandEmpty>Поиск...</CommandEmpty>
                        ) : !cities || cities.length === 0 ? (
                          <CommandEmpty>Ничего не найдено.</CommandEmpty>
                        ) : (
                          <CommandGroup>
                            {cities.map((c, i) => (
                              <CommandItem
                                key={`${c.name}-${c.lat}-${c.lng}-${i}`}
                                value={`${c.name}-${i}`}
                                onSelect={() => handleSelectCity(c)}
                              >
                                <MapPin className="w-4 h-4 mr-2 text-muted-foreground shrink-0" />
                                <span className="truncate">
                                  {c.name}, {countryRu(c.country)}
                                </span>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        )}
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
                {hasCityCoords && (
                  <p className="text-xs text-muted-foreground tabular-nums">
                    {formData.cityLatitude!.toFixed(4)}, {formData.cityLongitude!.toFixed(4)}
                    {formData.cityTimezone ? ` · ${formData.cityTimezone}` : ""}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-border pt-6">
              <div className="space-y-0.5">
                <Label>Уведомления</Label>
                <p className="text-sm text-muted-foreground">Получать оповещения от Оракула</p>
              </div>
              <Switch checked={formData.notificationsEnabled} onCheckedChange={handleSwitchChange} />
            </div>

            <Button type="submit" disabled={updateProfile.isPending} className="w-full md:w-auto">
              Сохранить изменения
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
