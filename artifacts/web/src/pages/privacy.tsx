import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function PrivacyPage() {
  const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");
  const updated = "29 июня 2026 г.";

  return (
    <div className="min-h-screen bg-background text-foreground relative overflow-hidden">
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-primary/15 rounded-full blur-[120px] pointer-events-none mix-blend-screen"></div>

      <header className="container mx-auto px-6 py-6 flex justify-between items-center relative z-10">
        <Link href="/">
          <div className="flex items-center gap-3 cursor-pointer">
            <img
              src={`${basePath}/logo.png`}
              alt="Этер Оракул"
              className="w-9 h-9 object-contain"
            />
            <span className="font-serif text-xl font-bold tracking-wide">
              Этер Оракул
            </span>
          </div>
        </Link>
        <Link href="/sign-up">
          <Button variant="outline" className="border-border hover:bg-card">
            <ArrowLeft className="w-4 h-4 mr-2" />
            К регистрации
          </Button>
        </Link>
      </header>

      <main className="container mx-auto px-6 py-10 relative z-10 max-w-3xl">
        <article className="bg-card/40 backdrop-blur-md border border-border rounded-3xl p-8 md:p-12 space-y-8">
          <div className="space-y-2">
            <h1 className="text-3xl md:text-4xl font-serif font-bold">
              Политика обработки персональных данных
            </h1>
            <p className="text-sm text-muted-foreground">
              Дата последнего обновления: {updated}
            </p>
          </div>

          <section className="space-y-3">
            <h2 className="text-xl font-serif font-semibold">
              1. Общие положения
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              Настоящая Политика обработки персональных данных (далее —
              «Политика») определяет порядок обработки и защиты сведений о
              физических лицах (далее — «Пользователи»), использующих
              веб-платформу «Этер Оракул» (далее — «Сервис»). Используя Сервис и
              регистрируя учётную запись, Пользователь подтверждает своё согласие
              с условиями настоящей Политики.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-serif font-semibold">
              2. Какие данные мы обрабатываем
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              В зависимости от используемых разделов Сервиса мы можем
              обрабатывать следующие категории данных, которые Пользователь
              предоставляет добровольно:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground leading-relaxed">
              <li>
                Учётные данные: адрес электронной почты, имя, фотография профиля
                и иные сведения, передаваемые при аутентификации.
              </li>
              <li>
                Данные рождения: дата, время и место рождения, город проживания —
                для расчётов Матрицы Судьбы, Бацзы и Фэн-шуй.
              </li>
              <li>
                Сведения из раздела «Мой дневник»: ключевые события жизни (брак,
                развод, рождение детей, переезды, смена работы, потери близких).
              </li>
              <li>
                Данные о здоровье (специальная категория): рост, вес, группа
                крови, хронические заболевания, аллергии, сведения о курении,
                страхи, дата начала последней менструации.
              </li>
              <li>
                Содержимое, создаваемое Пользователем: записи снов, привычки,
                контакты, отметки путешествий и сообщения в общем чате.
              </li>
            </ul>
            <p className="text-muted-foreground leading-relaxed">
              Все перечисленные данные не являются обязательными к заполнению.
              Пользователь самостоятельно решает, какие сведения предоставлять.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-serif font-semibold">
              3. Цели обработки
            </h2>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground leading-relaxed">
              <li>
                Предоставление функций Сервиса: формирование ежедневных прогнозов
                и расчётов по эзотерическим системам.
              </li>
              <li>
                Персонализация контента и взаимодействие предоставленных данных с
                натальной картой Пользователя.
              </li>
              <li>Обеспечение работы учётной записи и аутентификации.</li>
              <li>Поддержка, улучшение качества и безопасности Сервиса.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-serif font-semibold">
              4. Правовое основание
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              Обработка персональных данных осуществляется на основании согласия
              Пользователя, которое он даёт при регистрации и при добровольном
              вводе данных в соответствующих разделах. Обработка данных о здоровье
              осуществляется исключительно с явного согласия Пользователя и только
              для целей, указанных в настоящей Политике.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-serif font-semibold">
              5. Хранение и защита
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              Данные хранятся в защищённой базе данных и доступны только в рамках
              учётной записи самого Пользователя. Мы применяем организационные и
              технические меры для защиты данных от несанкционированного доступа,
              изменения или уничтожения. Данные хранятся до момента удаления
              учётной записи Пользователем либо до отзыва согласия.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-serif font-semibold">
              6. Передача третьим лицам
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              Для обеспечения аутентификации и хостинга Сервис использует
              сторонних поставщиков услуг (в частности, сервис управления
              учётными записями и облачную инфраструктуру). Такие поставщики
              обрабатывают данные исключительно в объёме, необходимом для работы
              Сервиса. Мы не продаём персональные данные и не передаём их третьим
              лицам в рекламных целях.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-serif font-semibold">
              7. Права Пользователя
            </h2>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground leading-relaxed">
              <li>Получать информацию об обработке своих данных.</li>
              <li>
                Изменять и дополнять свои данные в настройках профиля и разделах
                Сервиса.
              </li>
              <li>
                Удалить свою учётную запись и связанные с ней данные, а также
                отозвать ранее данное согласие.
              </li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-serif font-semibold">
              8. Изменения Политики
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              Мы вправе обновлять настоящую Политику. Актуальная версия всегда
              доступна на этой странице. Существенные изменения вступают в силу с
              момента их публикации.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-serif font-semibold">9. Контакты</h2>
            <p className="text-muted-foreground leading-relaxed">
              По вопросам обработки персональных данных Пользователь может
              обратиться к администрации Сервиса через указанные в учётной записи
              каналы связи.
            </p>
          </section>

          <div className="pt-4 border-t border-border">
            <Link href="/sign-up">
              <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
                Вернуться к регистрации
              </Button>
            </Link>
          </div>
        </article>
      </main>

      <footer className="py-8 text-center text-muted-foreground text-sm relative z-10">
        <p>© {new Date().getFullYear()} Этер Оракул</p>
      </footer>
    </div>
  );
}
