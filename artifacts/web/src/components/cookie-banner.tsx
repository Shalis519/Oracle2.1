import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Cookie, X } from "lucide-react";

export function CookieBanner() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    try {
      const consent = localStorage.getItem("oracle_cookie_consent");
      if (!consent) {
        setIsVisible(true);
      }
    } catch {
      // Ignore localStorage errors (e.g. incognito restrictions)
      setIsVisible(true);
    }
  }, []);

  const handleAccept = () => {
    try {
      localStorage.setItem("oracle_cookie_consent", "true");
    } catch {
      // Fallback
    }
    setIsVisible(false);
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-6 md:max-w-md z-50 animate-in fade-in slide-in-from-bottom-5 duration-300">
      <div className="bg-card/95 backdrop-blur-md border border-border rounded-2xl p-4 sm:p-5 shadow-2xl flex flex-col gap-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5 text-foreground font-medium text-sm">
            <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
              <Cookie className="w-5 h-5" />
            </div>
            <span>Мы используем файлы Cookie</span>
          </div>
          <button
            onClick={handleAccept}
            className="text-muted-foreground hover:text-foreground transition-colors p-1"
            aria-label="Закрыть"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-muted-foreground leading-relaxed">
          Сервис «Aether Oracle / Oracle2.1» использует файлы Cookie и локальное хранилище (localStorage) для авторизации через Clerk, сохранения пользовательских настроек и обеспечения корректной работы сервиса в соответствии с 152-ФЗ и GDPR. Подробнее в нашей{" "}
          <Link
            href="/privacy-policy"
            className="text-primary underline underline-offset-2 hover:text-primary/90"
          >
            Политике конфиденциальности
          </Link>
          .
        </p>

        <div className="flex items-center justify-end gap-2 pt-1">
          <Button
            size="sm"
            onClick={handleAccept}
            className="bg-primary text-primary-foreground hover:bg-primary/90 text-xs px-4 h-8 rounded-lg font-medium"
          >
            Понятно
          </Button>
        </div>
      </div>
    </div>
  );
}

export default CookieBanner;
