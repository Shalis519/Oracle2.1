import { useState, type ReactNode } from "react";
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

function formatInline(text: string): ReactNode[] {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={index} className="font-semibold text-foreground">{part.slice(2, -2)}</strong>;
    }
    return <span key={index}>{part.replace(/\*\*/g, "")}</span>;
  });
}

function normalizeInterpretation(text: string): string {
  return text
    .replace(/\r\n/g, "\n")
    .replace(/\s*---\s*/g, "\n\n")
    .replace(/\s*###\s*/g, "\n\n")
    .replace(/\s+(?=(?:\d+\.)\s)/g, "\n\n")
    .replace(/\s+\*\s+(?=\*\*?)/g, "\n- ")
    .replace(/[ \t]+\n/g, "\n")
    .trim();
}

function InterpretationText({ text }: { text: string }) {
  const blocks = normalizeInterpretation(text)
    .split(/\n\s*\n/)
    .map((block) => block.trim())
    .filter(Boolean);

  return (
    <div className="space-y-4 break-words text-[15px] leading-7 [overflow-wrap:anywhere]">
      {blocks.map((block, index) => {
        const lines = block.split("\n").map((line) => line.trim()).filter(Boolean);
        const isHeading = /^(?:#{1,4}\s|(?:[1-7]\.\s+)(?:Общее впечатление|Главные образы|Эмоциональный фон|Возможная связь с реальной жизнью|Практическое применение|Примеры возможных жизненных ситуаций|Вопросы для саморефлексии))/i.test(lines[0]);
        const listLines = lines.filter((line) => /^[-*•]\s+/.test(line));

        if (isHeading) {
          const heading = lines[0].replace(/^#{1,4}\s*/, "");
          return (
            <div key={index} className="space-y-2">
              <h5 className="pt-1 text-base font-semibold leading-6 text-secondary">
                {formatInline(heading)}
              </h5>
              {lines.length > 1 ? (
                <p className="whitespace-pre-line">{formatInline(lines.slice(1).join("\n"))}</p>
              ) : null}
            </div>
          );
        }

        if (listLines.length === lines.length && listLines.length > 0) {
          return (
            <ul key={index} className="list-disc space-y-1 pl-5 marker:text-secondary">
              {listLines.map((line, itemIndex) => (
                <li key={itemIndex}>{formatInline(line.replace(/^[-*•]\s+/, ""))}</li>
              ))}
            </ul>
          );
        }

        return (
          <p key={index} className="whitespace-pre-line">
            {formatInline(lines.join("\n"))}
          </p>
        );
      })}
    </div>
  );
}

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
          toast({ title: "Сон сохранен и проанализирован" });
          queryClient.invalidateQueries({ queryKey: getListDreamsQueryKey() });
        },
        onError: (error) => {
          toast({
            title: "Не удалось проанализировать сон",
            description: error instanceof Error ? error.message : "Попробуйте повторить позже.",
            variant: "destructive",
          });
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
        <p className="text-muted-foreground">Дневник сновидений с бережным психологическим анализом.</p>
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
            <p className="text-xs text-muted-foreground">
              Для одного аккаунта доступно до 3 анализов сновидений в сутки.
            </p>
            <Button type="submit" disabled={createDream.isPending} className="bg-secondary text-secondary-foreground hover:bg-secondary/90 w-full md:w-auto">
              {createDream.isPending ? "ИИ анализирует сон..." : "Сохранить и проанализировать"}
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
                    <InterpretationText text={dream.interpretation} />
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
