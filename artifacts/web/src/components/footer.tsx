import { Link } from "wouter";
import { ShieldCheck, Scale } from "lucide-react";

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
            Aether Oracle
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
          © {year} Aether Oracle. Все права защищены
        </p>
      </div>
    </footer>
  );
}

export default Footer;
