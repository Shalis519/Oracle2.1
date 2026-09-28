import { Link, useLocation } from "wouter";
import { useCallback, type MouseEvent } from "react";

const CONSENT_ANCHOR = "personal-data-consent";
const CONSENT_HREF = `/privacy-policy#${CONSENT_ANCHOR}`;

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
  const [, navigate] = useLocation();

  const handleConsentClick = useCallback(
    (event: MouseEvent<HTMLAnchorElement>) => {
      const target = document.getElementById(CONSENT_ANCHOR);
      if (!target) {
        return; // раздел согласия ещё не открыт — обычный переход по маршруту
      }
      event.preventDefault();
      target.scrollIntoView({ behavior: "smooth", block: "start" });
      window.history.replaceState(
        null,
        "",
        `${window.location.pathname}${window.location.search}#${CONSENT_ANCHOR}`,
      );
    },
    [navigate],
  );

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

          <Divider />

          <Link
            href={CONSENT_HREF}
            className={linkClass}
            onClick={handleConsentClick}
          >
            Согласие на обработку данных
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
