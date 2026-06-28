import { useState } from "react";
import { useListContacts, useCreateContact, useDeleteContact, useListUpcomingBirthdays, getListContactsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { Users, Plus, Trash2, Calendar, User } from "lucide-react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";

export default function ContactsPage() {
  const { data: contacts, isLoading } = useListContacts();
  const { data: birthdays } = useListUpcomingBirthdays();
  const createContact = useCreateContact();
  const deleteContact = useDeleteContact();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    birthDate: "",
    relationshipType: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    createContact.mutate(
      { data: { ...formData, birthDate: formData.birthDate || null, relationshipType: formData.relationshipType || null } },
      {
        onSuccess: () => {
          setIsOpen(false);
          setFormData({ name: "", birthDate: "", relationshipType: "" });
          toast({ title: "Контакт добавлен" });
          queryClient.invalidateQueries({ queryKey: getListContactsQueryKey() });
        }
      }
    );
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
        
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
              <Plus className="w-4 h-4 mr-2" /> Добавить
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border">
            <DialogHeader>
              <DialogTitle className="font-serif text-2xl">Новый контакт</DialogTitle>
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
                <label className="text-sm font-medium">Кем приходится (необязательно)</label>
                <Input placeholder="Например: Мама, Брат, Друг" value={formData.relationshipType} onChange={e => setFormData(p => ({...p, relationshipType: e.target.value}))} />
              </div>
              <Button type="submit" className="w-full" disabled={createContact.isPending}>Сохранить</Button>
            </form>
          </DialogContent>
        </Dialog>
      </motion.div>

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

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? (
          <div className="col-span-full flex justify-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>
        ) : contacts && contacts.length > 0 ? (
          contacts.map((contact, i) => (
            <motion.div key={contact.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.05 }}>
              <Card className="bg-card/40 backdrop-blur-md hover:border-primary/50 transition-colors group">
                <CardContent className="p-5 flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center text-muted-foreground shrink-0 border border-border">
                    <User className="w-6 h-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-lg truncate">{contact.name}</h3>
                    {contact.relationshipType && <p className="text-sm text-muted-foreground truncate">{contact.relationshipType}</p>}
                    {contact.birthDate && (
                      <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {format(new Date(contact.birthDate), "d MMMM", { locale: ru })}
                      </p>
                    )}
                  </div>
                  <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 shrink-0 text-muted-foreground hover:text-destructive" onClick={() => handleDelete(contact.id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ))
        ) : (
          <div className="col-span-full text-center p-12 border border-dashed border-border rounded-xl text-muted-foreground">
            У вас пока нет сохраненных контактов.
          </div>
        )}
      </div>
    </div>
  );
}
