import { useEffect, useRef, useState } from "react";
import {
  useListChatMessages,
  useSendChatMessage,
  getListChatMessagesQueryKey,
  type ChatMessage,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { MessageCircle, X, Send, Smile } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const MAX_LENGTH = 4096;

const EMOJIS = [
  "😀", "😄", "😁", "😊", "😍", "😘", "😎", "🤩",
  "🥳", "🤔", "😴", "😇", "🙃", "😋", "😜", "🤗",
  "😢", "😭", "😡", "😱", "😴", "🤯", "🥰", "😏",
  "👍", "👎", "👏", "🙏", "💪", "🤝", "✌️", "🤞",
  "❤️", "🔥", "✨", "🌟", "💫", "🌙", "☀️", "⭐",
  "🎉", "🎊", "🎁", "🌸", "🌹", "🍀", "🦋", "🕉️",
];

function codePointLength(text: string): number {
  return Array.from(text).length;
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  return new Intl.DateTimeFormat("ru-RU", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

function MessageRow({ message }: { message: ChatMessage }) {
  return (
    <div
      className={cn(
        "flex gap-2 items-end",
        message.mine ? "flex-row-reverse" : "flex-row",
      )}
    >
      <Avatar className="w-7 h-7 shrink-0">
        {message.authorAvatar && (
          <AvatarImage src={message.authorAvatar} alt="" />
        )}
        <AvatarFallback className="text-[10px] bg-muted">
          {initials(message.authorName)}
        </AvatarFallback>
      </Avatar>
      <div
        className={cn(
          "max-w-[78%] flex flex-col",
          message.mine ? "items-end" : "items-start",
        )}
      >
        <div className="flex items-baseline gap-2 mb-0.5 px-1">
          <span className="text-xs font-medium text-muted-foreground truncate max-w-[140px]">
            {message.mine ? "Вы" : message.authorName}
          </span>
          <span className="text-[10px] text-muted-foreground/70 shrink-0">
            {formatTime(message.createdAt)}
          </span>
        </div>
        <div
          className={cn(
            "rounded-2xl px-3 py-2 text-sm whitespace-pre-wrap break-words",
            message.mine
              ? "bg-primary text-primary-foreground rounded-br-sm"
              : "bg-muted text-foreground rounded-bl-sm",
          )}
        >
          {message.body}
        </div>
      </div>
    </div>
  );
}

export function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [emojiOpen, setEmojiOpen] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const endRef = useRef<HTMLDivElement>(null);

  const { data: messages } = useListChatMessages({
    query: {
      queryKey: getListChatMessagesQueryKey(),
      refetchInterval: open ? 5000 : false,
      enabled: open,
    },
  });

  const sendMessage = useSendChatMessage();

  useEffect(() => {
    if (open && messages) {
      endRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, open]);

  const length = codePointLength(text);
  const overLimit = length > MAX_LENGTH;
  const canSend = length > 0 && !overLimit && !sendMessage.isPending;

  const handleSend = () => {
    const body = text.trim();
    if (!body || overLimit || sendMessage.isPending) return;
    sendMessage.mutate(
      { data: { body } },
      {
        onSuccess: () => {
          setText("");
          queryClient.invalidateQueries({
            queryKey: getListChatMessagesQueryKey(),
          });
        },
        onError: (error) => {
          const data = (error as { data?: { error?: string } }).data;
          toast({
            title: "Не удалось отправить",
            description: data?.error ?? "Попробуйте ещё раз.",
            variant: "destructive",
          });
        },
      },
    );
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const insertEmoji = (emoji: string) => {
    const el = textareaRef.current;
    if (!el) {
      setText((t) => t + emoji);
      return;
    }
    const start = el.selectionStart ?? text.length;
    const end = el.selectionEnd ?? text.length;
    const next = text.slice(0, start) + emoji + text.slice(end);
    setText(next);
    requestAnimationFrame(() => {
      el.focus();
      const pos = start + emoji.length;
      el.setSelectionRange(pos, pos);
    });
  };

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Открыть Болталку"
        className="fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-full bg-primary text-primary-foreground px-5 py-3 shadow-xl shadow-primary/20 hover:bg-primary/90 transition-colors"
      >
        <MessageCircle className="w-5 h-5" />
        <span className="font-serif font-medium">Болталка</span>
      </button>
    );
  }

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col w-[min(92vw,24rem)] h-[min(75vh,32rem)] rounded-2xl border border-border bg-card/95 backdrop-blur-md shadow-2xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-card">
        <div className="flex items-center gap-2">
          <MessageCircle className="w-5 h-5 text-primary" />
          <h2 className="font-serif font-bold text-lg">Болталка</h2>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => setOpen(false)}
          aria-label="Закрыть"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>

      <ScrollArea className="flex-1 px-3 py-3">
        <div className="space-y-3">
          {messages && messages.length > 0 ? (
            messages.map((m) => <MessageRow key={m.id} message={m} />)
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">
              Пока нет сообщений. Будьте первым!
            </p>
          )}
          <div ref={endRef} />
        </div>
      </ScrollArea>

      <div className="border-t border-border p-3 space-y-2 bg-card">
        <div className="flex items-end gap-2">
          <Popover open={emojiOpen} onOpenChange={setEmojiOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 shrink-0"
                aria-label="Добавить эмодзи"
              >
                <Smile className="w-5 h-5" />
              </Button>
            </PopoverTrigger>
            <PopoverContent
              side="top"
              align="start"
              className="w-64 p-2"
            >
              <div className="grid grid-cols-8 gap-1">
                {EMOJIS.map((emoji, i) => (
                  <button
                    key={`${emoji}-${i}`}
                    type="button"
                    onClick={() => insertEmoji(emoji)}
                    className="text-xl leading-none rounded hover:bg-muted p-1 transition-colors"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </PopoverContent>
          </Popover>

          <Textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Напишите сообщение..."
            rows={1}
            className="resize-none min-h-9 max-h-28 flex-1 text-sm"
          />

          <Button
            size="icon"
            className="h-9 w-9 shrink-0"
            disabled={!canSend}
            onClick={handleSend}
            aria-label="Отправить"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
        <div className="flex justify-end px-1">
          <span
            className={cn(
              "text-[11px]",
              overLimit ? "text-destructive" : "text-muted-foreground/70",
            )}
          >
            {length} / {MAX_LENGTH}
          </span>
        </div>
      </div>
    </div>
  );
}
