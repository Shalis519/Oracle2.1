import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Sun,
  Cloud,
  CloudSun,
  CloudFog,
  CloudDrizzle,
  CloudRain,
  CloudSnow,
  CloudLightning,
  Clock,
  MapPin,
} from "lucide-react";

interface WeatherInfo {
  temperature: number;
  code: number;
}

function describeWeather(code: number): { label: string; Icon: typeof Sun } {
  if (code === 0) return { label: "Ясно", Icon: Sun };
  if (code === 1 || code === 2) return { label: "Переменная облачность", Icon: CloudSun };
  if (code === 3) return { label: "Пасмурно", Icon: Cloud };
  if (code === 45 || code === 48) return { label: "Туман", Icon: CloudFog };
  if (code >= 51 && code <= 57) return { label: "Морось", Icon: CloudDrizzle };
  if (code >= 61 && code <= 67) return { label: "Дождь", Icon: CloudRain };
  if (code >= 71 && code <= 77) return { label: "Снег", Icon: CloudSnow };
  if (code >= 80 && code <= 82) return { label: "Ливни", Icon: CloudRain };
  if (code >= 85 && code <= 86) return { label: "Снегопад", Icon: CloudSnow };
  if (code >= 95) return { label: "Гроза", Icon: CloudLightning };
  return { label: "—", Icon: Cloud };
}

async function fetchWeather(city: string): Promise<WeatherInfo | null> {
  const geoRes = await fetch(
    `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=ru&format=json`,
  );
  const geo = await geoRes.json();
  const place = geo?.results?.[0];
  if (!place) return null;
  const wRes = await fetch(
    `https://api.open-meteo.com/v1/forecast?latitude=${place.latitude}&longitude=${place.longitude}&current=temperature_2m,weather_code`,
  );
  const w = await wRes.json();
  if (!w?.current) return null;
  return { temperature: Math.round(w.current.temperature_2m), code: w.current.weather_code };
}

export function WeatherClock({ city }: { city: string | null | undefined }) {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const { data: weather, isLoading } = useQuery({
    queryKey: ["weather", city],
    queryFn: () => fetchWeather(city as string),
    enabled: !!city,
    staleTime: 1000 * 60 * 15,
    refetchInterval: 1000 * 60 * 30,
  });

  const timeStr = now.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  const dateStr = now.toLocaleDateString("ru-RU", { weekday: "long", day: "numeric", month: "long" });
  const { label, Icon } = weather ? describeWeather(weather.code) : { label: "", Icon: Cloud };

  return (
    <div className="flex items-center gap-5 rounded-2xl bg-card/40 backdrop-blur-md border border-border px-5 py-3">
      <div className="flex items-center gap-2">
        <Clock className="w-5 h-5 text-primary" />
        <div className="leading-tight">
          <div className="font-mono text-xl font-bold tabular-nums">{timeStr}</div>
          <div className="text-xs text-muted-foreground capitalize">{dateStr}</div>
        </div>
      </div>

      <div className="h-9 w-px bg-border" />

      {city ? (
        weather ? (
          <div className="flex items-center gap-2">
            <Icon className="w-6 h-6 text-secondary" />
            <div className="leading-tight">
              <div className="text-xl font-bold">{weather.temperature}°</div>
              <div className="text-xs text-muted-foreground">{label}</div>
            </div>
          </div>
        ) : isLoading ? (
          <div className="text-xs text-muted-foreground animate-pulse">Загрузка погоды…</div>
        ) : (
          <div className="text-xs text-muted-foreground">Погода недоступна</div>
        )
      ) : (
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <MapPin className="w-4 h-4" />
          Укажите город в профиле
        </div>
      )}
    </div>
  );
}
