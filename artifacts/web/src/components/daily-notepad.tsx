import { useEffect, useState } from "react";
import {
  useGetNotepad,
  useReconcileNotepad,
  useCreateNotepadItem,
  useUpdateNotepadItem,
  useDeleteNotepadItem,
  getGetNotepadQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, Plus, Trash2, NotebookPen } from "lucide-react";

export function DailyNotepad() {
  const queryClient = useQueryClient();
  const reconcile = useReconcileNotepad();
  const { data: items } = useGetNotepad({
    query: { queryKey: getGetNotepadQueryKey() },
  });
  const createItem = useCreateNotepadItem();
  const updateItem = useUpdateNotepadItem();
  const deleteItem = useDeleteNotepadItem();

  const [newText, setNewText] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingText, setEditingText] = useState("");

  useEffect(() => {
    reconcile.mutate(undefined, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetNotepadQueryKey() });
      },
    });
  }, []);

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: getGetNotepadQueryKey() });

  const toggleDone = (id: number, done: boolean) => {
    updateItem.mutate({ id, data: { done } }, { onSuccess: invalidate });
  };

  const addNote = () => {
    const text = newText.trim();
    if (!text) return;
    createItem.mutate(
      { data: { text } },
      {
        onSuccess: () => {
          setNewText("");
          invalidate();
        },
      },
    );
  };

  const saveEdit = (id: number) => {
    updateItem.mutate(
      { id, data: { text: editingText } },
      {
        onSuccess: () => {
          setEditingId(null);
          setEditingText("");
          invalidate();
        },
      },
    );
  };

  const removeNote = (id: number) => {
    deleteItem.mutate({ id }, { onSuccess: invalidate });
  };

  const list = items ?? [];

  return (
    <Card className="bg-card/40 backdrop-blur-md border-primary/20">
      <CardHeader className="pb-3">
        <CardTitle className="font-serif text-xl flex items-center gap-2">
          <NotebookPen className="w-5 h-5 text-primary" />
          Блокнот дня
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-xl border border-border bg-background/60 p-4 sm:p-6 notepad-lines">
          <ul className="space-y-0">
            {list.map((item) => (
              <li
                key={item.id}
                className="flex items-center gap-3 min-h-[2.25rem] leading-9"
              >
                <button
                  type="button"
                  onClick={() => toggleDone(item.id, !item.done)}
                  aria-label={item.done ? "Снять отметку" : "Отметить выполнено"}
                  aria-pressed={item.done}
                  className={`shrink-0 w-5 h-5 rounded border flex items-center justify-center transition-colors ${
                    item.done
                      ? "bg-primary border-primary text-primary-foreground"
                      : "border-muted-foreground/50 hover:border-primary"
                  }`}
                >
                  {item.done && <Check className="w-3.5 h-3.5" />}
                </button>

                {editingId === item.id && item.source === "manual" ? (
                  <input
                    autoFocus
                    value={editingText}
                    onChange={(e) => setEditingText(e.target.value)}
                    onBlur={() => saveEdit(item.id)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") saveEdit(item.id);
                      if (e.key === "Escape") {
                        setEditingId(null);
                        setEditingText("");
                      }
                    }}
                    className="flex-1 bg-transparent border-none outline-none text-sm leading-9"
                  />
                ) : (
                  <span
                    className={`flex-1 text-sm ${
                      item.done ? "line-through text-muted-foreground" : ""
                    } ${item.source === "manual" ? "cursor-text" : ""}`}
                    onClick={() => {
                      if (item.source === "manual") {
                        setEditingId(item.id);
                        setEditingText(item.text);
                      }
                    }}
                  >
                    {item.text}
                  </span>
                )}

                {item.source === "manual" && (
                  <button
                    type="button"
                    onClick={() => removeNote(item.id)}
                    aria-label="Удалить заметку"
                    className="shrink-0 text-muted-foreground/60 hover:text-destructive transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </li>
            ))}

            <li className="flex items-center gap-3 min-h-[2.25rem] leading-9">
              <span className="shrink-0 w-5 h-5 rounded border border-dashed border-muted-foreground/30" />
              <input
                value={newText}
                onChange={(e) => setNewText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") addNote();
                }}
                placeholder="Личная заметка..."
                className="flex-1 bg-transparent border-none outline-none text-sm leading-9 placeholder:text-muted-foreground/50"
              />
              <button
                type="button"
                onClick={addNote}
                aria-label="Добавить заметку"
                className="shrink-0 text-muted-foreground/60 hover:text-primary transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
            </li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
