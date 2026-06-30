import { useEffect, useMemo, useState } from "react";
import {
  useSearchCities,
  getSearchCitiesQueryKey,
  useComputeBaziHours,
  type City,
  type BaziHoursResult,
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MapPin, Clock3 } from "lucide-react";

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

function todayISO(): string {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

// Offset (in hours, may be fractional) of an IANA timezone on a given date.
function tzOffsetHours(timeZone: string, dateISO: string): number {
  try {
    const ref = new Date(`${dateISO}T12:00:00Z`);
    const dtf = new Intl.DateTimeFormat("en-US", {
      timeZone,
      timeZoneName: "longOffset",
    });
    const part = dtf
      .formatToParts(ref)
      .find((p) => p.type === "timeZoneName")?.value;
    const m = part?.match(/GMT([+-])(\d{1,2})(?::(\d{2}))?/);
    if (!m) return 0;
    const sign = m[1] === "-" ? -1 : 1;
    const h = parseInt(m[2]!, 10);
    const mm = m[3] ? parseInt(m[3], 10) : 0;
    return sign * (h + mm / 60);
  } catch {
    return 0;
  }
}

function offsetLabel(hours: number): string {
  const sign = hours < 0 ? "-" : "+";
  const abs = Math.abs(hours);
  const h = Math.floor(abs);
  const mm = Math.round((abs - h) * 60);
  return `UTC${sign}${h}${mm ? ":" + String(mm).padStart(2, "0") : ""}`;
}

function HoursTable({ rows }: { rows: BaziHoursResult["solar"] }) {
  return (
    <div className="divide-y divide-border rounded-md border border-border overflow-hidden">
      {rows.map((row, i) => (
        <div
          key={i}
          className="grid grid-cols-[1fr_auto] items-center gap-3 px-3 py-1.5 text-sm odd:bg-muted/20"
        >
          <span className="font-medium">{row.animal}</span>
          <span className="tabular-nums text-muted-foreground">
            {row.start && row.end ? `${row.start} – ${row.end}` : "—"}
          </span>
        </div>
      ))}
    </div>
  );
}

export default function BaziHoursCalculator() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const [city, setCity] = useState<City | null>(null);
  const [date, setDate] = useState(todayISO());
  const [doubledRat, setDoubledRat] = useState(true);
  const [resultOpen, setResultOpen] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(query.trim()), 250);
    return () => clearTimeout(t);
  }, [query]);

  const { data: cities, isFetching } = useSearchCities(
    { q: debounced },
    {
      query: {
        enabled: debounced.length >= 2,
        queryKey: getSearchCitiesQueryKey({ q: debounced }),
      },
    },
  );

  const utcOffset = useMemo(
    () => (city ? tzOffsetHours(city.timezone, date) : 0),
    [city, date],
  );

  const mutation = useComputeBaziHours();
  const result = mutation.data;

  function handleCompute() {
    if (!city) return;
    mutation.mutate(
      {
        data: {
          lat: city.lat,
          lng: city.lng,
          utcOffset,
          date,
          doubledRat,
        },
      },
      { onSuccess: () => setResultOpen(true) },
    );
  }

  return (
    <Card className="bg-card/40 backdrop-blur-md border-secondary/20">
      <CardHeader className="pb-2">
        <CardTitle className="font-serif text-lg flex items-center gap-2">
          <Clock3 className="w-5 h-5 text-secondary" />
          Расчёт времени
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Китайские двухчасовки для выбранного города: солнечное, резиновое и
          совмещённое время.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1.5">
          <Label>Город</Label>
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                className="w-full justify-start font-normal"
              >
                <MapPin className="w-4 h-4 mr-2 text-muted-foreground shrink-0" />
                {city ? (
                  <span className="truncate">
                    {city.name}, {countryRu(city.country)}
                  </span>
                ) : (
                  <span className="text-muted-foreground">
                    Начните вводить название города
                  </span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="p-0 w-[--radix-popover-trigger-width]">
              <Command shouldFilter={false}>
                <CommandInput
                  placeholder="Поиск города..."
                  value={query}
                  onValueChange={setQuery}
                />
                <CommandList>
                  {debounced.length < 2 ? (
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
                          onSelect={() => {
                            setCity(c);
                            setOpen(false);
                          }}
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
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5 min-w-0">
            <Label htmlFor="bazi-hours-date">Дата</Label>
            <input
              id="bazi-hours-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="flex h-9 w-full min-w-0 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
          </div>
          <div className="space-y-1.5 min-w-0">
            <Label>Часовой пояс</Label>
            <div className="flex h-9 items-center rounded-md border border-input bg-muted/20 px-3 text-sm text-muted-foreground truncate">
              {city ? offsetLabel(utcOffset) : "—"}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Checkbox
            id="doubled-rat"
            checked={doubledRat}
            onCheckedChange={(v) => setDoubledRat(v === true)}
          />
          <Label htmlFor="doubled-rat" className="font-normal cursor-pointer">
            Сдвоенный час Крысы
          </Label>
        </div>

        <Button
          onClick={handleCompute}
          disabled={!city || mutation.isPending}
          className="w-full"
        >
          {mutation.isPending ? "Расчёт..." : "Рассчитать"}
        </Button>
      </CardContent>

      <Dialog open={resultOpen} onOpenChange={setResultOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-serif">
              {city ? `${city.name}, ${countryRu(city.country)}` : "Расчёт времени"}
            </DialogTitle>
            {result && (
              <DialogDescription>
                Восход {result.sunrise} · Закат {result.sunset}
              </DialogDescription>
            )}
          </DialogHeader>
          {result && (
            <Tabs defaultValue="solar" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="solar">Солнечное</TabsTrigger>
                <TabsTrigger value="rubber">Резиновое</TabsTrigger>
                <TabsTrigger value="combined">Совмещённое</TabsTrigger>
              </TabsList>
              <TabsContent value="solar">
                <HoursTable rows={result.solar} />
              </TabsContent>
              <TabsContent value="rubber">
                <HoursTable rows={result.rubber} />
              </TabsContent>
              <TabsContent value="combined">
                <HoursTable rows={result.combined} />
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
}
