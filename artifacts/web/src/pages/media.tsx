import { motion } from "framer-motion";
import { ExternalLink, Headphones, Library } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const PLAYLIST_ID = "PLDTT1DPva46M";
const PLAYLIST_URL = `https://www.youtube.com/playlist?list=${PLAYLIST_ID}`;

export default function MediaPage() {
  return (
    <div className="mx-auto max-w-5xl space-y-8 p-6 md:p-10">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="space-y-3"
      >
        <div className="flex items-center gap-3">
          <Library className="h-9 w-9 text-secondary" />
          <h1 className="font-serif text-4xl font-bold">Медиатека</h1>
        </div>
        <p className="max-w-2xl text-muted-foreground">
          Видео и аудиопрактики с YouTube-канала проекта. Сейчас здесь доступен
          плейлист «Саблиминалы».
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.08 }}
      >
        <Card className="overflow-hidden border-secondary/20 bg-card/40 shadow-lg backdrop-blur-md">
          <CardHeader className="space-y-2 pb-4">
            <CardTitle className="flex items-center gap-2 font-serif text-2xl">
              <Headphones className="h-6 w-6 text-secondary" />
              Саблиминалы
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Выберите видео в официальном проигрывателе YouTube и включите его
              вручную.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="aspect-video overflow-hidden rounded-xl border border-border/60 bg-black shadow-inner">
              <iframe
                className="h-full w-full"
                src={`https://www.youtube-nocookie.com/embed/videoseries?list=${PLAYLIST_ID}&rel=0&modestbranding=1`}
                title="Плейлист «Саблиминалы» на YouTube"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                referrerPolicy="strict-origin-when-cross-origin"
                allowFullScreen
              />
            </div>
            <a
              href={PLAYLIST_URL}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 text-sm font-medium text-secondary underline-offset-4 transition-colors hover:text-secondary/80 hover:underline"
            >
              Открыть плейлист на YouTube
              <ExternalLink className="h-4 w-4" />
            </a>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
