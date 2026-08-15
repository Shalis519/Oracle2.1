import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "@clerk/react";
import { Link } from "wouter";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
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
  MessageSquareQuote,
  Download,
  Upload,
  AlertTriangle,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { ONTOLOGY_WEIGHTS, WEIGHT_LEVELS, getWeightLabel } from "@workspace/db/weights";
import {
  getGetAdminUserStatisticsQueryKey,
  useGetAdminUserStatistics,
} from "@workspace/api-client-react";
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
  futuristic?: Record<string, unknown> | null;
  keywords?: string[] | null;
}

interface ForecastTextTemplate {
  id: number;
  category: string;
  context: string;
  key: string;
  title: string;
  text: string;
  sourceNote?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

const CINDERELLA_PAIRS = [
  { key: "chiron-venus", label: "Хирон - Венера" },
  { key: "chiron-jupiter", label: "Хирон - Юпитер" },
  { key: "chiron-neptune", label: "Хирон - Нептун" },
  { key: "chiron-sun", label: "Хирон - Солнце" },
  { key: "chiron-pluto", label: "Хирон - Плутон" },
] as const;

const CINDERELLA_MODES = [
  { key: "natal", label: "Натальные Врата Золушки", shortLabel: "Натал" },
  { key: "transit", label: "Транзитные Врата Золушки", shortLabel: "Транзит" },
  { key: "synastry", label: "Врата Золушки в синастрии", shortLabel: "Синастрия" },
] as const;

type CinderellaMode = (typeof CINDERELLA_MODES)[number]["key"];

function getCinderellaPairLabel(pairKey: string) {
  return CINDERELLA_PAIRS.find((pair) => pair.key === pairKey)?.label ?? "Хирон - планета";
}

function getCinderellaModeLabel(mode: CinderellaMode) {
  return CINDERELLA_MODES.find((item) => item.key === mode)?.label ?? mode;
}

function getCinderellaTitle(pairKey: string, mode: CinderellaMode) {
  const pair = getCinderellaPairLabel(pairKey);
  if (mode === "natal") return `${pair}: натальный аспект`;
  if (mode === "transit") return `${pair}: транзит Врат Золушки`;
  return `${pair}: синастрия`;
}

const SYNastryBodies = [
  { key: "sun", label: "Солнце" }, { key: "moon", label: "Луна" },
  { key: "mercury", label: "Меркурий" }, { key: "venus", label: "Венера" },
  { key: "mars", label: "Марс" }, { key: "jupiter", label: "Юпитер" },
  { key: "saturn", label: "Сатурн" }, { key: "uranus", label: "Уран" },
  { key: "neptune", label: "Нептун" }, { key: "pluto", label: "Плутон" },
  { key: "chiron", label: "Хирон" }, { key: "lilith", label: "Лилит" },
] as const;
const SYNastryAspects = [
  { key: "conjunction", label: "соединение" }, { key: "sextile", label: "секстиль" },
  { key: "square", label: "квадрат" }, { key: "trine", label: "тригон" },
  { key: "opposition", label: "оппозиция" },
] as const;
const SYNastryDirections = [
  { key: "neutral", label: "Общая интерпретация" },
  { key: "male-to-female", label: "Мужчина -> женщина" },
  { key: "female-to-male", label: "Женщина -> мужчина" },
  { key: "mutual", label: "Взаимное положение" },
] as const;

interface SynastryInterpretation {
  id: number;
  categoryKey: string;
  sourceBody: string;
  targetBody: string;
  aspectKey: string;
  directionKey: string;
  title: string;
  text: string;
  keywords: string[];
  sourceNote?: string | null;
  isActive: boolean;
  updatedAt: string;
}

interface SynastryHouseInterpretation {
  id: number;
  planetBody: string;
  houseNumber: number;
  directionKey: string;
  title: string;
  text: string;
  sourceNote?: string | null;
  isActive: boolean;
  updatedAt: string;
}

interface CinderellaInterpretation {
  id: number;
  pairKey: string;
  mode: CinderellaMode;
  aspectKey: string;
  title: string;
  text: string;
  keywords: string[];
  sourceNote?: string | null;
  isActive: boolean;
  updatedAt: string;
}

interface LunarInterpretation {
  id: number;
  category: "house" | "sign";
  key: string;
  title: string;
  text: string;
  sourceNote?: string | null;
  isActive: boolean;
  updatedAt: string;
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
  professions?: string[];
  objects?: string[];
  plants?: string[];
  crystals?: string[];
  jewelry?: string[];
  colors?: string[];
  numbers?: string[];
  days?: string[];
  animals?: string[];
  places?: string[];
  materials?: string[];
}

// Oracle Studio always uses the production API service, never the static Web origin.
const API = "https://aether-oracle-api.onrender.com/api";

async function apiFetch(path: string, opts?: RequestInit) {
  const token = await (window as any).Clerk?.session?.getToken();
  return fetch(`${API}${path}`, {
    ...opts,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
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
  const safeItems = Array.isArray(items) ? items : [];

  const addItem = () => {
    const s = input.trim();
    if (!s) return;
    if (safeItems.includes(s)) {
      setInput("");
      return;
    }
    if (safeItems.length >= max) return;
    onChange([...safeItems, s]);
    setInput("");
    inputRef.current?.focus();
  };

  const removeItem = (idx: number) => {
    onChange(safeItems.filter((_, i) => i !== idx));
  };

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex flex-wrap gap-2">
        <AnimatePresence>
          {safeItems.map((item, idx) => (
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
    professions: profile?.professions ?? [],
    objects: profile?.objects ?? [],
    plants: profile?.plants ?? [],
    crystals: profile?.crystals ?? [],
    jewelry: profile?.jewelry ?? [],
    colors: profile?.colors ?? [],
    numbers: profile?.numbers ?? [],
    days: profile?.days ?? [],
    animals: profile?.animals ?? [],
    places: profile?.places ?? [],
    materials: profile?.materials ?? [],
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
      professions: profile?.professions ?? [],
      objects: profile?.objects ?? [],
      plants: profile?.plants ?? [],
      crystals: profile?.crystals ?? [],
      jewelry: profile?.jewelry ?? [],
      colors: profile?.colors ?? [],
      numbers: profile?.numbers ?? [],
      days: profile?.days ?? [],
      animals: profile?.animals ?? [],
      places: profile?.places ?? [],
      materials: profile?.materials ?? [],
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
        <ChipListEditor label="Профессии" items={arrValues.professions} onChange={(v) => handleArrChange("professions", v)} />
        <ChipListEditor label="Предметы" items={arrValues.objects} onChange={(v) => handleArrChange("objects", v)} />
        <ChipListEditor label="Растения" items={arrValues.plants} onChange={(v) => handleArrChange("plants", v)} />
        <ChipListEditor label="Кристаллы" items={arrValues.crystals} onChange={(v) => handleArrChange("crystals", v)} />
        <ChipListEditor label="Украшения" items={arrValues.jewelry} onChange={(v) => handleArrChange("jewelry", v)} />
        <ChipListEditor label="Цвета" items={arrValues.colors} onChange={(v) => handleArrChange("colors", v)} />
        <ChipListEditor label="Числа" items={arrValues.numbers} onChange={(v) => handleArrChange("numbers", v)} />
        <ChipListEditor label="Дни недели" items={arrValues.days} onChange={(v) => handleArrChange("days", v)} />
        <ChipListEditor label="Животные" items={arrValues.animals} onChange={(v) => handleArrChange("animals", v)} />
        <ChipListEditor label="Места" items={arrValues.places} onChange={(v) => handleArrChange("places", v)} />
        <ChipListEditor label="Материалы" items={arrValues.materials} onChange={(v) => handleArrChange("materials", v)} />
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

/* ─── Weight Slider ─── */

function WeightSlider({
  value,
  onChange,
  className,
}: {
  value: number;
  onChange: (v: number) => void;
  className?: string;
}) {
  return (
    <div className={cn("w-[200px] space-y-1", className)}>
      <Slider
        value={[value]}
        onValueChange={(v) => onChange(v[0] ?? ONTOLOGY_WEIGHTS.DEFAULT)}
        min={ONTOLOGY_WEIGHTS.MIN}
        max={ONTOLOGY_WEIGHTS.MAX}
        step={ONTOLOGY_WEIGHTS.STEP}
      />
      <div className="flex justify-between text-xs text-muted-foreground">
        {WEIGHT_LEVELS.map((l) => (
          <span key={l.value}>{l.value}</span>
        ))}
      </div>
      <div className="text-xs text-center font-medium">
        {value.toFixed(1)} — {getWeightLabel(value)}
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
  const [weight, setWeight] = useState<number>(ONTOLOGY_WEIGHTS.DEFAULT);
  const [polarity, setPolarity] = useState("neutral");

  if (available.length === 0) return <p className="text-sm text-muted-foreground">Все темы уже привязаны.</p>;

  return (
    <div className="flex flex-wrap gap-3 items-end">
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
      <WeightSlider value={weight} onChange={setWeight} />
      <Select value={polarity} onValueChange={setPolarity}>
        <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="neutral">нейтральная</SelectItem>
          <SelectItem value="positive">позитивная</SelectItem>
          <SelectItem value="negative">негативная</SelectItem>
        </SelectContent>
      </Select>
      <Button onClick={() => { if (!themeId) return; onAdd(themeId, weight, polarity); setThemeId(""); setWeight(ONTOLOGY_WEIGHTS.DEFAULT); }} disabled={!themeId}>
        <Plus className="w-4 h-4 mr-1" />Добавить
      </Button>
    </div>
  );
}

/* ─── Futuristic Fields Sub-component ─── */

function FuturisticFields({
  futuristic,
  onChange,
  keywordsStr,
  onKeywordsChange,
}: {
  futuristic: Record<string, unknown>;
  onChange: (v: Record<string, unknown>) => void;
  keywordsStr: string;
  onKeywordsChange: (v: string) => void;
}) {
  const archetype = String((futuristic.archetype as string) ?? "");
  const bif = (futuristic.bifurcation as Record<string, string>) ?? {};
  const opp = (futuristic.opportunity as Record<string, string>) ?? {};
  const timer = (futuristic.timer as Record<string, string>) ?? {};
  const beacon = (futuristic.beacon as Record<string, string>) ?? {};

  const setBif = (key: string, val: string) => onChange({ ...futuristic, bifurcation: { ...bif, [key]: val } });
  const setOpp = (val: string) => onChange({ ...futuristic, opportunity: { ...opp, description: val } });
  const setTimer = (val: string) => onChange({ ...futuristic, timer: { ...timer, action: val } });
  const setBeacon = (val: string) => onChange({ ...futuristic, beacon: { ...beacon, question: val } });

  return (
    <Card className="p-3 space-y-3">
      <p className="text-sm font-medium text-muted-foreground">Футурологические данные (опционально)</p>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-xs">Архетип</Label>
          <Input placeholder="Революционерка любви" value={archetype} onChange={(e) => onChange({ ...futuristic, archetype: e.target.value })} className="h-8" />
        </div>
        <div>
          <Label className="text-xs">Keywords (через запятую)</Label>
          <Input placeholder="свобода, революция, любовь" value={keywordsStr} onChange={(e) => onKeywordsChange(e.target.value)} className="h-8" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-xs">Старый паттерн</Label>
          <Input placeholder="старый шаблон в любви" value={bif.oldPattern ?? ""} onChange={(e) => setBif("oldPattern", e.target.value)} className="h-8" />
        </div>
        <div>
          <Label className="text-xs">Новая возможность</Label>
          <Input placeholder="свободное самовыражение" value={bif.newPossibility ?? ""} onChange={(e) => setBif("newPossibility", e.target.value)} className="h-8" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-xs">Комфорт</Label>
          <Input placeholder="привычный круг общения" value={bif.comfort ?? ""} onChange={(e) => setBif("comfort", e.target.value)} className="h-8" />
        </div>
        <div>
          <Label className="text-xs">Свобода</Label>
          <Input placeholder="новые знакомства" value={bif.freedom ?? ""} onChange={(e) => setBif("freedom", e.target.value)} className="h-8" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-xs">Описание возможностей</Label>
          <Input placeholder="в момент неожиданного вдохновения" value={opp.description ?? ""} onChange={(e) => setOpp(e.target.value)} className="h-8" />
        </div>
        <div>
          <Label className="text-xs">Действие для таймера</Label>
          <Input placeholder="сказать да тому, что пугает" value={timer.action ?? ""} onChange={(e) => setTimer(e.target.value)} className="h-8" />
        </div>
      </div>
      <div>
        <Label className="text-xs">Вопрос-маяк</Label>
        <Textarea placeholder="Что бы ты делал, если бы знал, что не можешь провалиться?" value={beacon.question ?? ""} onChange={(e) => setBeacon(e.target.value)} className="min-h-[60px]" />
      </div>
    </Card>
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
  onAdd: (
    toEntityId: number,
    relationType: string,
    description: string,
    weight: number,
    futuristic?: Record<string, unknown> | null,
    keywords?: string[] | null,
  ) => void;
}) {
  const available = entities.filter((e) => e.id !== excludeEntityId);
  const [toId, setToId] = useState<number | "">("");
  const [relationType, setRelationType] = useState("");
  const [description, setDescription] = useState("");
  const [weight, setWeight] = useState<number>(ONTOLOGY_WEIGHTS.DEFAULT);
  const [showFuturistic, setShowFuturistic] = useState(false);
  const [futuristic, setFuturistic] = useState<Record<string, unknown>>({});
  const [keywordsStr, setKeywordsStr] = useState("");

  if (available.length === 0) return <p className="text-sm text-muted-foreground">Нет доступных сущностей.</p>;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-3 items-end">
        <Select value={toId ? String(toId) : ""} onValueChange={(v) => setToId(Number(v))}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Связать с..." />
          </SelectTrigger>
          <SelectContent position="popper" side="bottom" sideOffset={4} className="max-h-60 overflow-y-auto z-[100]">
            {available.map((e) => (
              <SelectItem key={e.id} value={String(e.id)}>{e.symbol ? `${e.symbol} ` : ""}{e.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input value={relationType} onChange={(e) => setRelationType(e.target.value)} placeholder="Тип связи" className="w-[160px]" />
        <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Описание" className="w-[200px]" />
        <WeightSlider value={weight} onChange={setWeight} />
        <Button variant="ghost" size="sm" onClick={() => setShowFuturistic((v) => !v)}>
          {showFuturistic ? <X className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
          {showFuturistic ? "Скрыть" : "Футурология"}
        </Button>
        <Button onClick={() => {
          if (!toId || !relationType.trim()) return;
          const kw = keywordsStr.split(",").map((k) => k.trim()).filter(Boolean);
          onAdd(toId, relationType.trim(), description.trim(), weight, showFuturistic ? futuristic : null, kw.length > 0 ? kw : null);
          setToId(""); setRelationType(""); setDescription(""); setWeight(ONTOLOGY_WEIGHTS.DEFAULT);
          setShowFuturistic(false); setFuturistic({}); setKeywordsStr("");
        }} disabled={!toId || !relationType.trim()}>
          <Plus className="w-4 h-4 mr-1" />Связать
        </Button>
      </div>
      {showFuturistic && (
        <FuturisticFields futuristic={futuristic} onChange={setFuturistic} keywordsStr={keywordsStr} onKeywordsChange={setKeywordsStr} />
      )}
    </div>
  );
}

/* ─── Relation Row (inline edit) ─── */

function RelationRow({
  relation,
  direction,
  isAdmin,
  onSave,
  onDelete,
}: {
  relation: EntityRelation;
  direction: "from" | "to";
  isAdmin: boolean;
  onSave: (id: number, relationType: string, description: string, weight: number) => void;
  onDelete: (id: number) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [type, setType] = useState(relation.relationType);
  const [desc, setDesc] = useState(relation.description ?? "");
  const [w, setW] = useState(relation.weight);

  if (editing) {
    return (
      <div className="flex flex-wrap gap-2 items-end p-3 rounded-lg border border-border bg-card/50">
        <Badge variant={direction === "from" ? "secondary" : "outline"}>{direction === "from" ? "\u2192" : "\u2190"}</Badge>
        <Input value={type} onChange={(e) => setType(e.target.value)} placeholder="Тип связи" className="w-[140px] h-8" />
        <Input value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Описание" className="w-[200px] h-8" />
        <WeightSlider value={w} onChange={setW} className="w-[160px]" />
        <Button size="sm" variant="ghost" onClick={() => { onSave(relation.id, type, desc, w); setEditing(false); }}>
          <Save className="w-4 h-4" />
        </Button>
        <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>
          <X className="w-4 h-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-card/50">
      <div className="flex items-center gap-3">
        <Badge variant={direction === "from" ? "secondary" : "outline"}>{relation.relationType}</Badge>
        <span className="text-sm">{direction === "from" ? "\u2192" : "\u2190"} {relation.toEntity?.symbol || relation.fromEntity?.symbol || ""} {direction === "from" ? relation.toEntity?.name : relation.fromEntity?.name}</span>
        {relation.description && <span className="text-sm text-muted-foreground">{relation.description}</span>}
        <span className="text-xs text-muted-foreground">вес {relation.weight}</span>
      </div>
      {isAdmin && (
        <div className="flex gap-1">
          <Button variant="ghost" size="sm" onClick={() => setEditing(true)}>
            <Pencil className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => onDelete(relation.id)}>
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      )}
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
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminCheckLoading, setAdminCheckLoading] = useState(true);
  const [reseedLoading, setReseedLoading] = useState(false);
  const [secretCode, setSecretCode] = useState("");
  const [gateError, setGateError] = useState("");
  const [gateLoading, setGateLoading] = useState(false);
  const { data: userStatistics } = useGetAdminUserStatistics({
    query: {
      queryKey: getGetAdminUserStatisticsQueryKey(),
      enabled: isAdmin,
      refetchInterval: 60_000,
    },
  });

  // Motivation phrases state
  const [phrases, setPhrases] = useState<{ id: string; phrase: string; isActive: boolean }[]>([]);
  const [phraseInput, setPhraseInput] = useState("");
  const [phraseLoading, setPhraseLoading] = useState(false);

  // Backup / import state
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importMode, setImportMode] = useState<"replace" | "merge">("merge");
  const [importLoading, setImportLoading] = useState(false);
  const [importError, setImportError] = useState("");
  const [importConfirmOpen, setImportConfirmOpen] = useState(false);

  const [cinderella, setCinderella] = useState<CinderellaInterpretation[]>([]);
  const [cinderellaLoading, setCinderellaLoading] = useState(false);
  const [cinderellaSaving, setCinderellaSaving] = useState(false);
  const [editingCinderella, setEditingCinderella] = useState<CinderellaInterpretation | null>(null);
  const [cinderellaForm, setCinderellaForm] = useState({ pairKey: "chiron-venus", mode: "natal" as CinderellaMode, aspectKey: "any", title: getCinderellaTitle("chiron-venus", "natal"), text: "В разработке", sourceNote: "Врата Золушки - презентация", isActive: true });
  const [cinderellaEditorOpen, setCinderellaEditorOpen] = useState(false);
  const [synastryInterpretations, setSynastryInterpretations] = useState<SynastryInterpretation[]>([]);
  const [synastryLoading, setSynastryLoading] = useState(false);
  const [synastrySaving, setSynastrySaving] = useState(false);
  const [editingSynastry, setEditingSynastry] = useState<SynastryInterpretation | null>(null);
  const [synastryEditorOpen, setSynastryEditorOpen] = useState(false);
  const [synastryForm, setSynastryForm] = useState({ categoryKey: "general", sourceBody: "sun", targetBody: "moon", aspectKey: "conjunction", directionKey: "neutral", text: "В разработке", sourceNote: "", isActive: true });
  const [synastryHouseInterpretations, setSynastryHouseInterpretations] = useState<SynastryHouseInterpretation[]>([]);
  const [synastryHouseLoading, setSynastryHouseLoading] = useState(false);
  const [synastryHouseSaving, setSynastryHouseSaving] = useState(false);
  const [editingSynastryHouse, setEditingSynastryHouse] = useState<SynastryHouseInterpretation | null>(null);
  const [synastryHouseEditorOpen, setSynastryHouseEditorOpen] = useState(false);
  const [synastryHouseForm, setSynastryHouseForm] = useState({ planetBody: "sun", houseNumber: 1, directionKey: "neutral", text: "В разработке", sourceNote: "", isActive: true });
  const [lunarInterpretations, setLunarInterpretations] = useState<LunarInterpretation[]>([]);
  const [lunarLoading, setLunarLoading] = useState(false);
  const [lunarSaving, setLunarSaving] = useState(false);
  const [editingLunar, setEditingLunar] = useState<LunarInterpretation | null>(null);
  const [lunarEditorOpen, setLunarEditorOpen] = useState(false);
  const [lunarForm, setLunarForm] = useState({ category: "house" as "house" | "sign", key: "1", title: "1-й дом лунара", text: "В разработке", sourceNote: "", isActive: true });
  const [forecastTemplates, setForecastTemplates] = useState<ForecastTextTemplate[]>([]);
  const [forecastTemplatesLoading, setForecastTemplatesLoading] = useState(false);
  const [forecastTemplatesSaving, setForecastTemplatesSaving] = useState(false);
  const [editingForecastTemplate, setEditingForecastTemplate] = useState<ForecastTextTemplate | null>(null);
  const [forecastTemplateEditorOpen, setForecastTemplateEditorOpen] = useState(false);
  const [forecastTemplateForm, setForecastTemplateForm] = useState({ category: "entity", context: "transit", key: "mercury", title: "Меркурий в транзитном контексте", text: "В разработке", sourceNote: "", isActive: true });

  useEffect(() => {
    if (!isLoaded) return;
    if (!isSignedIn) {
      setIsAdmin(false);
      try { localStorage.setItem("aether_is_admin", "false"); } catch {}
      setAdminCheckLoading(false);
      return;
    }
       apiFetch("/profile")
      .then((res) => {
        if (!res.ok) throw new Error("Not ok");
        return res.json();
      })
      .then((data: any) => {
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
    loadPhrases();
    loadCinderella();
    loadSynastryInterpretations();
    loadSynastryHouseInterpretations();
    loadLunarInterpretations();
    loadForecastTemplates();
  }, [loadEntities, loadThemes]);

  const loadPhrases = useCallback(async () => {
    try {
      const res = await apiFetch("/admin/motivation-phrases");
      if (!res.ok) { setPhrases([]); return; }
      const data = await res.json();
      setPhrases(Array.isArray(data) ? data : []);
    } catch { setPhrases([]); }
  }, []);

  const loadSynastryInterpretations = useCallback(async () => {
    setSynastryLoading(true);
    try {
      const res = await apiFetch("/admin/synastry-interpretations");
      const data = await res.json();
      setSynastryInterpretations(res.ok ? (data.interpretations ?? []) : []);
    } catch { setSynastryInterpretations([]); }
    finally { setSynastryLoading(false); }
  }, []);

  const saveSynastryInterpretation = async () => {
    setSynastrySaving(true);
    try {
      const path = editingSynastry ? `/admin/synastry-interpretations/${editingSynastry.id}` : "/admin/synastry-interpretations";
      const method = editingSynastry ? "PUT" : "POST";
      const payload = editingSynastry
        ? { text: synastryForm.text, sourceNote: synastryForm.sourceNote, isActive: synastryForm.isActive }
        : synastryForm;
      const res = await apiFetch(path, { method, body: JSON.stringify(payload) });
      if (!res.ok) { const err = await res.json(); toast({ title: "Ошибка сохранения", description: err.error, variant: "destructive" }); return; }
      setSynastryEditorOpen(false); setEditingSynastry(null); await loadSynastryInterpretations();
      toast({ title: "Интерпретация синастрии сохранена" });
    } finally { setSynastrySaving(false); }
  };

  const deleteSynastryInterpretation = async (id: number) => {
    if (!confirm("Удалить интерпретацию?")) return;
    const res = await apiFetch(`/admin/synastry-interpretations/${id}`, { method: "DELETE" });
    if (res.ok) { await loadSynastryInterpretations(); toast({ title: "Интерпретация удалена" }); }
  };

  const loadSynastryHouseInterpretations = useCallback(async () => {
    setSynastryHouseLoading(true);
    try {
      const res = await apiFetch("/admin/synastry-house-interpretations");
      const data = await res.json();
      setSynastryHouseInterpretations(res.ok ? (data.interpretations ?? []) : []);
    } catch { setSynastryHouseInterpretations([]); }
    finally { setSynastryHouseLoading(false); }
  }, []);

  const saveSynastryHouseInterpretation = async () => {
    setSynastryHouseSaving(true);
    try {
      const path = editingSynastryHouse ? `/admin/synastry-house-interpretations/${editingSynastryHouse.id}` : "/admin/synastry-house-interpretations";
      const res = await apiFetch(path, {
        method: editingSynastryHouse ? "PUT" : "POST",
        body: JSON.stringify(editingSynastryHouse ? { text: synastryHouseForm.text, sourceNote: synastryHouseForm.sourceNote, isActive: synastryHouseForm.isActive } : synastryHouseForm),
      });
      if (!res.ok) { const err = await res.json(); toast({ title: "Ошибка сохранения", description: err.error, variant: "destructive" }); return; }
      setSynastryHouseEditorOpen(false); setEditingSynastryHouse(null); await loadSynastryHouseInterpretations();
      toast({ title: "Интерпретация планеты в доме сохранена" });
    } finally { setSynastryHouseSaving(false); }
  };

  const deleteSynastryHouseInterpretation = async (id: number) => {
    if (!confirm("Удалить интерпретацию положения в доме?")) return;
    const res = await apiFetch(`/admin/synastry-house-interpretations/${id}`, { method: "DELETE" });
    if (res.ok) { await loadSynastryHouseInterpretations(); toast({ title: "Интерпретация удалена" }); }
  };

  const loadLunarInterpretations = useCallback(async () => {
    setLunarLoading(true);
    try {
      const res = await apiFetch("/admin/lunar-interpretations");
      const data = await res.json();
      setLunarInterpretations(res.ok ? (data.interpretations ?? []) : []);
    } catch { setLunarInterpretations([]); }
    finally { setLunarLoading(false); }
  }, []);

  const saveLunarInterpretation = async () => {
    setLunarSaving(true);
    try {
      const path = editingLunar ? `/admin/lunar-interpretations/${editingLunar.id}` : "/admin/lunar-interpretations";
      const payload = editingLunar
        ? { text: lunarForm.text, sourceNote: lunarForm.sourceNote, isActive: lunarForm.isActive, title: lunarForm.title }
        : lunarForm;
      const res = await apiFetch(path, { method: editingLunar ? "PUT" : "POST", body: JSON.stringify(payload) });
      if (!res.ok) { const err = await res.json(); toast({ title: "Ошибка сохранения", description: err.error, variant: "destructive" }); return; }
      setLunarEditorOpen(false);
      setEditingLunar(null);
      await loadLunarInterpretations();
      toast({ title: "Рекомендация лунара сохранена" });
    } finally { setLunarSaving(false); }
  };

  const deleteLunarInterpretation = async (id: number) => {
    if (!confirm("Удалить запись лунара?")) return;
    const res = await apiFetch(`/admin/lunar-interpretations/${id}`, { method: "DELETE" });
    if (res.ok) { await loadLunarInterpretations(); toast({ title: "Запись лунара удалена" }); }
  };

  const getLunarSignLabel = (key: string) => ({ aries: "Овен", taurus: "Телец", gemini: "Близнецы", cancer: "Рак", leo: "Лев", virgo: "Дева", libra: "Весы", scorpio: "Скорпион", sagittarius: "Стрелец", capricorn: "Козерог", aquarius: "Водолей", pisces: "Рыбы" } as Record<string, string>)[key] ?? key;
  const loadForecastTemplates = useCallback(async () => {
    setForecastTemplatesLoading(true);
    try {
      const res = await apiFetch("/admin/forecast-text-templates");
      const data = await res.json();
      setForecastTemplates(res.ok ? (data.templates ?? []) : []);
    } catch { setForecastTemplates([]); }
    finally { setForecastTemplatesLoading(false); }
  }, []);
  const saveForecastTemplate = async () => {
    setForecastTemplatesSaving(true);
    try {
      const path = editingForecastTemplate ? `/admin/forecast-text-templates/${editingForecastTemplate.id}` : "/admin/forecast-text-templates";
      const payload = editingForecastTemplate
        ? { text: forecastTemplateForm.text, sourceNote: forecastTemplateForm.sourceNote, isActive: forecastTemplateForm.isActive, title: forecastTemplateForm.title }
        : forecastTemplateForm;
      const res = await apiFetch(path, { method: editingForecastTemplate ? "PUT" : "POST", body: JSON.stringify(payload) });
      if (!res.ok) { const err = await res.json(); toast({ title: "Ошибка сохранения", description: err.error, variant: "destructive" }); return; }
      setForecastTemplateEditorOpen(false);
      setEditingForecastTemplate(null);
      await loadForecastTemplates();
      toast({ title: "Шаблон прогноза сохранён" });
    } finally { setForecastTemplatesSaving(false); }
  };
  const deleteForecastTemplate = async (id: number) => {
    if (!confirm("Удалить шаблон прогноза?")) return;
    const res = await apiFetch(`/admin/forecast-text-templates/${id}`, { method: "DELETE" });
    if (res.ok) { await loadForecastTemplates(); toast({ title: "Шаблон прогноза удалён" }); }
  };
  const forecastCategoryLabel = (category: string) => ({ entity: "Сущность", aspect: "Аспект", house: "Дом", composition: "Сборка" } as Record<string, string>)[category] ?? category;
  const forecastContextLabel = (context: string) => ({ transit: "Транзит", natal: "Натал", square: "Квадрат", trine: "Тригон", opposition: "Оппозиция", conjunction: "Соединение" } as Record<string, string>)[context] ?? context;
  const getSynastryBodyLabel = (key: string) => SYNastryBodies.find((item) => item.key === key)?.label ?? key;
  const getSynastryAspectLabel = (key: string) => SYNastryAspects.find((item) => item.key === key)?.label ?? key;
  const getSynastryDirectionLabel = (key: string) => SYNastryDirections.find((item) => item.key === key)?.label ?? key;

  const loadCinderella = useCallback(async () => {
    setCinderellaLoading(true);
    try {
      const res = await apiFetch("/admin/cinderella-interpretations");
      const data = await res.json();
      setCinderella(res.ok ? (data.interpretations ?? []) : []);
    } catch {
      setCinderella([]);
    } finally {
      setCinderellaLoading(false);
    }
  }, []);

  const saveCinderella = async () => {
    if (!cinderellaForm.title.trim()) {
      toast({ title: "Укажите название", variant: "destructive" });
      return;
    }
    setCinderellaSaving(true);
    try {
      const path = editingCinderella
        ? `/admin/cinderella-interpretations/${editingCinderella.id}`
        : "/admin/cinderella-interpretations";
      const res = await apiFetch(path, {
        method: editingCinderella ? "PUT" : "POST",
        body: JSON.stringify(cinderellaForm),
      });
      if (!res.ok) {
        const err = await res.json();
        toast({ title: "Ошибка сохранения", description: err.error, variant: "destructive" });
        return;
      }
      setEditingCinderella(null);
      setCinderellaEditorOpen(false);
      setCinderellaForm({ pairKey: "chiron-venus", mode: "natal", aspectKey: "any", title: getCinderellaTitle("chiron-venus", "natal"), text: "В разработке", sourceNote: "Врата Золушки - презентация", isActive: true });
      await loadCinderella();
      toast({ title: "Интерпретация сохранена" });
    } finally {
      setCinderellaSaving(false);
    }
  };

  const deleteCinderella = async (id: number) => {
    if (!confirm("Удалить интерпретацию?")) return;
    const res = await apiFetch(`/admin/cinderella-interpretations/${id}`, { method: "DELETE" });
    if (res.ok) { await loadCinderella(); toast({ title: "Интерпретация удалена" }); }
  };

  const handleAddPhrase = async () => {
    const text = phraseInput.trim();
    if (!text || text.length < 3) {
      toast({ title: "Фраза слишком короткая", variant: "destructive" });
      return;
    }
    setPhraseLoading(true);
    try {
      const res = await apiFetch("/admin/motivation-phrases", { method: "POST", body: JSON.stringify({ phrase: text }) });
      if (!res.ok) throw new Error("Failed");
      setPhraseInput("");
      await loadPhrases();
      toast({ title: "Фраза добавлена" });
    } catch {
      toast({ title: "Ошибка", variant: "destructive" });
    } finally { setPhraseLoading(false); }
  };

  const handleTogglePhrase = async (id: string) => {
    const res = await apiFetch(`/admin/motivation-phrases/${id}/toggle`, { method: "PATCH" });
    if (res.ok) {
      await loadPhrases();
    } else {
      toast({ title: "Ошибка", variant: "destructive" });
    }
  };

  const handleDeletePhrase = async (id: string) => {
    const res = await apiFetch(`/admin/motivation-phrases/${id}`, { method: "DELETE" });
    if (res.ok) {
      await loadPhrases();
      toast({ title: "Фраза удалена" });
    } else {
      toast({ title: "Ошибка", variant: "destructive" });
    }
  };

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

  const handleExport = async () => {
    try {
      const res = await apiFetch("/admin/ontology/export");
      if (!res.ok) {
        const err = await res.json();
        toast({ title: "Ошибка экспорта", description: err.error, variant: "destructive" });
        return;
      }
      const json = await res.json();
      const blob = new Blob([JSON.stringify(json.data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const date = new Date().toISOString().slice(0, 10);
      a.href = url;
      a.download = `aether-ontology-${date}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast({ title: "Экспорт завершён" });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Сетевая ошибка";
      toast({ title: "Ошибка экспорта", description: msg, variant: "destructive" });
    }
  };

  const handleImport = async () => {
    if (!importFile) return;
    setImportLoading(true);
    setImportError("");
    try {
      const text = await importFile.text();
      const data = JSON.parse(text);
      const res = await apiFetch("/admin/ontology/import", {
        method: "POST",
        body: JSON.stringify({ mode: importMode, data }),
      });
      if (!res.ok) {
        const err = await res.json();
        const details = err.details ? (Array.isArray(err.details) ? err.details.join("; ") : String(err.details)) : "";
        setImportError(err.error + (details ? `: ${details}` : ""));
        return;
      }
      toast({ title: `Импорт (${importMode}) завершён` });
      loadEntities();
      loadThemes();
      loadPhrases();
      loadLunarInterpretations();
      setImportFile(null);
      setImportConfirmOpen(false);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Ошибка чтения файла";
      setImportError(msg);
    } finally {
      setImportLoading(false);
    }
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

  const handleAddRelation = async (
    toEntityId: number,
    relationType: string,
    description: string,
    weight: number,
    futuristic?: Record<string, unknown> | null,
    keywords?: string[] | null,
  ) => {
    if (!detailEntity) return;
    const res = await apiFetch("/admin/ontology/entity-relations", {
      method: "POST",
      body: JSON.stringify({
        fromEntityId: detailEntity.id,
        toEntityId,
        relationType,
        description,
        weight,
        futuristic: futuristic ?? undefined,
        keywords: keywords ?? undefined,
      }),
    });
    if (!res.ok) {
      const err = await res.json();
      toast({ title: "Ошибка", description: err.error, variant: "destructive" });
      return;
    }
    toast({ title: "Связь добавлена" });
    loadDetail(detailEntity.id);
  };

  const handleUpdateRelation = async (id: number, relationType: string, description: string, weight: number) => {
    const res = await apiFetch(`/admin/ontology/entity-relations/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ relationType, description: description || null, weight }),
    });
    if (!res.ok) {
      const err = await res.json();
      toast({ title: "Ошибка", description: err.error, variant: "destructive" });
      return;
    }
    toast({ title: "Связь обновлена" });
    if (detailEntity) loadDetail(detailEntity.id);
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

  if (!isAdmin) {
    return (
      <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center">
        <div className="bg-background border shadow-lg rounded-lg p-6 w-full max-w-sm space-y-4">
          <h2 className="text-lg font-serif font-semibold text-center">Доступ к Oracle Studio</h2>
          <Input
            type="password"
            placeholder="Код админа"
            value={secretCode}
            onChange={(e) => setSecretCode(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") document.getElementById("gate-btn")?.click(); }}
            disabled={gateLoading}
          />
          {gateError && <p className="text-sm text-destructive">{gateError}</p>}
          <Button
            id="gate-btn"
            className="w-full"
            disabled={!secretCode.trim() || gateLoading}
                       onClick={async () => {
              setGateError("");
              setGateLoading(true);
              try {
              const res = await apiFetch("/profile/make-admin", {
                  method: "POST",
                  body: JSON.stringify({ secret: secretCode.trim() }),
                });
                setGateLoading(false);
                if (!res.ok) {
                  setGateError("Неверный код админа");
                  return;
                }
                const data = await res.json();
                if (data?.role === "admin") {
                  setIsAdmin(true);
                  try { localStorage.setItem("aether_is_admin", "true"); } catch {}
                } else {
                  setGateError("Неверный код админа");
                }
              } catch (err: any) {
                setGateLoading(false);
                setGateError(err?.message || "Неверный код админа");
              }
            }}
          >
            {gateLoading ? "Проверка..." : "Войти"}
          </Button>
        </div>
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

      {isAdmin && (
        <Card className="max-w-xs">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Зарегистрированные пользователи</p>
            <p className="text-2xl font-semibold mt-1">
              {userStatistics?.registeredUsers ?? "—"}
            </p>
          </CardContent>
        </Card>
      )}

      <Tabs value={tab} onValueChange={setTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-8 md:w-auto">
          <TabsTrigger value="entities"><Layers className="w-4 h-4 mr-2" />Сущности</TabsTrigger>
          <TabsTrigger value="themes"><BookOpen className="w-4 h-4 mr-2" />Жизненные темы</TabsTrigger>
          <TabsTrigger value="phrases"><MessageSquareQuote className="w-4 h-4 mr-2" />Фразы</TabsTrigger>
          <TabsTrigger value="backup"><Download className="w-4 h-4 mr-2" />Бэкап</TabsTrigger>
          <TabsTrigger value="cinderella"><Sparkles className="w-4 h-4 mr-2" />Врата Золушки</TabsTrigger>
          <TabsTrigger value="synastry"><Link2 className="w-4 h-4 mr-2" />Общая синастрия</TabsTrigger>
          <TabsTrigger value="lunar"><span className="mr-2">☾</span>Лунар</TabsTrigger>
          <TabsTrigger value="forecastTemplates"><BrainCircuit className="w-4 h-4 mr-2" />Шаблоны прогноза</TabsTrigger>
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

          {(() => {
            const typeOrder = ["planet", "sign", "house", "aspect", "arcana"] as const;
            const typeLabels: Record<string, string> = {
              planet: "Планеты",
              sign: "Знаки зодиака",
              house: "Дома",
              aspect: "Аспекты",
              arcana: "Арканы",
            };
            const q = search.trim().toLowerCase();
            const filtered = q
              ? entities.filter((e) =>
                  e.name.toLowerCase().includes(q) ||
                  e.code.toLowerCase().includes(q) ||
                  e.type.toLowerCase().includes(q)
                )
              : entities;
            const byType = new Map<string, Entity[]>();
            for (const t of typeOrder) byType.set(t, []);
            for (const e of filtered) {
              const arr = byType.get(e.type) ?? [];
              arr.push(e);
              byType.set(e.type, arr);
            }
            return (
              <div className="space-y-8">
                {typeOrder.map((type) => {
                  const list = byType.get(type) ?? [];
                  if (list.length === 0) return null;
                  return (
                    <div key={type}>
                      <h3 className="text-lg font-serif font-semibold mb-3 flex items-center gap-2">
                        <Badge variant="secondary">{typeLabels[type] ?? type}</Badge>
                        <span className="text-sm font-normal text-muted-foreground">({list.length})</span>
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <AnimatePresence>
                          {list.map((e) => (
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
                                    <Badge variant="outline">{e.type}</Badge>
                                    <Badge variant="outline" className="font-mono">{e.code}</Badge>
                                  </div>
                                  <p className="text-xs text-muted-foreground mt-2">Кликните для профиля и связей</p>
                                </CardContent>
                              </Card>
                            </motion.div>
                          ))}
                        </AnimatePresence>
                      </div>
                    </div>
                  );
                })}
                {filtered.length === 0 && !loading && (
                  <div className="text-center py-20 text-muted-foreground">Ничего не найдено.</div>
                )}
              </div>
            );
          })()}
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

        <TabsContent value="phrases" className="space-y-6">
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Input
                value={phraseInput}
                onChange={(e) => setPhraseInput(e.target.value)}
                placeholder="Новая мотивационная фраза..."
                onKeyDown={(e) => { if (e.key === "Enter") handleAddPhrase(); }}
              />
            </div>
            <Button onClick={handleAddPhrase} disabled={phraseLoading || !phraseInput.trim()}>
              <Plus className="w-4 h-4 mr-2" />Добавить
            </Button>
          </div>

          <div className="space-y-3">
            <AnimatePresence>
              {phrases.map((p) => (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <Card className="bg-card/50 border-border">
                    <CardContent className="py-3 px-4 flex items-center justify-between gap-4">
                      <span className={p.isActive ? "" : "text-muted-foreground line-through"}>{p.phrase}</span>
                      <div className="flex items-center gap-2 shrink-0">
                        <label className="flex items-center gap-1.5 text-sm cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={p.isActive}
                            onChange={() => handleTogglePhrase(p.id)}
                            className="accent-primary"
                          />
                          Активна
                        </label>
                        <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => handleDeletePhrase(p.id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {phrases.length === 0 && (
            <div className="text-center py-20 text-muted-foreground">Нет фраз. Добавьте первую.</div>
          )}
        </TabsContent>

        <TabsContent value="cinderella" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Врата Золушки</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Здесь хранятся отдельные интерпретации для натальной карты, транзитов и синастрии. Формула поддерживает только пять фиксированных аспектов от Хирона к планете: Хирон - Венера, Хирон - Юпитер, Хирон - Нептун, Хирон - Солнце и Хирон - Плутон. Если текст ещё не заполнен, отображается «В разработке».
              </p>
            </CardContent>
          </Card>

          {CINDERELLA_MODES.map((mode) => {
            const modeItems = cinderella.filter((item) => item.mode === mode.key);
            return (
              <Card key={mode.key}>
                <CardHeader>
                  <CardTitle>{mode.label}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {cinderellaLoading ? (
                    <p className="text-sm text-muted-foreground">Загрузка...</p>
                  ) : (
                    CINDERELLA_PAIRS.map((pair) => {
                      const item = modeItems.find((candidate) => candidate.pairKey === pair.key && candidate.aspectKey === "any");
                      const text = item?.text?.trim() || "В разработке";
                      return (
                        <div key={`${mode.key}-${pair.key}`} className="rounded-lg border border-border p-4 space-y-3">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="font-medium">{getCinderellaTitle(pair.key, mode.key)}</p>
                              <p className="text-xs text-muted-foreground">Аспект: соединение, тригон или квинконс по действующей формуле</p>
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setEditingCinderella(item ?? null);
                                setCinderellaForm({
                                  pairKey: pair.key,
                                  mode: mode.key,
                                  aspectKey: "any",
                                  title: getCinderellaTitle(pair.key, mode.key),
                                  text,
                                  sourceNote: item?.sourceNote ?? "Врата Золушки - презентация",
                                  isActive: item?.isActive ?? true,
                                });
                                setCinderellaEditorOpen(true);
                              }}
                            >
                              {item ? "Изменить" : "Заполнить"}
                            </Button>
                          </div>
                          <p className={cn("whitespace-pre-wrap text-sm", !item || !item.text?.trim() ? "text-amber-200" : "text-muted-foreground")}>
                            {text}
                          </p>
                        </div>
                      );
                    })
                  )}
                </CardContent>
              </Card>
            );
          })}

          <Dialog open={cinderellaEditorOpen} onOpenChange={(open) => { setCinderellaEditorOpen(open); if (!open) setEditingCinderella(null); }}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>{getCinderellaTitle(cinderellaForm.pairKey, cinderellaForm.mode)}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="rounded-md border border-border bg-muted/30 p-3 text-sm text-muted-foreground">
                  Режим: {getCinderellaModeLabel(cinderellaForm.mode)}. Аспект фиксирован формулой проекта и не редактируется.
                </div>
                <div>
                  <Label>Интерпретация</Label>
                  <Textarea value={cinderellaForm.text} onChange={(e) => setCinderellaForm((form) => ({ ...form, text: e.target.value }))} rows={12} />
                </div>
                <div>
                  <Label>Источник</Label>
                  <Input value={cinderellaForm.sourceNote} onChange={(e) => setCinderellaForm((form) => ({ ...form, sourceNote: e.target.value }))} />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => { setCinderellaEditorOpen(false); setEditingCinderella(null); }}>Отмена</Button>
                  <Button onClick={saveCinderella} disabled={cinderellaSaving}>{cinderellaSaving ? "Сохранение..." : "Сохранить"}</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </TabsContent>
        <TabsContent value="synastry" className="space-y-6">
          <Card>
            <CardHeader><CardTitle>Общая синастрия</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">Здесь редактируются интерпретации межпланетных аспектов в синастрии. Планеты и аспекты фиксированы формулой проекта, а тексты можно менять в любое время.</p>
              <div className="rounded-md border border-border bg-muted/30 p-3 text-sm text-muted-foreground">Орбисы: соединение 3,72°, секстиль 0,61°, квадрат 0,93°, тригон 1,23°, оппозиция 2,85°. Пустые тексты отображаются пользователю как «В разработке».</div>
              <Button onClick={() => { setEditingSynastry(null); setSynastryForm({ categoryKey: "general", sourceBody: "sun", targetBody: "moon", aspectKey: "conjunction", directionKey: "neutral", text: "В разработке", sourceNote: "", isActive: true }); setSynastryEditorOpen(true); }}><Plus className="w-4 h-4 mr-2" />Добавить интерпретацию</Button>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6 space-y-3">
              {synastryLoading ? <p className="text-sm text-muted-foreground">Загрузка...</p> : synastryInterpretations.length === 0 ? <p className="text-sm text-muted-foreground">Записей пока нет. Добавьте первую интерпретацию.</p> : synastryInterpretations.map((item) => (
                <div key={item.id} className="rounded-lg border border-border p-4 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium">{getSynastryBodyLabel(item.sourceBody)} - {getSynastryBodyLabel(item.targetBody)}, {getSynastryAspectLabel(item.aspectKey)}</p>
                      <p className="text-xs text-muted-foreground">{getSynastryDirectionLabel(item.directionKey)} · {item.categoryKey}</p>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <Button size="sm" variant="outline" onClick={() => { setEditingSynastry(item); setSynastryForm({ categoryKey: item.categoryKey, sourceBody: item.sourceBody, targetBody: item.targetBody, aspectKey: item.aspectKey, directionKey: item.directionKey, text: item.text || "В разработке", sourceNote: item.sourceNote ?? "", isActive: item.isActive }); setSynastryEditorOpen(true); }}><Pencil className="w-4 h-4 mr-1" />Изменить</Button>
                      <Button size="sm" variant="ghost" onClick={() => deleteSynastryInterpretation(item.id)}><Trash2 className="w-4 h-4" /></Button>
                    </div>
                  </div>
                  <p className={cn("whitespace-pre-wrap text-sm", !item.text?.trim() || item.text === "В разработке" ? "text-amber-200" : "text-muted-foreground")}>{item.text?.trim() || "В разработке"}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          <Dialog open={synastryEditorOpen} onOpenChange={(open) => { setSynastryEditorOpen(open); if (!open) setEditingSynastry(null); }}>
            <DialogContent className="max-w-2xl">
              <DialogHeader><DialogTitle>{editingSynastry ? "Изменить интерпретацию синастрии" : "Новая интерпретация синастрии"}</DialogTitle></DialogHeader>
              <div className="space-y-4">
                {!editingSynastry && <div className="grid gap-4 md:grid-cols-2">
                  <div><Label>Планета карты A</Label><Select value={synastryForm.sourceBody} onValueChange={(value) => setSynastryForm((form) => ({ ...form, sourceBody: value }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{SYNastryBodies.map((item) => <SelectItem key={item.key} value={item.key}>{item.label}</SelectItem>)}</SelectContent></Select></div>
                  <div><Label>Планета карты B</Label><Select value={synastryForm.targetBody} onValueChange={(value) => setSynastryForm((form) => ({ ...form, targetBody: value }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{SYNastryBodies.map((item) => <SelectItem key={item.key} value={item.key}>{item.label}</SelectItem>)}</SelectContent></Select></div>
                  <div><Label>Аспект</Label><Select value={synastryForm.aspectKey} onValueChange={(value) => setSynastryForm((form) => ({ ...form, aspectKey: value }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{SYNastryAspects.map((item) => <SelectItem key={item.key} value={item.key}>{item.label}</SelectItem>)}</SelectContent></Select></div>
                  <div><Label>Направление</Label><Select value={synastryForm.directionKey} onValueChange={(value) => setSynastryForm((form) => ({ ...form, directionKey: value }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{SYNastryDirections.map((item) => <SelectItem key={item.key} value={item.key}>{item.label}</SelectItem>)}</SelectContent></Select></div>
                </div>}
                {editingSynastry && <div className="rounded-md border border-border bg-muted/30 p-3 text-sm">{getSynastryBodyLabel(editingSynastry.sourceBody)} - {getSynastryBodyLabel(editingSynastry.targetBody)}, {getSynastryAspectLabel(editingSynastry.aspectKey)} · {getSynastryDirectionLabel(editingSynastry.directionKey)}<br /><span className="text-muted-foreground">Формула фиксирована и не редактируется.</span></div>}
                <div><Label>Категория / тема</Label><Input value={synastryForm.categoryKey} onChange={(e) => setSynastryForm((form) => ({ ...form, categoryKey: e.target.value }))} disabled={Boolean(editingSynastry)} placeholder="general, sensuality, conflict..." /></div>
                <div><Label>Интерпретация</Label><Textarea value={synastryForm.text} onChange={(e) => setSynastryForm((form) => ({ ...form, text: e.target.value }))} rows={12} /></div>
                <div><Label>Источник</Label><Input value={synastryForm.sourceNote} onChange={(e) => setSynastryForm((form) => ({ ...form, sourceNote: e.target.value }))} /></div>
                <div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setSynastryEditorOpen(false)}>Отмена</Button><Button onClick={saveSynastryInterpretation} disabled={synastrySaving}>{synastrySaving ? "Сохранение..." : "Сохранить"}</Button></div>
              </div>
            </DialogContent>
          </Dialog>
                <section className="space-y-4 pt-4 border-t border-border">
                  <div>
                    <h3 className="font-semibold text-lg">Планеты в домах</h3>
                    <p className="text-sm text-muted-foreground mt-1">Этот подраздел входит в общую синастрию. Дома рассчитываются по Плацидусу, а тексты редактируются здесь же в Oracle Studio.</p>
                  </div>
                  <div className="rounded-md border border-border bg-muted/30 p-3 text-sm text-muted-foreground">Первый этап включает Солнце, Луну, Меркурий, Венеру, Марс, Юпитер и Сатурн в домах I-XII. Если текста нет, отображается «В разработке».</div>
                  <Button onClick={() => { setEditingSynastryHouse(null); setSynastryHouseForm({ planetBody: "sun", houseNumber: 1, directionKey: "neutral", text: "В разработке", sourceNote: "", isActive: true }); setSynastryHouseEditorOpen(true); }}><Plus className="w-4 h-4 mr-2" />Добавить интерпретацию положения в доме</Button>
                  <div className="space-y-3">
                    {synastryHouseLoading ? <p className="text-sm text-muted-foreground">Загрузка...</p> : synastryHouseInterpretations.length === 0 ? <p className="text-sm text-muted-foreground">Записей пока нет. Добавьте первую интерпретацию.</p> : synastryHouseInterpretations.map((item) => (
                      <div key={item.id} className="rounded-lg border border-border p-4 space-y-3">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-medium">{getSynastryBodyLabel(item.planetBody)} в {item.houseNumber} доме</p>
                            <p className="text-xs text-muted-foreground">{getSynastryDirectionLabel(item.directionKey)}</p>
                          </div>
                          <div className="flex gap-2 shrink-0">
                            <Button size="sm" variant="outline" onClick={() => { setEditingSynastryHouse(item); setSynastryHouseForm({ planetBody: item.planetBody, houseNumber: item.houseNumber, directionKey: item.directionKey, text: item.text || "В разработке", sourceNote: item.sourceNote ?? "", isActive: item.isActive }); setSynastryHouseEditorOpen(true); }}><Pencil className="w-4 h-4 mr-1" />Изменить</Button>
                            <Button size="sm" variant="ghost" onClick={() => deleteSynastryHouseInterpretation(item.id)}><Trash2 className="w-4 h-4" /></Button>
                          </div>
                        </div>
                        <p className={cn("whitespace-pre-wrap text-sm", !item.text?.trim() || item.text === "В разработке" ? "text-amber-200" : "text-muted-foreground")}>{item.text?.trim() || "В разработке"}</p>
                      </div>
                    ))}
                  </div>
                  <Dialog open={synastryHouseEditorOpen} onOpenChange={(open) => { setSynastryHouseEditorOpen(open); if (!open) setEditingSynastryHouse(null); }}>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader><DialogTitle>{editingSynastryHouse ? "Изменить интерпретацию планеты в доме" : "Новая интерпретация планеты в доме"}</DialogTitle></DialogHeader>
                      <div className="space-y-4">
                        {!editingSynastryHouse && <div className="grid gap-4 md:grid-cols-2">
                          <div><Label>Планета</Label><Select value={synastryHouseForm.planetBody} onValueChange={(value) => setSynastryHouseForm((form) => ({ ...form, planetBody: value }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{SYNastryBodies.filter((item) => ["sun", "moon", "mercury", "venus", "mars", "jupiter", "saturn"].includes(item.key)).map((item) => <SelectItem key={item.key} value={item.key}>{item.label}</SelectItem>)}</SelectContent></Select></div>
                          <div><Label>Дом</Label><Select value={String(synastryHouseForm.houseNumber)} onValueChange={(value) => setSynastryHouseForm((form) => ({ ...form, houseNumber: Number(value) }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{Array.from({ length: 12 }, (_, index) => index + 1).map((house) => <SelectItem key={house} value={String(house)}>{house} дом</SelectItem>)}</SelectContent></Select></div>
                          <div><Label>Направление</Label><Select value={synastryHouseForm.directionKey} onValueChange={(value) => setSynastryHouseForm((form) => ({ ...form, directionKey: value }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{SYNastryDirections.map((item) => <SelectItem key={item.key} value={item.key}>{item.label}</SelectItem>)}</SelectContent></Select></div>
                        </div>}
                        {editingSynastryHouse && <div className="rounded-md border border-border bg-muted/30 p-3 text-sm">{getSynastryBodyLabel(editingSynastryHouse.planetBody)} в {editingSynastryHouse.houseNumber} доме · {getSynastryDirectionLabel(editingSynastryHouse.directionKey)}<br /><span className="text-muted-foreground">Формула фиксирована и не редактируется.</span></div>}
                        <div><Label>Интерпретация</Label><Textarea value={synastryHouseForm.text} onChange={(e) => setSynastryHouseForm((form) => ({ ...form, text: e.target.value }))} rows={12} /></div>
                        <div><Label>Источник</Label><Input value={synastryHouseForm.sourceNote} onChange={(e) => setSynastryHouseForm((form) => ({ ...form, sourceNote: e.target.value }))} /></div>
                        <div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setSynastryHouseEditorOpen(false)}>Отмена</Button><Button onClick={saveSynastryHouseInterpretation} disabled={synastryHouseSaving}>{synastryHouseSaving ? "Сохранение..." : "Сохранить"}</Button></div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </section>
            </TabsContent>

        <TabsContent value="lunar" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="font-serif">Рекомендации лунара</CardTitle>
              <p className="text-sm text-muted-foreground">Здесь хранятся тексты по 12 домам и 12 знакам Луны. Пустые записи отмечаются как «В разработке».</p>
            </CardHeader>
            <CardContent className="space-y-6">
              {(["house", "sign"] as const).map((category) => (
                <section key={category} className="space-y-3">
                  <h3 className="text-lg font-medium">{category === "house" ? "Луна в домах" : "Луна в знаках"}</h3>
                  <div className="grid gap-3 md:grid-cols-2">
                    {lunarInterpretations.filter((item) => item.category === category).map((item) => (
                      <div key={item.id} className="rounded-lg border border-border p-4 space-y-3">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-medium">{category === "house" ? `${item.key}-й дом лунара` : item.title}</p>
                            <p className="text-xs text-muted-foreground">{item.title}</p>
                          </div>
                          {isAdmin && <div className="flex gap-1 shrink-0"><Button size="sm" variant="outline" onClick={() => { setEditingLunar(item); setLunarForm({ category: item.category, key: item.key, title: item.title, text: item.text || "В разработке", sourceNote: item.sourceNote ?? "", isActive: item.isActive }); setLunarEditorOpen(true); }}><Pencil className="w-4 h-4 mr-1" />Изменить</Button><Button size="sm" variant="ghost" onClick={() => deleteLunarInterpretation(item.id)}><Trash2 className="w-4 h-4" /></Button></div>}
                        </div>
                        <p className={cn("whitespace-pre-wrap text-sm", item.text === "В разработке" ? "text-amber-200" : "text-muted-foreground")}>{item.text || "В разработке"}</p>
                      </div>
                    ))}
                  </div>
                </section>
              ))}
              {lunarLoading && <p className="text-sm text-muted-foreground">Загрузка записей лунара...</p>}
            </CardContent>
          </Card>
          <Dialog open={lunarEditorOpen} onOpenChange={(open) => { setLunarEditorOpen(open); if (!open) setEditingLunar(null); }}>
            <DialogContent className="max-w-2xl">
              <DialogHeader><DialogTitle>Редактирование рекомендации лунара</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div className="rounded-md border border-border bg-muted/30 p-3 text-sm">{lunarForm.category === "house" ? `${lunarForm.key}-й дом лунара` : `Луна в ${getLunarSignLabel(lunarForm.key)}`}<br /><span className="text-muted-foreground">Формула и ключ записи фиксированы, редактируется текст.</span></div>
                <div><Label>Заголовок</Label><Input value={lunarForm.title} onChange={(e) => setLunarForm((form) => ({ ...form, title: e.target.value }))} /></div>
                <div><Label>Рекомендация</Label><Textarea value={lunarForm.text} onChange={(e) => setLunarForm((form) => ({ ...form, text: e.target.value }))} rows={12} /></div>
                <div><Label>Источник</Label><Input value={lunarForm.sourceNote} onChange={(e) => setLunarForm((form) => ({ ...form, sourceNote: e.target.value }))} placeholder="Например: книга по лунару" /></div>
                <div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setLunarEditorOpen(false)}>Отмена</Button><Button onClick={saveLunarInterpretation} disabled={lunarSaving}>{lunarSaving ? "Сохранение..." : "Сохранить"}</Button></div>
              </div>
            </DialogContent>
          </Dialog>
        </TabsContent>
        <TabsContent value="forecastTemplates" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Литературные шаблоны прогноза</CardTitle>
              <p className="text-sm text-muted-foreground">Здесь хранятся готовые смысловые фрагменты для сборки прогноза. Веса и выбор факторов остаются в онтологии, а эти тексты отвечают за связное изложение.</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-md border border-border bg-muted/30 p-3 text-sm text-muted-foreground">
                Каждый шаблон имеет контекст: транзитная или натальная сущность, аспект или дом. Пустые записи показываются как «В разработке» и не перезаписывают Ваши изменения.
              </div>
              <Button onClick={() => { setEditingForecastTemplate(null); setForecastTemplateForm({ category: "entity", context: "transit", key: "mercury", title: "Новый шаблон", text: "В разработке", sourceNote: "", isActive: true }); setForecastTemplateEditorOpen(true); }}><Plus className="w-4 h-4 mr-2" />Добавить шаблон</Button>
              {forecastTemplatesLoading ? <p className="text-sm text-muted-foreground">Загрузка...</p> : forecastTemplates.length === 0 ? <p className="text-sm text-muted-foreground">Шаблонов пока нет.</p> : (
                <div className="space-y-3">
                  {forecastTemplates.map((item) => (
                    <div key={item.id} className="rounded-lg border border-border p-4 space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-medium">{item.title}</p>
                          <p className="text-xs text-muted-foreground">{forecastCategoryLabel(item.category)} · {forecastContextLabel(item.context)} · {item.key}</p>
                        </div>
                        <div className="flex gap-2 shrink-0">
                          <Button size="sm" variant="outline" onClick={() => { setEditingForecastTemplate(item); setForecastTemplateForm({ category: item.category, context: item.context, key: item.key, title: item.title, text: item.text || "В разработке", sourceNote: item.sourceNote ?? "", isActive: item.isActive }); setForecastTemplateEditorOpen(true); }}><Pencil className="w-4 h-4 mr-1" />Изменить</Button>
                          <Button size="sm" variant="ghost" onClick={() => deleteForecastTemplate(item.id)}><Trash2 className="w-4 h-4" /></Button>
                        </div>
                      </div>
                      <p className={cn("whitespace-pre-wrap text-sm", !item.text?.trim() || item.text === "В разработке" ? "text-amber-200" : "text-muted-foreground")}>{item.text?.trim() || "В разработке"}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
          <Dialog open={forecastTemplateEditorOpen} onOpenChange={(open) => { setForecastTemplateEditorOpen(open); if (!open) setEditingForecastTemplate(null); }}>
            <DialogContent className="max-w-2xl">
              <DialogHeader><DialogTitle>{editingForecastTemplate ? "Изменить шаблон прогноза" : "Новый шаблон прогноза"}</DialogTitle></DialogHeader>
              <div className="space-y-4">
                {editingForecastTemplate && <div className="rounded-md border border-border bg-muted/30 p-3 text-sm">{forecastCategoryLabel(editingForecastTemplate.category)} · {forecastContextLabel(editingForecastTemplate.context)} · {editingForecastTemplate.key}<br /><span className="text-muted-foreground">Контекст и ключ фиксированы для существующей записи.</span></div>}
                {!editingForecastTemplate && <div className="grid gap-4 md:grid-cols-3">
                  <div><Label>Категория</Label><Select value={forecastTemplateForm.category} onValueChange={(value) => setForecastTemplateForm((form) => ({ ...form, category: value }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{[["entity", "Сущность"], ["aspect", "Аспект"], ["house", "Дом"], ["composition", "Сборка"]].map(([key, label]) => <SelectItem key={key} value={key}>{label}</SelectItem>)}</SelectContent></Select></div>
                  <div><Label>Контекст</Label><Input value={forecastTemplateForm.context} onChange={(e) => setForecastTemplateForm((form) => ({ ...form, context: e.target.value }))} placeholder="transit, natal, square" /></div>
                  <div><Label>Ключ</Label><Input value={forecastTemplateForm.key} onChange={(e) => setForecastTemplateForm((form) => ({ ...form, key: e.target.value }))} placeholder="mercury, 1, default" /></div>
                </div>}
                <div><Label>Название</Label><Input value={forecastTemplateForm.title} onChange={(e) => setForecastTemplateForm((form) => ({ ...form, title: e.target.value }))} /></div>
                <div><Label>Литературный фрагмент</Label><Textarea value={forecastTemplateForm.text} onChange={(e) => setForecastTemplateForm((form) => ({ ...form, text: e.target.value }))} rows={10} /></div>
                <div><Label>Источник или примечание</Label><Input value={forecastTemplateForm.sourceNote} onChange={(e) => setForecastTemplateForm((form) => ({ ...form, sourceNote: e.target.value }))} /></div>
                <div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setForecastTemplateEditorOpen(false)}>Отмена</Button><Button onClick={saveForecastTemplate} disabled={forecastTemplatesSaving}>{forecastTemplatesSaving ? "Сохранение..." : "Сохранить"}</Button></div>
              </div>
            </DialogContent>
          </Dialog>
        </TabsContent>

        <TabsContent value="backup" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Download className="w-5 h-5 text-primary" />
                  Экспорт онтологии
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Скачать JSON-снимок всей онтологии: сущности, темы, профили, связи, фразы. Файл можно импортировать обратно в любой момент.
                </p>
                <Button onClick={handleExport} className="w-full">
                  <Download className="w-4 h-4 mr-2" />
                  Скачать бэкап
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Upload className="w-5 h-5 text-primary" />
                  Импорт онтологии
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Загрузить JSON-бэкап. Режим <b>merge</b> — обновит существующие и добавит новые. Режим <b>replace</b> — полностью заменит текущие данные.
                </p>
                <div className="flex items-center gap-3">
                  <Select value={importMode} onValueChange={(v) => setImportMode(v as "replace" | "merge")}>
                    <SelectTrigger className="w-[160px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="merge">merge (безопасно)</SelectItem>
                      <SelectItem value="replace">replace (опасно)</SelectItem>
                    </SelectContent>
                  </Select>
                  <input
                    type="file"
                    accept="application/json"
                    onChange={(e) => {
                      setImportFile(e.target.files?.[0] ?? null);
                      setImportError("");
                    }}
                    className="flex-1 text-sm file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:bg-primary file:text-primary-foreground file:text-sm"
                  />
                </div>
                {importMode === "replace" && (
                  <div className="flex items-start gap-2 text-sm text-destructive bg-destructive/10 p-3 rounded-md">
                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>Replace сотрёт все текущие данные онтологии и заменит их содержимым файла. Это нельзя отменить.</span>
                  </div>
                )}
                {importError && (
                  <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">{importError}</div>
                )}
                <Button
                  onClick={() => setImportConfirmOpen(true)}
                  disabled={!importFile || importLoading}
                  className="w-full"
                  variant={importMode === "replace" ? "destructive" : "default"}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  {importLoading ? "Импорт..." : "Импортировать"}
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Import confirmation dialog */}
      <Dialog open={importConfirmOpen} onOpenChange={setImportConfirmOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-destructive" />
              Подтвердите импорт
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm">
              Вы собираетесь импортировать файл <b>{importFile?.name}</b> в режиме <b>{importMode}</b>.
            </p>
            {importMode === "replace" ? (
              <p className="text-sm text-destructive">
                Все текущие данные онтологии будут удалены и заменены содержимым файла. Это необратимо.
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">
                Существующие записи будут обновлены, новые — добавлены. Ничего не удалится.
              </p>
            )}
            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={() => setImportConfirmOpen(false)}>
                Отмена
              </Button>
              <Button
                variant={importMode === "replace" ? "destructive" : "default"}
                onClick={handleImport}
                disabled={importLoading}
              >
                {importLoading ? "Импорт..." : "Подтвердить"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

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
        <DialogContent className="max-w-4xl h-[90vh] p-0 !grid !grid-cols-1">
          <div className="flex flex-col h-full overflow-hidden">
            <DialogHeader className="px-6 pt-6 pb-2 shrink-0">
              <DialogTitle className="font-serif text-2xl flex items-center gap-2">
                {detailEntity?.symbol ? <span className="text-2xl">{detailEntity.symbol}</span> : <Sparkles className="w-6 h-6 text-primary" />}
                {detailEntity?.name}
                <Badge variant="secondary">{detailEntity?.system}</Badge>
                <Badge variant="outline">{detailEntity?.type}</Badge>
              </DialogTitle>
            </DialogHeader>

            <ScrollArea className="flex-1 px-6 pb-6">
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
                    <RelationRow
                      key={r.id}
                      relation={r}
                      direction="from"
                      isAdmin={isAdmin}
                      onSave={(id, type, desc, w) => handleUpdateRelation(id, type, desc, w)}
                      onDelete={handleDeleteRelation}
                    />
                  ))}
                  {detailRelations.to.map((r) => (
                    <RelationRow
                      key={`to-${r.id}`}
                      relation={r}
                      direction="to"
                      isAdmin={isAdmin}
                      onSave={(id, type, desc, w) => handleUpdateRelation(id, type, desc, w)}
                      onDelete={handleDeleteRelation}
                    />
                  ))}
                  {isAdmin && <AddRelationForm entities={entities} excludeEntityId={detailEntity?.id ?? 0} onAdd={handleAddRelation} />}
                </div>
              </div>
            </div>
          </ScrollArea>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
