import { useEffect, useRef, useState } from "react";
import { useAuth, useUser } from "@clerk/react";
import { Link } from "wouter";
import { ShieldCheck, FileText, Lock } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";

/**
 * Ключ в localStorage, фиксирующий согласие пользователя с актуальной
 * редакцией Пользовательского соглашения и Политики обработки
 * персональных данных.
 */
const TERMS_STORAGE_KEY = "oracle_terms_accepted_v2";

/** Безопасное чтение ключа согласия (устойчиво к запрету localStorage). */
function hasAcceptedTerms(): boolean {
  try {
    return window.localStorage.getItem(TERMS_STORAGE_KEY) === "true";
  } catch {
    // localStorage недоступен (приватный режим и т.п.) — считаем, что согласие
    // не подтверждено, чтобы не пропустить юридический текст.
    return false;
  }
}

/** Безопасная запись ключа согласия. */
function persistAcceptedTerms(): void {
  try {
    window.localStorage.setItem(TERMS_STORAGE_KEY, "true");
  } catch {
    // Игнорируем ошибки записи: согласие подтверждено в текущей сессии.
  }
}

/**
 * Всплывающее окно согласия для уже зарегистрированных пользователей.
 *
 * Порядок работы:
 * 1. Через useAuth()/useUser() определяем, авторизован ли пользователь;
 * 2. Проверяем наличие ключа `oracle_terms_accepted_v2` в localStorage;
 * 3. Если пользователь авторизован И ключа нет — показываем модальное окно;
 * 4. Кнопка «Принять и продолжить» активна только при отмеченном чекбоксе;
 * 5. По клику сохраняем ключ в localStorage и закрываем окно.
 */
export function TermsUpdateModal() {
  const { isSignedIn, isLoaded } = useAuth();
  const { user, isLoaded: isUserLoaded } = useUser();
  const [open, setOpen] = useState(false);
  const [accepted, setAccepted] = useState(false);
  // Окно инициализируется один раз на конкретного пользователя, чтобы
  // обновления сессии Clerk не сбрасывали состояние чекбокса в процессе
  // взаимодействия с окном.
  const initializedForRef = useRef<string | null>(null);

  useEffect(() => {
    if (!isLoaded || !isUserLoaded) return;

    if (!isSignedIn || !user) {
      // Пользователь вышел из аккаунта — сбрасываем защиту, чтобы окно
      // показалось снова при следующем входе этого же пользователя.
      initializedForRef.current = null;
      return;
    }

    if (initializedForRef.current === user.id) return;
    initializedForRef.current = user.id;

    if (hasAcceptedTerms()) return;

    setAccepted(false);
    setOpen(true);
  }, [isLoaded, isUserLoaded, isSignedIn, user]);

  const handleAccept = () => {
    if (!accepted) return;
    persistAcceptedTerms();
    setAccepted(false);
    setOpen(false);
  };

  return (
    <Dialog open={open}>
      <DialogContent
        // Окно нельзя закрыть без подтверждения: блокируем Esc, клик по
        // оверлею и кнопку-крестик.
        onEscapeKeyDown={(event) => event.preventDefault()}
        onInteractOutside={(event) => event.preventDefault()}
        onPointerDownOutside={(event) => event.preventDefault()}
        className="max-w-xl border-border bg-card/95 backdrop-blur-md shadow-2xl"
      >
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <DialogTitle className="text-2xl font-semibold text-foreground">
              Обновление условий сервиса
            </DialogTitle>
          </div>
          <DialogDescription className="pt-3 text-sm leading-relaxed text-muted-foreground">
            Мы обновили Пользовательское соглашение и Политику обработки
            персональных данных. Для продолжения работы подтвердите согласие с
            актуальной редакцией:
          </DialogDescription>
        </DialogHeader>

        <ul className="grid gap-2.5 py-2">
          <li className="flex items-center gap-3 rounded-xl border border-border bg-muted/30 px-4 py-3">
            <FileText className="h-4 w-4 shrink-0 text-primary" />
            <Link
              href="/terms-of-service"
              className="text-sm text-foreground underline underline-offset-2 transition-colors hover:text-primary"
            >
              Пользовательское соглашение
            </Link>
          </li>
          <li className="flex items-center gap-3 rounded-xl border border-border bg-muted/30 px-4 py-3">
            <Lock className="h-4 w-4 shrink-0 text-primary" />
            <Link
              href="/privacy-policy#consent"
              className="text-sm text-foreground underline underline-offset-2 transition-colors hover:text-primary"
            >
              Политика обработки персональных данных
            </Link>
          </li>
        </ul>

        <label
          htmlFor="oracle-terms-accept"
          className="flex cursor-pointer select-none items-start gap-3 rounded-xl border border-border bg-muted/20 p-4 transition-colors hover:bg-muted/40"
        >
          <Checkbox
            id="oracle-terms-accept"
            checked={accepted}
            onCheckedChange={(checked) => setAccepted(checked === true)}
            className="mt-0.5 h-5 w-5 rounded-md"
            aria-label="Я принимаю условия Пользовательского соглашения и даю Согласие на обработку персональных данных"
          />
          <span className="text-sm leading-relaxed text-foreground">
            Я принимаю условия{" "}
            <Link
              href="/terms-of-service"
              className="text-primary underline underline-offset-2 hover:text-primary/90"
            >
              Пользовательского соглашения
            </Link>{" "}
            и даю Согласие на обработку персональных данных
          </span>
        </label>

        <div className="flex justify-end pt-1">
          <Button
            type="button"
            onClick={handleAccept}
            disabled={!accepted}
            className="bg-primary text-primary-foreground font-medium hover:bg-primary/90"
          >
            Принять и продолжить
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default TermsUpdateModal;
