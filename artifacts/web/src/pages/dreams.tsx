import { useState } from "react";
import { useListDreams, useCreateDream, useDeleteDream, getListDreamsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { Moon, Sparkles, Trash2, Key } from "lucide-react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";

export default function DreamsPage() {
  const { data: dreams, isLoading } = useListDreams();
  const createDream = useCreateDream();
  const deleteDream = useDeleteDream();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [dreamText, setDreamText] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!dreamText.trim()) return;

    createDream.mutate(
      { data: { dreamText } },
      {
        onSuccess: () => {
          setDreamText("");
          toast({ title: "Сон сохранен и интерпретирован" });
          queryClient.invalidateQueries({ queryKey: getListDreamsQueryKey() });
        },
        onError: () => {
          toast({ title: "Ошибка при сохранении", variant: "destructive" });
        }
      }
    );
  };

  const handleDelete = (id: number) => {
    if (!confirm("Удалить этот сон?")) return;
    deleteDream.mutate(
      { id },
      {
        onSuccess: () => {
          toast({ title: "Сон удален" });
          queryClient.invalidateQueries({ queryKey: getListDreamsQueryKey() });
        }
      }
    );
  };

  return (
    <div className="p-6 md:p-10 max-w-4xl mx-auto space-y-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <h1 className="text-4xl font-serif font-bold mb-2 flex items-center gap-3">
          <Moon className="text-secondary" />
          Сны и сонник
        </h1>
        <p className="text-muted-foreground">Дневник сновидений с мистической интерпретацией.</p>
      </motion.div>

      <Card className="bg-card/40 backdrop-blur-md shadow-lg border-secondary/20">
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <Textarea 
              placeholder="Опишите ваш сон в деталях..." 
              className="min-h-[120px] resize-y bg-background"
              value={dreamText}
              onChange={(e) => setDreamText(e.target.value)}
              required
            />
            <Button type="submit" disabled={createDream.isPending} className="bg-secondary text-secondary-foreground hover:bg-secondary/90 w-full md:w-auto">
              {createDream.isPending ? "Расшифровка..." : "Сохранить и расшифровать"}
              {!createDream.isPending && <Sparkles className="ml-2 w-4 h-4" />}
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="space-y-6 mt-8">
        <h2 className="font-serif text-2xl">Архив сновидений</h2>
        
        {isLoading ? (
          <div className="flex justify-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-secondary"></div></div>
        ) : dreams && dreams.length > 0 ? (
          dreams.map((dream, i) => (
            <motion.div key={dream.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
              <Card className="bg-card/40 backdrop-blur-md relative overflow-hidden">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-sm text-muted-foreground font-normal">
                      {format(new Date(dream.date), "d MMMM yyyy, HH:mm", { locale: ru })}
                    </CardTitle>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => handleDelete(dream.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-foreground border-l-2 border-secondary/30 pl-4 py-1 italic">
                    {dream.dreamText}
                  </p>
                  
                  <div className="bg-secondary/5 rounded-xl p-4 border border-secondary/10">
                    <h4 className="font-bold flex items-center gap-2 mb-2 text-secondary">
                      <Sparkles className="w-4 h-4" /> Толкование
                    </h4>
                    <p className="text-sm leading-relaxed">{dream.interpretation}</p>
                  </div>
                  
                  {dream.keywords && dream.keywords.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-2">
                      {dream.keywords.map((kw, idx) => (
                        <span key={idx} className="px-2 py-1 rounded-md bg-background border border-border text-xs flex items-center gap-1">
                          <Key className="w-3 h-3 text-muted-foreground" />
                          {kw}
                        </span>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ))
        ) : (
          <div className="text-center p-8 border border-dashed border-border rounded-xl text-muted-foreground">
            Вы еще не записывали свои сны.
          </div>
        )}
      </div>
    </div>
  );
}
