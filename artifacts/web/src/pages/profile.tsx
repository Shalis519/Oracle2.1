import { useGetProfile, useUpdateProfile, getGetProfileQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";

export default function ProfilePage() {
  const { data: profile, isLoading } = useGetProfile();
  const updateProfile = useUpdateProfile();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: "",
    birthDate: "",
    birthTime: "",
    birthPlace: "",
    bedDirection: "",
    notificationsEnabled: false,
  });

  useEffect(() => {
    if (profile) {
      setFormData({
        name: profile.name || "",
        birthDate: profile.birthDate ? profile.birthDate.split("T")[0] : "",
        birthTime: profile.birthTime || "",
        birthPlace: profile.birthPlace || "",
        bedDirection: profile.bedDirection || "",
        notificationsEnabled: profile.notificationsEnabled || false,
      });
    }
  }, [profile]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSwitchChange = (checked: boolean) => {
    setFormData((prev) => ({ ...prev, notificationsEnabled: checked }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile.mutate(
      { data: {
        ...formData,
        birthDate: formData.birthDate || null,
        birthTime: formData.birthTime || null,
        birthPlace: formData.birthPlace || null,
        bedDirection: formData.bedDirection || null,
      } },
      {
        onSuccess: () => {
          toast({ title: "Профиль успешно обновлен" });
          queryClient.invalidateQueries({ queryKey: getGetProfileQueryKey() });
        },
        onError: () => {
          toast({ title: "Ошибка при сохранении", variant: "destructive" });
        }
      }
    );
  };

  if (isLoading) {
    return <div className="flex h-[50vh] items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>;
  }

  return (
    <div className="p-6 md:p-10 max-w-3xl mx-auto space-y-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <h1 className="text-4xl font-serif font-bold mb-2">Настройки Профиля</h1>
        <p className="text-muted-foreground">Ваши данные для точных расчетов Оракула.</p>
      </motion.div>

      <Card className="bg-card/40 backdrop-blur-md border-border shadow-lg">
        <CardHeader>
          <CardTitle className="font-serif text-2xl">Личные данные</CardTitle>
          <CardDescription>Эти данные используются для расчетов Бацзы и Матрицы Судьбы.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="name">Имя</Label>
                <Input id="name" name="name" value={formData.name} onChange={handleChange} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="birthDate">Дата рождения</Label>
                <Input id="birthDate" name="birthDate" type="date" value={formData.birthDate} onChange={handleChange} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="birthTime">Время рождения</Label>
                <Input id="birthTime" name="birthTime" type="time" value={formData.birthTime} onChange={handleChange} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="birthPlace">Место рождения</Label>
                <Input id="birthPlace" name="birthPlace" placeholder="Город" value={formData.birthPlace} onChange={handleChange} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bedDirection">Направление изголовья кровати</Label>
                <Select value={formData.bedDirection} onValueChange={(val) => handleSelectChange("bedDirection", val)}>
                  <SelectTrigger id="bedDirection">
                    <SelectValue placeholder="Выберите направление" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Север">Север</SelectItem>
                    <SelectItem value="Северо-восток">Северо-восток</SelectItem>
                    <SelectItem value="Восток">Восток</SelectItem>
                    <SelectItem value="Юго-восток">Юго-восток</SelectItem>
                    <SelectItem value="Юг">Юг</SelectItem>
                    <SelectItem value="Юго-запад">Юго-запад</SelectItem>
                    <SelectItem value="Запад">Запад</SelectItem>
                    <SelectItem value="Северо-запад">Северо-запад</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-border pt-6">
              <div className="space-y-0.5">
                <Label>Уведомления</Label>
                <p className="text-sm text-muted-foreground">Получать оповещения от Оракула</p>
              </div>
              <Switch checked={formData.notificationsEnabled} onCheckedChange={handleSwitchChange} />
            </div>

            <Button type="submit" disabled={updateProfile.isPending} className="w-full md:w-auto">
              Сохранить изменения
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
