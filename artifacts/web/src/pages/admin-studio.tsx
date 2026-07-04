import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "@clerk/react";
import { Link } from "wouter";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Plus,
  Pencil,
  Trash2,
  Search,
  Save,
  X,
  Layers,
  BookOpen,
  ArrowLeft,
  BrainCircuit,
  Sparkles,
  Link2,
  XCircle,
  RefreshCw,
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

interface EntityRelation {
  id: number;
  relationType: string;
  description?: string | null;
  weight: number;
  toEntity?: Entity | null;
  fromEntity?: Entity | null;
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
  lifeThemes?: string[];
  keyMeaningsArr?: string[];
  positiveQualities?: string[];
  shadowQualities?: string[];
  positiveEmotions?: string[];
  negativeEmotions?: string[];
  strengthsArr?: string[];
  weaknessesArr?: string[];
  archetypes?: string[];
}

const API = `${import.meta.env.BASE_URL.replace(/\/$/, "")}/api`;

function apiFetch(path: string, opts?: RequestInit) {
  return fetch(`${API}${path}`, {
    ...opts,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(opts?.headers ?? {}),
    },
  });
}

/* ─── Chip List Editor ─── */

function ChipListEditor({
  label,
  items,
  onChange,
  placeholder = "Добавить...",
  max = 50,
}: {
  label: string;
  items: string[];
  onChange: (items: string[]) => void;
  placeholder?: string;
  max?: number;
}) {
  const [input, setInput] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const addItem = () => {
    const s = input.trim();
    if (!s) return;
    if (items.includes(s)) {
      setInput("");
      return;
    }
    if (items.length >= max) return;
    onChange([...items, s]);
    setInput("");
    inputRef.current?.focus();
  };

  const removeItem = (idx: number) => {
    onChange(items.filter((_, i) => i !== idx));
  };

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex flex-wrap gap-2">
        <AnimatePresence>
          {items.map((item, idx) => (
            <motion.span
              key={`${item}-${idx}`}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-sm bg-primary/10 text-primary border border-primary/20"
            >
              {item}
              <button
                onClick={() => removeItem(idx)}
                className="ml-1 hover:text-destructive transition-colors"
                type="button"
              >
                <XCircle className="w-3.5 h-3.5" />
              </button>
            </motion.span>
          ))}
        </AnimatePresence>
        {items.length < max && (
          <div className="inline-flex items-center gap-1">
            <Input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addItem();
                }
              }}
              placeholder={placeholder}
              className="h-8 w-40 text-sm"
            />
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-2"
              onClick={addItem}
              disabled={!input.trim()}
            >
              <Plus className="w-3.5 h-3.5" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
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
          <Input value={code} onChange={(e) => setCode(e.target.value)} placeholder="venus" disabled={!!entity} />
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
          <Input value={symbol} onChange={(e) => setSymbol(e.target.value)} placeholder="♀" />
        </div>
      </div>
      <div className="flex gap-2 pt-2">
        <Button onClick={() => onSave({ name, code, system, type, symbol: symbol || null })} disabled={!name || !code || !system || !type}>
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
  const textFields: { key: keyof Profile; label: string; placeholder: string }[] = [
    { key: "keyMeanings", label: "Ключевые смыслы (legacy)", placeholder: "Основные семантические значения..." },
    { key: "psychologicalManifestations", label: "Психологические проявления", placeholder: "Как проявляется в психике..." },
    { key: "emotions", label: "Эмоции (legacy)", placeholder: "Какие эмоции порождает..." },
    { key: "strengths", label: "Сильные стороны (legacy)", placeholder: "Позитивные качества..." },
    { key: "weaknesses", label: "Слабые стороны (legacy)", placeholder: "Области для роста..." },
    { key: "recommendations", label: "Рекомендации", placeholder: "Практические советы..." },
    { key: "warnings", label: "Предупреждения", placeholder: "Чего остерегаться..." },
  ];

  const [textValues, setTextValues] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    textFields.forEach((f) => {
      init[f.key] = (profile?.[f.key] as string | null) ?? "";
    });
    return init;
  });

  const [arrValues, setArrValues] = useState<Record<string, string[]>>({
    lifeThemes: profile?.lifeThemes ?? [],
    keyMeaningsArr: profile?.keyMeaningsArr ?? [],
    positiveQualities: profile?.positiveQualities ?? [],
    shadowQualities: profile?.shadowQualities ?? [],
    positiveEmotions: profile?.positiveEmotions ?? [],
    negativeEmotions: profile?.negativeEmotions ?? [],
    strengthsArr: profile?.strengthsArr ?? [],
    weaknessesArr: profile?.weaknessesArr ?? [],
    archetypes: profile?.archetypes ?? [],
  });

  const { toast } = useToast();
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onSaveRef = useRef(onSave);
  onSaveRef.current = onSave;
  const lastSavedSnapshot = useRef<string>("");

  useEffect(() => {
    const init: Record<string, string> = {};
    textFields.forEach((f) => {
      init[f.key] = (profile?.[f.key] as string | null) ?? "";
    });
    const nextArr: Record<string, string[]> = {
      lifeThemes: profile?.lifeThemes ?? [],
      keyMeaningsArr: profile?.keyMeaningsArr ?? [],
      positiveQualities: profile?.positiveQualities ?? [],
      shadowQualities: profile?.shadowQualities ?? [],
      positiveEmotions: profile?.positiveEmotions ?? [],
      negativeEmotions: profile?.negativeEmotions ?? [],
      strengthsArr: profile?.strengthsArr ?? [],
      weaknessesArr: profile?.weaknessesArr ?? [],
      archetypes: profile?.archetypes ?? [],
    };
    setTextValues(init);
    setArrValues(nextArr);
    lastSavedSnapshot.current = JSON.stringify({ text: init, arr: nextArr });
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [profile?.id]);

  useEffect(() => {
    const current = JSON.stringify({ text: textValues, arr: arrValues });
    if (current === lastSavedSnapshot.current) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      const payload: Record<string, unknown> = {};
      textFields.forEach((f) => {
        payload[f.key] = textValues[f.key] || null;
      });
      Object.entries(arrValues).forEach(([k, v]) => {
        payload[k] = v;
      });
      onSaveRef.current(payload);
      lastSavedSnapshot.current = current;
    }, 800);
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [textValues, arrValues]);

  const handleTextChange = (key: string, value: string) => {
    setTextValues((prev) => ({ ...prev, [key]: value }));
  };

  const handleArrChange = (key: string, items: string[]) => {
    setArrValues((prev) => ({ ...prev, [key]: items }));
  };

  const handleManualSave = () => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    const payload: Record<string, unknown> = {};
    textFields.forEach((f) => {
      payload[f.key] = textValues[f.key] || null;
    });
    Object.entries(arrValues).forEach(([k, v]) => {
      payload[k] = v;
    });
    onSaveRef.current(payload);
    lastSavedSnapshot.current = JSON.stringify({ text: textValues, arr: arrValues });
    toast({ title: "Профиль сохранён" });
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4 border rounded-lg p-4 bg-muted/30">
        <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Структурированные списки</h4>
        <ChipListEditor label="Жизненные темы" items={arrValues.lifeThemes} onChange={(v) => handleArrChange("lifeThemes", v)} />
        <ChipListEditor label="Ключевые смыслы (список)" items={arrValues.keyMeaningsArr} onChange={(v) => handleArrChange("keyMeaningsArr", v)} />
        <ChipListEditor label="Позитивные качества" items={arrValues.positiveQualities} onChange={(v) => handleArrChange("positiveQualities", v)} />
        <ChipListEditor label="Теневые качества" items={arrValues.shadowQualities} onChange={(v) => handleArrChange("shadowQualities", v)} />
        <ChipListEditor label="Позитивные эмоции" items={arrValues.positiveEmotions} onChange={(v) => handleArrChange("positiveEmotions", v)} />
        <ChipListEditor label="Негативные эмоции" items={arrValues.negativeEmotions} onChange={(v) => handleArrChange("negativeEmotions", v)} />
        <ChipListEditor label="Силы" items={arrValues.strengthsArr} onChange={(v) => handleArrChange("strengthsArr", v)} />
        <ChipListEditor label="Слабости" items={arrValues.weaknessesArr} onChange={(v) => handleArrChange("weaknessesArr", v)} />
        <ChipListEditor label="Архетипы" items={arrValues.archetypes} onChange={(v) => handleArrChange("archetypes", v)} />
      </div>

      <div className="space-y-4">
        <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Текстовые поля (legacy)</h4>
        {textFields.map((f) => (
          <div key={f.key} className="space-y-1">
            <Label>{f.label}</Label>
            <Textarea
              value={textValues[f.key]}
              onChange={(e) => handleTextChange(f.key, e.target.value)}
              placeholder={f.placeholder}
              rows={3}
            />
          </div>
        ))}
      </div>

      <Button onClick={handleManualSave}>
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
        <Input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="love" disabled={!!theme} />
      </div>
      <div className="space-y-2">
        <Label>Описание</Label>
        <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Описание..." rows={3} />
      </div>
      <div className="flex gap-2 pt-2">
        <Button onClick={() => onSave({ name, slug, description: description || null })} disabled={!name || !slug}>
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
  const available = themes.filter((t) => !existingThemeIds.includes(t.id));
  const [themeId, setThemeId] = useState<number | "">("");
  const [weight, setWeight] = useState("1.0");
  const [polarity, setPolarity] = useState("neutral");

  if (available.length === 0) return <p className="text-sm text-muted-foreground">Все темы уже привязаны.</p>;

  return (
    <div className="flex flex-wrap gap-2 items-end">
      <Select value={themeId ? String(themeId) : ""} onValueChange={(v) => setThemeId(Number(v))}>
        <SelectTrigger className="w-[200px]">
          <SelectValue placeholder="Выберите тему" />
        </SelectTrigger>
        <SelectContent>
          {available.map((t) => (
            <SelectItem key={t.id} value={String(t.id)}>{t.name}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Input value={weight} onChange={(e) => setWeight(e.target.value)} type="number" step="0.1" className="w-24" />
      <Select value={polarity} onValueChange={setPolarity}>
        <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="neutral">нейтральная</SelectItem>
          <SelectItem value="positive">позитивная</SelectItem>
          <SelectItem value="negative">негативная</SelectItem>
        </SelectContent>
      </Select>
      <Button onClick={() => { if (!themeId) return; onAdd(themeId, parseFloat(weight) || 1.0, polarity); setThemeId(""); }} disabled={!themeId}>
        <Plus className="w-4 h-4 mr-1" />Добавить
      </Button>
    </div>
  );
}

/* ─── Add Relation Form ─── */

function AddRelationForm({
  entities,
  excludeEntityId,
  onAdd,
}: {
  entities: Entity[];
  excludeEntityId: number;
  onAdd: (toEntityId: number, relationType: string, description: string, weight: number) => void;
}) {
  const available = entities.filter((e) => e.id !== excludeEntityId);
  const [toId, setToId] = useState<number | "">("");
  const [relationType, setRelationType] = useState("");
  const [description, setDescription] = useState("");
  const [weight, setWeight] = useState("1.0");

  if (available.length === 0) return <p className="text-sm text-muted-foreground">Нет доступных сущностей.</p>;

  return (
    <div className="flex flex-wrap gap-2 items-end">
      <Select value={toId ? String(toId) : ""} onValueChange={(v) => setToId(Number(v))}>
        <SelectTrigger className="w-[200px]">
          <SelectValue placeholder="Связать с..." />
        </SelectTrigger>
        <SelectContent>
          {available.map((e) => (
            <SelectItem key={e.id} value={String(e.id)}>{e.symbol ? `${e.symbol} ` : ""}{e.name}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Input value={relationType} onChange={(e) => setRelationType(e.target.value)} placeholder="Тип связи" className="w-[160px]" />
      <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Описание" className="w-[200px]" />
      <Input value={weight} onChange={(e) => setWeight(e.target.value)} type="number" step="0.1" className="w-20" />
      <Button onClick={() => {
        if (!toId || !relationType.trim()) return;
        onAdd(toId, relationType.trim(), description.trim(), parseFloat(weight) || 1.0);
        setToId(""); setRelationType(""); setDescription(""); setWeight("1.0");
      }} disabled={!toId || !relationType.trim()}>
        <Plus className="w-4 h-4 mr-1" />Связать
      </Button>
    </div>
  );
}

/* ─── Main Page ─── */

export default function AdminStudioPage() {
  const { isLoaded, isSignedIn } = useAuth();
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
  const [detailRelations, setDetailRelations] = useState<{ from: EntityRelation[]; to: EntityRelation[] }>({ from: [], to: [] });
  const [loading, setLoading] = useState(false);
  const cachedAdmin = (() => {
    try {
      return localStorage.getItem("aether_is_admin") === "true";
    } catch {
      return false;
    }
  })();
  const [isAdmin, setIsAdmin] = useState(cachedAdmin);
  const [adminCheckLoading, setAdminCheckLoading] = useState(!cachedAdmin);
  const [reseedLoading, setReseedLoading] = useState(false);

  useEffect(() => {
    if (!isLoaded) return;
    if (!isSignedIn) {
      setIsAdmin(false);
      try { localStorage.setItem("aether_is_admin", "false"); } catch {}
      setAdminCheckLoading(false);
      return;
    }
    apiFetch("/profile")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        const admin = data?.role === "admin";
        setIsAdmin(admin);
        try { localStorage.setItem("aether_is_admin", String(admin)); } catch {}
      })
      .catch(() => {
        setIsAdmin(false);
        try { localStorage.setItem("aether_is_admin", "false"); } catch {}
      })
      .finally(() => setAdminCheckLoading(false));
  }, [isLoaded, isSignedIn]);

  const loadEntities = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch(`/admin/ontology/entities?search=${encodeURIComponent(search)}`);
      if (!res.ok) {
        setEntities([]);
        return;
      }
      const data = await res.json();
      setEntities(data.entities ?? []);
    } finally {
      setLoading(false);
    }
  }, [search]);

  const loadThemes = useCallback(async () => {
    try {
      const res = await apiFetch("/admin/ontology/themes");
      if (!res.ok) {
        setThemes([]);
        return;
      }
      const data = await res.json();
      setThemes(data.themes ?? []);
    } catch {
      setThemes([]);
    }
  }, []);

  const loadDetail = useCallback(async (id: number) => {
    const res = await apiFetch(`/admin/ontology/entities/${id}`);
    const data = await res.json();
    setDetailEntity(data.entity);
    setDetailProfile(data.profile);
    setDetailLinks(data.themes ?? []);
    const relRes = await apiFetch(`/admin/ontology/entities/${id}/relations`);
    if (relRes.ok) {
      const relData = await relRes.json();
      setDetailRelations({ from: relData.from ?? [], to: relData.to ?? [] });
    }
  }, []);

  useEffect(() => {
    loadEntities();
    loadThemes();
  }, [loadEntities, loadThemes]);

  const handleCreateEntity = async (values: Record<string, unknown>) => {
    const res = await apiFetch("/admin/ontology/entities", { method: "POST", body: JSON.stringify(values) });
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
    const res = await apiFetch(`/admin/ontology/entities/${editingEntity.id}`, { method: "PUT", body: JSON.stringify(values) });
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
    if (!confirm("Удалить сущность? Связанный профиль, темы и отношения тоже удалятся.")) return;
    const res = await apiFetch(`/admin/ontology/entities/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const err = await res.json();
      toast({ title: "Ошибка", description: err.error, variant: "destructive" });
      return;
    }
    toast({ title: "Удалено" });
    loadEntities();
  };

  const handleReseed = async () => {
    if (!confirm("Все данные онтологии будут удалены и заново сидированы. Продолжить?")) return;
    setReseedLoading(true);
    try {
      const res = await apiFetch("/admin/ontology/reseed", { method: "POST" });
      if (!res.ok) {
        const err = await res.json();
        toast({ title: "Ошибка", description: err.error, variant: "destructive" });
        return;
      }
      toast({ title: "Онтология пересидирована" });
      loadEntities();
      loadThemes();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Сетевая ошибка";
      toast({ title: "Ошибка", description: msg, variant: "destructive" });
    } finally {
      setReseedLoading(false);
    }
  };

  const handleCreateTheme = async (values: Record<string, unknown>) => {
    const res = await apiFetch("/admin/ontology/themes", { method: "POST", body: JSON.stringify(values) });
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
    const res = await apiFetch(`/admin/ontology/themes/${editingTheme.id}`, { method: "PUT", body: JSON.stringify(values) });
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

  const handleSaveProfile = useCallback(async (values: Record<string, unknown>) => {
    if (!detailEntity) return;
    const res = await apiFetch(`/admin/ontology/entities/${detailEntity.id}/profile`, { method: "PUT", body: JSON.stringify(values) });
    if (!res.ok) {
      const err = await res.json();
      toast({ title: "Ошибка", description: err.error, variant: "destructive" });
      return;
    }
    const updated = await res.json();
    setDetailProfile(updated);
  }, [detailEntity]);

  const handleAddLink = async (themeId: number, weight: number, polarity: string) => {
    if (!detailEntity) return;
    const res = await apiFetch("/admin/ontology/entity-themes", { method: "POST", body: JSON.stringify({ entityId: detailEntity.id, themeId, weight, polarity }) });
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

  const handleAddRelation = async (toEntityId: number, relationType: string, description: string, weight: number) => {
    if (!detailEntity) return;
    const res = await apiFetch("/admin/ontology/entity-relations", {
      method: "POST",
      body: JSON.stringify({ fromEntityId: detailEntity.id, toEntityId, relationType, description, weight }),
    });
    if (!res.ok) {
      const err = await res.json();
      toast({ title: "Ошибка", description: err.error, variant: "destructive" });
      return;
    }
    toast({ title: "Связь добавлена" });
    loadDetail(detailEntity.id);
  };

  const handleDeleteRelation = async (id: number) => {
    if (!confirm("Удалить связь между сущностями?")) return;
    const res = await apiFetch(`/admin/ontology/entity-relations/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const err = await res.json();
      toast({ title: "Ошибка", description: err.error, variant: "destructive" });
      return;
    }
    toast({ title: "Связь удалена" });
    if (detailEntity) loadDetail(detailEntity.id);
  };

  if (adminCheckLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
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
        <div className="flex items-center gap-2">
          {isAdmin && (
            <Button variant="outline" onClick={handleReseed} disabled={reseedLoading}>
              <RefreshCw className={`w-4 h-4 mr-2 ${reseedLoading ? "animate-spin" : ""}`} />
              {reseedLoading ? "Сидинг..." : "Reseed"}
            </Button>
          )}
          <Link href="/dashboard">
            <Button variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Назад
            </Button>
          </Link>
        </div>
      </div>

      <Tabs value={tab} onValueChange={setTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:w-auto">
          <TabsTrigger value="entities"><Layers className="w-4 h-4 mr-2" />Сущности</TabsTrigger>
          <TabsTrigger value="themes"><BookOpen className="w-4 h-4 mr-2" />Жизненные темы</TabsTrigger>
        </TabsList>

        <TabsContent value="entities" className="space-y-6">
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Поиск сущностей..." className="pl-9" />
            </div>
            {isAdmin && (
              <Dialog open={showEntityForm} onOpenChange={setShowEntityForm}>
                <DialogTrigger asChild>
                  <Button><Plus className="w-4 h-4 mr-2" />Сущность</Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg">
                  <DialogHeader><DialogTitle>Новая сущность</DialogTitle></DialogHeader>
                  <EntityForm onSave={handleCreateEntity} onCancel={() => setShowEntityForm(false)} />
                </DialogContent>
              </Dialog>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <AnimatePresence>
              {entities.map((e) => (
                <motion.div key={e.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}>
                  <Card className="cursor-pointer hover:border-primary/40 transition-colors group">
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg font-serif flex items-center gap-2">
                          {e.symbol ? <span className="text-xl">{e.symbol}</span> : <Sparkles className="w-5 h-5 text-primary" />}
                          {e.name}
                        </CardTitle>
                        {isAdmin && (
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button variant="ghost" size="icon" onClick={(ev) => { ev.stopPropagation(); setEditingEntity(e); }}>
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={(ev) => { ev.stopPropagation(); handleDeleteEntity(e.id); }}>
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        )}
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
            <div className="text-center py-20 text-muted-foreground">Нет сущностей. Создайте первую.</div>
          )}
        </TabsContent>

        <TabsContent value="themes" className="space-y-6">
          <div className="flex justify-end">
            {isAdmin && (
              <Dialog open={showThemeForm} onOpenChange={setShowThemeForm}>
                <DialogTrigger asChild>
                  <Button><Plus className="w-4 h-4 mr-2" />Тема</Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg">
                  <DialogHeader><DialogTitle>Новая тема</DialogTitle></DialogHeader>
                  <ThemeForm onSave={handleCreateTheme} onCancel={() => setShowThemeForm(false)} />
                </DialogContent>
              </Dialog>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <AnimatePresence>
              {themes.map((t) => (
                <motion.div key={t.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}>
                  <Card className="group hover:border-primary/40 transition-colors">
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg font-serif">{t.name}</CardTitle>
                        {isAdmin && (
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button variant="ghost" size="icon" onClick={() => setEditingTheme(t)}>
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => handleDeleteTheme(t.id)}>
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <Badge variant="outline" className="font-mono">{t.slug}</Badge>
                      {t.description && <p className="text-sm text-muted-foreground mt-2">{t.description}</p>}
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {themes.length === 0 && (
            <div className="text-center py-20 text-muted-foreground">Нет тем. Создайте первую.</div>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={!!editingEntity} onOpenChange={(v) => !v && setEditingEntity(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Редактирование сущности</DialogTitle></DialogHeader>
          {editingEntity && <EntityForm entity={editingEntity} onSave={handleUpdateEntity} onCancel={() => setEditingEntity(null)} />}
        </DialogContent>
      </Dialog>

      <Dialog open={!!editingTheme} onOpenChange={(v) => !v && setEditingTheme(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Редактирование темы</DialogTitle></DialogHeader>
          {editingTheme && <ThemeForm theme={editingTheme} onSave={handleUpdateTheme} onCancel={() => setEditingTheme(null)} />}
        </DialogContent>
      </Dialog>

      <Dialog open={!!detailEntity} onOpenChange={(v) => !v && setDetailEntity(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="font-serif text-2xl flex items-center gap-2">
              {detailEntity?.symbol ? <span className="text-2xl">{detailEntity.symbol}</span> : <Sparkles className="w-6 h-6 text-primary" />}
              {detailEntity?.name}
              <Badge variant="secondary">{detailEntity?.system}</Badge>
              <Badge variant="outline">{detailEntity?.type}</Badge>
            </DialogTitle>
          </DialogHeader>

          <ScrollArea className="flex-1 pr-4">
            <div className="space-y-8">
              <div>
                <h3 className="text-lg font-medium mb-3 flex items-center gap-2">
                  <BrainCircuit className="w-5 h-5 text-primary" />
                  Семантический профиль
                </h3>
                <ProfileForm profile={detailProfile} onSave={handleSaveProfile} />
              </div>

              <div>
                <h3 className="text-lg font-medium mb-3 flex items-center gap-2">
                  <Layers className="w-5 h-5 text-primary" />
                  Связанные темы
                </h3>
                <div className="space-y-3">
                  {detailLinks.map((link) => (
                    <div key={link.id} className="flex items-center justify-between p-3 rounded-lg border border-border bg-card/50">
                      <div className="flex items-center gap-3">
                        <Badge>{link.theme?.name}</Badge>
                        <span className="text-sm text-muted-foreground">вес: {link.weight}, полярность: {link.polarity}</span>
                      </div>
                      {isAdmin && (
                        <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => handleDeleteLink(link.id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                  {detailLinks.length === 0 && <p className="text-sm text-muted-foreground">Нет связанных тем. Добавьте ниже.</p>}
                  {isAdmin && <AddLinkForm themes={themes} existingThemeIds={detailLinks.map((l) => l.themeId)} onAdd={handleAddLink} />}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium mb-3 flex items-center gap-2">
                  <Link2 className="w-5 h-5 text-primary" />
                  Связи с другими сущностями
                </h3>
                <div className="space-y-3">
                  {detailRelations.from.length === 0 && detailRelations.to.length === 0 && (
                    <p className="text-sm text-muted-foreground">Нет связей с другими сущностями.</p>
                  )}
                  {detailRelations.from.map((r) => (
                    <div key={r.id} className="flex items-center justify-between p-3 rounded-lg border border-border bg-card/50">
                      <div className="flex items-center gap-3">
                        <Badge variant="secondary">{r.relationType}</Badge>
                        <span className="text-sm">→ {r.toEntity?.symbol || ""} {r.toEntity?.name}</span>
                        {r.description && <span className="text-sm text-muted-foreground">{r.description}</span>}
                        <span className="text-xs text-muted-foreground">вес {r.weight}</span>
                      </div>
                      {isAdmin && (
                        <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => handleDeleteRelation(r.id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                  {detailRelations.to.map((r) => (
                    <div key={`to-${r.id}`} className="flex items-center justify-between p-3 rounded-lg border border-border bg-card/50">
                      <div className="flex items-center gap-3">
                        <Badge variant="outline">{r.relationType}</Badge>
                        <span className="text-sm">← {r.fromEntity?.symbol || ""} {r.fromEntity?.name}</span>
                        {r.description && <span className="text-sm text-muted-foreground">{r.description}</span>}
                        <span className="text-xs text-muted-foreground">вес {r.weight}</span>
                      </div>
                      {isAdmin && (
                        <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => handleDeleteRelation(r.id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                  {isAdmin && <AddRelationForm entities={entities} excludeEntityId={detailEntity?.id ?? 0} onAdd={handleAddRelation} />}
                </div>
              </div>
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}
