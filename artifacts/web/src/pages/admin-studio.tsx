import { useState, useEffect, useCallback } from "react";
import { useUser } from "@clerk/react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Search,
  Plus,
  Save,
  Trash2,
  Pencil,
  X,
  Layers,
  BookOpen,
  ArrowLeft,
  BrainCircuit,
  Sparkles,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";

interface Entity {
  id: number;
  name: string;
  code: string;
  system: string;
  type: string;
  symbol?: string | null;
  createdAt: string;
  updatedAt: string;
}

interface Theme {
  id: number;
  name: string;
  slug: string;
  description?: string | null;
}

interface EntityThemeLink {
  id: number;
  entityId: number;
  themeId: number;
  weight: number;
  polarity: string;
  theme: Theme | null;
}

interface Profile {
  id: number;
  entityId: number;
  keyMeanings?: string | null;
  psychologicalManifestations?: string | null;
  emotions?: string | null;
  strengths?: string | null;
  weaknesses?: string | null;
  recommendations?: string | null;
  warnings?: string | null;
}

const API = `${import.meta.env.BASE_URL.replace(/\/$/, "")}/api`;

function apiFetch(path: string, opts?: RequestInit) {
  return fetch(`${API}${path}`, {
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    ...opts,
  });
}

/* ─── Entity Form ─── */

function EntityForm({
  entity,
  onSave,
  onCancel,
}: {
  entity?: Entity;
  onSave: (values: Record<string, unknown>) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(entity?.name ?? "");
  const [code, setCode] = useState(entity?.code ?? "");
  const [system, setSystem] = useState(entity?.system ?? "");
  const [type, setType] = useState(entity?.type ?? "");
  const [symbol, setSymbol] = useState(entity?.symbol ?? "");

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Название</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Например: Венера" />
        </div>
        <div className="space-y-2">
          <Label>Код (unique)</Label>
          <Input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="venus"
            disabled={!!entity}
          />
        </div>
        <div className="space-y-2">
          <Label>Система</Label>
          <Input value={system} onChange={(e) => setSystem(e.target.value)} placeholder="astrology" />
        </div>
        <div className="space-y-2">
          <Label>Тип</Label>
          <Input value={type} onChange={(e) => setType(e.target.value)} placeholder="planet" />
        </div>
        <div className="space-y-2 md:col-span-2">
          <Label>Символ</Label>
          <Input value={symbol} onChange={(e) => setSymbol(e.target.value)} placeholder="↑ или текст" />
        </div>
      </div>
      <div className="flex gap-2 pt-2">
        <Button
          onClick={() =>
            onSave({ name, code, system, type, symbol: symbol || null })
          }
          disabled={!name || !code || !system || !type}
        >
          <Save className="w-4 h-4 mr-2" />
          {entity ? "Сохранить" : "Создать"}
        </Button>
        <Button variant="ghost" onClick={onCancel}>
          <X className="w-4 h-4 mr-2" />
          Отмена
        </Button>
      </div>
    </div>
  );
}

/* ─── Entity Profile Form ─── */

function ProfileForm({
  profile,
  onSave,
}: {
  profile: Profile | null;
  onSave: (values: Record<string, unknown>) => void;
}) {
  const fields: { key: keyof Profile; label: string; placeholder: string }[] = [
    { key: "keyMeanings", label: "Ключевые смыслы", placeholder: "Основные семантические значения сущности..." },
    { key: "psychologicalManifestations", label: "Психологические проявления", placeholder: "Как эта сущность проявляется в психике..." },
    { key: "emotions", label: "Эмоции", placeholder: "Какие эмоции порождает..." },
    { key: "strengths", label: "Сильные стороны", placeholder: "Позитивные качества..." },
    { key: "weaknesses", label: "Слабые стороны", placeholder: "Области для роста..." },
    { key: "recommendations", label: "Рекомендации", placeholder: "Практические советы..." },
    { key: "warnings", label: "Предупреждения", placeholder: "Чего остерегаться..." },
  ];

  const [values, setValues] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    fields.forEach((f) => {
      init[f.key] = (profile?.[f.key] as string | null) ?? "";
    });
    return init;
  });

  return (
    <div className="space-y-4">
      {fields.map((f) => (
        <div key={f.key} className="space-y-1">
          <Label>{f.label}</Label>
          <Textarea
            value={values[f.key]}
            onChange={(e) =>
              setValues((prev) => ({ ...prev, [f.key]: e.target.value }))
            }
            placeholder={f.placeholder}
            rows={3}
          />
        </div>
      ))}
      <Button
        onClick={() =>
          onSave(
            Object.fromEntries(
              fields.map((f) => [f.key, values[f.key] || null]),
            ),
          )
        }
      >
        <Save className="w-4 h-4 mr-2" />
        Сохранить профиль
      </Button>
    </div>
  );
}

