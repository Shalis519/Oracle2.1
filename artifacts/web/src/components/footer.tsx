import { Link } from "wouter";
import { ShieldCheck, Scale, Cookie } from "lucide-react";

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer
      className="relative z-10 border-t border-border/60 bg-background/60 backdrop-blur-md"
      role="contentinfo"
    >
      <div className="container mx-auto px-6 py-8 flex flex-col items-center gap-5 text-center">
        <Link href="/" className="flex items-center gap-2.5 group">
          <span className="font-serif text-lg font-bold tracking-wide text-foreground group-hover:text-primary transition-colors">
            Oracle2.1
          </span>
        </Link>

        <nav
          aria-label="Правовая информация"
          className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm"
        >
          <Link
            href="/privacy-policy"
            className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-primary transition-colors underline-offset-4 hover:underline"
          >
            <ShieldCheck className="h-4 w-4" aria-hidden="true" />
            Политика конфиденциальности
          </Link>

          <Link
            href="/terms-of-service"
            className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-primary transition-colors underline-offset-4 hover:underline"
          >
            <Scale className="h-4 w-4" aria-hidden="true" />
            Пользовательское соглашение
          </Link>
        </nav>

        <p className="text-sm text-muted-foreground">
          © {year} Oracle2.1. Все права защищены.
        </p>

        <p className="max-w-2xl text-xs leading-relaxed text-muted-foreground/80">
          Астрологические и ИИ-прогнозы носят информационно-развлекательный характер и не
          являются публичной офертой. Финансовые переводы — добровольные безвозмездные
          пожертвования (дарения). Сервис использует Cookie и localStorage в соответствии с{" "}
          <Link
            href="/privacy-policy"
            className="text-primary underline underline-offset-2 hover:text-primary/90"
          >
            политикой обработки персональных данных
          </Link>
          .
        </p>

        <p className="inline-flex items-center gap-1.5 text-xs text-muted-foreground/70">
          <Cookie className="h-3.5 w-3.5" aria-hidden="true" />
          Соответствует 152-ФЗ РФ и GDPR
        </p>
      </div>
    </footer>
  );
}

export default Footer;
