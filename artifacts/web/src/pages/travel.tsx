import { useState } from "react";
import { useListTravels, useCreateTravel, useDeleteTravel, useGetTravelStats, getListTravelsQueryKey, getGetTravelStatsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { Map as MapIcon, Plus, MapPin, Heart, Trash2 } from "lucide-react";

export default function TravelPage() {
  const { data: travels, isLoading } = useListTravels();
  const { data: stats } = useGetTravelStats();
  const createTravel = useCreateTravel();
  const deleteTravel = useDeleteTravel();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [countryName, setCountryName] = useState("");
  const [visited, setVisited] = useState(false);
  const [wishlist, setWishlist] = useState(true);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!countryName.trim()) return;

    createTravel.mutate(
      { data: { countryName, countryCode: "XX", visited, wishlist } },
      {
        onSuccess: () => {
          setCountryName("");
          setVisited(false);
          setWishlist(true);
          toast({ title: "Страна добавлена" });
          queryClient.invalidateQueries({ queryKey: getListTravelsQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetTravelStatsQueryKey() });
        }
      }
    );
  };

  const handleDelete = (id: number) => {
    if (!confirm("Удалить из списка?")) return;
    deleteTravel.mutate(
      { id },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListTravelsQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetTravelStatsQueryKey() });
        }
      }
    );
  };

  return (
    <div className="p-6 md:p-10 max-w-4xl mx-auto space-y-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <h1 className="text-4xl font-serif font-bold mb-2 flex items-center gap-3">
          <MapIcon className="text-accent" />
          Карта путешествий
        </h1>
        <p className="text-muted-foreground">Ваши перемещения по миру и планы на будущее.</p>
      </motion.div>

      <div className="grid grid-cols-2 gap-4">
        <Card className="bg-card/40 backdrop-blur-md">
          <CardContent className="p-6 flex flex-col items-center justify-center">
            <MapPin className="w-8 h-8 text-primary mb-2" />
            <div className="text-3xl font-serif font-bold">{stats?.visitedCount || 0}</div>
            <div className="text-sm text-muted-foreground">Посещено стран</div>
          </CardContent>
        </Card>
        <Card className="bg-card/40 backdrop-blur-md">
          <CardContent className="p-6 flex flex-col items-center justify-center">
            <Heart className="w-8 h-8 text-accent mb-2" />
            <div className="text-3xl font-serif font-bold">{stats?.wishlistCount || 0}</div>
            <div className="text-sm text-muted-foreground">В планах</div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-card/40 backdrop-blur-md shadow-sm">
        <CardHeader>
          <CardTitle className="font-serif">Добавить страну</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreate} className="flex flex-col md:flex-row gap-4">
            <Input 
              placeholder="Название страны..." 
              value={countryName} 
              onChange={(e) => setCountryName(e.target.value)}
              className="flex-1"
              required
            />
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <Checkbox checked={visited} onCheckedChange={(c) => setVisited(!!c)} />
                Был(а) здесь
              </label>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <Checkbox checked={wishlist} onCheckedChange={(c) => setWishlist(!!c)} />
                Хочу посетить
              </label>
            </div>
            <Button type="submit" disabled={createTravel.isPending} className="bg-accent text-accent-foreground hover:bg-accent/90">
              <Plus className="w-4 h-4 mr-2" /> Добавить
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <h2 className="font-serif text-2xl">Ваш список</h2>
        {isLoading ? (
          <div className="flex justify-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div></div>
        ) : travels && travels.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {travels.map((travel, i) => (
              <motion.div key={travel.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.05 }}>
                <Card className="bg-card/40 backdrop-blur-md overflow-hidden relative group">
                  <div className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${travel.visited ? 'bg-primary/20 text-primary' : 'bg-accent/20 text-accent'}`}>
                        {travel.visited ? <MapPin className="w-5 h-5" /> : <Heart className="w-5 h-5" />}
                      </div>
                      <div>
                        <h4 className="font-bold text-lg">{travel.countryName}</h4>
                        <p className="text-xs text-muted-foreground">{travel.visited ? 'Посещено' : 'В планах'}</p>
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
            Ваш список путешествий пока пуст.
          </div>
        )}
      </div>
    </div>
  );
}
