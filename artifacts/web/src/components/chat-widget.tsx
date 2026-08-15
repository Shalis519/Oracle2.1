import { useEffect, useRef, useState } from "react";
import {
  useListChatMessages,
  useSendChatMessage,
  getListChatMessagesQueryKey,
  getGetChatUnreadQueryKey,
  type ChatMessage,
  useGetChatUnread,
  useMarkChatRead,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { MessageCircle, X, Send, Smile, Bell, BellOff } from "lucide-react";
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
const MUTE_STORAGE_KEY = "aether-chat-sound-muted";

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

const relativeTimeFormat = new Intl.RelativeTimeFormat("ru-RU", {
  numeric: "auto",
  style: "short",
});

function formatRelativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  const diffSeconds = Math.round((then - Date.now()) / 1000);
  const abs = Math.abs(diffSeconds);

  if (abs < 45) return "только что";
  if (abs < 3600)
    return relativeTimeFormat.format(Math.round(diffSeconds / 60), "minute");
  if (abs < 86400)
    return relativeTimeFormat.format(Math.round(diffSeconds / 3600), "hour");
  if (abs < 2592000)
    return relativeTimeFormat.format(Math.round(diffSeconds / 86400), "day");
  if (abs < 31536000)
    return relativeTimeFormat.format(Math.round(diffSeconds / 2592000), "month");
  return relativeTimeFormat.format(Math.round(diffSeconds / 31536000), "year");
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

let sharedAudioContext: AudioContext | null = null;

function playNotificationSound() {
  try {
    const Ctx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!Ctx) return;
    if (!sharedAudioContext) sharedAudioContext = new Ctx();
    const ctx = sharedAudioContext;
    if (ctx.state === "suspended") void ctx.resume();

    const now = ctx.currentTime;
    const notes = [880, 1174.66];
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      const start = now + i * 0.12;
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(0.18, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.35);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(start);
      osc.stop(start + 0.4);
    });
  } catch {
    // Audio is best-effort; ignore failures (e.g. autoplay restrictions).
  }
}

function MessageRow({ message }: { message: ChatMessage }) {
  return (
    <div className="flex gap-3 py-1.5">
      <Avatar className="w-9 h-9 shrink-0">
        {message.authorAvatar && (
          <AvatarImage src={message.authorAvatar} alt="" />
        )}
        <AvatarFallback className="text-xs bg-muted">
          {initials(message.authorName)}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-[13px] font-medium text-foreground truncate max-w-[170px]">
            {message.mine ? "Вы" : message.authorName}
          </span>
          <span className="text-xs text-muted-foreground shrink-0">
            {formatRelativeTime(message.createdAt)}
          </span>
        </div>
        <p className="text-sm text-foreground/90 whitespace-pre-wrap break-words leading-snug">
          {message.body}
        </p>
      </div>
    </div>
  );
}

export function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [muted, setMuted] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const openRef = useRef(open);
  const mutedRef = useRef(muted);
  const previousUnreadRef = useRef<number | null>(null);
  const lastMarkedReadIdRef = useRef(0);

  useEffect(() => {
    try {
      setMuted(localStorage.getItem(MUTE_STORAGE_KEY) === "1");
    } catch {
      // localStorage may be unavailable; default to unmuted.
    }
  }, []);

  useEffect(() => {
    openRef.current = open;
  }, [open]);

  useEffect(() => {
    mutedRef.current = muted;
  }, [muted]);

  const { data: messages } = useListChatMessages({
    query: {
      queryKey: getListChatMessagesQueryKey(),
      refetchInterval: open ? 5000 : 20000,
    },
  });

  const { data: unreadData } = useGetChatUnread({
    query: {
      queryKey: getGetChatUnreadQueryKey(),
      refetchInterval: open ? 5000 : 20000,
    },
  });
  const unread = unreadData?.unreadCount ?? 0;
  const markChatRead = useMarkChatRead();

  useEffect(() => {
    if (previousUnreadRef.current === null) {
      previousUnreadRef.current = unread;
      return;
    }
    if (unread > previousUnreadRef.current && !openRef.current && !mutedRef.current) {
      playNotificationSound();
    }
    previousUnreadRef.current = unread;
  }, [unread]);

  useEffect(() => {
    if (!open || !messages || messages.length === 0) return;
    const maxId = messages.reduce((acc, m) => (m.id > acc ? m.id : acc), 0);
    if (maxId <= lastMarkedReadIdRef.current) return;
    lastMarkedReadIdRef.current = maxId;
    markChatRead.mutate(
      { data: { messageId: maxId } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetChatUnreadQueryKey() });
        },
      },
    );
  }, [messages, open, markChatRead, queryClient]);

  useEffect(() => {
    if (open && messages) {
      endRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, open]);

  const openWidget = () => {
    setOpen(true);
  };

  const toggleMute = () => {
    setMuted((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(MUTE_STORAGE_KEY, next ? "1" : "0");
      } catch {
        // Ignore persistence failures.
      }
      return next;
    });
  };

  const sendMessage = useSendChatMessage();

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
        onClick={openWidget}
        aria-label="Открыть Болталку"
        className="fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-full bg-primary text-primary-foreground px-5 py-3 shadow-xl shadow-primary/20 hover:bg-primary/90 transition-colors"
      >
        <MessageCircle className="w-5 h-5" />
        <span className="font-serif font-medium">Болталка</span>
        {unread > 0 && (
          <span className="absolute -top-1.5 -right-1.5 min-w-[1.25rem] h-5 px-1 rounded-full bg-destructive text-destructive-foreground text-xs font-bold flex items-center justify-center shadow-md">
            {unread > 99 ? "99+" : unread}
          </span>
        )}
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
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={toggleMute}
            aria-label={
              muted ? "Включить звук оповещений" : "Выключить звук оповещений"
            }
            title={
              muted ? "Звук оповещений выключен" : "Звук оповещений включён"
            }
          >
            {muted ? (
              <BellOff className="w-4 h-4 text-muted-foreground" />
            ) : (
              <Bell className="w-4 h-4 text-primary" />
            )}
          </Button>
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
      </div>

      <ScrollArea className="flex-1 px-3 py-3">
        <div className="space-y-1 divide-y divide-border/40">
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
