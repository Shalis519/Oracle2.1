import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  FileText,
  Database,
  Eye,
  Scale,
  Lock,
  Users,
  ScrollText,
} from "lucide-react";

export default function PrivacyPolicyPage() {
  const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

  const linkClass =
    "text-primary hover:underline underline-offset-2 break-words";

  return (
    <div className="min-h-screen bg-background text-foreground relative overflow-hidden flex flex-col justify-between">
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-primary/15 rounded-full blur-[120px] pointer-events-none mix-blend-screen"></div>

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
        <article
            id="article-content"
            className="text-base text-justify leading-relaxed bg-card/40 backdrop-blur-md border border-border rounded-3xl p-8 md:p-12 space-y-8 shadow-xl"
          >
          <div className="space-y-3 border-b border-border/60 pb-6">
            <h1 className="text-3xl md:text-4xl font-serif font-bold tracking-tight">
              Политика конфиденциальности и обработки персональных данных
            </h1>
          </div>

          <section className="space-y-3">
            <p className="text-base leading-relaxed text-justify text-muted-foreground">
              Настоящая Политика разработана в соответствии с требованиями
              Федерального закона РФ от 27.07.2006 № 152-ФЗ «О персональных
              данных» (далее – «Закон») и определяет порядок сбора, записи,
              систематизации, накопления, хранения, уточнения, извлечения,
              использования, передачи, обезличивания, блокирования, удаления и
              уничтожения персональных данных Администрацией сервиса «Aether
              Oracle» (физическим лицом – автором и создателем проекта, далее –
              «Оператор»), доступного в сети Интернет по адресу:{" "}
              <a
                href="https://aether-oracle-web.onrender.com/"
                target="_blank"
                rel="noopener noreferrer"
                className={linkClass}
              >
                https://aether-oracle-web.onrender.com/
              </a>
              .
            </p>
            <p className="text-base leading-relaxed text-justify text-muted-foreground">
              Для направления юридических запросов, предложений и обращений
              субъектов персональных данных используется адрес электронной
              почты:{" "}
              <a href="mailto:trimorion@inbox.ru" className={linkClass}>
                trimorion@inbox.ru
              </a>
              .
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground leading-relaxed text-justify">
              <li>
                Оператор ставит своей важнейшей целью соблюдение прав и свобод
                человека и гражданина при обработке его персональных данных, в
                том числе защиту прав на неприкосновенность частной жизни,
                личную и семейную тайну.
              </li>
              <li>
                Настоящая Политика применяется ко всей информации, которую
                Оператор может получить о посетителях и зарегистрированных
                пользователях Сайта{" "}
                <a
                  href="https://aether-oracle-web.onrender.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={linkClass}
                >
                  https://aether-oracle-web.onrender.com/
                </a>
                .
              </li>
              <li>
                Используя функции Сервиса, регистрируя учётную запись через
                систему авторизации Clerk или продолжая использование Сайта,
                Пользователь выражает полное и безоговорочное согласие с
                условиями настоящей Политики.
              </li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-serif font-semibold text-foreground flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              1. Термины и определения
            </h2>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground leading-relaxed text-justify">
              <li>
                <span className="text-foreground font-medium">
                  Автоматизированная обработка персональных данных
                </span>{" "}
                – обработка персональных данных с помощью средств вычислительной
                техники;
              </li>
              <li>
                <span className="text-foreground font-medium">
                  Блокирование персональных данных
                </span>{" "}
                – временное прекращение обработки персональных данных (за
                исключением случаев, если обработка необходима для уточнения
                персональных данных);
              </li>
              <li>
                <span className="text-foreground font-medium">Сайт</span> –
                веб-ресурс в сети Интернет, совокупность программ для ЭВМ, баз
                данных и графического интерфейса по адресу{" "}
                <a
                  href="https://aether-oracle-web.onrender.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={linkClass}
                >
                  https://aether-oracle-web.onrender.com/
                </a>{" "}
                (включая все подразделы);
              </li>
              <li>
                <span className="text-foreground font-medium">
                  Обезличивание персональных данных
                </span>{" "}
                – действия, в результате которых невозможно определить без
                использования дополнительной информации принадлежность данных
                конкретному Пользователю;
              </li>
              <li>
                <span className="text-foreground font-medium">
                  Обработка персональных данных
                </span>{" "}
                – любое действие (операция) с персональными данными, включая
                сбор, запись, систематизацию, накопление, хранение, уточнение,
                использование, передачу, обезличивание, блокирование и
                уничтожение;
              </li>
              <li>
                <span className="text-foreground font-medium">Оператор</span> –
                физическое лицо (автор, создатель и администратор сервиса «Aether
                Oracle»), самостоятельно организующее и осуществляющее обработку
                персональных данных на Сайте;
              </li>
              <li>
                <span className="text-foreground font-medium">Пользователь</span>{" "}
                – физическое лицо, осуществляющее доступ к Сайту и
                использующее его материалы и сервисы;
              </li>
              <li>
                <span className="text-foreground font-medium">
                  Трансграничная передача персональных данных
                </span>{" "}
                – передача персональных данных на территорию иностранного
                государства органу власти иностранного государства, иностранному
                физическому или иностранному юридическому лицу;
              </li>
              <li>
                <span className="text-foreground font-medium">
                  Уничтожение персональных данных
                </span>{" "}
                – действия, в результате которых персональные данные уничтожаются
                безвозвратно с невозможностью восстановления в информационной
                системе.
              </li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-serif font-semibold text-foreground flex items-center gap-2">
              <Database className="w-5 h-5 text-primary" />
              2. Категории и состав обрабатываемых данных
            </h2>
            <p className="text-base leading-relaxed text-justify text-muted-foreground">
              Оператор обрабатывает следующие персональные данные Пользователя:
            </p>
            <ul className="list-disc pl-6 space-y-3 text-base leading-relaxed text-justify text-muted-foreground">
              <li>
                <span className="text-foreground font-medium">
                  2.1. Учётные данные аутентификации (интеграция платформы
                  Clerk).
                </span>{" "}
                Адрес электронной почты (e-mail), никнейм/псевдоним,
                идентификатор в системе авторизации, фото профиля (аватар).
              </li>
              <li>
                <span className="text-foreground font-medium">
                  2.2. Астрологические и расчётные данные.
                </span>{" "}
                Дата рождения, точное время и город рождения, текущий город
                проживания, пол. Обработка этих данных осуществляется
                исключительно для алгоритмического расчёта натальных карт,
                Матрицы Судьбы, столпов Бацзы, раскладов Ци Мэнь Дунь Цзя и
                формирования персональных рекомендаций.
              </li>
              <li>
                <span className="text-foreground font-medium">
                  2.3. Пользовательские записи.
                </span>{" "}
                Данные интерактивных модулей Сайта (заметки, записи личного
                дневника, трекер привычек).
              </li>
              <li>
                <span className="text-foreground font-medium">
                  2.4. Технические данные и файлы Cookie.
                </span>{" "}
                На Сайте не используются сторонние маркетинговые сервисы
                веб-аналитики (Яндекс.Метрика, Google Analytics и аналогичные),
                а также не осуществляется сбор данных в рекламных целях или для
                профилирования пользователей.
              </li>
              <li>
                На Сайте используются исключительно технические файлы cookie
                (cookie) и локальное хранилище браузера (localStorage),
                необходимые для поддержания сессии через Clerk, сохранения темы
                интерфейса и фиксации согласия с правилами
                «oracle_cookie_consent»;
              </li>
              <li>
                Логи инфраструктуры хостинга (IP-адрес, тип браузера, время
                обращения) обрабатываются исключительно для предотвращения
                сетевых атак, предотвращения спама и обеспечения
                отказоустойчивости Сайта.
              </li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-serif font-semibold text-foreground flex items-center gap-2">
              <Eye className="w-5 h-5 text-primary" />
              3. Цели обработки данных
            </h2>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground leading-relaxed text-justify">
              <li>
                Регистрация и безопасная аутентификация Пользователя через
                платформу Clerk;
              </li>
              <li>
                Генерация персональных метафизических, нумерологических и
                астрологических расчетов (Бацзы, Матрица Судьбы, транзиты,
                прогнозы дня);
              </li>
              <li>
                Обеспечение функционирования интерактивных модулей (личный
                дневник, заметки, трекер привычек);
              </li>
              <li>
                Защита учетных записей от несанкционированного доступа и
                обеспечение стабильной работы Сайта.
              </li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-serif font-semibold text-foreground flex items-center gap-2">
              <Scale className="w-5 h-5 text-primary" />
              4. Правовые основания обработки персональных данных
            </h2>
            <p className="text-base leading-relaxed text-justify text-muted-foreground">
              Правовыми основаниями обработки персональных данных Оператором
              являются:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground leading-relaxed text-justify">
              <li>
                нормы ст. 6 Федерального закона от 27.07.2006 № 152-ФЗ «О
                персональных данных»;
              </li>
              <li>
                согласие Пользователя на обработку персональных данных,
                предоставляемое при регистрации учетной записи на Сайте или при
                заполнении форм расчёта;
              </li>
              <li>
                необходимость исполнения Пользовательского соглашения сервиса
                «Aether Oracle» для предоставления Пользователю функционала
                Сайта и проведения персональных расчётов.
              </li>
            </ul>
            <p className="text-base leading-relaxed text-justify text-muted-foreground">
              Оператор обрабатывает персональные данные только в случае их
              самостоятельного и добровольного предоставления Пользователем при
              регистрации или использовании Сайта.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-serif font-semibold text-foreground flex items-center gap-2">
              <Lock className="w-5 h-5 text-primary" />
              5. Порядок, способы, сроки обработки и трансграничная передача
            </h2>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground leading-relaxed text-justify">
              <li>
                <span className="text-foreground font-medium">5.1. Способы обработки:</span>{" "}
                Обработка осуществляется автоматизированным способом (сбор,
                сохранение в защищенной базе данных и математический расчет
                алгоритмов на сервере).
              </li>
              <li>
                <span className="text-foreground font-medium">
                  5.2. Обезличивание и аналитика алгоритмов:
                </span>{" "}
                Оператор вправе осуществлять обезличивание персональных данных
                (отвязку астрологических параметров от адреса электронной почты и
                профиля Пользователя) в целях тестирования точности расчетных
                алгоритмов, оптимизации математических моделей сервиса и
                статистических исследований. Обезличенные данные не позволяют
                установить личность Пользователя и не относятся к персональным
                данным согласно ст. 3 Закона.
              </li>
              <li>
                <span className="text-foreground font-medium">
                  5.3. Трансграничная передача данных:
                </span>{" "}
                В связи с использованием облачной серверной инфраструктуры
                хостинга Render и международной системы аутентификации Clerk,
                обработка и хранение технических данных учетной записи могут
                осуществляться с использованием серверов, расположенных за
                пределами Российской Федерации. Оператор убеждается в том, что
                иностранными государствами, на территорию которых осуществляется
                передача, обеспечивается адекватная защита прав субъектов
                персональных данных. Регистрируясь на Сайте, Пользователь
                выражает свое прямое согласие на трансграничную передачу данных в
                объеме, необходимом для обеспечения доступа к функционалу Сайта в
                соответствии со ст. 12 Закона.
              </li>
              <li>
                <span className="text-foreground font-medium">
                  5.4. Сроки хранения:
                </span>{" "}
                Персональные данные хранятся в течение всего срока активности
                учетной записи Пользователя. Хранение прекращается при
                самостоятельном удалении аккаунта, получении отзыва согласия или
                закрытии сервиса «Aether Oracle».
              </li>
              <li>
                <span className="text-foreground font-medium">
                  5.5. Безопасность данных:
                </span>{" "}
                Данные передаются по защищенным каналам с использованием
                шифрования TLS/SSL. Персональные данные не передаются третьим
                лицам, за исключением официальных запросов госорганов РФ в
                установленном законом порядке.
              </li>
              <li>
                <span className="text-foreground font-medium">
                  5.6. Уничтожение данных:
                </span>{" "}
                При удалении аккаунта или отзыве согласия Оператор производит
                полное удаление персональных данных в срок, не превышающий 30
                (тридцать) дней.
              </li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-serif font-semibold text-foreground flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              6. Права Пользователя (субъекта персональных данных)
            </h2>
            <p className="text-base leading-relaxed text-justify text-muted-foreground">
              Каждый Пользователь имеет право:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground leading-relaxed text-justify">
              <li>
                Получать информацию, касающуюся обработки его персональных
                данных;
              </li>
              <li>
                Требовать от Оператора уточнения своих персональных данных, их
                блокирования или уничтожения в случае, если данные являются
                неполными, устаревшими или неточными;
              </li>
              <li>
                В любой момент отозвать свое согласие на обработку персональных
                данных, направив соответствующее требование Оператору по
                электронной почте.
              </li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-serif font-semibold text-foreground flex items-center gap-2">
              <ScrollText className="w-5 h-5 text-primary" />
              7. Заключительные положения
            </h2>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground leading-relaxed text-justify">
              <li>
                <span className="text-foreground font-medium">
                  7.1. Изменение Политики:
                </span>{" "}
                Оператор имеет право вносить изменения в настоящую Политику в
                одностороннем порядке. Новая редакция вступает в силу с момента
                ее публикации на Сайте.
              </li>
              <li>
                <span className="text-foreground font-medium">
                  7.2. Обращения и запросы:
                </span>{" "}
                Все вопросы, предложения, а также запросы на отзыв согласия или
                удаление персональных данных направляются Пользователем по
                электронной почте:{" "}
                <a href="mailto:trimorion@inbox.ru" className={linkClass}>
                  trimorion@inbox.ru
                </a>
                .
              </li>
              <li>
                <span className="text-foreground font-medium">
                  7.3. Актуальная редакция:
                </span>{" "}
                Действующая редакция Политики постоянно доступна по адресу:{" "}
                <a
                  href="https://aether-oracle-web.onrender.com/privacy-policy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={linkClass}
                >
                  https://aether-oracle-web.onrender.com/privacy-policy
                </a>
                .
              </li>
            </ul>
          </section>

          <section
            id="personal-data-consent"
            className="space-y-3 scroll-mt-24"
          >
            <h2 className="text-xl font-serif font-semibold text-foreground flex items-center gap-2">
              <ScrollText className="w-5 h-5 text-primary" />
              8. Согласие на обработку персональных данных
            </h2>
            <p className="text-base leading-relaxed text-justify text-muted-foreground">
              Регистрируясь на сайте «<a href="https://aether-oracle-web.onrender.com" target="_blank" rel="noopener noreferrer" className={linkClass}>https://aether-oracle-web.onrender.com</a>» и начиная пользоваться его сервисами, я даю согласие Администрации сервиса «Aether Oracle» (Оператору) на обработку, в том числе на сбор, систематизацию, накопление, хранение (уточнение, обновление, изменение), использование, передачу третьим лицам, обезличивание, блокирование и уничтожение моих персональных данных – псевдонима, имени, даты и времени рождения, пола, города рождения, города проживания, адреса электронной почты. Целью данного согласия является предоставление мне функционала Сайта, алгоритмических расчетов, возможности участия в чате сообщества и интерактивных модулях Сайта, а также получения обратной связи.
            </p>
            <p className="text-base leading-relaxed text-justify text-muted-foreground">
              Настоящим, я также даю свое прямое согласие на трансграничную передачу моих персональных данных (с использованием инфраструктуры хостинга Render и международной системы аутентификации Clerk), в том числе на территории иностранных государств, не включенных в перечень, утвержденный Приказом Роскомнадзора от 15.03.2013 N 274, для выполнения вышеуказанных целей обработки персональных данных.
            </p>
            <p className="text-base leading-relaxed text-justify text-muted-foreground">
              Подтверждаю, что персональные данные и иные сведения, относящиеся ко мне, предоставлены мною Сайту путем внесения их при регистрации на сайте <a href="https://aether-oracle-web.onrender.com" target="_blank" rel="noopener noreferrer" className={linkClass}>https://aether-oracle-web.onrender.com</a> добровольно и являются достоверными.
            </p>
            <p className="text-base leading-relaxed text-justify text-muted-foreground">
              Я согласен, что мои персональные данные будут обрабатываться способами, соответствующими целям обработки персональных данных, без возможности принятия юридически значимых решений на основании исключительно автоматизированной обработки моих персональных данных.
            </p>
            <p className="text-base leading-relaxed text-justify text-muted-foreground">
              Настоящее согласие может быть отозвано мной в любой момент путем направления электронного требования в адрес администрации Сайта. Адрес электронной почты: <a href="mailto:trimorion@inbox.ru" className={linkClass}>trimorion@inbox.ru</a>.
            </p>
          </section>
        </article>
      </main>
    </div>
  );
}