/* ─── Theme Form ─── */

function ThemeForm({
  theme,
  onSave,
  onCancel,
}: {
  theme?: Theme;
  onSave: (values: Record<string, unknown>) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(theme?.name ?? "");
  const [slug, setSlug] = useState(theme?.slug ?? "");
  const [description, setDescription] = useState(theme?.description ?? "");

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Название</Label>
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Любовь" />
      </div>
      <div className="space-y-2">
        <Label>Slug (unique)</Label>
        <Input
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          placeholder="love"
          disabled={!!theme}
        />
      </div>
      <div className="space-y-2">
        <Label>Описание</Label>
        <Textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Жизненная тема любви и отношений..."
          rows={3}
        />
      </div>
      <div className="flex gap-2 pt-2">
        <Button
          onClick={() =>
            onSave({
              name,
              slug,
              description: description || null,
            })
          }
          disabled={!name || !slug}
        >
          <Save className="w-4 h-4 mr-2" />
          {theme ? "Сохранить" : "Создать"}
        </Button>
        <Button variant="ghost" onClick={onCancel}>
          <X className="w-4 h-4 mr-2" />
          Отмена
        </Button>
      </div>
    </div>
  );
}

/* ─── Main Page ─── */

export default function AdminStudioPage() {
  const { user } = useUser();
  const { toast } = useToast();
  const [tab, setTab] = useState("entities");
  const [entities, setEntities] = useState<Entity[]>([]);
  const [themes, setThemes] = useState<Theme[]>([]);
  const [search, setSearch] = useState("");
  const [editingEntity, setEditingEntity] = useState<Entity | null>(null);
  const [editingTheme, setEditingTheme] = useState<Theme | null>(null);
  const [showEntityForm, setShowEntityForm] = useState(false);
  const [showThemeForm, setShowThemeForm] = useState(false);
  const [detailEntity, setDetailEntity] = useState<Entity | null>(null);
  const [detailProfile, setDetailProfile] = useState<Profile | null>(null);
  const [detailLinks, setDetailLinks] = useState<EntityThemeLink[]>([]);
  const [loading, setLoading] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    apiFetch("/profile")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setIsAdmin(data?.role === "admin"))
      .catch(() => setIsAdmin(false));
  }, []);

  const loadEntities = useCallback(async () => {
    const res = await apiFetch(`/admin/ontology/entities?search=${encodeURIComponent(search)}`);
    const data = await res.json();
    setEntities(data.entities ?? []);
  }, [search]);

  const loadThemes = useCallback(async () => {
    const res = await apiFetch("/admin/ontology/themes");
    const data = await res.json();
    setThemes(data.themes ?? []);
  }, []);

  const loadDetail = useCallback(async (id: number) => {
    const res = await apiFetch(`/admin/ontology/entities/${id}`);
    const data = await res.json();
    setDetailEntity(data.entity);
    setDetailProfile(data.profile);
    setDetailLinks(data.themes ?? []);
  }, []);

  useEffect(() => {
    loadEntities();
    loadThemes();
  }, [loadEntities, loadThemes]);

  const handleCreateEntity = async (values: Record<string, unknown>) => {
    const res = await apiFetch("/admin/ontology/entities", {
      method: "POST",
      body: JSON.stringify(values),
    });
    if (!res.ok) {
      const err = await res.json();
      toast({ title: "Ошибка", description: err.error, variant: "destructive" });
      return;
    }
    toast({ title: "Сущность создана" });
    setShowEntityForm(false);
    loadEntities();
  };

  const handleUpdateEntity = async (values: Record<string, unknown>) => {
    if (!editingEntity) return;
    const res = await apiFetch(`/admin/ontology/entities/${editingEntity.id}`, {
      method: "PUT",
      body: JSON.stringify(values),
    });
    if (!res.ok) {
      const err = await res.json();
      toast({ title: "Ошибка", description: err.error, variant: "destructive" });
      return;
    }
    toast({ title: "Сущность обновлена" });
    setEditingEntity(null);
    loadEntities();
  };

  const handleDeleteEntity = async (id: number) => {
    if (!confirm("Удалить сущность? Связанный профиль и темы тоже удалятся.")) return;
    const res = await apiFetch(`/admin/ontology/entities/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const err = await res.json();
      toast({ title: "Ошибка", description: err.error, variant: "destructive" });
      return;
    }
    toast({ title: "Удалено" });
    loadEntities();
  };

  const handleCreateTheme = async (values: Record<string, unknown>) => {
    const res = await apiFetch("/admin/ontology/themes", {
      method: "POST",
      body: JSON.stringify(values),
    });
    if (!res.ok) {
      const err = await res.json();
      toast({ title: "Ошибка", description: err.error, variant: "destructive" });
      return;
    }
    toast({ title: "Тема создана" });
    setShowThemeForm(false);
    loadThemes();
  };

  const handleUpdateTheme = async (values: Record<string, unknown>) => {
    if (!editingTheme) return;
    const res = await apiFetch(`/admin/ontology/themes/${editingTheme.id}`, {
      method: "PUT",
      body: JSON.stringify(values),
    });
    if (!res.ok) {
      const err = await res.json();
      toast({ title: "Ошибка", description: err.error, variant: "destructive" });
      return;
    }
    toast({ title: "Тема обновлена" });
    setEditingTheme(null);
    loadThemes();
  };

  const handleDeleteTheme = async (id: number) => {
    if (!confirm("Удалить тему? Связи с сущностями тоже удалятся.")) return;
    const res = await apiFetch(`/admin/ontology/themes/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const err = await res.json();
      toast({ title: "Ошибка", description: err.error, variant: "destructive" });
      return;
    }
    toast({ title: "Удалено" });
    loadThemes();
  };

  const handleSaveProfile = async (values: Record<string, unknown>) => {
    if (!detailEntity) return;
    const res = await apiFetch(`/admin/ontology/entities/${detailEntity.id}/profile`, {
      method: "PUT",
      body: JSON.stringify(values),
    });
    if (!res.ok) {
      const err = await res.json();
      toast({ title: "Ошибка", description: err.error, variant: "destructive" });
      return;
    }
    const updated = await res.json();
    setDetailProfile(updated);
    toast({ title: "Профиль сохранён" });
  };

  const handleAddLink = async (themeId: number, weight: number, polarity: string) => {
    if (!detailEntity) return;
    const res = await apiFetch("/admin/ontology/entity-themes", {
      method: "POST",
      body: JSON.stringify({ entityId: detailEntity.id, themeId, weight, polarity }),
    });
    if (!res.ok) {
      const err = await res.json();
      toast({ title: "Ошибка", description: err.error, variant: "destructive" });
      return;
    }
    toast({ title: "Связь добавлена" });
    loadDetail(detailEntity.id);
  };

  const handleDeleteLink = async (id: number) => {
    if (!confirm("Удалить связь?")) return;
    const res = await apiFetch(`/admin/ontology/entity-themes/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const err = await res.json();
      toast({ title: "Ошибка", description: err.error, variant: "destructive" });
      return;
    }
    toast({ title: "Связь удалена" });
    if (detailEntity) loadDetail(detailEntity.id);
  };

  if (!isAdmin) {
    return (
      <div className="p-10 max-w-xl mx-auto text-center space-y-4">
        <h1 className="text-2xl font-serif">Доступ ограничен</h1>
        <p className="text-muted-foreground">Эта страница доступна только администраторам.</p>
        <Link href="/dashboard">
          <Button>Вернуться на главную</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-10 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-serif font-bold flex items-center gap-2">
            <BrainCircuit className="w-7 h-7 text-primary" />
            Oracle Studio
          </h1>
          <p className="text-muted-foreground">Редактор семантической онтологии</p>
        </div>
        <Link href="/dashboard">
          <Button variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Назад
          </Button>
        </Link>
      </div>

      <Tabs value={tab} onValueChange={setTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:w-auto">
          <TabsTrigger value="entities">
            <Layers className="w-4 h-4 mr-2" />
            Сущности
          </TabsTrigger>
          <TabsTrigger value="themes">
            <BookOpen className="w-4 h-4 mr-2" />
            Жизненные темы
          </TabsTrigger>
        </TabsList>

        <TabsContent value="entities" className="space-y-6">
          {/* Search & Create */}
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Поиск сущностей..."
                className="pl-9"
              />
            </div>
            <Dialog open={showEntityForm} onOpenChange={setShowEntityForm}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Сущность
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>Новая сущность</DialogTitle>
                </DialogHeader>
                <EntityForm
                  onSave={handleCreateEntity}
                  onCancel={() => setShowEntityForm(false)}
                />
              </DialogContent>
            </Dialog>
          </div>

          {/* Entity Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <AnimatePresence>
              {entities.map((e) => (
                <motion.div
                  key={e.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                >
                  <Card className="cursor-pointer hover:border-primary/40 transition-colors group">
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg font-serif flex items-center gap-2">
                          {e.symbol ? <span className="text-xl">{e.symbol}</span> : <Sparkles className="w-5 h-5 text-primary" />}
                          {e.name}
                        </CardTitle>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(ev) => {
                              ev.stopPropagation();
                              setEditingEntity(e);
                            }}
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:text-destructive"
                            onClick={(ev) => {
                              ev.stopPropagation();
                              handleDeleteEntity(e.id);
                            }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent onClick={() => loadDetail(e.id)}>
                      <div className="flex flex-wrap gap-2 text-xs">
                        <Badge variant="secondary">{e.system}</Badge>
                        <Badge variant="outline">{e.type}</Badge>
                        <Badge variant="outline" className="font-mono">{e.code}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">Кликните для редактирования профиля</p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {entities.length === 0 && !loading && (
            <div className="text-center py-20 text-muted-foreground">
              Нет сущностей. Создайте первую.
            </div>
          )}
        </TabsContent>

        <TabsContent value="themes" className="space-y-6">
          <div className="flex justify-end">
            <Dialog open={showThemeForm} onOpenChange={setShowThemeForm}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Тема
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>Новая тема</DialogTitle>
                </DialogHeader>
                <ThemeForm
                  onSave={handleCreateTheme}
                  onCancel={() => setShowThemeForm(false)}
                />
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <AnimatePresence>
              {themes.map((t) => (
                <motion.div
                  key={t.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                >
                  <Card className="group hover:border-primary/40 transition-colors">
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg font-serif">{t.name}</CardTitle>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setEditingTheme(t)}
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:text-destructive"
                            onClick={() => handleDeleteTheme(t.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <Badge variant="outline" className="font-mono">{t.slug}</Badge>
                      {t.description && (
                        <p className="text-sm text-muted-foreground mt-2">{t.description}</p>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {themes.length === 0 && (
            <div className="text-center py-20 text-muted-foreground">
              Нет тем. Создайте первую.
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Edit Entity Dialog */}
      <Dialog open={!!editingEntity} onOpenChange={(v) => !v && setEditingEntity(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Редактирование сущности</DialogTitle>
          </DialogHeader>
          {editingEntity && (
            <EntityForm
              entity={editingEntity}
              onSave={handleUpdateEntity}
              onCancel={() => setEditingEntity(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Theme Dialog */}
      <Dialog open={!!editingTheme} onOpenChange={(v) => !v && setEditingTheme(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Редактирование темы</DialogTitle>
          </DialogHeader>
          {editingTheme && (
            <ThemeForm
              theme={editingTheme}
              onSave={handleUpdateTheme}
              onCancel={() => setEditingTheme(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Entity Detail Drawer/Modal */}
      <Dialog open={!!detailEntity} onOpenChange={(v) => !v && setDetailEntity(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="font-serif text-2xl flex items-center gap-2">
              {detailEntity?.symbol ? (
                <span className="text-2xl">{detailEntity.symbol}</span>
              ) : (
                <Sparkles className="w-6 h-6 text-primary" />
              )}
              {detailEntity?.name}
              <Badge variant="secondary">{detailEntity?.system}</Badge>
              <Badge variant="outline">{detailEntity?.type}</Badge>
            </DialogTitle>
          </DialogHeader>

          <ScrollArea className="flex-1 pr-4">
            <div className="space-y-8">
              {/* Semantic Profile */}
              <div>
                <h3 className="text-lg font-medium mb-3 flex items-center gap-2">
                  <BrainCircuit className="w-5 h-5 text-primary" />
                  Семантический профиль
                </h3>
                <ProfileForm profile={detailProfile} onSave={handleSaveProfile} />
              </div>

              {/* Theme Links */}
              <div>
                <h3 className="text-lg font-medium mb-3 flex items-center gap-2">
                  <Layers className="w-5 h-5 text-primary" />
                  Связанные темы
                </h3>
                <div className="space-y-3">
                  {detailLinks.map((link) => (
                    <div
                      key={link.id}
                      className="flex items-center justify-between p-3 rounded-lg border border-border bg-card/50"
                    >
                      <div className="flex items-center gap-3">
                        <Badge>{link.theme?.name}</Badge>
                        <span className="text-sm text-muted-foreground">
                          вес: {link.weight}, полярность: {link.polarity}
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => handleDeleteLink(link.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}

                  {detailLinks.length === 0 && (
                    <p className="text-sm text-muted-foreground">
                      Нет связанных тем. Добавьте ниже.
                    </p>
                  )}

                  {/* Add Link */}
                  <AddLinkForm
                    themes={themes}
                    existingThemeIds={detailLinks.map((l) => l.themeId)}
                    onAdd={handleAddLink}
                  />
                </div>
              </div>
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ─── Add Link Form ─── */

function AddLinkForm({
  themes,
  existingThemeIds,
  onAdd,
}: {
  themes: Theme[];
  existingThemeIds: number[];
  onAdd: (themeId: number, weight: number, polarity: string) => void;
}) {
  const [themeId, setThemeId] = useState<string>("");
  const [weight, setWeight] = useState("1.0");
  const [polarity, setPolarity] = useState("neutral");

  const available = themes.filter((t) => !existingThemeIds.includes(t.id));

  if (available.length === 0) return null;

  return (
    <div className="flex flex-wrap items-end gap-2 pt-2">
      <div className="space-y-1 min-w-[160px]">
        <Label className="text-xs">Тема</Label>
        <Select value={themeId} onValueChange={setThemeId}>
          <SelectTrigger>
            <SelectValue placeholder="Выберите..." />
          </SelectTrigger>
          <SelectContent>
            {available.map((t) => (
              <SelectItem key={t.id} value={String(t.id)}>
                {t.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1 w-24">
        <Label className="text-xs">Вес</Label>
        <Input
          type="number"
          step="0.1"
          value={weight}
          onChange={(e) => setWeight(e.target.value)}
        />
      </div>
      <div className="space-y-1 min-w-[140px]">
        <Label className="text-xs">Полярность</Label>
        <Select value={polarity} onValueChange={setPolarity}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="positive">Позитив</SelectItem>
            <SelectItem value="neutral">Нейтрал</SelectItem>
            <SelectItem value="negative">Негатив</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <Button
        onClick={() => {
          if (!themeId) return;
          onAdd(Number(themeId), Number(weight), polarity);
          setThemeId("");
          setWeight("1.0");
          setPolarity("neutral");
        }}
        disabled={!themeId}
        className="mb-0"
      >
        <Plus className="w-4 h-4 mr-1" />
        Добавить
      </Button>
    </div>
  );
}
