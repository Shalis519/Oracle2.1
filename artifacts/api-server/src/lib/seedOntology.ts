import { sql } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { and, eq } from "drizzle-orm";
import {
  db,
  ontologyEntitiesTable,
  ontologyThemesTable,
  ontologyEntityThemesTable,
  ontologyEntityProfilesTable,
  ontologyEntityRelationsTable,
  motivationPhrasesTable,
  cinderellaInterpretationsTable,
  synastryInterpretationsTable,
  synastryHouseInterpretationsTable,
} from "@workspace/db";
import { logger } from "./logger";
import { ARCANA } from "./data/arcana";

export async function seedOntology() {
  console.log("Seeding ontology...");

  // ─── Жизненные темы ───
  const themeRows = await db
    .insert(ontologyThemesTable)
    .values([
      { name: "Любовь", slug: "love", description: "Отношения, романтика, брак, гармония" },
      { name: "Карьера", slug: "career", description: "Работа, профессия, амбиции, деловая энергия" },
      { name: "Здоровье", slug: "health", description: "Тело, энергии, иммунитет, исцеление" },
      { name: "Деньги", slug: "money", description: "Доход, имущество, инвестиции, материальное благо" },
      { name: "Семья", slug: "family", description: "Род, дети, домашний очаг, поколения" },
      { name: "Творчество", slug: "creativity", description: "Искусство, самовыражение, проекты, вдохновение" },
      { name: "Духовность", slug: "spirituality", description: "Смысл, вера, медитация, высшее назначение" },
      { name: "Общение", slug: "communication", description: "Речь, диалог, переговоры, информация" },
      { name: "Учёба", slug: "education", description: "Знания, навыки, обучение, исследования" },
      { name: "Путешествия", slug: "travel", description: "Перемещения, иное, расширение горизонтов" },
      { name: "Борьба", slug: "struggle", description: "Препятствия, конфликты, вызов, кризис" },
      { name: "Свобода", slug: "freedom", description: "Независимость, прорыв, освобождение, революция" },
      { name: "Интеллект", slug: "intellect", description: "Мышление, анализ, познание, интеллектуальная деятельность" },
      { name: "Соседи", slug: "neighbors", description: "Ближнее окружение, соседство, локальные связи" },
      { name: "Братья и сёстры", slug: "siblings", description: "Родственники, близкие по возрасту, передача опыта" },
      { name: "Короткие путешествия", slug: "short-trips", description: "Поездки на выходные, смена обстановки, локальные перемещения" },
      { name: "Перемены", slug: "changes", description: "Трансформации, новации, смена статус-кво" },
      { name: "Инновации", slug: "innovations", description: "Новые идеи, передовые технологии, творческий прорыв" },
      { name: "Будущее", slug: "future", description: "Перспектива, ориентация вперёд, прогноз" },
      { name: "Независимость", slug: "independence", description: "Автономия, самостоятельность, освобождение от зависимости" },
      { name: "Технологии", slug: "technology", description: "IT, гаджеты, техника, дигитальные инструменты" },
      { name: "Эмоции", slug: "emotions", description: "Чувства, настроения, эмоциональный интеллект" },
      { name: "Привычки", slug: "habits", description: "Автоматизмы, рутина, повседневность" },
      { name: "Забота", slug: "care", description: "Внимание к другим, забота, поддержка" },
      { name: "Интуиция", slug: "intuition", description: "Внутреннее знание, инстинкт, предчувствие" },
      { name: "Дом", slug: "home", description: "Жилое пространство, уют, безопасность" },
      { name: "Мать", slug: "mother", description: "Материнская энергия, забота, покров" },
      { name: "Память", slug: "memory", description: "Воспоминания, прошлое, ностальгия" },
      { name: "Подсознание", slug: "subconscious", description: "Глубинный разум, сны, инстинкты" },
      { name: "Отношения", slug: "relationships", description: "Партнерство, единство, связи, общность" },
      { name: "Искусство", slug: "art", description: "Творчество, вдохновение, эстетика, ремесло" },
      { name: "Удовольствия", slug: "pleasures", description: "Наслаждения, удовольствие, любовь, радость" },
      { name: "Развлечения", slug: "entertainment", description: "Игры, отдых, досуг и приятное времяпрепровождение" },
      { name: "Дети", slug: "children", description: "Дети, забота о детях, радость общения и связь с ними" },
      { name: "Спорт", slug: "sport", description: "Физическая активность, соревнования, тренировки и развитие формы" },
      { name: "Ценности", slug: "values", description: "Ценности, принципы, этика, критерии" },
      { name: "Красота", slug: "beauty", description: "Эстетика, внешний вид, грация, искусство оформления" },
      { name: "Гармония", slug: "harmony", description: "Баланс, согласованность, мир, единство" },
      { name: "Финансы", slug: "finances", description: "Деньги, имущество, инвестиции, доход" },
      { name: "Действие", slug: "action", description: "Реализация задуманного, движение вперёд" },
      { name: "Энергия", slug: "energy", description: "Жизненная сила, активность, движение" },
      { name: "Инициатива", slug: "initiative", description: "Первый шаг, начало действий" },
      { name: "Страсть", slug: "passion", description: "Сильные чувства, огонь внутри" },
      { name: "Сила", slug: "strength", description: "Внутренняя и внешняя мощь" },
      { name: "Конкуренция", slug: "competition", description: "Соревновательный дух, желание быть лучшим" },
      { name: "Конкурсы", slug: "contests", description: "Творческие, спортивные и игровые состязания, участие и демонстрация способностей" },
      { name: "Защита", slug: "protection", description: "Физическая и эмоциональная защита близких" },
      { name: "Смелость", slug: "courage", description: "Отвага, готовность действовать" },
    ])
    .onConflictDoUpdate({
      target: ontologyThemesTable.slug,
      set: {
        name: sql`excluded.name`,
        description: sql`excluded.description`,
        updatedAt: new Date(),
      },
    })
    .returning();

  const allThemeRows = await db.select().from(ontologyThemesTable);
  const themeMap = new Map(allThemeRows.map((t) => [t.slug, t]));

  // ─── Астрологические сущности ───
  const planetDefs = [
    { name: "Солнце", code: "sun", symbol: "☉", lifeThemes: ["Эго", "Свобода", "Творчество"], keyMeaningsArr: ["Сознание", "Эго", "Жизненная сила", "Авторитет"], positiveQualities: ["Мужественность", "Прямота", "Уверенность"], shadowQualities: ["Тщеславие", "Эгоцентризм", "Нетерпимость"], positiveEmotions: ["Радость", "Гордость", "Уверенность"], negativeEmotions: ["Отчаяние", "Ярость", "Унижение"], strengthsArr: ["Лидерство", "Вдохновение", "Целеустремлённость"], weaknessesArr: ["Гордыня", "Требовательность", "Негибкость"], archetypes: ["Король", "Герой", "Творец"], professions: [], objects: [], colors: [], days: [], animals: [], places: [], materials: [], numbers: [], keyMeanings: "Сознание, эго, жизненная сила, авторитет, лидерство", psychologicalManifestations: "Стремление быть в центре, получать признание, выражать себя", emotions: "Радость, гордость, уверенность, отчаяние", strengths: "Лидерство, вдохновение, целеустремлённость, оптимизм", weaknesses: "Гордыня, требовательность, негибкость, эгоцентризм", recommendations: "Будьте автентичны, излучайте своё сознание, заботьтесь о здоровье", warnings: "Опасно подаваться от чужого мнения, искать постоянное одобрение" },
    { name: "Луна", code: "moon", symbol: "☽", lifeThemes: ["Эмоции", "Привычки", "Забота", "Интуиция", "Дом", "Мать", "Память", "Подсознание"], keyMeaningsArr: ["Интуиция", "Привычки", "Эмоции", "Забота", "Память"], positiveQualities: ["Чуткость", "Заботливость", "Интуитивность", "Адаптивность", "Восприимчивость"], shadowQualities: ["Излишняя тревожность", "Зависимость от прошлого", "Чувствительность к критике", "Капризность", "Пассивность"], positiveEmotions: ["Умиротворение", "Нежность", "Забота", "Теплота", "Принятие", "Эмпатия"], negativeEmotions: ["Тревога", "Сентиментальность", "Обида", "Привязанность к прошлому", "Зависимость", "Капризы"], strengthsArr: ["Эмпатия", "Забота", "Интуиция", "Умение создавать уют", "Память", "Глубокое чувствование"], weaknessesArr: ["Тревожность", "Зависимость от внешнего мнения", "Склонность к унынию", "Сентиментальность", "Избегание конфликтов", "Перепады настроения"], archetypes: ["Мать", "Заботливая душа", "Интуитивная женщина", "Хранительница очага"], professions: ["Психолог", "Социальный работник", "Медицинская сестра", "Воспитатель", "Учитель начальных классов", "Массажист", "Акушерка", "Нутрициолог"], objects: ["Книга рецептов", "Семейный альбом", "Свечи", "Чайная чашка", "Плед", "Блокнот для записей", "Аромалампа"], colors: ["Серебристый", "Белый", "Перламутровый", "Светло-голубой"], days: ["Понедельник"], animals: ["Кошка", "Кролик", "Дельфин", "Собака (домашняя)"], places: ["Дом", "Кухня", "Сад", "Берег водоёма", "Спальня", "Кресло у окна"], materials: ["Ткань (мягкая, тёплая)", "Посуда", "Вода (символически)", "Дерево"], numbers: [], keyMeanings: "Интуиция, привычки, эмоции, забота, память", psychologicalManifestations: "Глубокая связь с внутренним миром, заботливость, изменчивость настроения", emotions: "Умиротворение, тревога, нежность, сентиментальность", strengths: "Эмпатия, забота, интуиция, умение создавать уют", weaknesses: "Тревожность, зависимость от внешнего мнения, склонность к унынию", recommendations: "Доверяйте своей интуиции, заботьтесь о себе, создавайте уют", warnings: "Не зацикливайтесь на прошлом, избегайте эмоциональных качелей, не растворяйтесь в других" },
    { name: "Меркурий", code: "mercury", symbol: "☿", lifeThemes: ["Общение", "Учёба", "Интеллект", "Соседи", "Братья и сёстры", "Короткие путешествия"], keyMeaningsArr: ["Мышление", "Речь", "Анализ", "Коммуникация"], positiveQualities: ["Ум", "Острота", "Адаптивность"], shadowQualities: ["Переменчивость", "Поверхностность", "Суетливость", "Логические ловушки"], positiveEmotions: ["Любопытство", "Интерес", "Оживление", "Вдохновение от новых идей"], negativeEmotions: ["Беспокойство", "Тревожность", "Сомнения", "Раздражение от непонимания", "Ментальная усталость"], strengthsArr: ["Ум", "Речистость", "Аналитическое мышление"], weaknessesArr: ["Непоследовательность", "Ментальная перегрузка", "Поверхностность", "Распыление внимания"], archetypes: ["Посланник", "Учёный", "Торговец"], professions: ["Писатель", "Журналист", "Преподаватель", "Переводчик", "Программист", "Аналитик", "Маркетолог", "Веб-разработчик", "Шахматист", "Учитель", "Бегун"], objects: ["Книга", "Ноутбук", "Телефон", "Письменные принадлежности", "Календарь", "Диктофон", "Шахматная доска", "Школьная доска", "Беговые кроссовки", "Велосипед", "Ролики", "Самокат"], colors: ["Жёлтый", "Оранжевый", "Голубой", "Серебристый"], days: ["Среда"], animals: ["Лиса", "Попугай", "Белка", "Дельфин"], places: ["Библиотека", "Книжный магазин", "Университет", "Коворкинг", "Кафе для работы", "Школа", "Спортивный стадион", "Парк"], materials: ["Бумага", "Ткань (лёгкая)", "Металл (медь, алюминий)", "Стекло"], numbers: [], keyMeanings: "Мышление, речь, анализ, коммуникация", psychologicalManifestations: "Стремление к анализу, любопытство, многозадачность", emotions: "Любопытство, интерес, беспокойство", strengths: "Ум, речистость, аналитическое мышление", weaknesses: "Непоследовательность, перегрузка, поверхность", recommendations: "Пишите, читайте, обучайтесь, делитесь идеями", warnings: "Остерегайтесь поверхности, не разбрасывайте внимание" },
    { name: "Венера", code: "venus", symbol: "♀", lifeThemes: ["Любовь", "Отношения", "Красота", "Гармония", "Искусство", "Финансы", "Удовольствия", "Ценности"], keyMeaningsArr: ["Любовь", "Гармония", "Эстетика", "Ценности", "Притяжение"], positiveQualities: ["Дипломатичность", "Чувство вкуса", "Умение объединять", "Нежность", "Обаяние", "Тактичность"], shadowQualities: ["Зависимость", "Поверхность", "Избегание конфликтов", "Ревность", "Потворство желаниям", "Жертвенность"], positiveEmotions: ["Нежность", "Любовь", "Удовлетворенность", "Вдохновение", "Восторг", "Принятие"], negativeEmotions: ["Тоска", "Ревность", "Разочарование", "Обида", "Пустота", "Привязанность"], strengthsArr: ["Объединитель", "Миротворец", "Художник", "Создатель гармонии", "Дипломат", "Вдохновитель"], weaknessesArr: ["Лень", "Потворство желаниям", "Подавленность", "Зависимость от отношений", "Жертвенность", "Страх потерь"], archetypes: ["Любовница", "Художник", "Певица", "Дипломат", "Богиня любви", "Хранительница красоты"], professions: ["Художник", "Дизайнер", "Модельер", "Визажист", "Флорист", "Психолог (работа с парами)", "Свадебный организатор", "Искусствовед", "Музыкант", "Певица"], objects: ["Зеркало", "Цветы", "Украшения", "Предметы искусства", "Духи", "Косметика", "Шкатулка для украшений", "Ваза", "Парфюм"], colors: ["Розовый", "Зелёный", "Голубой", "Бежевый", "Пастельные тона", "Сиреневый"], days: ["Пятница"], animals: ["Голубь", "Лебедь", "Бабочка", "Кошечка"], places: ["Галерея", "Сад", "Ресторан", "Спа-салон", "Концертный зал", "Берег моря", "Квартира (уютная)"], materials: ["Шёлк", "Посуда (изящная)", "Фарфор", "Стекло", "Цветы", "Ароматы"], numbers: [], keyMeanings: "Любовь, гармония, эстетика, ценности, притяжение", psychologicalManifestations: "Стремление к красоте, стремление к гармонии, ценностное ориентирование", emotions: "Нежность, любовь, удовлетворенность, тоска, ревность, разочарование", strengths: "Объединитель, миротворец, художник, создатель гармонии, дипломат, вдохновитель", weaknesses: "Лень, потворство желаниям, подавленность, зависимость от отношений, жертвенность, страх потерь", recommendations: "Вкладывайте любовь в себя и окружающих, уделяйте время эстетике, создавайте гармонию", warnings: "Не впадайте в зависимость от отношений, избегайте поверхностных решений, не позволяйте страху быть собой" },
    { name: "Марс", code: "mars", symbol: "♂", lifeThemes: ["Действие", "Энергия", "Инициатива", "Страсть", "Сила", "Конкуренция", "Защита", "Смелость"], keyMeaningsArr: ["Действие", "Энергия", "Страсть", "Сила", "Инициатива"], positiveQualities: ["Смелость", "Решительность", "Энергичность", "Самостоятельность", "Сила воли"], shadowQualities: ["Агрессивность", "Импульсивность", "Раздражительность", "Конфликтность", "Вспыльчивость"], positiveEmotions: ["Воодушевление", "Уверенность", "Решимость", "Энтузиазм", "Азарт"], negativeEmotions: ["Гнев", "Раздражение", "Злость", "Нетерпение", "Фрустрация"], strengthsArr: ["Лидерство", "Смелость", "Физическая выносливость", "Умение достигать целей", "Способность защищать"], weaknessesArr: ["Импульсивность", "Агрессивность", "Нетерпение", "Конфликтность", "Склонность к риску"], archetypes: ["Воин", "Герой", "Защитник", "Победитель", "Первопроходец"], professions: ["Военный", "Спортсмен", "Хирург", "Полицейский", "Пожарный", "Строитель", "Механик", "Руководитель"], objects: ["Оружие символически", "Инструменты", "Спортивный инвентарь", "Ключи", "Молот", "Металлические предметы"], colors: ["Красный", "Оранжевый", "Бордовый", "Огненный"], days: ["Вторник"], animals: ["Волк", "Баран", "Тигр", "Орёл", "Бык"], places: ["Спортзал", "Поле битвы символически", "Строительная площадка", "Тренировочный центр", "Горы", "Пустыня"], materials: ["Металл", "Железо", "Сталь", "Огонь символически", "Камень"], numbers: [], keyMeanings: "Действие, энергия, страсть, сила, инициатива", psychologicalManifestations: "Инициативность, решительность, лидерские качества, конкуренция", emotions: "Воодушевление, уверенность, гнев, раздражение", strengths: "Лидерство, смелость, физическая выносливость, способность достигать целей", weaknesses: "Импульсивность, агрессивность, нетерпение, конфликтность", recommendations: "Действуйте решительно, но обдуманно. Направляйте энергию на достижение целей", warnings: "Остерегайтесь импульсивных решений. Не направляйте агрессию на близких" },
    { name: "Юпитер", code: "jupiter", symbol: "♃", lifeThemes: ["Удача", "Рост", "Мудрость"], keyMeaningsArr: ["Рост", "Удача", "Мудрость", "Стремление"], positiveQualities: ["Мудрость", "Щедрость", "Оптимизм"], shadowQualities: ["Неумеренность", "Расточность", "Раскошность"], positiveEmotions: ["Откровенность", "Веселье", "Благодарность"], negativeEmotions: ["Надменность", "Гордыня", "Непомерность"], strengthsArr: ["Мудрец", "Защитник", "Философ"], weaknessesArr: ["Расточность", "Лень", "Неумеренность"], archetypes: ["Учитель", "Жрец", "Философ"], professions: [], objects: [], colors: [], days: [], animals: [], places: [], materials: [], numbers: [], keyMeanings: "Рост, удача, мудрость, стремление", psychologicalManifestations: "Оптимизм, стремление к росту, щедрость", emotions: "Откровенность, веселье, благодарность", strengths: "Мудрец, защитник, философ", weaknesses: "Расточность, лень, неумеренность", recommendations: "Учитесь, путешествуйте, делитесь знаниями", warnings: "Остерегайтесь переедания, раскошности" },
    { name: "Сатурн", code: "saturn", symbol: "♔", lifeThemes: ["Карьера", "Ответственность", "Время"], keyMeaningsArr: ["Структура", "Дисциплина", "Ограничение", "Время"], positiveQualities: ["Дисциплина", "Ответственность", "Настойчивость"], shadowQualities: ["Жестокость", "Ограниченность", "Депрессия"], positiveEmotions: ["Спокойствие", "Уважение", "Уверенность"], negativeEmotions: ["Страх", "Одиночество", "Отчаяние"], strengthsArr: ["Мастер", "Строитель", "Организатор"], weaknessesArr: ["Жестокость", "Медлительность", "Пессимизм"], archetypes: ["Старец", "Жрец", "Испытатель"], professions: [], objects: [], colors: [], days: [], animals: [], places: [], materials: [], numbers: [], keyMeanings: "Структура, дисциплина, ограничение, время", psychologicalManifestations: "Необходимость структуры, ответственность", emotions: "Спокойствие, страх, уважение", strengths: "Мастер, строитель, организатор", weaknesses: "Жестокость, медлительность", recommendations: "Планируйте, работайте систематически", warnings: "Не застривайте в ограничениях" },
    { name: "Уран", code: "uranus", symbol: "♅", lifeThemes: ["Свобода", "Перемены", "Инновации", "Будущее", "Независимость"], keyMeaningsArr: ["Озарение", "Неожиданность", "Свобода", "Будущее", "Инновации"], positiveQualities: ["Оригинальность", "Смелость", "Дальновидность"], shadowQualities: ["Непредсказуемость", "Хаотичность", "Эпатажность"], positiveEmotions: ["Воодушевление", "Предвкушение", "Освобождение", "Вдохновение"], negativeEmotions: ["Тревога перед неизвестным", "Отчуждение", "Разрыв", "Хаос"], strengthsArr: ["Оригинальность", "Инновационное мышление", "Смелость перемен"], weaknessesArr: ["Непоследовательность", "Безрассудство", "Отрыв от реальности", "Нестабильность"], archetypes: ["Революционер", "Изобретатель", "Бунтарь"], professions: ["Изобретатель", "Астроном", "IT-специалист", "Футуролог", "Бунтарь (активист)"], objects: ["Электроника", "Компьютер", "Книги по футурологии", "Необычные вещи", "Новые технологии"], colors: ["Фиолетовый", "Синий", "Серебряный"], days: ["Суббота"], animals: ["Сокол", "Орел"], places: ["Лаборатория", "Обсерватория", "Космопорт (символически)", "IT-кластер"], materials: ["Металл", "Стекло", "Провода", "Кремний"], numbers: [], keyMeanings: "Озарение, неожиданность, свобода, будущее, инновации", psychologicalManifestations: "Оригинальность, независимость, поиск нового", emotions: "Воодушевление, предвкушение, освобождение", strengths: "Оригинальность, инновационное мышление, смелость перемен", weaknesses: "Непоследовательность, безрассудство, отрыв от реальности", recommendations: "Смотрите вперёд, принимайте новое, создавайте будущее", warnings: "Остерегайтесь хаоса, не разрывайте важные связи бездумно" },
    { name: "Нептун", code: "neptune", symbol: "♆", lifeThemes: ["Духовность", "Мечты", "Искусство"], keyMeaningsArr: ["Мечты", "Интуиция", "Трансцендентность", "Сострадание"], positiveQualities: ["Эмпатия", "Творческое воображение", "Сжелающая способность"], shadowQualities: ["Иллюзии", "Зависимость", "Уклонение"], positiveEmotions: ["Восхищение", "Вдохновение", "Успокоение"], negativeEmotions: ["Растерянность", "Сомнения", "Уязвимость"], strengthsArr: ["Мистик", "Художник", "Целитель"], weaknessesArr: ["Рассеянность", "Обман", "Зависимость"], archetypes: ["Мистик", "Мечтатель", "Спаситель"], professions: [], objects: [], colors: [], days: [], animals: [], places: [], materials: [], numbers: [], keyMeanings: "Мечты, интуиция, трансцендентность", psychologicalManifestations: "Эмпатия, интуиция, стремление к идеальному", emotions: "Восхищение, вдохновение, растерянность", strengths: "Мистик, художник, целитель", weaknesses: "Рассеянность, обман, зависимость", recommendations: "Медитируйте, занимайтесь искусством", warnings: "Остерегайтесь иллюзий, проверяйте реальность" },
    { name: "Плутон", code: "pluto", symbol: "♇", lifeThemes: ["Трансформация", "Власть", "Тайны"], keyMeaningsArr: ["Трансформация", "Власть", "Глубина", "Регенерация"], positiveQualities: ["Глубина", "Решимость", "Психологическая сила"], shadowQualities: ["Манипуляция", "Обсессивность", "Контроль"], positiveEmotions: ["Страсть", "Сила", "Уверенность"], negativeEmotions: ["Ревность", "Ненависть", "Обсессия"], strengthsArr: ["Психолог", "Исцелитель", "Преображатель"], weaknessesArr: ["Контроль", "Подозрительность", "Разрушение"], archetypes: ["Маг", "Шаман", "Король под миров"], professions: [], objects: [], colors: [], days: [], animals: [], places: [], materials: [], numbers: [], keyMeanings: "Трансформация, власть, глубина", psychologicalManifestations: "Психологическая глубина, магнитность, регенерация", emotions: "Страсть, глубина, ревность", strengths: "Психолог, исцелитель, преображатель", weaknesses: "Контроль, подозрительность, разрушение", recommendations: "Исследуйте подсознанное, практикуйте психотерапию", warnings: "Остерегайтесь манипуляций, не торгуйте прошлым" },
  ];

  const signDefs = [
    { name: "Овен", code: "aries", symbol: "♈", lifeThemes: ["Свобода", "Борьба", "Лидерство"], keyMeaningsArr: ["Начало", "Импульс", "Смелость", "Независимость"], positiveQualities: ["Храбрость", "Прямота", "Смелость"], shadowQualities: ["Нетерпение", "Импульсивность", "Эгоцентризм"], positiveEmotions: ["Воодушевление", "Страсть", "Уверенность"], negativeEmotions: ["Гнев", "Раздражение", "Импатиентность"], strengthsArr: ["Лидер", "Пионер", "Боец"], weaknessesArr: ["Поспешность", "Агрессия", "Эгоцентризм"], archetypes: ["Воин", "Пионер", "Лидер"], professions: [], objects: [], colors: [], days: [], animals: [], places: [], materials: [], numbers: [], keyMeanings: "Начало, импульс, смелость", psychologicalManifestations: "Прямота, импульсивность, стремление к победе", emotions: "Воодушевление, страсть, гнев", strengths: "Лидер, пионер, боец", weaknesses: "Поспешность, агрессия", recommendations: "Замедляйте, подумайте перед действием", warnings: "Остерегайтесь импульса, конфликтов" },
    { name: "Телец", code: "taurus", symbol: "♉", lifeThemes: ["Деньги", "Красота", "Комфорт"], keyMeaningsArr: ["Стабильность", "Материальное", "Упорство", "Наслаждение"], positiveQualities: ["Надёжность", "Практичность", "Терпение"], shadowQualities: ["Упрямство", "Материализм", "Лень"], positiveEmotions: ["Удовлетворенность", "Спокойствие", "Благодарность"], negativeEmotions: ["Упрямство", "Жадность", "Обида"], strengthsArr: ["Строитель", "Художник", "Финансист"], weaknessesArr: ["Упрямство", "Лень", "Материализм"], archetypes: ["Строитель", "Художник", "Сенсуалист"], professions: [], objects: [], colors: [], days: [], animals: [], places: [], materials: [], numbers: [], keyMeanings: "Стабильность, материальное, упорство", psychologicalManifestations: "Практичность, необходимость стабильности", emotions: "Удовлетворенность, спокойствие, упрямство", strengths: "Строитель, художник, финансист", weaknesses: "Упрямство, лень", recommendations: "Создавайте красоту, не спешите", warnings: "Остерегайтесь жадности, упрямства" },
    { name: "Близнецы", code: "gemini", symbol: "♊", lifeThemes: ["Общение", "Учёба", "Интеллект"], keyMeaningsArr: ["Коммуникация", "Гибкость", "Любознательность", "Многообразие"], positiveQualities: ["Ум", "Адаптивность", "Общительность"], shadowQualities: ["Поверхность", "Непоследовательность", "Нерешительность"], positiveEmotions: ["Любопытство", "Возбуждение", "Открытость"], negativeEmotions: ["Беспокойство", "Тревожность", "Рассеянность"], strengthsArr: ["Коммуникатор", "Учёный", "Писатель"], weaknessesArr: ["Поверхность", "Непоследовательность", "Беспокойство"], archetypes: ["Посланник", "Ученый", "Торговец"], professions: [], objects: [], colors: [], days: [], animals: [], places: [], materials: [], numbers: [], keyMeanings: "Коммуникация, гибкость, любознательность", psychologicalManifestations: "Любопытство, адаптивность, многозадачность", emotions: "Любопытство, возбуждение, беспокойство", strengths: "Коммуникатор, учёный, писатель", weaknesses: "Поверхность, непоследовательность", recommendations: "Пишите, учитесь, делитеся идеями", warnings: "Остерегайтесь поверхности, не разбрасывайте внимание" },
    { name: "Рак", code: "cancer", symbol: "♋", lifeThemes: ["Семья", "Эмоции", "Забота"], keyMeaningsArr: ["Эмоциональность", "Забота", "Интуиция", "Защита"], positiveQualities: ["Чувствительность", "Забота", "Преданность"], shadowQualities: ["Ранимость", "Зажатость", "Уязвимость"], positiveEmotions: ["Нежность", "Забота", "Сострадание"], negativeEmotions: ["Ранимость", "Обида", "Тоска"], strengthsArr: ["Хранитель", "Целитель", "Психолог"], weaknessesArr: ["Уязвимость", "Зависимость", "Меланхолия"], archetypes: ["Мать", "Хранительница", "Целитель"], professions: [], objects: [], colors: [], days: [], animals: [], places: [], materials: [], numbers: [], keyMeanings: "Эмоциональность, забота, интуиция", psychologicalManifestations: "Эмоциональная чувствительность, забота", emotions: "Нежность, забота, ранимость", strengths: "Хранитель, целитель, психолог", weaknesses: "Уязвимость, зависимость", recommendations: "Создавайте уют, заботьтесь о семье", warnings: "Остерегайтесь ранимости, зависимости" },
    { name: "Лев", code: "leo", symbol: "♌", lifeThemes: ["Свобода", "Творчество", "Лидерство"], keyMeaningsArr: ["Самовыражение", "Творчество", "Сила воли", "Воодушевление"], positiveQualities: ["Мужественность", "Щедрота", "Теплота"], shadowQualities: ["Тщеславие", "Гордыня", "Доминирование"], positiveEmotions: ["Радость", "Гордость", "Уверенность"], negativeEmotions: ["Обида", "Тщеславие", "Раздражение"], strengthsArr: ["Лидер", "Артист", "Щедрый сердцем"], weaknessesArr: ["Гордыня", "Тщеславие", "Доминирование"], archetypes: ["Король", "Артист", "Герой"], professions: [], objects: [], colors: [], days: [], animals: [], places: [], materials: [], numbers: [], keyMeanings: "Самовыражение, творчество, сила воли", psychologicalManifestations: "Стремление к признанию, мужественность", emotions: "Радость, гордость, уверенность", strengths: "Лидер, артист, щедрый", weaknesses: "Гордыня, тщеславие", recommendations: "Творчествуйте, выражайте себя, дарите", warnings: "Остерегайтесь гордыни, тщеславия" },
    { name: "Дева", code: "virgo", symbol: "♍", lifeThemes: ["Здоровье", "Учёба", "Работа"], keyMeaningsArr: ["Анализ", "Сервис", "Совершенство", "Здоровье"], positiveQualities: ["Точность", "Скромность", "Практичность"], shadowQualities: ["Критичность", "Тревожность", "Переборчивость"], positiveEmotions: ["Спокойствие", "Удовлетворенность", "Уверенность"], negativeEmotions: ["Тревожность", "Критичность", "Переборчивость"], strengthsArr: ["Аналитик", "Целитель", "Сервис"], weaknessesArr: ["Критичность", "Тревожность", "Переборчивость"], archetypes: ["Целитель", "Сервис", "Аналитик"], professions: [], objects: [], colors: [], days: [], animals: [], places: [], materials: [], numbers: [], keyMeanings: "Анализ, сервис, совершенство", psychologicalManifestations: "Аналитическое мышление, стремление к порядку", emotions: "Спокойствие, удовлетворенность, тревожность", strengths: "Аналитик, целитель, сервис", weaknesses: "Критичность, тревожность", recommendations: "Работайте систематически, заботьтесь о здоровье", warnings: "Не критикуйте себя слишком" },
    { name: "Весы", code: "libra", symbol: "♎", lifeThemes: ["Любовь", "Гармония", "Справедливость"], keyMeaningsArr: ["Гармония", "Справедливость", "Красота", "Отношения"], positiveQualities: ["Дипломатичность", "Справедливость", "Эстетичность"], shadowQualities: ["Нерешительность", "Зависимость", "Поверхность"], positiveEmotions: ["Гармония", "Удовлетворенность", "Радость"], negativeEmotions: ["Нерешительность", "Растерянность", "Тоска"], strengthsArr: ["Дипломат", "Художник", "Переговорщик"], weaknessesArr: ["Нерешительность", "Зависимость", "Поверхность"], archetypes: ["Дипломат", "Художник", "Судья"], professions: [], objects: [], colors: [], days: [], animals: [], places: [], materials: [], numbers: [], keyMeanings: "Гармония, справедливость, красота", psychologicalManifestations: "Дипломатичность, стремление к гармонии", emotions: "Гармония, удовлетворенность, нерешительность", strengths: "Дипломат, художник, переговорщик", weaknesses: "Нерешительность, зависимость", recommendations: "Создавайте красоту, ищите баланс", warnings: "Не теряйте себя, остерегайтесь поверхности" },
    { name: "Скорпион", code: "scorpio", symbol: "♏", lifeThemes: ["Трансформация", "Власть", "Тайны"], keyMeaningsArr: ["Глубина", "Страсть", "Тайна", "Регенерация"], positiveQualities: ["Решимость", "Психологическая сила", "Интуиция"], shadowQualities: ["Манипуляция", "Ревность", "Подозрительность"], positiveEmotions: ["Страсть", "Сила", "Уверенность"], negativeEmotions: ["Ревность", "Ненависть", "Обсессия"], strengthsArr: ["Психолог", "Исцелитель", "Преображатель"], weaknessesArr: ["Контроль", "Подозрительность", "Разрушение"], archetypes: ["Маг", "Шаман", "Король под миров"], professions: [], objects: [], colors: [], days: [], animals: [], places: [], materials: [], numbers: [], keyMeanings: "Глубина, страсть, тайна, регенерация", psychologicalManifestations: "Психологическая глубина, магнитность", emotions: "Страсть, глубина, ревность", strengths: "Психолог, исцелитель, преображатель", weaknesses: "Контроль, подозрительность", recommendations: "Исследуйте подсознанное, практикуйте психотерапию", warnings: "Остерегайтесь манипуляций" },
    { name: "Стрелец", code: "sagittarius", symbol: "♐", lifeThemes: ["Путешествия", "Учёба", "Свобода"], keyMeaningsArr: ["Стремление", "Философия", "Приключение", "Вера"], positiveQualities: ["Оптимизм", "Щедрость", "Откровенность"], shadowQualities: ["Неумеренность", "Прямолинейность", "Непостоянство"], positiveEmotions: ["Веселье", "Энтузиазм", "Благодарность"], negativeEmotions: ["Надменность", "Нетерпение", "Беспокойство"], strengthsArr: ["Философ", "Учитель", "Путешественник"], weaknessesArr: ["Неумеренность", "Прямолинейность", "Непостоянство"], archetypes: ["Учитель", "Жрец", "Философ"], professions: [], objects: [], colors: [], days: [], animals: [], places: [], materials: [], numbers: [], keyMeanings: "Стремление, философия, приключение, вера", psychologicalManifestations: "Оптимизм, стремление к росту, щедрость", emotions: "Веселье, энтузиазм, надменность", strengths: "Философ, учитель, путешественник", weaknesses: "Неумеренность, прямолинейность", recommendations: "Учитесь, путешествуйте, делитесь знаниями", warnings: "Остерегайтесь переедания, раскошности" },
    { name: "Козерог", code: "capricorn", symbol: "♑", lifeThemes: ["Карьера", "Деньги", "Амбиции"], keyMeaningsArr: ["Структура", "Дисциплина", "Цель", "Власть"], positiveQualities: ["Ответственность", "Настойчивость", "Практичность"], shadowQualities: ["Жестокость", "Ригидность", "Материализм"], positiveEmotions: ["Спокойствие", "Уважение", "Уверенность"], negativeEmotions: ["Страх", "Одиночество", "Отчаяние"], strengthsArr: ["Мастер", "Строитель", "Организатор"], weaknessesArr: ["Жестокость", "Ригидность", "Материализм"], archetypes: ["Старец", "Жрец", "Испытатель"], professions: [], objects: [], colors: [], days: [], animals: [], places: [], materials: [], numbers: [], keyMeanings: "Структура, дисциплина, цель, власть", psychologicalManifestations: "Необходимость структуры, ответственность", emotions: "Спокойствие, страх, уважение", strengths: "Мастер, строитель, организатор", weaknesses: "Жестокость, ригидность", recommendations: "Планируйте, работайте систематически", warnings: "Не застривайте в ограничениях" },
    { name: "Водолей", code: "aquarius", symbol: "♒", lifeThemes: ["Свобода", "Новаторство", "Общение"], keyMeaningsArr: ["Революция", "Оригинальность", "Братство", "Будущее"], positiveQualities: ["Оригинальность", "Независимость", "Гуманизм"], shadowQualities: ["Отчуждение", "Резкость", "Упрямство"], positiveEmotions: ["Воодушевление", "Освобождение", "Экстаз"], negativeEmotions: ["Анархия", "Отчуждение", "Нервозность"], strengthsArr: ["Новатор", "Реформатор", "Гуманист"], weaknessesArr: ["Отчуждение", "Резкость", "Упрямство"], archetypes: ["Гений", "Революционер", "Шаман"], professions: [], objects: [], colors: [], days: [], animals: [], places: [], materials: [], numbers: [], keyMeanings: "Революция, оригинальность, братство, будущее", psychologicalManifestations: "Независимость, оригинальность, бунт", emotions: "Воодушевление, освобождение, анархия", strengths: "Новатор, реформатор, гуманист", weaknesses: "Отчуждение, резкость", recommendations: "Экспериментируйте, развивайте оригинальность", warnings: "Не разрушайте всё вокруг" },
    { name: "Рыбы", code: "pisces", symbol: "♓", lifeThemes: ["Духовность", "Мечты", "Искусство"], keyMeaningsArr: ["Мечты", "Интуиция", "Трансцендентность", "Сострадание"], positiveQualities: ["Эмпатия", "Творческое воображение", "Сжелающая способность"], shadowQualities: ["Иллюзии", "Зависимость", "Уклонение"], positiveEmotions: ["Восхищение", "Вдохновение", "Успокоение"], negativeEmotions: ["Растерянность", "Сомнения", "Уязвимость"], strengthsArr: ["Мистик", "Художник", "Целитель"], weaknessesArr: ["Рассеянность", "Обман", "Зависимость"], archetypes: ["Мистик", "Мечтатель", "Спаситель"], professions: [], objects: [], colors: [], days: [], animals: [], places: [], materials: [], numbers: [], keyMeanings: "Мечты, интуиция, трансцендентность, сострадание", psychologicalManifestations: "Эмпатия, интуиция, стремление к идеальному", emotions: "Восхищение, вдохновение, растерянность", strengths: "Мистик, художник, целитель", weaknesses: "Рассеянность, обман, зависимость", recommendations: "Медитируйте, занимайтесь искусством", warnings: "Остерегайтесь иллюзий, проверяйте реальность" },
  ];

  const allAstrologyEntities = [
    ...planetDefs.map((d) => ({ ...d, system: "astrology", type: "planet" })),
    ...signDefs.map((d) => ({ ...d, system: "astrology", type: "sign" })),
    ...Array.from({ length: 12 }, (_, i) => ({
      name: `Дом ${i + 1}`,
      code: `house_${i + 1}`,
      symbol: "",
      system: "astrology" as const,
      type: "house" as const,
      lifeThemes: ([] as string[]),
      keyMeaningsArr: ([] as string[]),
      positiveQualities: ([] as string[]),
      shadowQualities: ([] as string[]),
      positiveEmotions: ([] as string[]),
      negativeEmotions: ([] as string[]),
      strengthsArr: ([] as string[]),
      weaknessesArr: ([] as string[]),
      archetypes: ([] as string[]),
      professions: ([] as string[]),
      objects: ([] as string[]),
      colors: ([] as string[]),
      days: ([] as string[]),
      animals: ([] as string[]),
      places: ([] as string[]),
      materials: ([] as string[]),
      numbers: ([] as string[]),
      keyMeanings: "",
      psychologicalManifestations: "",
      emotions: "",
      strengths: "",
      weaknesses: "",
      recommendations: "",
      warnings: "",
    })),
    ...[
      { name: "Соединение", code: "conjunction", symbol: "☌", system: "astrology" as const, type: "aspect" as const, lifeThemes: ([] as string[]), keyMeaningsArr: ([] as string[]), positiveQualities: ([] as string[]), shadowQualities: ([] as string[]), positiveEmotions: ([] as string[]), negativeEmotions: ([] as string[]), strengthsArr: ([] as string[]), weaknessesArr: ([] as string[]), archetypes: ([] as string[]), professions: ([] as string[]), objects: ([] as string[]), colors: ([] as string[]), days: ([] as string[]), animals: ([] as string[]), places: ([] as string[]), materials: ([] as string[]), numbers: ([] as string[]), keyMeanings: "", psychologicalManifestations: "", emotions: "", strengths: "", weaknesses: "", recommendations: "", warnings: "" },
      { name: "Секстиль", code: "sextile", symbol: "⚹", system: "astrology" as const, type: "aspect" as const, lifeThemes: ([] as string[]), keyMeaningsArr: ([] as string[]), positiveQualities: ([] as string[]), shadowQualities: ([] as string[]), positiveEmotions: ([] as string[]), negativeEmotions: ([] as string[]), strengthsArr: ([] as string[]), weaknessesArr: ([] as string[]), archetypes: ([] as string[]), professions: ([] as string[]), objects: ([] as string[]), colors: ([] as string[]), days: ([] as string[]), animals: ([] as string[]), places: ([] as string[]), materials: ([] as string[]), numbers: ([] as string[]), keyMeanings: "", psychologicalManifestations: "", emotions: "", strengths: "", weaknesses: "", recommendations: "", warnings: "" },
      { name: "Квадрат", code: "square", symbol: "□", system: "astrology" as const, type: "aspect" as const, lifeThemes: ([] as string[]), keyMeaningsArr: ([] as string[]), positiveQualities: ([] as string[]), shadowQualities: ([] as string[]), positiveEmotions: ([] as string[]), negativeEmotions: ([] as string[]), strengthsArr: ([] as string[]), weaknessesArr: ([] as string[]), archetypes: ([] as string[]), professions: ([] as string[]), objects: ([] as string[]), colors: ([] as string[]), days: ([] as string[]), animals: ([] as string[]), places: ([] as string[]), materials: ([] as string[]), numbers: ([] as string[]), keyMeanings: "", psychologicalManifestations: "", emotions: "", strengths: "", weaknesses: "", recommendations: "", warnings: "" },
      { name: "Тригон", code: "trine", symbol: "△", system: "astrology" as const, type: "aspect" as const, lifeThemes: ([] as string[]), keyMeaningsArr: ([] as string[]), positiveQualities: ([] as string[]), shadowQualities: ([] as string[]), positiveEmotions: ([] as string[]), negativeEmotions: ([] as string[]), strengthsArr: ([] as string[]), weaknessesArr: ([] as string[]), archetypes: ([] as string[]), professions: ([] as string[]), objects: ([] as string[]), colors: ([] as string[]), days: ([] as string[]), animals: ([] as string[]), places: ([] as string[]), materials: ([] as string[]), numbers: ([] as string[]), keyMeanings: "", psychologicalManifestations: "", emotions: "", strengths: "", weaknesses: "", recommendations: "", warnings: "" },
      { name: "Оппозиция", code: "opposition", symbol: "☍", system: "astrology" as const, type: "aspect" as const, lifeThemes: ([] as string[]), keyMeaningsArr: ([] as string[]), positiveQualities: ([] as string[]), shadowQualities: ([] as string[]), positiveEmotions: ([] as string[]), negativeEmotions: ([] as string[]), strengthsArr: ([] as string[]), weaknessesArr: ([] as string[]), archetypes: ([] as string[]), professions: ([] as string[]), objects: ([] as string[]), colors: ([] as string[]), days: ([] as string[]), animals: ([] as string[]), places: ([] as string[]), materials: ([] as string[]), numbers: ([] as string[]), keyMeanings: "", psychologicalManifestations: "", emotions: "", strengths: "", weaknesses: "", recommendations: "", warnings: "" },
      { name: "Квинконс", code: "quincunx", symbol: "⚻", system: "astrology" as const, type: "aspect" as const, lifeThemes: ([] as string[]), keyMeaningsArr: ([] as string[]), positiveQualities: ([] as string[]), shadowQualities: ([] as string[]), positiveEmotions: ([] as string[]), negativeEmotions: ([] as string[]), strengthsArr: ([] as string[]), weaknessesArr: ([] as string[]), archetypes: ([] as string[]), professions: ([] as string[]), objects: ([] as string[]), colors: ([] as string[]), days: ([] as string[]), animals: ([] as string[]), places: ([] as string[]), materials: ([] as string[]), numbers: ([] as string[]), keyMeanings: "", psychologicalManifestations: "", emotions: "", strengths: "", weaknesses: "", recommendations: "", warnings: "" },
      { name: "Полуквадрат", code: "semisquare", symbol: "∠", system: "astrology" as const, type: "aspect" as const, lifeThemes: ([] as string[]), keyMeaningsArr: ([] as string[]), positiveQualities: ([] as string[]), shadowQualities: ([] as string[]), positiveEmotions: ([] as string[]), negativeEmotions: ([] as string[]), strengthsArr: ([] as string[]), weaknessesArr: ([] as string[]), archetypes: ([] as string[]), professions: ([] as string[]), objects: ([] as string[]), colors: ([] as string[]), days: ([] as string[]), animals: ([] as string[]), places: ([] as string[]), materials: ([] as string[]), numbers: ([] as string[]), keyMeanings: "", psychologicalManifestations: "", emotions: "", strengths: "", weaknesses: "", recommendations: "", warnings: "" },
      { name: "Полусекстиль", code: "semisextile", symbol: "⚺", system: "astrology" as const, type: "aspect" as const, lifeThemes: ([] as string[]), keyMeaningsArr: ([] as string[]), positiveQualities: ([] as string[]), shadowQualities: ([] as string[]), positiveEmotions: ([] as string[]), negativeEmotions: ([] as string[]), strengthsArr: ([] as string[]), weaknessesArr: ([] as string[]), archetypes: ([] as string[]), professions: ([] as string[]), objects: ([] as string[]), colors: ([] as string[]), days: ([] as string[]), animals: ([] as string[]), places: ([] as string[]), materials: ([] as string[]), numbers: ([] as string[]), keyMeanings: "", psychologicalManifestations: "", emotions: "", strengths: "", weaknesses: "", recommendations: "", warnings: "" },
    ],
  ];

  const arcanaDefs = ARCANA.map((a) => ({
    name: a.name,
    code: `arcana-${a.number}`,
    symbol: "",
    system: "tarot" as const,
    type: "arcana" as const,
    lifeThemes: ([] as string[]),
    keyMeaningsArr: a.pros ?? [],
    positiveQualities: ([] as string[]),
    shadowQualities: ([] as string[]),
    positiveEmotions: ([] as string[]),
    negativeEmotions: ([] as string[]),
    strengthsArr: ([] as string[]),
    weaknessesArr: ([] as string[]),
    archetypes: ([] as string[]),
    professions: ([] as string[]),
    objects: ([] as string[]),
    colors: ([] as string[]),
    days: ([] as string[]),
    animals: ([] as string[]),
    places: ([] as string[]),
    materials: ([] as string[]),
    numbers: [String(a.number)],
    keyMeanings: a.pros?.join(", ") ?? "",
    psychologicalManifestations: "",
    emotions: "",
    strengths: "",
    weaknesses: "",
    recommendations: "",
    warnings: "",
  }));

  const allDefs = [...allAstrologyEntities, ...arcanaDefs];

  // Подтверждённые соответствия из Obsidian/Hermes. Кристаллы и украшения
  // намеренно не заполняются: в источнике нет прямой планетарной таблицы.
  const planetaryPlants: Record<string, string[]> = {
    sun: ["Акация", "Ангелика", "Ясень", "Лавр", "Голубой лотос", "Календула", "Гвоздика", "Кедр", "Ромашка", "Корица", "Ладан", "Лимон", "Ноготки", "Апельсин", "Розмарин", "Подсолнух"],
    moon: ["Алоэ", "Анис", "Мелисса", "Аир", "Кизил", "Шалфей садовый", "Жасмин", "Мирра", "Валериана", "Ива"],
    mercury: ["Миндаль", "Бергамот", "Кофе", "Фенхель", "Лаванда", "Лимонная трава", "Мандрагора", "Мята", "Валериана"],
    venus: ["Африканская фиалка", "Алтей", "Яблоня", "Авокадо", "Берёза", "Ежевика", "Кардамон", "Котовник", "Водосбор", "Первоцвет", "Бузина", "Вереск", "Гибискус", "Пустырник", "Полынь", "Барвинок", "Роза", "Пижма", "Тимьян", "Валериана", "Вербена", "Тысячелистник"],
    mars: ["Душистый перец", "Анемона", "Базилик", "Дрок", "Кактус", "Корица", "Кориандр", "Драконова кровь", "Гибискус", "Падуб", "Крапива", "Рута", "Табак", "Горчица", "Перец чёрный", "Сосна"],
    jupiter: ["Репейник", "Огуречная трава", "Одуванчик", "Шалфей садовый", "Жимолость", "Валериана"],
    saturn: ["Аконит", "Белладонна", "Горец змеиный", "Окопник", "Чертовы башмачки", "Конопля", "Пачули", "Тис", "Коровяк", "Хвощ", "Кипарис"],
    uranus: ["Кофе"],
    neptune: ["Ольха", "Жасмин", "Лаванда"],
    pluto: ["Кизил"],
  };
  const planetaryColors: Record<string, string[]> = {
    sun: ["Жёлтый", "Золотой"],
    moon: ["Белый", "Серебряный", "Серый"],
    mercury: ["Оранжевый", "Синий", "Белый"],
    venus: ["Зелёный", "Розовый"],
    mars: ["Красный", "Оранжевый", "Зелёный"],
    jupiter: ["Зелёный", "Фиолетовый"],
    saturn: ["Чёрный"],
    uranus: [],
    neptune: ["Синий"],
    pluto: [],
  };

  await db
    .insert(ontologyEntitiesTable)
    .values(
      allDefs.map((d) => ({
        name: d.name,
        code: d.code,
        system: d.system,
        type: d.type,
        symbol: d.symbol,
      })),
    )
    .onConflictDoUpdate({
      target: ontologyEntitiesTable.code,
      set: {
        name: sql`excluded.name`,
        symbol: sql`excluded.symbol`,
        updatedAt: new Date(),
      },
    });

  // Query ALL entities (including pre-existing) for the map
  const allEntityRows = await db.select().from(ontologyEntitiesTable);
  const entityMap = new Map(allEntityRows.map((e) => [e.code, e]));

  // Profiles
  const profileInserts = allDefs
    .map((d) => {
      const e = entityMap.get(d.code);
      if (!e) return null;
      return {
        entityId: e.id,
        keyMeanings: d.keyMeanings,
        psychologicalManifestations: d.psychologicalManifestations,
        emotions: d.emotions,
        strengths: d.strengths,
        weaknesses: d.weaknesses,
        recommendations: d.recommendations,
        warnings: d.warnings,
        lifeThemes: d.lifeThemes,
        keyMeaningsArr: d.keyMeaningsArr,
        positiveQualities: d.positiveQualities,
        shadowQualities: d.shadowQualities,
        positiveEmotions: d.positiveEmotions,
        negativeEmotions: d.negativeEmotions,
        strengthsArr: d.strengthsArr,
        weaknessesArr: d.weaknessesArr,
        archetypes: d.archetypes,
        professions: d.professions,
        objects: d.objects,
        plants: planetaryPlants[d.code] ?? [],
        crystals: [],
        jewelry: [],
        colors: planetaryColors[d.code] ?? d.colors,
        numbers: d.numbers,
        days: d.days,
        animals: d.animals,
        places: d.places,
        materials: d.materials,
      };
    })
    .filter(Boolean) as any[];

  if (profileInserts.length > 0) {
    await db
      .insert(ontologyEntityProfilesTable)
      .values(profileInserts)
      .onConflictDoUpdate({
        target: ontologyEntityProfilesTable.entityId,
        set: {
          plants: sql`CASE WHEN jsonb_array_length(${ontologyEntityProfilesTable.plants}) = 0 THEN excluded.plants ELSE ${ontologyEntityProfilesTable.plants} END`,
          colors: sql`CASE WHEN jsonb_array_length(${ontologyEntityProfilesTable.colors}) = 0 THEN excluded.colors ELSE ${ontologyEntityProfilesTable.colors} END`,
        },
      });
  }

  // Исправляем только известную опечатку, не заменяя остальные ручные правки Studio.
  await db.execute(sql`
    UPDATE ontology_entity_profiles AS profile
    SET negative_emotions = (
      SELECT jsonb_agg(
        CASE
          WHEN value = '"Горесть"'::jsonb THEN '"Гордыня"'::jsonb
          ELSE value
        END
      )
      FROM jsonb_array_elements(profile.negative_emotions) AS item(value)
    )
    WHERE profile.entity_id = (
      SELECT id FROM ontology_entities WHERE code = 'jupiter'
    )
    AND profile.negative_emotions @> '["Горесть"]'::jsonb
  `);

  // Связи сущностей с темами
  const entityThemeLinks: { entityId: number; themeId: number; weight: number; polarity: string }[] = [];

  const addLink = (entityCode: string, themeSlug: string, weight: number, polarity: string) => {
    const e = entityMap.get(entityCode);
    const t = themeMap.get(themeSlug);
    if (e && t) entityThemeLinks.push({ entityId: e.id, themeId: t.id, weight, polarity });
  };

  // Планеты
  addLink("sun", "health", 0.7, "positive");
  addLink("moon", "family", 1.0, "positive");
  addLink("moon", "emotions", 1.0, "neutral");
  addLink("moon", "habits", 0.9, "neutral");
  addLink("moon", "care", 0.9, "positive");
  addLink("moon", "intuition", 0.8, "positive");
  addLink("moon", "home", 0.8, "positive");
  addLink("moon", "mother", 0.7, "positive");
  addLink("moon", "memory", 0.7, "neutral");
  addLink("moon", "subconscious", 0.6, "neutral");
  addLink("mercury", "communication", 1.0, "positive");
  addLink("mercury", "education", 0.9, "positive");
  addLink("mercury", "intellect", 0.8, "positive");
  addLink("mercury", "neighbors", 0.5, "neutral");
  addLink("mercury", "siblings", 0.6, "neutral");
  addLink("mercury", "short-trips", 0.6, "positive");
  addLink("venus", "love", 1.0, "positive");
  addLink("venus", "relationships", 0.9, "positive");
  addLink("venus", "beauty", 0.9, "positive");
  addLink("venus", "harmony", 0.8, "positive");
  addLink("venus", "art", 0.7, "positive");
  addLink("venus", "finances", 0.6, "neutral");
  addLink("venus", "pleasures", 0.6, "positive");
  addLink("venus", "values", 0.5, "neutral");
  addLink("mars", "action", 1.0, "positive");
  addLink("mars", "energy", 0.9, "positive");
  addLink("mars", "initiative", 0.9, "positive");
  addLink("mars", "passion", 0.8, "positive");
  addLink("mars", "strength", 0.7, "positive");
  addLink("mars", "competition", 0.6, "neutral");
  addLink("mars", "protection", 0.6, "positive");
  addLink("mars", "courage", 0.5, "positive");
  addLink("jupiter", "travel", 0.8, "positive");
  addLink("jupiter", "money", 0.9, "positive");
  addLink("saturn", "career", 1.0, "positive");
  addLink("saturn", "money", 0.8, "positive");
  addLink("uranus", "freedom", 1.0, "positive");
  addLink("uranus", "changes", 0.9, "neutral");
  addLink("uranus", "innovations", 0.9, "positive");
  addLink("uranus", "future", 0.8, "neutral");
  addLink("uranus", "independence", 0.8, "positive");
  addLink("uranus", "technology", 0.7, "positive");
  addLink("uranus", "travel", 0.6, "positive");
  addLink("neptune", "spirituality", 1.0, "positive");
  addLink("neptune", "creativity", 0.9, "positive");
  addLink("pluto", "struggle", 0.8, "neutral");
  addLink("pluto", "spirituality", 0.7, "positive");

  // Знаки
  addLink("aries", "struggle", 0.8, "neutral");
  addLink("taurus", "money", 0.8, "positive");
  addLink("taurus", "beauty", 0.7, "positive");
  addLink("taurus", "pleasures", 0.6, "positive");
  addLink("gemini", "communication", 1.0, "positive");
  addLink("gemini", "relationships", 0.6, "positive");
  addLink("cancer", "family", 1.0, "positive");
  addLink("cancer", "care", 0.7, "positive");
  addLink("leo", "creativity", 0.9, "positive");
  addLink("leo", "pleasures", 0.6, "positive");
  addLink("virgo", "health", 0.9, "positive");
  addLink("virgo", "habits", 0.6, "neutral");
  addLink("libra", "love", 0.9, "positive");
  addLink("libra", "harmony", 0.8, "positive");
  addLink("libra", "relationships", 0.7, "positive");
  addLink("scorpio", "struggle", 0.7, "neutral");
  addLink("scorpio", "intuition", 0.7, "positive");
  addLink("sagittarius", "travel", 0.9, "positive");
  addLink("sagittarius", "freedom", 0.7, "positive");
  addLink("capricorn", "career", 1.0, "positive");
  addLink("capricorn", "values", 0.6, "neutral");
  addLink("aquarius", "freedom", 0.9, "positive");
  addLink("aquarius", "innovations", 0.7, "positive");
  addLink("pisces", "spirituality", 0.9, "positive");
  addLink("pisces", "subconscious", 0.7, "positive");

  // Дома
  addLink("house_1", "freedom", 0.7, "positive");
  addLink("house_2", "money", 1.0, "positive");
  addLink("house_2", "finances", 0.8, "neutral");
  addLink("house_2", "values", 0.5, "neutral");
  addLink("house_3", "communication", 0.9, "positive");
  addLink("house_3", "intellect", 0.7, "positive");
  addLink("house_4", "family", 1.0, "positive");
  addLink("house_4", "home", 0.8, "positive");
  addLink("house_5", "creativity", 1.0, "positive");
  addLink("house_5", "pleasures", 0.7, "positive");
  addLink("house_5", "love", 0.8, "positive");
  addLink("house_5", "entertainment", 0.8, "positive");
  addLink("house_5", "children", 0.8, "positive");
  addLink("house_5", "sport", 0.7, "positive");
  addLink("house_5", "contests", 0.7, "positive");
  addLink("house_6", "health", 0.9, "positive");
  addLink("house_6", "habits", 0.6, "neutral");
  addLink("house_7", "love", 0.9, "positive");
  addLink("house_7", "relationships", 0.8, "positive");
  addLink("house_7", "harmony", 0.6, "positive");
  addLink("house_8", "struggle", 0.7, "neutral");
  addLink("house_8", "intuition", 0.5, "neutral");
  addLink("house_9", "travel", 0.9, "positive");
  addLink("house_9", "spirituality", 0.6, "positive");
  addLink("house_10", "career", 1.0, "positive");
  addLink("house_10", "values", 0.5, "neutral");
  addLink("house_11", "freedom", 0.8, "positive");
  addLink("house_11", "innovations", 0.6, "positive");
  addLink("house_12", "spirituality", 0.9, "positive");
  addLink("house_12", "subconscious", 0.7, "positive");

  // Аспекты
  addLink("conjunction", "struggle", 0.5, "neutral");
  addLink("sextile", "love", 0.6, "positive");
  addLink("square", "struggle", 0.8, "neutral");
  addLink("trine", "love", 0.8, "positive");
  addLink("opposition", "struggle", 0.7, "neutral");

  // Арканы
  for (const a of arcanaDefs) {
    const themes = a.lifeThemes;
    for (const t of themes.slice(0, 3)) {
      addLink(a.code, t.toLowerCase(), 0.8, "positive");
    }
  }

  if (entityThemeLinks.length > 0) {
    await db
      .insert(ontologyEntityThemesTable)
      .values(entityThemeLinks)
      .onConflictDoUpdate({
        target: [ontologyEntityThemesTable.entityId, ontologyEntityThemesTable.themeId],
        set: {
          weight: sql`excluded.weight`,
          polarity: sql`excluded.polarity`,
        },
      });
  }

  // Связи между сущностями (planets → signs: rulership)
  const rulerships: [string, string][] = [
    ["sun", "leo"],
    ["moon", "cancer"],
    ["mercury", "gemini"],
    ["mercury", "virgo"],
    ["venus", "taurus"],
    ["venus", "libra"],
    ["mars", "aries"],
    ["mars", "scorpio"],
    ["jupiter", "sagittarius"],
    ["jupiter", "pisces"],
    ["saturn", "capricorn"],
    ["saturn", "aquarius"],
    ["uranus", "aquarius"],
    ["neptune", "pisces"],
    ["pluto", "scorpio"],
  ];

  const relationInserts = rulerships
    .map(([planetCode, signCode]) => {
      const p = entityMap.get(planetCode);
      const s = entityMap.get(signCode);
      if (!p || !s) return null;
      return {
        fromEntityId: p.id,
        toEntityId: s.id,
        relationType: "rulership",
        description: `${p.name} управляет ${s.name}`,
        weight: 1.0,
      };
    })
    .filter(Boolean) as any[];

  // Planet-to-planet aspect relations
  const planetAspectRelations: [string, string, string, string, number][] = [
    ["mercury", "venus", "тригон", "Лёгкость в общении, приятные разговоры", 1.0],
    ["mercury", "uranus", "тригон", "Гениальные озарения, свежие идеи", 1.0],
    ["mercury", "saturn", "квадрат", "Ментальные блоки, задержки в коммуникации", 0.7],
    ["mercury", "jupiter", "секстиль", "Широкий кругозор, возможности через общение", 0.8],
    ["mercury", "mars", "оппозиция", "Конфликты в общении, резкость", 0.6],
    ["uranus", "sun", "оппозиция", "Разрыв с привычным 'я', кризис идентичности", 0.8],
    ["moon", "uranus", "тригон", "Интуитивные озарения, эмоциональная свобода, неожиданные перемены, вызвавшие отсутствие контроля эмоций", 1.2],
    ["uranus", "moon", "квадрат", "Эмоциональная нестабильность, внезапные перемены в семье", 0.7],
    ["uranus", "mercury", "тригон", "Гениальные озарения, новый взгляд на мир", 1.0],
    ["uranus", "venus", "квадрат", "Свободные отношения, революция в любви, внезапные романы", 0.7],
    ["uranus", "mars", "соединение", "Революционная энергия, импульс к переменам", 0.8],
    ["uranus", "jupiter", "секстиль", "Неожиданные возможности через новые технологии", 0.8],
    ["uranus", "saturn", "оппозиция", "Бунт против системы, разрушение старых структур", 0.7],
    ["uranus", "neptune", "соединение", "Гениальные прозрения, идеи, опережающие время", 0.9],
    ["uranus", "pluto", "тригон", "Трансформация через неожиданные события", 0.8],
    // Venus aspect relations
    ["venus", "sun", "соединение", "Расцвет творчества, признание, яркая личная жизнь", 0.9],
    ["venus", "moon", "тригон", "Гармоничные отношения, любовь и забота", 0.9],
    ["venus", "moon", "квадрат", "Нестабильность в отношениях, ревность", 0.7],
    ["venus", "mercury", "тригон", "Романтические разговоры, лёгкость в общении", 0.9],
    ["venus", "mercury", "квадрат", "Непонимание в отношениях, словесные споры", 0.7],
    ["venus", "mars", "соединение", "Сильная страсть, активная любовь", 0.9],
    ["venus", "mars", "квадрат", "Конфликт между любовью и действиями", 0.7],
    ["venus", "jupiter", "тригон", "Счастливый брак, изобилие любви", 0.9],
    ["venus", "saturn", "оппозиция", "Сложности в отношениях, проверка чувств временем", 0.7],
    ["venus", "uranus", "тригон", "Свободные отношения, революционер в любви", 0.9],
    ["venus", "uranus", "квадрат", "Внезапные разрывы, хаос в личной жизни", 0.7],
    ["venus", "neptune", "соединение", "Романтические мечты, идеализация партнёра", 0.9],
    ["venus", "pluto", "тригон", "Интенсивная страсть, глубокая эмоциональная связь", 0.9],
    // Mars aspect relations
    ["mars", "sun", "соединение", "Всплеск энергии, яркая активность, лидерство", 1.0],
    ["mars", "sun", "оппозиция", "Конфликт с авторитетами, борьба за независимость", 1.0],
    ["mars", "moon", "секстиль", "Эмоциональная энергия, способность заботиться и защитить", 1.0],
    ["mars", "moon", "оппозиция", "Конфликт между желаниями и эмоциональными потребностями", 1.0],
    ["mars", "mercury", "тригон", "Быстрое мышление, резкость в словах, агитатор", 1.0],
    ["mars", "mercury", "квадрат", "Словесные конфликты, агрессивное общение", 1.0],
    ["mars", "venus", "соединение", "Сильная страсть, активная любовь", 1.0],
    ["mars", "venus", "квадрат", "Конфликт между любовью и действиями", 1.0],
    ["mars", "jupiter", "тригон", "Успех через предпринимательство, уверенность в действиях", 1.0],
    ["mars", "saturn", "оппозиция", "Препятствия, борьба с системой", 1.0],
    ["mars", "uranus", "соединение", "Революционная энергия, импульс к переменам", 1.0],
    ["mars", "uranus", "квадрат", "Конфликт с авторитетами, бунтарство", 1.0],
    ["mars", "neptune", "квадрат", "Иллюзия, обман, разочарование, конфликт с идеалами", 1.0],
    ["mars", "pluto", "тригон", "Скрытая сила, трансформация, способность перерождаться", 1.0],
  ];

  for (const [fromCode, toCode, aspectType, description, weight] of planetAspectRelations) {
    const fromE = entityMap.get(fromCode);
    const toE = entityMap.get(toCode);
    if (fromE && toE) {
      relationInserts.push({
        fromEntityId: fromE.id,
        toEntityId: toE.id,
        relationType: aspectType,
        description,
        weight,
      });
    }
  }

  if (relationInserts.length > 0) {
    await db
      .insert(ontologyEntityRelationsTable)
      .values(relationInserts)
      .onConflictDoNothing();
  }

  // ─── Motivation phrases ───
  const phrases = [
    "Каждый день - это новый шанс изменить свою жизнь.",
    "Ваша сила в том, что Вы продолжаете идти вперёд.",
    "Не бойтесь быть собой - это ваша суперсила.",
    "Верьте в свои мечты, даже если они кажутся далекими. Вы намного сильнее, чем думаете.",
    "Никто не может остановить вас, если Вы движетесь к своей цели.",
    "Делайте то, что любите, и будьте лучшей версией себя.",
    "Смотрите вперёд, а не назад - там ваше будущее.",
    "Маленькие шаги ведут к большим победам.",
    "В любой ситуации Вы можете найти свою силу.",
    "Доверяйте своему сердцу и интуиции.",
    "Каждый день бросает вызов, чтобы ты стал сильнее.",
    "Сегодня - это разрешение быть подлинным собой.",
    "В каждом дне живёт магия новых открытий.",
    "Сегодня ты можешь рискнуть и выиграть.",
    "Каждый день открывает окно в новую реальность.",
    "Сегодня - это шанс удивить самого себя.",
    "Каждый день приглашает нас к новой роли.",
    "Сегодня можно построить то, что казалось фантазией.",
    "В каждом дне живёт энергия для прорыва.",
    "Каждый день - это новая игра, где правила создаёшь ты.",
  ];

  if (phrases.length > 0) {
    await db
      .insert(motivationPhrasesTable)
      .values(phrases.map((phrase) => ({ id: randomUUID(), phrase, isActive: true })))
      .onConflictDoNothing({ target: motivationPhrasesTable.phrase });
  }

  // Render API currently builds without running drizzle-kit push. Create this additive
  // table at startup so a new deployment cannot fail before the seed runs.
  await db.execute(sql`CREATE TABLE IF NOT EXISTS cinderella_interpretations (
    id SERIAL PRIMARY KEY,
    pair_key TEXT NOT NULL,
    mode TEXT NOT NULL,
    aspect_key TEXT NOT NULL DEFAULT 'any',
    title TEXT NOT NULL,
    text TEXT NOT NULL DEFAULT 'В разработке',
    keywords TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    source_note TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`);
  await db.execute(sql`CREATE UNIQUE INDEX IF NOT EXISTS cinderella_interpretation_unique
    ON cinderella_interpretations (pair_key, mode, aspect_key)`);

  const cinderellaInterpretations = [
    { pairKey: "chiron-venus", mode: "natal", aspectKey: "any", title: "Хирон - Венера: натальный аспект", text: "Супер-аспект и один из важнейших романтических аспектов. Любовь к семье и стремление к браку, карьера, приносящая деньги, деньги через брак или семейные связи. Влюбчивость." },
    { pairKey: "chiron-jupiter", mode: "natal", aspectKey: "any", title: "Хирон - Юпитер: натальный аспект", text: "Один из наиболее могущественных супер-аспектов. Прекрасный общественный имидж, естественные руководящие способности, уверенность в себе, доверие публики, большая судьба и блестящий успех." },
    { pairKey: "chiron-neptune", mode: "natal", aspectKey: "any", title: "Хирон - Нептун: натальный аспект", text: "Долговременная финансовая обеспеченность благодаря семейным связям или браку. Продолжительная харизма и благоприятный общественный имидж, вера в чудеса и интерес к эзотерике." },
    { pairKey: "chiron-sun", mode: "natal", aspectKey: "any", title: "Солнце - Хирон: натальный аспект", text: "Помогает человеку быть харизматичным и популярным, оказывает гипнотическое воздействие на людей. У женщин может усиливать желание брака и детей." },
    { pairKey: "chiron-pluto", mode: "natal", aspectKey: "any", title: "Плутон - Хирон: натальный аспект", text: "Супер-аспект. Заметный успех, высокоприбыльная карьера, власть благодаря браку или семейным связям. Человек обладает властью и видением." },
    { pairKey: "chiron-venus", mode: "transit", aspectKey: "any", title: "Хирон - Венера: транзит Врат Золушки", text: "Время, когда вас видят в наилучшем свете. Подходит для знакомств, признания, презентации себя и идей, важных переговоров и романтических встреч." },
    { pairKey: "chiron-jupiter", mode: "transit", aspectKey: "any", title: "Хирон - Юпитер: транзит Врат Золушки", text: "Время повышенной заметности, признания, доверия аудитории и благоприятного восприятия. Подходит для собеседования, повышения, нового дела или публичного запуска." },
    { pairKey: "chiron-neptune", mode: "transit", aspectKey: "any", title: "Хирон - Нептун: транзит Врат Золушки", text: "Период длительной харизмы, вдохновения, защищённости и благоприятного общественного имиджа. Возможны романтические знакомства." },
    { pairKey: "chiron-sun", mode: "transit", aspectKey: "any", title: "Солнце - Хирон: транзит Врат Золушки", text: "Период харизмы, популярности и способности быть замеченным. Подходит для публичных действий, важных знакомств и начала значимых дел." },
    { pairKey: "chiron-pluto", mode: "transit", aspectKey: "any", title: "Плутон - Хирон: транзит Врат Золушки", text: "Период усиления влияния, карьерной реализации, власти и финансового потенциала." },
    { pairKey: "chiron-venus", mode: "synastry", aspectKey: "any", title: "Хирон - Венера: синастрия", text: "Один из наилучших аспектов во взаимоотношениях: объединение судеб, общее будущее, возникновение семьи, любовь длиной в жизнь, совместное зарабатывание денег и взаимопомощь. Велики шансы заключения брака." },
    { pairKey: "chiron-jupiter", mode: "synastry", aspectKey: "any", title: "Хирон - Юпитер: синастрия", text: "Один из наиболее желательных аспектов. Совместный блестящий, в том числе финансовый успех, благословенный брак, счастливая и успешная семья." },
    { pairKey: "chiron-neptune", mode: "synastry", aspectKey: "any", title: "Хирон - Нептун: синастрия", text: "Романтические взаимоотношения длиной в жизнь. Один из наиболее часто встречающихся аспектов в продолжительных браках." },
    { pairKey: "chiron-sun", mode: "synastry", aspectKey: "any", title: "Солнце - Хирон: синастрия", text: "Аспект доверия, особенно со стороны обладателя Хирона. Партнёры чувствуют себя друг с другом просто и естественно, как члены одной семьи." },
    { pairKey: "chiron-pluto", mode: "synastry", aspectKey: "any", title: "Плутон - Хирон: синастрия", text: "Совместная власть и успех, особенно в финансовом отношении. Процветающий, могущественный брак и влиятельная семья." },
  ];
  await db.insert(cinderellaInterpretationsTable).values(cinderellaInterpretations).onConflictDoNothing();

  const generalSynastryInterpretations = [
    { categoryKey: "support", sourceBody: "sun", targetBody: "saturn", aspectKey: "square", directionKey: "neutral", title: "Солнце - Сатурн: квадрат", text: "Связь требует зрелости и терпения. Сатурн контакта может задавать вашему Солнцу высокую планку, а вы помогаете отношениям сохранять живость и направление. При уважении границ аспект даёт устойчивость и способность вместе проходить испытания.", keywords: ["ответственность", "границы", "устойчивость"], sourceNote: "Начальный набор общей синастрии" },
    { categoryKey: "conflict", sourceBody: "mars", targetBody: "uranus", aspectKey: "square", directionKey: "neutral", title: "Марс - Уран: квадрат", text: "Аспект усиливает напряжение, импульсивность и стремление действовать по-своему. Между людьми возможны резкие реакции и неожиданные повороты. Энергия аспекта лучше раскрывается через совместные активные задачи и уважение к свободе друг друга.", keywords: ["напряжение", "свобода", "импульсивность"], sourceNote: "Начальный набор общей синастрии" },
    { categoryKey: "communication", sourceBody: "mercury", targetBody: "mercury", aspectKey: "conjunction", directionKey: "neutral", title: "Меркурий - Меркурий: соединение", text: "Людям легко обмениваться мыслями, замечать общие интересы и быстро подхватывать идеи друг друга. Слова оказывают сильное влияние на отношения, поэтому особенно важны ясность, уважительный тон и готовность слышать собеседника.", keywords: ["общение", "мышление", "понимание"], sourceNote: "Начальный набор общей синастрии" },
    { categoryKey: "conflict", sourceBody: "jupiter", targetBody: "sun", aspectKey: "opposition", directionKey: "neutral", title: "Юпитер - Солнце: оппозиция", text: "Контакт расширяет горизонты, но одновременно может усиливать различия во взглядах, амбициях и представлениях о правильном пути. Важно не превращать убеждения и советы в соревнование за лидерство.", keywords: ["убеждения", "рост", "лидерство"], sourceNote: "Начальный набор общей синастрии" },
    { categoryKey: "support", sourceBody: "jupiter", targetBody: "jupiter", aspectKey: "trine", directionKey: "neutral", title: "Юпитер - Юпитер: тригон", text: "Людей объединяют сходные представления о развитии, знаниях, справедливости и будущем. Аспект поддерживает взаимное вдохновение, совместные планы, путешествия и расширение возможностей.", keywords: ["развитие", "вдохновение", "будущее"], sourceNote: "Начальный набор общей синастрии" },
    { categoryKey: "conflict", sourceBody: "jupiter", targetBody: "lilith", aspectKey: "opposition", directionKey: "neutral", title: "Юпитер - Лилит: оппозиция", text: "Аспект сталкивает убеждения и стремление к расширению с сильными, не всегда признанными желаниями и независимой позицией. Отношения могут провоцировать честный пересмотр моральных установок и личных границ.", keywords: ["убеждения", "границы", "искушение"], sourceNote: "Начальный набор общей синастрии" },
    { categoryKey: "communication", sourceBody: "uranus", targetBody: "mercury", aspectKey: "square", directionKey: "neutral", title: "Уран - Меркурий: квадрат", text: "Общение отличается нестандартностью и высокой скоростью, но может быть нервным и непредсказуемым. Люди стимулируют друг друга мыслить иначе; для устойчивого диалога нужны паузы и договорённость о правилах общения.", keywords: ["идеи", "перемены", "диалог"], sourceNote: "Начальный набор общей синастрии" },
  ];
  await db.insert(synastryInterpretationsTable).values(generalSynastryInterpretations).onConflictDoNothing();

  const extendedSynastryInterpretations = [
    { categoryKey: "support", sourceBody: "sun", targetBody: "sun", aspectKey: "trine", directionKey: "neutral", title: "Солнце - Солнце: тригон", text: "Люди естественно признают индивидуальность друг друга и поддерживают стремление проявлять себя. Между ними легче сохранять уважение, тепло и чувство общей цели.", keywords: ["самовыражение", "уважение", "цель"], sourceNote: "Расширенный набор общей синастрии" },
    { categoryKey: "emotions", sourceBody: "moon", targetBody: "moon", aspectKey: "conjunction", directionKey: "neutral", title: "Луна - Луна: соединение", text: "Эмоциональные реакции и потребность в заботе во многом совпадают. Люди быстро чувствуют настроение друг друга и могут создать атмосферу близости, но иногда одинаковая чувствительность усиливает переживания.", keywords: ["эмоции", "близость", "забота"], sourceNote: "Расширенный набор общей синастрии" },
    { categoryKey: "relationships", sourceBody: "venus", targetBody: "mars", aspectKey: "trine", directionKey: "neutral", title: "Венера - Марс: тригон", text: "Между людьми возникает естественное притяжение, живой интерес и желание радовать друг друга. Чувства и действия поддерживают друг друга, поэтому отношения легче развиваются без лишнего давления.", keywords: ["притяжение", "чувства", "действие"], sourceNote: "Расширенный набор общей синастрии" },
    { categoryKey: "conflict", sourceBody: "venus", targetBody: "mars", aspectKey: "square", directionKey: "neutral", title: "Венера - Марс: квадрат", text: "Сильное притяжение сочетается с различиями в темпе, желаниях и способах проявлять любовь. Искра отношений может быть яркой, если люди учатся говорить о потребностях и не превращают разницу в борьбу.", keywords: ["страсть", "различия", "желания"], sourceNote: "Расширенный набор общей синастрии" },
    { categoryKey: "conflict", sourceBody: "mars", targetBody: "saturn", aspectKey: "square", directionKey: "neutral", title: "Марс - Сатурн: квадрат", text: "Действия одного человека могут сталкиваться с осторожностью, правилами или ограничениями другого. Аспект проверяет отношения на зрелость и помогает превратить напряжение в дисциплину, если ответственность распределена честно.", keywords: ["действие", "ограничения", "зрелость"], sourceNote: "Расширенный набор общей синастрии" },
    { categoryKey: "support", sourceBody: "sun", targetBody: "jupiter", aspectKey: "trine", directionKey: "neutral", title: "Солнце - Юпитер: тригон", text: "Контакт помогает раскрывать уверенность, щедрость и веру в собственные возможности. Люди поддерживают рост друг друга, легче видят перспективу и способны радоваться успехам партнёра.", keywords: ["рост", "уверенность", "поддержка"], sourceNote: "Расширенный набор общей синастрии" },
    { categoryKey: "relationships", sourceBody: "moon", targetBody: "venus", aspectKey: "sextile", directionKey: "neutral", title: "Луна - Венера: секстиль", text: "Чувства и проявления симпатии хорошо дополняют друг друга. В отношениях легче создавать мягкость, уют и эмоциональную поддержку, сохраняя при этом уважение к личным вкусам.", keywords: ["нежность", "уют", "гармония"], sourceNote: "Расширенный набор общей синастрии" },
    { categoryKey: "relationships", sourceBody: "venus", targetBody: "jupiter", aspectKey: "conjunction", directionKey: "neutral", title: "Венера - Юпитер: соединение", text: "Связь усиливает доброжелательность, щедрость и удовольствие от совместной жизни. Людям проще видеть красоту друг в друге и поддерживать общие планы, однако важно сохранять меру в тратах и обещаниях.", keywords: ["радость", "щедрость", "ценности"], sourceNote: "Расширенный набор общей синастрии" },
  ];
  await db.insert(synastryInterpretationsTable).values(extendedSynastryInterpretations).onConflictDoNothing();

  const houseSeed = [
    { planetBody: "sun", houseNumber: 5, title: "Солнце в V доме", text: "Вы пробуждаете у контакта желание проявляться, творить, радоваться и чувствовать себя особенным. Ваше присутствие может усиливать романтический интерес и тягу к совместному творчеству." },
    { planetBody: "moon", houseNumber: 4, title: "Луна в IV доме", text: "Вы создаёте у контакта ощущение знакомости, домашнего тепла и эмоциональной причастности. Ваше влияние затрагивает его глубокие воспоминания и потребность в безопасности." },
    { planetBody: "mercury", houseNumber: 3, title: "Меркурий в III доме", text: "Вы помогаете контакту легче выражать мысли и поддерживать постоянный обмен идеями. Общение становится естественной частью связи, а повседневные разговоры могут стимулировать взаимное обучение." },
    { planetBody: "venus", houseNumber: 7, title: "Венера в VII доме", text: "Вы воспринимаетесь контактом как образ желанного партнёра. Ваша Венера усиливает симпатию, стремление к гармонии и желание строить отношения на взаимности." },
    { planetBody: "mars", houseNumber: 8, title: "Марс в VIII доме", text: "Вы пробуждаете у контакта сильное притяжение, смелость и желание глубокой вовлечённости. Важно бережно обращаться с темами ревности, контроля и личных границ." },
    { planetBody: "jupiter", houseNumber: 9, title: "Юпитер в IX доме", text: "Вы расширяете мировоззрение контакта, поддерживаете его обучение, путешествия и поиск смысла. Благодаря вашему влиянию ему легче смотреть дальше привычных рамок и строить большие планы." },
    { planetBody: "saturn", houseNumber: 10, title: "Сатурн в X доме", text: "Вы влияете на цели контакта, его карьерный путь и чувство ответственности. Такая связь может давать опору и долговременность, но требует уважения к амбициям и темпу развития друг друга." },
  ].map((item) => ({ ...item, directionKey: "neutral", categoryKey: "general", sourceNote: "Начальный набор планет в домах", isActive: true }));
  await db.execute(sql`CREATE TABLE IF NOT EXISTS synastry_house_interpretations (
    id SERIAL PRIMARY KEY,
    planet_body TEXT NOT NULL,
    house_number INTEGER NOT NULL,
    direction_key TEXT NOT NULL DEFAULT 'neutral',
    title TEXT NOT NULL,
    text TEXT NOT NULL DEFAULT 'В разработке',
    source_note TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`);
  await db.execute(sql`CREATE UNIQUE INDEX IF NOT EXISTS synastry_house_interpretation_unique ON synastry_house_interpretations (planet_body, house_number, direction_key)`);
  await db.insert(synastryHouseInterpretationsTable).values(houseSeed).onConflictDoNothing();
  const houseAdditionalSeed = [
    { planetBody: "moon", houseNumber: 1, title: "Луна в I доме", text: "Вы эмоционально затрагиваете самоощущение контакта и его способ проявляться в мире. Рядом с вами ему легче показывать чувства, но ваша реакция может особенно сильно влиять на его настроение." },
    { planetBody: "mercury", houseNumber: 6, title: "Меркурий в VI доме", text: "Вы влияете на повседневный ритм контакта, его рабочие привычки и внимание к деталям. Общение помогает ему упорядочивать дела, находить практичные решения и заботиться о собственном режиме." },
    { planetBody: "mars", houseNumber: 12, title: "Марс в XII доме", text: "Ваши действия затрагивают скрытые переживания контакта и процессы, которые он не всегда осознаёт. Связь может пробуждать сильную внутреннюю энергию, но требует бережности, чтобы напряжение не накапливалось молча." },
    { planetBody: "jupiter", houseNumber: 12, title: "Юпитер в XII доме", text: "Вы приносите контакту ощущение внутренней поддержки и расширяете его представление о духовных и скрытых ресурсах. Ваше влияние может проявляться тихо, через доверие, помощь и чувство защищённости." },
    { planetBody: "saturn", houseNumber: 1, title: "Сатурн в I доме", text: "Вы заметно влияете на самоощущение контакта, его манеру проявляться и отношение к собственной ответственности. Рядом с вами он может становиться собраннее и увереннее в своих целях, но иногда ощущать повышенные требования к себе." },
  ].map((item) => ({ ...item, directionKey: "neutral", categoryKey: "general", sourceNote: "Расширенный набор планет в домах", isActive: true }));
  await db.insert(synastryHouseInterpretationsTable).values(houseAdditionalSeed).onConflictDoNothing();
  const houseReverseSeed = [
    { planetBody: "sun", houseNumber: 9, title: "Солнце контакта в IX доме", text: "Контакт расширяет ваше мировоззрение, поддерживает интерес к обучению, путешествиям и поиску смысла. Благодаря его влиянию вам легче выходить за привычные рамки и строить большие планы." },
    { planetBody: "moon", houseNumber: 6, title: "Луна контакта в VI доме", text: "Контакт эмоционально влияет на ваш повседневный ритм, рабочие привычки и заботу о собственном состоянии. Его настроение может менять атмосферу ваших обычных дел и потребность в практической поддержке." },
    { planetBody: "mercury", houseNumber: 8, title: "Меркурий контакта в VIII доме", text: "Слова и мысли контакта затрагивают ваши глубокие переживания, темы доверия и общих ресурсов. Разговоры могут помогать вам лучше понимать скрытые мотивы, но требуют честности и бережного отношения к личным границам." },
    { planetBody: "venus", houseNumber: 8, title: "Венера контакта в VIII доме", text: "Контакт пробуждает в вас сильное притяжение и желание эмоциональной глубины. Его чувства затрагивают темы доверия, близости и общих ресурсов, поэтому особенно важны открытость и уважение к границам." },
    { planetBody: "mars", houseNumber: 5, title: "Марс контакта в V доме", text: "Контакт пробуждает в вас желание действовать, играть, творить и ярко проявляться. Его энергия усиливает романтический интерес и совместную активность, но важно оставлять место для свободного самовыражения." },
    { planetBody: "jupiter", houseNumber: 6, title: "Юпитер контакта в VI доме", text: "Контакт помогает вам расширять рабочие навыки, находить полезные привычки и видеть больше возможностей в повседневных делах. Его поддержка может улучшать ваш режим, но важно не брать на себя слишком много обещаний." },
    { planetBody: "saturn", houseNumber: 5, title: "Сатурн контакта в V доме", text: "Контакт влияет на ваше самовыражение, романтические чувства и отношение к творчеству. Он может помогать оформлять вдохновение в устойчивую форму, но иногда его сдержанность ощущается как ограничение спонтанности." },
  ].map((item) => ({ ...item, directionKey: "male-to-female", categoryKey: "general", sourceNote: "Обратный набор планет в домах", isActive: true }));
  await db.insert(synastryHouseInterpretationsTable).values(houseReverseSeed).onConflictDoNothing();
  for (const item of houseReverseSeed) {
    await db.update(synastryHouseInterpretationsTable)
      .set({ text: item.text, title: item.title, updatedAt: new Date() })
      .where(and(
        eq(synastryHouseInterpretationsTable.planetBody, item.planetBody),
        eq(synastryHouseInterpretationsTable.houseNumber, item.houseNumber),
        eq(synastryHouseInterpretationsTable.directionKey, item.directionKey),
        eq(synastryHouseInterpretationsTable.text, "В разработке"),
      ));
  }
  const houseMutualSeed = [
    { planetBody: "sun", houseNumber: 9, title: "Взаимное Солнце в IX доме", text: "Вы взаимно расширяете мировоззрение друг друга. Вместе легче учиться, путешествовать, посещать тренинги и курсы, обсуждать смысл происходящего и строить большие планы." },
    { planetBody: "moon", houseNumber: 4, title: "Взаимная Луна в IV доме", text: "Вы взаимно создаёте ощущение домашнего тепла, знакомости и эмоциональной защищённости. Вместе легче заботиться друг о друге и формировать пространство, где можно быть собой." },
    { planetBody: "venus", houseNumber: 7, title: "Взаимная Венера в VII доме", text: "Вы взаимно воспринимаете друг друга как желанного партнёра и естественно стремитесь к гармонии. Такое положение поддерживает симпатию, взаимность и желание строить отношения вместе." },
    { planetBody: "mercury", houseNumber: 3, title: "Взаимный Меркурий в III доме", text: "Вы взаимно стимулируете интерес к разговорам, обучению и обмену идеями. Вместе легче обсуждать повседневные дела, быстро находить общий язык и поддерживать живой диалог." },
    { planetBody: "jupiter", houseNumber: 9, title: "Взаимный Юпитер в IX доме", text: "Вы взаимно поддерживаете рост, обучение, путешествия и поиск новых смыслов. Общие знания и планы помогают каждому смотреть дальше привычных границ." },
  ].map((item) => ({ ...item, directionKey: "mutual", categoryKey: "general", sourceNote: "Взаимные положения планет в домах", isActive: true }));
  await db.insert(synastryHouseInterpretationsTable).values(houseMutualSeed).onConflictDoNothing();
  const houseMutualAdditionalSeed = [
    { planetBody: "sun", houseNumber: 5, title: "Взаимное Солнце в V доме", text: "Вы взаимно пробуждаете желание творить, радоваться жизни и ярко проявляться. В отношениях легче поддерживать романтический интерес, совместные увлечения и чувство собственной значимости." },
    { planetBody: "moon", houseNumber: 1, title: "Взаимная Луна в I доме", text: "Вы тонко чувствуете состояние друг друга и заметно влияете на способ проявляться во внешнем мире. Рядом друг с другом легче быть эмоционально открытыми, но реакции могут быстро менять настроение обоих." },
    { planetBody: "mercury", houseNumber: 6, title: "Взаимный Меркурий в VI доме", text: "Вы помогаете друг другу упорядочивать повседневные дела, рабочие задачи и привычки. Разговоры легко переходят в совместный поиск практичных решений и взаимную помощь." },
    { planetBody: "venus", houseNumber: 5, title: "Взаимная Венера в V доме", text: "Вы взаимно усиливаете романтический интерес, удовольствие от общения и желание создавать что-то красивое вместе. Отношениям помогают игра, творчество, свидания и искренняя радость друг от друга." },
    { planetBody: "mars", houseNumber: 8, title: "Взаимный Марс в VIII доме", text: "Вы взаимно пробуждаете сильную страсть, смелость и стремление к глубокой вовлечённости. Связь требует честного обращения с ревностью, контролем, доверием и личными границами." },
    { planetBody: "jupiter", houseNumber: 6, title: "Взаимный Юпитер в VI доме", text: "Вы помогаете друг другу развиваться через работу, полезные привычки и заботу о повседневном благополучии. Вместе легче видеть возможности для улучшения режима и навыков." },
    { planetBody: "saturn", houseNumber: 10, title: "Взаимный Сатурн в X доме", text: "Вы взаимно поддерживаете цели, карьерный путь и чувство ответственности. Такая связь может давать устойчивость и долгосрочные результаты, если оба уважаете амбиции и темп развития друг друга." },
  ].map((item) => ({ ...item, directionKey: "mutual", categoryKey: "general", sourceNote: "Расширенный набор взаимных положений планет в домах", isActive: true }));
  await db.insert(synastryHouseInterpretationsTable).values(houseMutualAdditionalSeed).onConflictDoNothing();

  const completeHousePlanets = [
    { key: "sun", label: "Солнце", effect: "самоощущение, волю и стремление ярко проявляться" },
    { key: "moon", label: "Луна", effect: "эмоциональные реакции, потребность в заботе и чувство безопасности" },
    { key: "mercury", label: "Меркурий", effect: "мышление, разговоры и способы обмениваться информацией" },
    { key: "venus", label: "Венера", effect: "симпатию, вкус, ценности и стремление к гармонии" },
    { key: "mars", label: "Марс", effect: "действия, инициативу, желание и способ отстаивать себя" },
    { key: "jupiter", label: "Юпитер", effect: "рост, веру в возможности, обучение и расширение горизонтов" },
    { key: "saturn", label: "Сатурн", effect: "ответственность, границы, цели и способность выдерживать испытания" },
  ] as const;
  const completeHouseThemes = [
    "самовыражение, личный образ и начало нового этапа",
    "личные ресурсы, деньги, опору и ощущение ценности",
    "общение, обучение, поездки и повседневный обмен мыслями",
    "дом, семью, прошлое и эмоциональную основу",
    "романтику, творчество, удовольствие и желание играть",
    "работу, обязанности, здоровье и полезные привычки",
    "партнёрство, взаимность и образ близких отношений",
    "доверие, интимность, общие ресурсы и глубокие перемены",
    "мировоззрение, обучение, путешествия и поиск смысла",
    "цели, карьеру, статус и ответственность перед будущим",
    "дружбу, сообщество, планы и надежды",
    "скрытые переживания, внутреннюю жизнь и потребность в уединении",
  ] as const;
  const completeNeutralHouseSeed = completeHousePlanets.flatMap((planet) => completeHouseThemes.map((theme, index) => ({
    planetBody: planet.key,
    houseNumber: index + 1,
    directionKey: "neutral",
    categoryKey: "general",
    title: `${planet.label} в ${index + 1} доме`,
    text: `Вы направляете энергию ${planet.effect} контакта в сферу ${theme}. Ваше присутствие помогает ему лучше раскрывать эту сторону жизни, но требует уважения к его темпу, выбору и личным границам.`,
    sourceNote: "Полный набор планет в домах",
    isActive: true,
  })));
  const completeReverseHouseSeed = completeHousePlanets.flatMap((planet) => completeHouseThemes.map((theme, index) => ({
    planetBody: planet.key,
    houseNumber: index + 1,
    directionKey: "male-to-female",
    categoryKey: "general",
    title: `${planet.label} контакта в ${index + 1} доме`,
    text: `Контакт направляет энергию ${planet.effect} в вашу сферу ${theme}. Его присутствие помогает вам лучше раскрывать эту сторону жизни, но требует уважения к вашему темпу, выбору и личным границам.`,
    sourceNote: "Полный обратный набор планет в домах",
    isActive: true,
  })));
  await db.insert(synastryHouseInterpretationsTable).values(completeNeutralHouseSeed).onConflictDoNothing();
  await db.insert(synastryHouseInterpretationsTable).values(completeReverseHouseSeed).onConflictDoNothing();
  const completeMutualHouseSeed = completeHousePlanets.flatMap((planet) => completeHouseThemes.map((theme, index) => ({
    planetBody: planet.key,
    houseNumber: index + 1,
    directionKey: "mutual",
    categoryKey: "general",
    title: `Взаимное ${planet.label} в ${index + 1} доме`,
    text: `Вы взаимно усиливаете ${planet.effect} в сфере ${theme}. Вместе легче раскрывать эту сторону жизни, поддерживать друг друга и согласовывать личные границы, темп и способы самовыражения.`,
    sourceNote: "Полный набор взаимных положений планет в домах",
    isActive: true,
  })));
  await db.insert(synastryHouseInterpretationsTable).values(completeMutualHouseSeed).onConflictDoNothing();
  await db.execute(sql`UPDATE synastry_house_interpretations SET text = CASE planet_body
    WHEN 'sun' THEN 'Вы пробуждаете у контакта желание проявляться, творить, радоваться и чувствовать себя особенным. Ваше присутствие может усиливать романтический интерес и тягу к совместному творчеству.'
    WHEN 'moon' THEN 'Вы создаёте у контакта ощущение знакомости, домашнего тепла и эмоциональной причастности. Ваше влияние затрагивает его глубокие воспоминания и потребность в безопасности.'
    WHEN 'mercury' THEN 'Вы помогаете контакту легче выражать мысли и поддерживать постоянный обмен идеями. Общение становится естественной частью связи, а повседневные разговоры могут стимулировать взаимное обучение.'
    WHEN 'venus' THEN 'Вы воспринимаетесь контактом как образ желанного партнёра. Ваша Венера усиливает симпатию, стремление к гармонии и желание строить отношения на взаимности.'
    WHEN 'mars' THEN 'Вы пробуждаете у контакта сильное притяжение, смелость и желание глубокой вовлечённости. Важно бережно обращаться с темами ревности, контроля и личных границ.'
    WHEN 'jupiter' THEN 'Вы расширяете мировоззрение контакта, поддерживаете его обучение, путешествия и поиск смысла. Благодаря вашему влиянию ему легче смотреть дальше привычных рамок и строить большие планы.'
    WHEN 'saturn' THEN 'Вы влияете на цели контакта, его карьерный путь и чувство ответственности. Такая связь может давать опору и долговременность, но требует уважения к амбициям и темпу развития друг друга.'
  END
  WHERE direction_key = 'neutral' AND source_note = 'Начальный набор планет в домах'
    AND text IN (
      'Человек пробуждает в партнёре желание проявляться, творить, радоваться и чувствовать себя особенным. Связь может усиливать романтический интерес и совместное творчество.',
      'Возникает ощущение знакомости, домашнего тепла и эмоциональной причастности. Партнёр затрагивает глубокие воспоминания и потребность в безопасности.',
      'Общение становится естественной частью связи. Партнёры охотно обсуждают повседневные дела, учатся друг у друга и поддерживают постоянный обмен мыслями.',
      'Планета воспринимается как образ желанного партнёра. Положение усиливает симпатию, стремление к гармонии и желание строить отношения на взаимности.',
      'Связь пробуждает сильное притяжение, смелость и желание глубокой вовлечённости. Важно бережно обращаться с темами ревности, контроля и личных границ.',
      'Партнёр расширяет мировоззрение, поддерживает обучение, путешествия и поиск смысла. Вместе легче смотреть дальше привычных рамок и строить большие планы.',
      'Партнёр влияет на цели, карьерный путь и чувство ответственности. Такая связь может давать опору и долговременность, но требует уважения к амбициям и темпу развития друг друга.'
    )`);

  logger.info(
    "Seeded: %d entities (%d astrology + %d arcana), %d themes, %d profiles, %d entity-theme links, %d entity relations, %d phrases",
    allEntityRows.length,
    allAstrologyEntities.length,
    arcanaDefs.length,
    allThemeRows.length,
    profileInserts.length,
    entityThemeLinks.length,
    relationInserts.length,
    phrases.length,
  );
}

// NOTE: CLI entry point removed — seedOntology() is invoked explicitly from index.ts
