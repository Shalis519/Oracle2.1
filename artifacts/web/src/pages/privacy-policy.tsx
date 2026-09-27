import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ShieldCheck, Lock, Eye, Database, FileText } from "lucide-react";

export default function PrivacyPolicyPage() {
  const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");
  const updatedDate = "15 октября 2024 г.";

  return (
    <div className="min-h-screen bg-background text-foreground relative overflow-hidden flex flex-col justify-between">
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-primary/15 rounded-full blur-[120px] pointer-events-none mix-blend-screen"></div>

      <header className="container mx-auto px-6 py-6 flex justify-between items-center relative z-10">
        <Link href="/">
          <div className="flex items-center gap-3 cursor-pointer">
            <img
              src={`${basePath}/logo.png`}
              alt="Aether Oracle / Oracle2.1"
              className="w-9 h-9 object-contain"
            />
            <span className="font-serif text-xl font-bold tracking-wide">
              Aether Oracle / Oracle2.1
            </span>
          </div>
        </Link>
        <Link href="/">
          <Button variant="outline" className="border-border hover:bg-card">
            <ArrowLeft className="w-4 h-4 mr-2" />
            На главную
          </Button>
        </Link>
      </header>

      <main className="container mx-auto px-6 py-10 relative z-10 max-w-4xl flex-1">
        <article className="bg-card/40 backdrop-blur-md border border-border rounded-3xl p-8 md:p-12 space-y-8 shadow-xl">
          <div className="space-y-3 border-b border-border/60 pb-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs text-primary font-medium">
              <ShieldCheck className="w-3.5 h-3.5" />
              152-ФЗ РФ и GDPR
            </div>
            <h1 className="text-3xl md:text-4xl font-serif font-bold tracking-tight">
              Политика конфиденциальности и обработки персональных данных
            </h1>
            <p className="text-sm text-muted-foreground">
              Сервис «Aether Oracle / Oracle2.1» • Дата последнего обновления: {updatedDate}
            </p>
          </div>

          <section className="space-y-3">
            <h2 className="text-xl font-serif font-semibold text-foreground flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              1. Общие положения
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              Настоящая Политика конфиденциальности (далее — «Политика») определяет порядок сбора, записи, систематизации, накопления, хранения, уточнения, извлечения, использования, передачи, обезличивания, блокирования, удаления и уничтожения персональных данных пользователей сервиса «Aether Oracle / Oracle2.1» (далее — «Сервис», «Оператор»).
            </p>
            <p className="text-muted-foreground leading-relaxed">
              Политика разработана в строгом соответствии с требованиями Федерального закона РФ от 27.07.2006 № 152-ФЗ «О персональных данных», а также принципами Общего регламента по защите данных Европейского Союза (GDPR — Regulation (EU) 2016/679).
            </p>
            <p className="text-muted-foreground leading-relaxed">
              Используя функции Сервиса, регистрируя учётную запись через систему авторизации Clerk или продолжая использование сайта, Пользователь выражает полное и безоговорочное согласие с условиями настоящей Политики.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-serif font-semibold text-foreground flex items-center gap-2">
              <Database className="w-5 h-5 text-primary" />
              2. Категории и состав обрабатываемых данных
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              Для предоставления доступа к функционалу Сервиса, проведения расчетов персональных прогнозов и поддержания стабильной работы системы обрабатываются следующие категории данных:
            </p>
            <div className="grid gap-4 mt-2">
              <div className="p-4 rounded-xl bg-background/50 border border-border/60">
                <h3 className="font-semibold text-foreground text-sm mb-1">Учётные данные аутентификации (интеграция Clerk):</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Адрес электронной почты (e-mail), сетевой псевдоним (никнейм / username), имя и фамилия (если указаны), идентификатор пользователя в системе аутентификации Clerk, аватар профиля.
                </p>
              </div>
              <div className="p-4 rounded-xl bg-background/50 border border-border/60">
                <h3 className="font-semibold text-foreground text-sm mb-1">Астрологические и расчётные данные:</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Дата и время рождения Пользователя, а также географическое место рождения (город/страна). Обработка даты и времени рождения осуществляется исключительно для алгоритмического расчета натальных карт, Матрицы Судьбы, столпов Бацзы, Ци Мэнь Дунь Цзя и персонализированных прогнозов, и не используется для иных целей.
                </p>
              </div>
              <div className="p-4 rounded-xl bg-background/50 border border-border/60">
                <h3 className="font-semibold text-foreground text-sm mb-1">Технические файлы Cookie и локальное хранилище (localStorage):</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Файлы cookie сессий Clerk для безопасного поддержания авторизованного состояния, технические cookie для балансировки нагрузки, параметры темы оформления и локальные флаги состояния интерфейса (включая метку согласия с использованием cookie — <code className="text-xs bg-muted px-1.5 py-0.5 rounded text-foreground font-mono">oracle_cookie_consent</code>).
                </p>
              </div>
              <div className="p-4 rounded-xl bg-background/50 border border-border/60">
                <h3 className="font-semibold text-foreground text-sm mb-1">Системные логи и телеметрия:</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  IP-адрес, тип и версия браузера, данные об операционной системе, дата, время и URL-адреса сетевых запросов, коды ошибок и диагностические журналы для предотвращения сетевых атак, предотвращения злоупотреблений и обеспечения отказоустойчивости инфраструктуры.
                </p>
              </div>
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-serif font-semibold text-foreground flex items-center gap-2">
              <Eye className="w-5 h-5 text-primary" />
              3. Цели обработки данных
            </h2>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground leading-relaxed">
              <li>
                Идентификация и аутентификация Пользователя в рамках учетной записи через платформу Clerk.
              </li>
              <li>
                Генерация персональных метафизических, нумерологических, астрологических и психологических расчетов (Бацзы, Матрица Судьбы, транзиты, прогнозы дня).
              </li>
              <li>
                Обеспечение функционирования интерактивных модулей (дневник, сонник, заметки, трекер привычек).
              </li>
              <li>
                Обеспечение безопасности учётных записей, предотвращение спама, мошенничества и DdoS-атак.
              </li>
              <li>
                Улучшение качества работы интерфейса, устранение багов и оптимизация быстродействия Сервиса.
              </li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-serif font-semibold text-foreground flex items-center gap-2">
              <Lock className="w-5 h-5 text-primary" />
              4. Правовые основания и безопасность
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              Правовым основанием обработки данных являются ст. 6 Федерального закона № 152-ФЗ и ст. 6 Регламента GDPR (согласие субъекта персональных данных, исполнение соглашения об использовании Сервиса).
            </p>
            <p className="text-muted-foreground leading-relaxed">
              Все данные передаются по защищенным каналам с использованием протоколов шифрования TLS/SSL. Мы не продаем, не арендуем и не передаем персональные данные третьим лицам для рекламного профилирования или таргетинга. Обработка через инфраструктурные сервисы (включая Clerk) осуществляется исключительно в объеме технической необходимости.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-serif font-semibold text-foreground">
              5. Права субъекта персональных данных (152-ФЗ и GDPR)
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              Каждый Пользователь имеет право:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground leading-relaxed">
              <li>Получать полные сведения о составе и целях обработки своих данных;</li>
              <li>Требовать уточнения, блокирования или полного удаления своих данных из базы данных («право на забвение»);</li>
              <li>Экспортировать свои данные в машиночитаемом формате;</li>
              <li>Отозвать ранее предоставленное согласие на обработку данных в любой момент через настройки личного кабинета или направив обращение администрации Сервиса.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-serif font-semibold text-foreground">
              6. Обратная связь и контакты
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              По любым вопросам, касающимся обработки и защиты персональных данных, реализации ваших прав согласно 152-ФЗ и GDPR, вы можете обращаться по электронной почте службы поддержки проекта «Aether Oracle / Oracle2.1»: <span className="text-foreground font-medium">privacy@oracle-aether.internal</span> или через форму обратной связи в личном кабинете.
            </p>
          </section>
        </article>
      </main>
    </div>
  );
}
