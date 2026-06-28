import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowRight, Star, Moon, Map, BookOpen } from "lucide-react";
import { motion } from "framer-motion";

export default function LandingPage() {
  const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col relative overflow-hidden">
      {/* Mystical Background Gradients */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-primary/20 rounded-full blur-[120px] pointer-events-none mix-blend-screen"></div>
      <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-secondary/15 rounded-full blur-[150px] pointer-events-none mix-blend-screen"></div>
      
      <header className="container mx-auto px-6 py-6 flex justify-between items-center relative z-10">
        <div className="flex items-center gap-3">
          <img src={`${basePath}/logo.png`} alt="Aether Oracle" className="w-10 h-10 object-contain drop-shadow-[0_0_12px_rgba(74,124,247,0.6)]" />
          <span className="font-serif text-2xl font-bold tracking-wide">Этер Оракул</span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/sign-in">
            <Button variant="ghost" className="text-foreground hover:bg-card">Войти</Button>
          </Link>
          <Link href="/sign-up">
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90">Создать аккаунт</Button>
          </Link>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center container mx-auto px-6 py-12 relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="max-w-3xl text-center space-y-8"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-card/50 border border-border backdrop-blur-sm text-sm text-secondary mb-4">
            <Star className="w-4 h-4" />
            <span>Ваш мистический компаньон</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-serif font-bold leading-tight">
            Синтез древних знаний <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-secondary to-accent">в одном ритуале</span>
          </h1>
          
          <p className="text-lg md:text-xl text-muted-foreground leading-relaxed max-w-2xl mx-auto">
            Откройте для себя персональный оракул, объединяющий Матрицу Судьбы, Бацзы и Фэн-шуй. Ежедневный прогноз, дневник снов и карта вашей жизни в одном эстетичном пространстве.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-8">
            <Link href="/sign-up">
              <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 text-lg px-8 h-14 rounded-full shadow-[0_0_20px_rgba(74,124,247,0.4)]">
                Начать путешествие
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
            <Link href="/sign-in">
              <Button size="lg" variant="outline" className="border-border hover:bg-card text-lg px-8 h-14 rounded-full">
                У меня уже есть аккаунт
              </Button>
            </Link>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.3, ease: "easeOut" }}
          className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-5xl"
        >
          <div className="bg-card/40 backdrop-blur-md border border-border p-8 rounded-3xl flex flex-col items-center text-center gap-4 relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="w-16 h-16 rounded-full bg-background flex items-center justify-center border border-border text-primary shadow-[0_0_15px_rgba(74,124,247,0.2)]">
              <BookOpen className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-serif font-bold">Оракул Дня</h3>
            <p className="text-muted-foreground">Ежедневный синтез арканов Таро, элементов Бацзы и звезд Фэн-шуй для осознанного начала дня.</p>
          </div>

          <div className="bg-card/40 backdrop-blur-md border border-border p-8 rounded-3xl flex flex-col items-center text-center gap-4 relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-secondary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="w-16 h-16 rounded-full bg-background flex items-center justify-center border border-border text-secondary shadow-[0_0_15px_rgba(179,155,200,0.2)]">
              <Moon className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-serif font-bold">Дневник Снов</h3>
            <p className="text-muted-foreground">Записывайте сновидения и получайте мгновенные интерпретации с выделением ключевых символов.</p>
          </div>

          <div className="bg-card/40 backdrop-blur-md border border-border p-8 rounded-3xl flex flex-col items-center text-center gap-4 relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-accent/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="w-16 h-16 rounded-full bg-background flex items-center justify-center border border-border text-accent shadow-[0_0_15px_rgba(242,141,158,0.2)]">
              <Map className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-serif font-bold">Карта Жизни</h3>
            <p className="text-muted-foreground">Отслеживайте свои привычки, сохраняйте контакты, стройте древо рода и отмечайте путешествия.</p>
          </div>
        </motion.div>
      </main>
      
      <footer className="py-8 text-center text-muted-foreground text-sm relative z-10 border-t border-border/50 bg-background/50 backdrop-blur-md">
        <p>© {new Date().getFullYear()} Этер Оракул. Ваш личный гримуар.</p>
      </footer>
    </div>
  );
}
