import { useState } from "react";
import { useListContacts, useCreateContact, useUpdateContact, useDeleteContact, useListUpcomingBirthdays, useCalculateContactSynastry, getListContactsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { Users, Plus, Trash2, Pencil, Calendar, Clock, User, MapPin, Phone, Mail, Search, Sparkles } from "lucide-react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

type FormData = {
  name: string;
  birthDate: string;
  birthTime: string;
  relationshipType: string;
  gender: "" | "мужчина" | "женщина";
  city: string;
  birthPlace: string;
  phone: string;
  email: string;
  synastryEnabled: boolean;
};

const SYNASTRY_BODY_NAMES: Record<string, string> = {
  sun: "Солнце", moon: "Луна", mercury: "Меркурий", venus: "Венера", mars: "Марс",
  jupiter: "Юпитер", saturn: "Сатурн", uranus: "Уран", neptune: "Нептун", pluto: "Плутон",
  chiron: "Хирон", lilith: "Лилит",
};

const SYNASTRY_BODY_ACCUSATIVE: Record<string, string> = {
  sun: "Солнцу", moon: "Луне", mercury: "Меркурию", venus: "Венере", mars: "Марсу",
  jupiter: "Юпитеру", saturn: "Сатурну", uranus: "Урану", neptune: "Нептуну", pluto: "Плутону",
  chiron: "Хирону", lilith: "Лилит",
};

const SYNASTRY_ASPECT_PHRASES: Record<string, { text: string; preposition: "к" | "с" }> = {
  соединение: { text: "соединение", preposition: "с" },
  секстиль: { text: "секстиль", preposition: "к" },
  квадрат: { text: "квадрат", preposition: "к" },
  тригон: { text: "тригон", preposition: "к" },
  оппозиция: { text: "оппозицию", preposition: "к" },
};

const SYNASTRY_BODY_INSTRUMENTAL: Record<string, string> = {
  sun: "Солнцем", moon: "Луной", mercury: "Меркурием", venus: "Венерой", mars: "Марсом",
  jupiter: "Юпитером", saturn: "Сатурном", uranus: "Ураном", neptune: "Нептуном", pluto: "Плутоном",
  chiron: "Хироном", lilith: "Лилит",
};

const SYNASTRY_BODY_YOUR_DATIVE: Record<string, string> = {
  sun: "вашему Солнцу", moon: "вашей Луне", mercury: "вашему Меркурию", venus: "вашей Венере", mars: "вашему Марсу",
  jupiter: "вашему Юпитеру", saturn: "вашему Сатурну", uranus: "вашему Урану", neptune: "вашему Нептуну", pluto: "вашему Плутону",
  chiron: "вашему Хирону", lilith: "вашей Лилит",
};

const SYNASTRY_BODY_YOUR_INSTRUMENTAL: Record<string, string> = {
  sun: "вашим Солнцем", moon: "вашей Луной", mercury: "вашим Меркурием", venus: "вашей Венерой", mars: "вашим Марсом",
  jupiter: "вашим Юпитером", saturn: "вашим Сатурном", uranus: "вашим Ураном", neptune: "вашим Нептуном", pluto: "вашим Плутоном",
  chiron: "вашим Хироном", lilith: "вашей Лилит",
};

function synastryPersonPhrase(sourcePerson: "user" | "contact", sourceLabel: string, targetPerson: "user" | "contact", targetLabel: string, sourceBody: string, targetBody: string, aspectType: string) {
  const sourceBodyLabel = SYNASTRY_BODY_NAMES[sourceBody] ?? sourceBody;
  const targetBodyLabel = SYNASTRY_BODY_ACCUSATIVE[targetBody] ?? SYNASTRY_BODY_NAMES[targetBody] ?? targetBody;
  const aspect = SYNASTRY_ASPECT_PHRASES[aspectType.toLowerCase()] ?? { text: aspectType.toLowerCase(), preposition: "к" as const };
  if (sourcePerson === "user" && targetPerson === "contact") {
    return aspect.preposition === "с"
      ? `Ваш ${sourceBodyLabel} образует ${aspect.text} с ${SYNASTRY_BODY_INSTRUMENTAL[targetBody] ?? targetBodyLabel} контакта.`
      : `Ваш ${sourceBodyLabel} образует ${aspect.text} к ${targetBodyLabel} контакта.`;
  }
  if (sourcePerson === "contact" && targetPerson === "user") {
    return aspect.preposition === "с"
      ? `${sourceBodyLabel} контакта образует ${aspect.text} с ${SYNASTRY_BODY_YOUR_INSTRUMENTAL[targetBody] ?? `вашим ${targetBodyLabel}`}.`
      : `${sourceBodyLabel} контакта образует ${aspect.text} к ${SYNASTRY_BODY_YOUR_DATIVE[targetBody] ?? `вашему ${targetBodyLabel}`}.`;
  }
  return `${sourceLabel}: ${sourceBodyLabel} образует ${aspect.text} ${aspect.preposition} ${targetBodyLabel} (${targetLabel}).`;
}

const emptyForm: FormData = {
  name: "",
  birthDate: "",
  birthTime: "",
  relationshipType: "",
  gender: "",
  city: "",
  birthPlace: "",
  phone: "",
  email: "",
  synastryEnabled: false,
};

export default function ContactsPage() {
  const { data: contacts, isLoading } = useListContacts();
  const { data: birthdays } = useListUpcomingBirthdays();
  const createContact = useCreateContact();
  const updateContact = useUpdateContact();
  const deleteContact = useDeleteContact();
  const calculateSynastry = useCalculateContactSynastry();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState<FormData>(emptyForm);
  const [search, setSearch] = useState("");
  const [synastryContactId, setSynastryContactId] = useState<number | null>(null);

  const query = search.trim().toLowerCase();
  const visibleContacts = (contacts ?? [])
    .filter((c) => {
      if (!query) return true;
      return [c.name, c.relationshipType, c.city, c.birthPlace, c.phone, c.email]
        .filter(Boolean)
        .some((field) => field!.toLowerCase().includes(query));
    })
    .sort((a, b) => (a.name ?? "").localeCompare(b.name ?? "", "ru"));

  const openCreate = () => {
    setEditingId(null);
    setFormData(emptyForm);
    setIsOpen(true);
  };

  const openEdit = (contact: NonNullable<typeof contacts>[number]) => {
    setEditingId(contact.id);
    setFormData({
      name: contact.name ?? "",
      birthDate: contact.birthDate ?? "",
      birthTime: contact.birthTime?.slice(0, 5) ?? "",
      relationshipType: contact.relationshipType ?? "",
      gender: contact.gender === "мужчина" || contact.gender === "женщина" ? contact.gender : "",
      city: contact.city ?? "",
      birthPlace: contact.birthPlace ?? "",
      phone: contact.phone ?? "",
      email: contact.email ?? "",
      synastryEnabled: contact.synastryEnabled ?? false,
    });
    setIsOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.gender) return;

    const payload = {
      name: formData.name,
      birthDate: formData.birthDate || null,
      birthTime: formData.birthTime || null,
      relationshipType: formData.relationshipType || null,
      gender: formData.gender,
      city: formData.city || null,
      birthPlace: formData.birthPlace || null,
      phone: formData.phone || null,
      email: formData.email || null,
      synastryEnabled: formData.synastryEnabled,
    };

    const onSuccess = (savedContact: { id: number }) => {
      setIsOpen(false);
      setEditingId(null);
      setFormData(emptyForm);
      toast({ title: editingId ? "Контакт обновлен" : "Контакт добавлен" });
      queryClient.invalidateQueries({ queryKey: getListContactsQueryKey() });
      if (formData.synastryEnabled) {
        calculateSynastry.mutate({ id: savedContact.id }, {
          onSuccess: () => queryClient.invalidateQueries({ queryKey: getListContactsQueryKey() }),
          onError: () => toast({ title: "Синастрия пока недоступна", description: "Проверьте дату, время и место рождения." }),
        });
      }
    };

    const onError = (error: unknown) => {
      const message = error instanceof Error ? error.message : "Не удалось сохранить контакт.";
      toast({ title: "Контакт не сохранён", description: message });
    };

    if (editingId) {
      updateContact.mutate({ id: editingId, data: payload }, { onSuccess, onError });
    } else {
      createContact.mutate({ data: payload }, { onSuccess, onError });
    }
  };

  const handleDelete = (id: number) => {
    if (!confirm("Удалить контакт?")) return;
    deleteContact.mutate(
      { id },
      {
        onSuccess: () => {
          toast({ title: "Контакт удален" });
          queryClient.invalidateQueries({ queryKey: getListContactsQueryKey() });
        }
      }
    );
  };

  const isSaving = createContact.isPending || updateContact.isPending;

  return (
    <div className="p-6 md:p-10 max-w-5xl mx-auto space-y-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-serif font-bold mb-2 flex items-center gap-3">
            <Users className="text-primary" />
            Контакты
          </h1>
          <p className="text-muted-foreground">Древо рода и важные связи.</p>
        </div>

        <Dialog open={isOpen} onOpenChange={(open) => { setIsOpen(open); if (!open) { setEditingId(null); setFormData(emptyForm); } }}>
          <DialogTrigger asChild>
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90" onClick={openCreate}>
              <Plus className="w-4 h-4 mr-2" /> Добавить
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="font-serif text-2xl">{editingId ? "Изменить контакт" : "Новый контакт"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 pt-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Имя</label>
                <Input value={formData.name} onChange={e => setFormData(p => ({...p, name: e.target.value}))} required />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Дата рождения (необязательно)</label>
                <Input type="date" value={formData.birthDate} onChange={e => setFormData(p => ({...p, birthDate: e.target.value}))} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Время рождения (необязательно)</label>
                <Input type="time" value={formData.birthTime} onChange={e => setFormData(p => ({...p, birthTime: e.target.value}))} />
                <p className="text-xs text-muted-foreground">Понадобится для расчета совместимости в западной астрологии.</p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Кем приходится (необязательно)</label>
                <Input placeholder="Например: Мама, Брат, Друг" value={formData.relationshipType} onChange={e => setFormData(p => ({...p, relationshipType: e.target.value}))} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Пол</label>
                <RadioGroup
                  required
                  value={formData.gender}
                  onValueChange={(value) => setFormData((p) => ({ ...p, gender: value as FormData["gender"] }))}
                  className="flex gap-5 pt-1"
                >
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="мужчина" id="contact-gender-male" />
                    <label htmlFor="contact-gender-male" className="text-sm cursor-pointer">Мужчина</label>
                  </div>
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="женщина" id="contact-gender-female" />
                    <label htmlFor="contact-gender-female" className="text-sm cursor-pointer">Женщина</label>
                  </div>
                </RadioGroup>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Телефон (необязательно)</label>
                <Input type="tel" placeholder="Например: +7 900 000-00-00" value={formData.phone} onChange={e => setFormData(p => ({...p, phone: e.target.value}))} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Email (необязательно)</label>
                <Input type="email" placeholder="Например: name@example.com" value={formData.email} onChange={e => setFormData(p => ({...p, email: e.target.value}))} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Город проживания (необязательно)</label>
                <Input placeholder="Например: Москва" value={formData.city} onChange={e => setFormData(p => ({...p, city: e.target.value}))} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Место рождения (необязательно)</label>
                <Input placeholder="Город рождения" value={formData.birthPlace} onChange={e => setFormData(p => ({...p, birthPlace: e.target.value}))} />
              </div>
              <label className="flex items-start gap-3 rounded-lg border border-border p-3 cursor-pointer">
                <input type="checkbox" className="mt-1 accent-primary" checked={formData.synastryEnabled} onChange={e => setFormData(p => ({ ...p, synastryEnabled: e.target.checked }))} />
                <span>
                  <span className="block text-sm font-medium">Рассчитать синастрию</span>
                  <span className="block text-xs text-muted-foreground mt-1">Для расчёта нужны дата, точное время и место рождения.</span>
                </span>
              </label>
              <Button type="submit" className="w-full" disabled={isSaving}>Сохранить</Button>
            </form>
          </DialogContent>
        </Dialog>
      </motion.div>

      <Dialog open={synastryContactId !== null} onOpenChange={(open) => { if (!open) setSynastryContactId(null); }}>
        <DialogContent className="bg-card border-border max-h-[90vh] overflow-y-auto max-w-2xl">
          <DialogHeader><DialogTitle className="font-serif text-2xl">Синастрия с {contacts?.find((c) => c.id === synastryContactId)?.name ?? "контактом"}</DialogTitle></DialogHeader>
          {(() => {
            const contact = contacts?.find((c) => c.id === synastryContactId);
            if (!contact?.synastryData) return <p className="text-muted-foreground">Расчёт ещё не готов.</p>;
            try {
              const result = JSON.parse(contact.synastryData) as {
                summary: string;
                cinderellaGates?: Array<{ pairKey?: string; sourcePerson?: "user" | "contact"; targetPerson?: "user" | "contact"; sourceLabel: string; targetLabel: string; aspectType: string; orb: number; interpretation: string }>;
                aspects?: Array<{ sourcePerson?: "user" | "contact"; targetPerson?: "user" | "contact"; sourceLabel: string; targetLabel: string; sourceBody: string; targetBody: string; aspectType: string; aspectSymbol: string; orb: number; interpretation: string }>;
                themes?: Array<{ key: string; label: string; aspects: Array<{ sourceLabel: string; targetLabel: string; sourceBody: string; targetBody: string; aspectType: string; aspectSymbol: string; orb: number; interpretation: string }> }>;
              };
              const gates = result.cinderellaGates ?? [];
              const aspects = result.aspects ?? [];
              const themes = result.themes ?? [];
              const bodyNames = SYNASTRY_BODY_NAMES;
              return <div className="space-y-5">
                {(gates.length > 0 || aspects.length > 0) && <section><h3 className="font-semibold text-lg mb-2">Интерпретация:</h3><div className="space-y-3">
                  {gates.map((gate, index) => <article key={`gate-${gate.sourceLabel}-${gate.targetLabel}-${index}`} className="rounded-lg border border-primary/20 bg-primary/5 p-3 space-y-2"><div className="font-medium">{synastryPersonPhrase(gate.sourcePerson ?? "user", gate.sourceLabel, gate.targetPerson ?? "contact", gate.targetLabel, "chiron", gate.pairKey?.replace(/^chiron-/, "") ?? "venus", gate.aspectType)} Орбис {gate.orb}°</div><p className="text-sm leading-relaxed">{gate.interpretation}</p></article>)}
                  {aspects.map((aspect, index) => <article key={`aspect-${aspect.sourceBody}-${aspect.targetBody}-${aspect.aspectType}-${index}`} className="rounded-lg border border-border p-3 space-y-2"><div className="font-medium">{synastryPersonPhrase(aspect.sourcePerson ?? "user", aspect.sourceLabel, aspect.targetPerson ?? "contact", aspect.targetLabel, aspect.sourceBody, aspect.targetBody, aspect.aspectType)} Орбис {aspect.orb}°</div><p className="text-sm leading-relaxed">{aspect.interpretation}</p></article>)}
                </div></section>}
                {themes.length > 0 && <section className="space-y-3"><h3 className="font-semibold text-lg">Ключевые темы</h3>{themes.map((theme) => <article key={theme.key} className="rounded-lg border border-border p-3"><h4 className="font-medium">{theme.label}</h4><p className="mt-1 text-sm text-muted-foreground">Тема подтверждена тремя и более связанными аспектами.</p></article>)}</section>}
              </div>;
            } catch { return <p className="text-destructive">Не удалось прочитать результат расчёта.</p>; }
          })()}
        </DialogContent>
      </Dialog>

      {birthdays && birthdays.length > 0 && (
        <Card className="bg-secondary/10 border-secondary/30 mb-8">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2 text-secondary">
              <Calendar className="w-5 h-5" /> Ближайшие дни рождения
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              {birthdays.map((b) => (
                <div key={b.contactId} className="bg-background px-4 py-2 rounded-lg border border-border text-sm flex items-center gap-2">
                  <span className="font-bold">{b.name}</span>
                  <span className="text-muted-foreground">— через {b.daysUntil} дн.</span>
                  {b.turningAge && <span className="text-secondary ml-1">({b.turningAge} лет)</span>}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Поиск по имени, городу, телефону..."
          className="pl-10"
        />
      </div>

      <div className="space-y-3">
        {isLoading ? (
          <div className="flex justify-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>
        ) : !contacts || contacts.length === 0 ? (
          <div className="text-center p-12 border border-dashed border-border rounded-xl text-muted-foreground">
            У вас пока нет сохраненных контактов.
          </div>
        ) : visibleContacts.length === 0 ? (
          <div className="text-center p-12 border border-dashed border-border rounded-xl text-muted-foreground">
            Ничего не найдено.
          </div>
        ) : (
          visibleContacts.map((contact, i) => (
            <motion.div key={contact.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
              <Card className="bg-card/40 backdrop-blur-md hover:border-primary/50 transition-colors group">
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground shrink-0 border border-border">
                    <User className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
                      <h3 className="font-bold text-lg truncate">{contact.name}</h3>
                      {contact.relationshipType && <span className="text-sm text-muted-foreground truncate">{contact.relationshipType}</span>}
                    </div>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-xs text-muted-foreground">
                      {contact.birthDate && (
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {format(new Date(contact.birthDate), "d MMMM", { locale: ru })}
                        </span>
                      )}
                      {contact.birthTime && (
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {contact.birthTime.slice(0, 5)}
                        </span>
                      )}
                      {contact.phone && (
                        <span className="flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          <a href={`tel:${contact.phone}`} className="hover:text-primary truncate">{contact.phone}</a>
                        </span>
                      )}
                      {contact.email && (
                        <span className="flex items-center gap-1">
                          <Mail className="w-3 h-3" />
                          <a href={`mailto:${contact.email}`} className="hover:text-primary truncate">{contact.email}</a>
                        </span>
                      )}
                      {contact.city && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {contact.city}
                        </span>
                      )}
                      {contact.birthPlace && (
                        <span>Место рождения: {contact.birthPlace}</span>
                      )}
                    </div>
                    {contact.synastryEnabled && (
                      <div className="mt-2 flex items-center gap-2 text-xs">
                        <Sparkles className="w-3 h-3 text-primary" />
                        {contact.synastryStatus === "ready" ? <button type="button" className="text-primary hover:underline" onClick={() => setSynastryContactId(contact.id)}>Открыть синастрию</button> : <span className="text-muted-foreground">{contact.synastryStatus === "insufficient_data" ? "Недостаточно данных для синастрии" : contact.synastryStatus === "error" ? "Ошибка расчёта синастрии" : "Синастрия готовится"}</span>}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary" onClick={() => openEdit(contact)}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive" onClick={() => handleDelete(contact.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
