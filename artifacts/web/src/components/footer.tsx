import { Link } from "wouter";

function Divider() {
  return (
    <span
      aria-hidden="true"
      className="select-none text-border text-[0.95em] px-1"
    >
      |
    </span>
  );
}

const linkClass =
  "text-muted-foreground hover:text-primary transition-colors underline-offset-4 hover:underline whitespace-nowrap";

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer
      className="relative z-10 border-t border-border/60 bg-background/60 backdrop-blur-md"
      role="contentinfo"
    >
      <div className="container mx-auto px-6 py-3 flex flex-col items-center gap-1.5 text-center">
        <nav
          aria-label="Правовая информация"
          className="flex flex-wrap items-center justify-center gap-x-1 gap-y-1 text-[13px] leading-tight"
        >
          <Link href="/privacy-policy" className={linkClass}>
            Политика конфиденциальности
          </Link>

          <Divider />

          <Link href="/terms-of-service" className={linkClass}>
            Пользовательское соглашение
          </Link>
        </nav>

        <p className="text-xs text-muted-foreground/90 leading-tight">
          © {year} Aether Oracle. Все права защищены
        </p>
      </div>
    </footer>
  );
}

export default Footer;
