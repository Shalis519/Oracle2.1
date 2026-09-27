import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowLeft, AlertTriangle, HeartHandshake, ShieldAlert, BookOpenCheck, HelpCircle } from "lucide-react";

export default function TermsOfServicePage() {
  const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");
  const updatedDate = "15 октября 2024 г.";

  return (
    <div className="min-h-screen bg-background text-foreground relative overflow-hidden flex flex-col justify-between">
      <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-secondary/15 rounded-full blur-[120px] pointer-events-none mix-blend-screen"></div>

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
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary/10 border border-secondary/20 text-xs text-secondary font-medium">
              <BookOpenCheck className="w-3.5 h-3.5" />
              Публичная оферта и правила использования
            </div>
            <h1 className="text-3xl md:text-4xl font-serif font-bold tracking-tight">
              Пользовательское соглашение (Публичная оферта)
            </h1>
            <p className="text-sm text-muted-foreground">
              Сервис «Aether Oracle / Oracle2.1» • Редакция от {updatedDate}
            </p>
          </div>

          <section className="space-y-3">
            <h2 className="text-xl font-serif font-semibold text-foreground flex items-center gap-2">
              1. Предмет соглашения
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              Настоящее Пользовательское соглашение является публичной офертой сервиса «Aether Oracle / Oracle2.1» (далее — «Сервис», «Администрация»). Соглашение регулирует отношения между Сервисом и любым физическим лицом (далее — «Пользователь»), использующим функции сайта, веб-приложения и сопутствующих сервисов.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              Начало использования Сервиса, включая регистрацию аккаунта с помощью Clerk или продолжение серфинга по разделам платформы, означает полное и безоговорочное согласие Пользователя со всеми условиями настоящего Соглашения и Политикой конфиденциальности.
            </p>
          </section>

          {/* Важный дисклеймер */}
          <section className="space-y-4 p-5 rounded-2xl bg-destructive/10 border border-destructive/30">
            <div className="flex items-center gap-2.5 text-destructive font-serif font-semibold text-lg">
              <AlertTriangle className="w-5 h-5 flex-shrink-0" />
              2. Важный дисклеймер: информационно-развлекательный характер сервиса
            </div>
            <p className="text-foreground/90 leading-relaxed text-sm">
              Все предоставляемые Сервисом материалы, включая, но не ограничиваясь: астрологические расчеты (натальные карты, транзиты), столпы Бацзы, расклады Таро, расчеты Матрицы Судьбы, практики Ци Мэнь Дунь Цзя, толкования снов и рекомендации искусственного интеллекта (ИИ-ассистентов), <strong>носят исключительно ознакомительный, философский и информационно-развлекательный характер</strong>.
            </p>
            <ul className="list-disc pl-6 space-y-1.5 text-foreground/80 text-sm leading-relaxed">
              <li>
                Сервис <strong>не является</strong> медицинским учреждением, не оказывает квалифицированной психологической, психотерапевтической, медицинской или фармацевтической помощи.
              </li>
              <li>
                Информация Сервиса <strong>не является</strong> финансовой, инвестиционной, юридической или налоговой консультацией и не может служить прямым руководством к принятию финансовых или жизненно важных решений.
              </li>
              <li>
                Пользователь принимает на себя полную ответственность за любые решения, действия или бездействие, основанные на полученных в Сервисе прогнозах и интерпретациях. Администрация не несет ответственности за возможные прямые или косвенные последствия.
              </li>
            </ul>
          </section>

          {/* Пожертвования и донаты */}
          <section className="space-y-4 p-5 rounded-2xl bg-primary/10 border border-primary/20">
            <div className="flex items-center gap-2.5 text-primary font-serif font-semibold text-lg">
              <HeartHandshake className="w-5 h-5 flex-shrink-0" />
              3. Условия финансовых переводов (Добровольные безвозмездные пожертвования)
            </div>
            <p className="text-muted-foreground leading-relaxed text-sm">
              Любые финансовые переводы, платежи и донаты, совершаемые Пользователем в пользу Сервиса «Aether Oracle / Oracle2.1», <strong>являются добровольными безвозмездными пожертвованиями (дарениями)</strong> на поддержку, развитие и оплату серверной инфраструктуры проекта (в соответствии со ст. 582 Гражданского кодекса РФ).
            </p>
            <ul className="list-disc pl-6 space-y-1.5 text-muted-foreground text-sm leading-relaxed">
              <li>
                Пожертвования осуществляются Пользователем по собственной инициативе и воле.
              </li>
              <li>
                Пожертвования не являются коммерческой платой за товар или гарантированные услуги и не подлежат возврату, за исключением случаев, прямо предусмотренных действующим законодательством РФ.
              </li>
              <li>
                Администрация оставляет за собой право предоставлять жертвователям благодарственные бонусы или расширенные возможности в знак признательности, что не меняет безвозмездной правовой природы перевода.
              </li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-serif font-semibold text-foreground flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-primary" />
              4. Обязанности и ответственность Пользователя
            </h2>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground leading-relaxed">
              <li>
                Предоставлять достоверную информацию при заполнении профиля и не использовать учетные записи третьих лиц без их согласия.
              </li>
              <li>
                Обеспечивать сохранность и конфиденциальность аутентификационных данных учетной записи Clerk.
              </li>
              <li>
                Не предпринимать действий, направленных на нарушение целостности, безопасности или нормального функционирования Сервиса (включая попытки инъекций, парсинг данных, чрезмерную генерацию запросов к ИИ-моделям).
              </li>
              <li>
                Соблюдать нормы вежливости и законодательства при использовании интерактивного чата и дневников.
              </li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-serif font-semibold text-foreground flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-primary" />
              5. Интеллектуальная собственность
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              Все элементы дизайна, программный код, графические иллюстрации, аудиовизуальные произведения, алгоритмы синтеза эзотерических данных и тексты платформы «Aether Oracle / Oracle2.1» являются объектами интеллектуальной собственности и защищены законами об авторском праве. Любое несанкционированное копирование или коммерческое воспроизведение запрещено.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-serif font-semibold text-foreground">
              6. Изменение соглашения и контакты
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              Администрация имеет право в одностороннем порядке изменять условия настоящего Соглашения. Продолжение использования Сервиса после публикации обновлений означает акцепт новых условий. Контактный адрес для обращений: <span className="text-foreground font-medium">support@oracle-aether.internal</span>.
            </p>
          </section>
        </article>
      </main>
    </div>
  );
}
