import { useState } from "react";
import { motion } from "framer-motion";
import { ExternalLink, Headphones, Library } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const PLAYLISTS = [
  { id: "PLDTT1DPva46M", title: "Саблиминалы" },
  { id: "PLE6oWh3oUv6Y", title: "Китайская метафизика" },
] as const;
type PlaylistId = (typeof PLAYLISTS)[number]["id"];

export default function MediaPage() {
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<PlaylistId>(PLAYLISTS[0].id);
  const selectedPlaylist = PLAYLISTS.find(({ id }) => id === selectedPlaylistId) ?? PLAYLISTS[0];
  const playlistUrl = `https://www.youtube.com/playlist?list=${selectedPlaylist.id}`;

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
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.08 }}
      >
        <Card className="overflow-hidden border-secondary/20 bg-card/40 shadow-lg backdrop-blur-md">
          <CardHeader className="space-y-2 pb-4">
            <div className="flex flex-wrap gap-2" role="tablist" aria-label="Плейлисты медиатеки">
              {PLAYLISTS.map((playlist) => {
                const isSelected = playlist.id === selectedPlaylist.id;
                return (
                  <button
                    key={playlist.id}
                    type="button"
                    role="tab"
                    aria-selected={isSelected}
                    onClick={() => setSelectedPlaylistId(playlist.id)}
                    className={`rounded-lg border px-3 py-2 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-primary ${
                      isSelected
                        ? "border-secondary bg-secondary/20 text-foreground"
                        : "border-border text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`}
                  >
                    {playlist.title}
                  </button>
                );
              })}
            </div>
            <CardTitle className="flex items-center gap-2 font-serif text-2xl">
              <Headphones className="h-6 w-6 text-secondary" />
              {selectedPlaylist.title}
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
                src={`https://www.youtube-nocookie.com/embed/videoseries?list=${selectedPlaylist.id}&rel=0&modestbranding=1`}
                title={`Плейлист «${selectedPlaylist.title}» на YouTube`}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                referrerPolicy="strict-origin-when-cross-origin"
                allowFullScreen
              />
            </div>
            <a
              href={playlistUrl}
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
