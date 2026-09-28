import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

const SITE_URL = "https://aether-oracle-web.onrender.com/";
const TERMS_URL = "https://aether-oracle-web.onrender.com/terms-of-service";
const CONTACT_EMAIL = "trimorion@inbox.ru";

const linkClass = "text-primary hover:underline underline-offset-2 break-words";

const bodyClass = "text-base leading-relaxed text-justify text-muted-foreground";
const listClass = `${bodyClass} list-disc pl-6 space-y-2`;

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="text-base font-medium text-foreground">{children}</h2>;
}

export default function TermsOfServicePage() {
  const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

  return (
    <div className="min-h-screen bg-background text-foreground relative overflow-hidden flex flex-col justify-between">
      <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-secondary/15 rounded-full blur-[120px] pointer-events-none mix-blend-screen"></div>

      <header className="container mx-auto px-6 py-6 flex justify-between items-center relative z-10">
        <Link href="/">
          <div className="flex items-center gap-3 cursor-pointer">
            <img
              src={`${basePath}/logo.png`}
              alt="Aether Oracle"
              className="w-9 h-9 object-contain"
            />
            <span className="font-serif text-xl font-bold tracking-wide">
              Aether Oracle
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
        <article className="text-base text-justify leading-relaxed bg-card/40 backdrop-blur-md border border-border rounded-3xl p-8 md:p-12 space-y-8 shadow-xl">
          <div className="space-y-3 border-b border-border/60 pb-6">
            <h1 className="text-3xl md:text-4xl font-serif font-bold tracking-tight">
              Пользовательское соглашение
            </h1>
            <p className={bodyClass}>
              Публичная оферта и правила использования сервиса «Aether Oracle».
            </p>
          </div>

          <section className="space-y-3">
            <SectionTitle>1. Предмет соглашения</SectionTitle>

            <p className={bodyClass}>
              1.1. Настоящее Пользовательское соглашение является публичной
              офертой сервиса «Aether Oracle» (далее — «Сервис»,
              «Администрация», в лице физического лица — автора и создателя
              проекта). Соглашение регулирует отношения между Сервисом и любым
              физическим лицом (далее — «Пользователь»), использующим функции
              сайта{" "}
              <a
                href={SITE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className={linkClass}
              >
                {SITE_URL}
              </a>
              , веб-приложения и сопутствующих сервисов платформы.
            </p>

            <p className={bodyClass}>
              1.2. Начало использования Сервиса, включая регистрацию учетной
              записи через систему аутентификации Clerk или использование
              расчетных модулей платформы, означает полное и безоговорочное
              согласие Пользователя со всеми условиями настоящего Соглашения и
              Политикой конфиденциальности и обработки персональных данных.
            </p>
          </section>

          <section className="space-y-3">
            <SectionTitle>
              2. Информационно-развлекательный характер сервиса
            </SectionTitle>

            <p className={bodyClass}>
              2.1. Все предоставляемые Сервисом материалы, включая, но не
              ограничиваясь: астрологические расчеты (натальные карты,
              планетарные транзиты), Бацзы, расклады карт Таро, расчеты Матрицы
              Судьбы, структуры Ци Мэнь Дунь Цзя, толкования сновидений и ответы
              алгоритмических модулей, носят исключительно ознакомительный,
              философский и информационно-развлекательный характер.
            </p>

            <p className={bodyClass}>
              2.2. Сервис не является медицинским учреждением, не оказывает
              квалифицированной медицинской, психологической или
              психотерапевтической помощи.
            </p>

            <p className={bodyClass}>
              2.3. Материалы Сервиса не являются финансовой, инвестиционной,
              юридической или налоговой консультацией и не могут служить
              прямым руководством к совершению сделок или принятию жизненно
              важных решений.
            </p>

            <p className={bodyClass}>
              2.4. Пользователь принимает на себя полную ответственность за любые
              свои решения, действия или бездействие, основанные на полученных в
              Сервисе расчетах и интерпретациях. Администрация не несет
              ответственности за возможные субъективные выводы и решения
              Пользователя.
            </p>
          </section>

          <section className="space-y-3">
            <SectionTitle>
              3. Условия финансовых переводов (Добровольные пожертвования)
            </SectionTitle>

            <p className={bodyClass}>
              3.1. Любые финансовые переводы, платежи и донаты, совершаемые
              Пользователем в пользу Сервиса «Aether Oracle», являются
              добровольными безвозмездными пожертвованиями (дарениями)
              физических лиц на поддержку, техническое сопровождение, развитие и
              оплату облачной серверной инфраструктуры проекта в соответствии со
              статьей 582 Гражданского кодекса Российской Федерации.
            </p>

            <p className={bodyClass}>
              3.2. Пожертвования осуществляются Пользователем по собственной
              инициативе, воле и в собственном интересе.
            </p>

            <p className={bodyClass}>
              3.3. Перечисляемые средства не являются коммерческой платой за
              товары, работы или гарантированные платные услуги и не подлежат
              возврату, за исключением случаев, прямо установленных действующим
              законодательством РФ.
            </p>

            <p className={bodyClass}>
              3.4. Администрация оставляет за собой право предоставлять
              Пользователям, совершившим пожертвование, доступ к дополнительным
              возможностям платформы или памятным знакам в знак благодарности,
              что не изменяет безвозмездной правовой природы дарения.
            </p>
          </section>

          <section className="space-y-3">
            <SectionTitle>
              4. Обязанности и ответственность Пользователя
            </SectionTitle>

            <ul className={listClass}>
              <li>
                4.1. Предоставлять достоверные данные (дату, время и место
                рождения) для обеспечения точности алгоритмических расчетов и не
                использовать чужие учетные записи без согласия их владельцев.
              </li>
              <li>
                4.2. Обеспечивать конфиденциальность своих данных авторизации
                в системе Clerk.
              </li>
              <li>
                4.3. Не предпринимать действий, направленных на нарушение
                целостности, сетевой безопасности или нормальной
                работоспособности Сервиса (включая автоматизированный парсинг
                данных, инъекции кода и искусственные перегрузки серверов).
              </li>
              <li>
                4.4. Соблюдать нормы уважения и законодательства РФ при
                взаимодействии в чате сообщества и заполнении интерактивных
                модулей (дневников и заметок).
              </li>
            </ul>
          </section>

          <section className="space-y-3">
            <SectionTitle>5. Интеллектуальная собственность</SectionTitle>

            <p className={bodyClass}>
              5.1. Все элементы дизайна интерфейса, программный код, графические
              материалы, алгоритмы расчетов и текстовые материалы платформы
              «Aether Oracle» являются объектами интеллектуальной
              собственности, охраняемыми законодательством об авторском праве.
            </p>

            <p className={bodyClass}>
              5.2. Любое несанкционированное копирование, распространение или
              коммерческое использование элементов платформы без письменного
              разрешения Администрации запрещено.
            </p>
          </section>

          <section className="space-y-3">
            <SectionTitle>6. Изменение соглашения и контакты</SectionTitle>

            <p className={bodyClass}>
              6.1. Администрация оставляет за собой право в одностороннем порядке
              вносить изменения в условия настоящего Соглашения. Обновленная
              редакция вступает в силу с момента ее публикации на Сайте.
            </p>

            <p className={bodyClass}>
              6.2. Официальным адресом для направления юридических обращений,
              предложений и вопросов по настоящему Соглашению является
              электронная почта Администрации:{" "}
              <a href={`mailto:${CONTACT_EMAIL}`} className={linkClass}>
                {CONTACT_EMAIL}
              </a>
              .
            </p>

            <p className={bodyClass}>
              6.3. Действующая редакция Пользовательского соглашения постоянно
              размещена в сети Интернет по адресу:{" "}
              <a
                href={TERMS_URL}
                target="_blank"
                rel="noopener noreferrer"
                className={linkClass}
              >
                {TERMS_URL}
              </a>
              .
            </p>
          </section>
        </article>
      </main>
    </div>
  );
}
