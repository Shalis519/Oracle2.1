import { Link, useLocation } from "wouter";
import { useClerk, useUser } from "@clerk/react";
import { 
  Compass, 
  Moon, 
  Map as MapIcon, 
  Users, 
  ListTodo, 
  LayoutDashboard, 
  Settings, 
  LogOut, 
  Star,
  Wind,
  Layers,
  Footprints,
  Menu,
  X,
  User,
  BookHeart,
  Sparkles,
  BrainCircuit
} from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { userProfileAppearance } from "@/lib/clerk-appearance";
import { ChatWidget } from "@/components/chat-widget";

interface AppLayoutProps {
  children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const [location] = useLocation();
  const { signOut, openUserProfile } = useClerk();
  const { user } = useUser();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const base = import.meta.env.BASE_URL.replace(/\/$/, "");
    fetch(`${base}/api/profile`, { credentials: "include" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setIsAdmin(data?.role === "admin"))
      .catch(() => setIsAdmin(false));
  }, []);

  const navItems = [
    { href: "/dashboard", label: "Оракул дня", icon: LayoutDashboard },
    { href: "/matrix", label: "Матрица Судьбы", icon: Layers },
    { href: "/bazi", label: "Бацзы", icon: Compass },
    { href: "/qimen", label: "Ци Мэнь Дунь Цзя", icon: Footprints },
    { href: "/astrology", label: "Западная астрология", icon: Sparkles },
    { href: "/fengshui", label: "Фэн-шуй", icon: Wind },
    { href: "/tarot", label: "Таро", icon: Star },
    { href: "/dreams", label: "Сны и сонник", icon: Moon },
    { href: "/journal", label: "Мой дневник", icon: BookHeart },
    { href: "/psychology", label: "Психология", icon: BrainCircuit },
    { href: "/contacts", label: "Контакты", icon: Users },
    { href: "/habits", label: "Трекер привычек", icon: ListTodo },
    { href: "/travel", label: "Карта путешествий", icon: MapIcon },
    { href: "/admin/studio", label: "Oracle Studio", icon: BrainCircuit },
  ];

  const NavLinks = () => (
    <div className="flex flex-col gap-1 w-full py-2">
      {navItems.map((item) => {
        const isActive = location === item.href;
        return (
          <Link key={item.href} href={item.href}>
            <span
              onClick={() => setIsMobileMenuOpen(false)}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg mx-2 transition-all duration-300 cursor-pointer ${
                isActive
                  ? "bg-primary/20 text-primary font-medium"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <item.icon className="h-5 w-5" />
              <span>{item.label}</span>
            </span>
          </Link>
        );
      })}
    </div>
  );

  const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col md:flex-row">
      {/* Mobile Header */}
      <header className="md:hidden flex items-center justify-between p-4 border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <img src={`${basePath}/logo.png`} alt="Logo" className="w-8 h-8 object-contain" />
          <span className="font-serif text-xl font-bold">Этер Оракул</span>
        </div>
        <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon">
              <Menu className="h-6 w-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-72 bg-card p-0 border-r-border flex flex-col">
            <div className="p-6 border-b border-border flex items-center gap-3">
              <img src={`${basePath}/logo.png`} alt="Logo" className="w-8 h-8 object-contain" />
              <span className="font-serif text-xl font-bold">Этер Оракул</span>
            </div>
            <ScrollArea className="flex-1">
              <NavLinks />
            </ScrollArea>
            <div className="p-4 border-t border-border flex flex-col gap-2">
              <Link href="/profile">
                <Button variant="ghost" className="w-full justify-start text-muted-foreground hover:text-foreground" onClick={() => setIsMobileMenuOpen(false)}>
                  <Settings className="h-5 w-5 mr-3" />
                  Настройки
                </Button>
              </Link>
              <Button 
                variant="ghost" 
                className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
                onClick={() => signOut({ redirectUrl: basePath || "/" })}
              >
                <LogOut className="h-5 w-5 mr-3" />
                Выйти
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </header>

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-72 border-r border-border bg-card/30 backdrop-blur-md sticky top-0 h-screen">
        <div className="p-6 border-b border-border flex items-center gap-3">
          <img src={`${basePath}/logo.png`} alt="Logo" className="w-10 h-10 object-contain drop-shadow-[0_0_8px_rgba(179,155,200,0.5)]" />
          <span className="font-serif text-2xl font-bold tracking-wide">Этер Оракул</span>
        </div>
        
        <ScrollArea className="flex-1 py-4">
          <NavLinks />
        </ScrollArea>
        
        <div className="p-4 border-t border-border bg-card/50">
          <button
            type="button"
            onClick={() => openUserProfile({ appearance: userProfileAppearance })}
            title="Изменить фото и имя"
            className="flex items-center gap-3 mb-4 px-2 py-2 w-full rounded-lg text-left transition-colors hover:bg-muted focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center border border-border overflow-hidden shrink-0">
              {user?.imageUrl ? (
                <img src={user.imageUrl} alt="Avatar" className="h-full w-full object-cover" />
              ) : (
                <User className="h-5 w-5 text-muted-foreground" />
              )}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-medium truncate">{user?.fullName || user?.username || "Пользователь"}</p>
              <p className="text-xs text-muted-foreground truncate">{user?.primaryEmailAddress?.emailAddress}</p>
            </div>
          </button>
          
          <div className="flex flex-col gap-1">
            <Link href="/profile">
              <Button variant="ghost" className="w-full justify-start text-muted-foreground hover:text-foreground hover:bg-muted">
                <Settings className="h-5 w-5 mr-3" />
                Настройки
              </Button>
            </Link>
            <Button 
              variant="ghost" 
              className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={() => signOut({ redirectUrl: basePath || "/" })}
            >
              <LogOut className="h-5 w-5 mr-3" />
              Выйти
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-x-hidden relative">
        <div className="absolute top-0 left-0 w-full h-[500px] bg-[radial-gradient(ellipse_at_top_right,rgba(74,124,247,0.1),transparent_50%)] pointer-events-none"></div>
        {children}
      </main>

      <ChatWidget />
    </div>
  );
}
