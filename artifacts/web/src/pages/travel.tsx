import { useState } from "react";
import {
  useListTravels,
  useCreateTravel,
  useDeleteTravel,
  useUpdateTravel,
  useGetTravelStats,
  getListTravelsQueryKey,
  getGetTravelStatsQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { Map as MapIcon, MapPin, Heart, Trash2 } from "lucide-react";
import { WorldMap, type CountryStatus } from "@/components/world-map";

export default function TravelPage() {
  const { data: travels, isLoading } = useListTravels();
  const { data: stats } = useGetTravelStats();
  const createTravel = useCreateTravel();
  const updateTravel = useUpdateTravel();
  const deleteTravel = useDeleteTravel();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [mode, setMode] = useState<CountryStatus>("visited");

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: getListTravelsQueryKey() });
    queryClient.invalidateQueries({ queryKey: getGetTravelStatsQueryKey() });
  };

  const statusByCode: Record<string, CountryStatus> = {};
  for (const t of travels ?? []) {
    if (t.countryCode && t.countryCode.length === 2) {
      statusByCode[t.countryCode] = t.visited ? "visited" : "wishlist";
    }
  }

  const handleSelect = (code: string, name: string) => {
    const existing = (travels ?? []).find((t) => t.countryCode === code);
    const desiredVisited = mode === "visited";
    const desiredWishlist = mode === "wishlist";

    if (existing) {
      if (existing.visited === desiredVisited && existing.wishlist === desiredWishlist) {
        deleteTravel.mutate({ id: existing.id }, { onSuccess: invalidate });
        return;
      }
      updateTravel.mutate(
        { id: existing.id, data: { visited: desiredVisited, wishlist: desiredWishlist } },
        { onSuccess: invalidate },
      );
      return;
    }

    createTravel.mutate(
      { data: { countryName: name, countryCode: code, visited: desiredVisited, wishlist: desiredWishlist } },
      {
        onSuccess: () => {
          toast({ title: `${name}: ${desiredVisited ? "посещено" : "в планах"}` });
          invalidate();
        },
      },
    );
  };

  const handleDelete = (id: number) => {
    deleteTravel.mutate({ id }, { onSuccess: invalidate });
  };

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <h1 className="text-3xl md:text-4xl font-serif font-bold mb-2 flex items-center gap-3">
          <MapIcon className="text-accent" />
          Карта путешествий
        </h1>
        <p className="text-muted-foreground">Отмечайте страны прямо на карте мира: выберите режим и нажмите на страну.</p>
      </motion.div>

      <div className="grid grid-cols-2 gap-4">
        <Card className="bg-card/40 backdrop-blur-md">
          <CardContent className="p-5 flex flex-col items-center justify-center">
            <MapPin className="w-7 h-7 text-primary mb-2" />
            <div className="text-3xl font-serif font-bold">{stats?.visitedCount || 0}</div>
            <div className="text-sm text-muted-foreground">Посещено стран</div>
          </CardContent>
        </Card>
        <Card className="bg-card/40 backdrop-blur-md">
          <CardContent className="p-5 flex flex-col items-center justify-center">
            <Heart className="w-7 h-7 text-accent mb-2" />
            <div className="text-3xl font-serif font-bold">{stats?.wishlistCount || 0}</div>
            <div className="text-sm text-muted-foreground">В планах</div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-card/40 backdrop-blur-md shadow-sm">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <CardTitle className="font-serif">Мир</CardTitle>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground mr-1">Отмечаю:</span>
            <Button
              size="sm"
              variant={mode === "visited" ? "default" : "outline"}
              className={mode === "visited" ? "bg-primary text-primary-foreground" : ""}
              onClick={() => setMode("visited")}
            >
              <MapPin className="w-4 h-4 mr-1.5" /> Посещённые
            </Button>
            <Button
              size="sm"
              variant={mode === "wishlist" ? "default" : "outline"}
              className={mode === "wishlist" ? "bg-accent text-accent-foreground" : ""}
              onClick={() => setMode("wishlist")}
            >
              <Heart className="w-4 h-4 mr-1.5" /> Желаемые
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <WorldMap statusByCode={statusByCode} onSelect={handleSelect} />
          <div className="flex flex-wrap gap-4 mt-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-sm" style={{ background: "hsl(var(--primary))" }} /> Посещено
            </span>
            <span className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-sm" style={{ background: "hsl(var(--accent))" }} /> В планах
            </span>
            <span>Повторное нажатие в том же режиме снимает отметку.</span>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <h2 className="font-serif text-2xl">Ваш список</h2>
        {isLoading ? (
          <div className="flex justify-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div></div>
        ) : travels && travels.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {travels.map((travel, i) => (
              <motion.div key={travel.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.04 }}>
                <Card className="bg-card/40 backdrop-blur-md overflow-hidden relative group">
                  <div className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${travel.visited ? "bg-primary/20 text-primary" : "bg-accent/20 text-accent"}`}>
                        {travel.visited ? <MapPin className="w-5 h-5" /> : <Heart className="w-5 h-5" />}
                      </div>
                      <div>
                        <h4 className="font-bold text-lg">{travel.countryName}</h4>
                        <p className="text-xs text-muted-foreground">{travel.visited ? "Посещено" : "В планах"}</p>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive" onClick={() => handleDelete(travel.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center p-12 border border-dashed border-border rounded-xl text-muted-foreground">
            Ваш список путешествий пока пуст. Нажмите на страну на карте, чтобы добавить.
          </div>
        )}
      </div>
    </div>
  );
}
