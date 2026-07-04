import {
  db,
  ontologyEntitiesTable,
  ontologyThemesTable,
  ontologyEntityThemesTable,
  ontologyEntityProfilesTable,
  ontologyEntityRelationsTable,
} from "@workspace/db";

async function seed() {
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
    ])
    .onConflictDoNothing({ target: ontologyThemesTable.slug })
    .returning();

  const themeMap = new Map(themeRows.map((t) => [t.slug, t]));

  // ─── Астрологические сущности ───
  const planetDefs = [
    { name: "Солнце", code: "sun", symbol: "☉", lifeThemes: ["Эго", "Свобода", "Творчество"], keyMeaningsArr: ["Сознание", "Эго", "Жизненная сила", "Авторитет"], positiveQualities: ["Мужественность", "Прямота", "Уверенность"], shadowQualities: ["Тщеславие", "Эгоцентризм", "Нетерпимость"], positiveEmotions: ["Радость", "Гордость", "Уверенность"], negativeEmotions: ["Отчаяние", "Ярость", "Унижение"], strengthsArr: ["Лидерство", "Вдохновение", "Целеустремлённость"], weaknessesArr: ["Гордыня", "Требовательность", "Негибкость"], archetypes: ["Король", "Герой", "Творец"], keyMeanings: "Сознание, эго, жизненная сила, авторитет, лидерство", psychologicalManifestations: "Стремление быть в центре, получать признание, выражать себя", emotions: "Радость, гордость, уверенность, отчаяние", strengths: "Лидерство, вдохновение, целеустремлённость, оптимизм", weaknesses: "Гордыня, требовательность, негибкость, эгоцентризм", recommendations: "Будьте автентичны, излучайте своё сознание, заботьтесь о здоровье", warnings: "Опасно подаваться от чужого мнения, искать постоянное одобрение" },
    { name: "Луна", code: "moon", symbol: "☽", lifeThemes: ["Семья", "Эмоции", "Подсознание"], keyMeaningsArr: ["Эмоции", "Память", "Инстинкт", "Забота"], positiveQualities: ["Чувствительность", "Забота", "Принятие"], shadowQualities: ["Зависимость", "Переменчивость", "Зажатость"], positiveEmotions: ["Нежность", "Теплота", "Сострадание"], negativeEmotions: ["Тоска", "Страх", "Нерешительность"], strengthsArr: ["Интуиция", "Эмпатия", "Приспособляемость"], weaknessesArr: ["Уязвимость", "Колебания", "Избегание"], archetypes: ["Мать", "Хранительница", "Мистик"], keyMeanings: "Эмоции, память, инстинкт, забота, подсознание", psychologicalManifestations: "Эмоциональная чувствительность, потребность в безопасности", emotions: "Нежность, теплота, тоска, страх", strengths: "Интуиция, эмпатия, приспособляемость, забота", weaknesses: "Уязвимость, колебания, избегание, зажатость", recommendations: "Позволяйте себе чувствовать, создавайте уют, заботьтесь о сне", warnings: "Остерегайтесь зависимости, не утопайте в сентиментальности" },
    { name: "Меркурий", code: "mercury", symbol: "☿", lifeThemes: ["Общение", "Учёба", "Интеллект"], keyMeaningsArr: ["Мышление", "Речь", "Анализ", "Коммуникация"], positiveQualities: ["Ум", "Острота", "Адаптивность"], shadowQualities: ["Переменчивость", "Поверхностность", "Беспокойство"], positiveEmotions: ["Любопытство", "Интерес", "Оживление"], negativeEmotions: ["Беспокойство", "Тревожность", "Сомнения"], strengthsArr: ["Ум", "Речистость", "Аналитическое мышление"], weaknessesArr: ["Непоследовательность", "Перегрузка", "Поверхность"], archetypes: ["Посланник", "Ученый", "Торговец"], keyMeanings: "Мышление, речь, анализ, коммуникация", psychologicalManifestations: "Стремление к анализу, любопытство, многозадачность", emotions: "Любопытство, интерес, беспокойство", strengths: "Ум, речистость, аналитическое мышление", weaknesses: "Непоследовательность, перегрузка, поверхность", recommendations: "Пишите, читайте, обучайтесь, делитесь идеями", warnings: "Остерегайтесь поверхности, не разбрасывайте внимание" },
    { name: "Венера", code: "venus", symbol: "♀", lifeThemes: ["Любовь", "Красота", "Гармония"], keyMeaningsArr: ["Любовь", "Гармония", "Эстетика", "Ценности"], positiveQualities: ["Дипломатичность", "Чувство вкуса", "Умение объединять"], shadowQualities: ["Зависимость", "Поверхность", "Избегание конфликтов"], positiveEmotions: ["Нежность", "Любовь", "Удовлетворенность"], negativeEmotions: ["Тоска", "Ревность", "Разочарование"], strengthsArr: ["Объединитель", "Миротворец", "Художник"], weaknessesArr: ["Лень", "Послеповательность", "Подавленность"], archetypes: ["Любовница", "Художник", "Певица"], keyMeanings: "Любовь, гармония, эстетика, ценности", psychologicalManifestations: "Стремление к гармонии, мягкость, отклик от конфликта", emotions: "Нежность, радость, удовлетворенность", strengths: "Умеет объединять, создавать красоту", weaknesses: "Зависимость, поверхность, лень", recommendations: "Практикуйте искусство, ухаживайте за эстетикой", warnings: "Опасно иллюзиям, избеганию конфликтов" },
    { name: "Марс", code: "mars", symbol: "♂", lifeThemes: ["Борьба", "Секс", "Действие"], keyMeaningsArr: ["Действие", "Агрессия", "Смелость", "Движение"], positiveQualities: ["Смелость", "Прямота", "Целеустремлённость"], shadowQualities: ["Гнев", "Импульсивность", "Жестокость"], positiveEmotions: ["Страсть", "Уверенность", "Воодушевление"], negativeEmotions: ["Гнев", "Раздражение", "Злоба"], strengthsArr: ["Победитель", "Защитник", "Инициатор"], weaknessesArr: ["Агрессия", "Нетерпение", "Поспешность"], archetypes: ["Воин", "Охотник", "Предприниматель"], keyMeanings: "Действие, агрессия, смелость, движение", psychologicalManifestations: "Прямота, решимость, импульсивность", emotions: "Страсть, гнев, уверенность", strengths: "Победитель, защитник, инициатор", weaknesses: "Агрессия, нетерпение, поспешность", recommendations: "Спорт, физактивная активность, цели", warnings: "Остерегайтесь конфликтов, травм" },
    { name: "Юпитер", code: "jupiter", symbol: "♃", lifeThemes: ["Удача", "Рост", "Мудрость"], keyMeaningsArr: ["Рост", "Удача", "Мудрость", "Стремление"], positiveQualities: ["Мудрость", "Щедрость", "Оптимизм"], shadowQualities: ["Неумеренность", "Расточность", "Раскошность"], positiveEmotions: ["Откровенность", "Веселье", "Благодарность"], negativeEmotions: ["Надменность", "Горесть", "Непомерность"], strengthsArr: ["Мудрец", "Защитник", "Философ"], weaknessesArr: ["Расточность", "Лень", "Неумеренность"], archetypes: ["Учитель", "Жрец", "Философ"], keyMeanings: "Рост, удача, мудрость, стремление", psychologicalManifestations: "Оптимизм, стремление к росту, щедрость", emotions: "Откровенность, веселье, благодарность", strengths: "Мудрец, защитник, философ", weaknesses: "Расточность, лень, неумеренность", recommendations: "Учитесь, путешествуйте, делитесь знаниями", warnings: "Остерегайтесь переедания, раскошности" },
    { name: "Сатурн", code: "saturn", symbol: "♔", lifeThemes: ["Карьера", "Ответственность", "Время"], keyMeaningsArr: ["Структура", "Дисциплина", "Ограничение", "Время"], positiveQualities: ["Дисциплина", "Ответственность", "Настойчивость"], shadowQualities: ["Жестокость", "Ограниченность", "Депрессия"], positiveEmotions: ["Спокойствие", "Уважение", "Уверенность"], negativeEmotions: ["Страх", "Одиночество", "Отчаяние"], strengthsArr: ["Мастер", "Строитель", "Организатор"], weaknessesArr: ["Жестокость", "Медлительность", "Пессимизм"], archetypes: ["Старец", "Жрец", "Испытатель"], keyMeanings: "Структура, дисциплина, ограничение, время", psychologicalManifestations: "Необходимость структуры, ответственность", emotions: "Спокойствие, страх, уважение", strengths: "Мастер, строитель, организатор", weaknesses: "Жестокость, медлительность", recommendations: "Планируйте, работайте систематически", warnings: "Не застривайте в ограничениях" },
    { name: "Уран", code: "uranus", symbol: "♅", lifeThemes: ["Свобода", "Революция", "Новаторство"], keyMeaningsArr: ["Революция", "Новаторство", "Свобода", "Оригинальность"], positiveQualities: ["Оригинальность", "Независимость", "Смелость"], shadowQualities: ["Беспокойство", "Отчуждение", "Резкость"], positiveEmotions: ["Воодушевление", "Освобождение", "Экстаз"], negativeEmotions: ["Анархия", "Отчуждение", "Нервозность"], strengthsArr: ["Новатор", "Реформатор", "Гений"], weaknessesArr: ["Нестабильность", "Эксцентризм", "Упрямство"], archetypes: ["Гений", "Революционер", "Шаман"], keyMeanings: "Революция, новаторство, свобода", psychologicalManifestations: "Независимость, оригинальность, бунт", emotions: "Воодушевление, освобождение, анархия", strengths: "Новатор, реформатор, гений", weaknesses: "Нестабильность, эксцентризм, упрямство", recommendations: "Экспериментируйте, развивайте оригинальность", warnings: "Не разрушайте всё вокруг, остерегайтесь беспокойства" },
    { name: "Нептун", code: "neptune", symbol: "♆", lifeThemes: ["Духовность", "Мечты", "Искусство"], keyMeaningsArr: ["Мечты", "Интуиция", "Трансцендентность", "Сострадание"], positiveQualities: ["Эмпатия", "Творческое воображение", "Сжелающая способность"], shadowQualities: ["Иллюзии", "Зависимость", "Уклонение"], positiveEmotions: ["Восхищение", "Вдохновение", "Успокоение"], negativeEmotions: ["Растерянность", "Сомнения", "Уязвимость"], strengthsArr: ["Мистик", "Художник", "Целитель"], weaknessesArr: ["Рассеянность", "Обман", "Зависимость"], archetypes: ["Мистик", "Мечтатель", "Спаситель"], keyMeanings: "Мечты, интуиция, трансцендентность", psychologicalManifestations: "Эмпатия, интуиция, стремление к идеальному", emotions: "Восхищение, вдохновение, растерянность", strengths: "Мистик, художник, целитель", weaknesses: "Рассеянность, обман, зависимость", recommendations: "Медитируйте, занимайтесь искусством", warnings: "Остерегайтесь иллюзий, проверяйте реальность" },
    { name: "Плутон", code: "pluto", symbol: "♇", lifeThemes: ["Трансформация", "Власть", "Тайны"], keyMeaningsArr: ["Трансформация", "Власть", "Глубина", "Регенерация"], positiveQualities: ["Глубина", "Решимость", "Психологическая сила"], shadowQualities: ["Манипуляция", "Обсессивность", "Контроль"], positiveEmotions: ["Страсть", "Сила", "Уверенность"], negativeEmotions: ["Ревность", "Ненависть", "Обсессия"], strengthsArr: ["Психолог", "Исцелитель", "Преображатель"], weaknessesArr: ["Контроль", "Подозрительность", "Разрушение"], archetypes: ["Маг", "Шаман", "Король под миров"], keyMeanings: "Трансформация, власть, глубина", psychologicalManifestations: "Психологическая глубина, магнитность, регенерация", emotions: "Страсть, глубина, ревность", strengths: "Психолог, исцелитель, преображатель", weaknesses: "Контроль, подозрительность, разрушение", recommendations: "Исследуйте подсознанное, практикуйте психотерапию", warnings: "Остерегайтесь манипуляций, не торгуйте прошлым" },
  ];

  const signDefs = [
    { name: "Овен", code: "aries", symbol: "♈", lifeThemes: ["Свобода", "Борьба", "Лидерство"], keyMeaningsArr: ["Начало", "Импульс", "Смелость", "Независимость"], positiveQualities: ["Храбрость", "Прямота", "Смелость"], shadowQualities: ["Нетерпение", "Импульсивность", "Эгоцентризм"], positiveEmotions: ["Воодушевление", "Страсть", "Уверенность"], negativeEmotions: ["Гнев", "Раздражение", "Импатиентность"], strengthsArr: ["Лидер", "Пионер", "Боец"], weaknessesArr: ["Поспешность", "Агрессия", "Эгоцентризм"], archetypes: ["Воин", "Пионер", "Лидер"], keyMeanings: "Начало, импульс, смелость", psychologicalManifestations: "Прямота, импульсивность, стремление к победе", emotions: "Воодушевление, страсть, гнев", strengths: "Лидер, пионер, боец", weaknesses: "Поспешность, агрессия", recommendations: "Замедляйте, подумайте перед действием", warnings: "Остерегайтесь импульса, конфликтов" },
    { name: "Телец", code: "taurus", symbol: "♉", lifeThemes: ["Деньги", "Красота", "Комфорт"], keyMeaningsArr: ["Стабильность", "Материальное", "Упорство", "Наслаждение"], positiveQualities: ["Надёжность", "Практичность", "Терпение"], shadowQualities: ["Упрямство", "Материализм", "Лень"], positiveEmotions: ["Удовлетворенность", "Спокойствие", "Благодарность"], negativeEmotions: ["Упрямство", "Жадность", "Обида"], strengthsArr: ["Строитель", "Художник", "Финансист"], weaknessesArr: ["Упрямство", "Лень", "Материализм"], archetypes: ["Строитель", "Художник", "Сенсуалист"], keyMeanings: "Стабильность, материальное, упорство", psychologicalManifestations: "Практичность, необходимость стабильности", emotions: "Удовлетворенность, спокойствие, упрямство", strengths: "Строитель, художник, финансист", weaknesses: "Упрямство, лень", recommendations: "Создавайте красоту, не спешите", warnings: "Остерегайтесь жадности, упрямства" },
    { name: "Близнецы", code: "gemini", symbol: "♊", lifeThemes: ["Общение", "Учёба", "Интеллект"], keyMeaningsArr: ["Коммуникация", "Гибкость", "Любознательность", "Многообразие"], positiveQualities: ["Ум", "Адаптивность", "Общительность"], shadowQualities: ["Поверхность", "Непоследовательность", "Нерешительность"], positiveEmotions: ["Любопытство", "Возбуждение", "Открытость"], negativeEmotions: ["Беспокойство", "Тревожность", "Рассеянность"], strengthsArr: ["Коммуникатор", "Учёный", "Писатель"], weaknessesArr: ["Поверхность", "Непоследовательность", "Беспокойство"], archetypes: ["Посланник", "Ученый", "Торговец"], keyMeanings: "Коммуникация, гибкость, любознательность", psychologicalManifestations: "Любопытство, адаптивность, многозадачность", emotions: "Любопытство, возбуждение, беспокойство", strengths: "Коммуникатор, учёный, писатель", weaknesses: "Поверхность, непоследовательность", recommendations: "Пишите, учитесь, делитеся идеями", warnings: "Остерегайтесь поверхности, не разбрасывайте внимание" },
    { name: "Рак", code: "cancer", symbol: "♋", lifeThemes: ["Семья", "Эмоции", "Забота"], keyMeaningsArr: ["Эмоциональность", "Забота", "Интуиция", "Защита"], positiveQualities: ["Чувствительность", "Забота", "Преданность"], shadowQualities: ["Ранимость", "Зажатость", "Уязвимость"], positiveEmotions: ["Нежность", "Забота", "Сострадание"], negativeEmotions: ["Ранимость", "Обида", "Тоска"], strengthsArr: ["Хранитель", "Целитель", "Психолог"], weaknessesArr: ["Уязвимость", "Зависимость", "Меланхолия"], archetypes: ["Мать", "Хранительница", "Целитель"], keyMeanings: "Эмоциональность, забота, интуиция", psychologicalManifestations: "Эмоциональная чувствительность, забота", emotions: "Нежность, забота, ранимость", strengths: "Хранитель, целитель, психолог", weaknesses: "Уязвимость, зависимость", recommendations: "Создавайте уют, заботьтесь о семье", warnings: "Остерегайтесь ранимости, зависимости" },
    { name: "Лев", code: "leo", symbol: "♌", lifeThemes: ["Свобода", "Творчество", "Лидерство"], keyMeaningsArr: ["Самовыражение", "Творчество", "Сила воли", "Воодушевление"], positiveQualities: ["Мужественность", "Щедрота", "Теплота"], shadowQualities: ["Тщеславие", "Гордыня", "Доминирование"], positiveEmotions: ["Радость", "Гордость", "Уверенность"], negativeEmotions: ["Обида", "Тщеславие", "Раздражение"], strengthsArr: ["Лидер", "Артист", "Щедрый сердцем"], weaknessesArr: ["Гордыня", "Тщеславие", "Доминирование"], archetypes: ["Король", "Артист", "Герой"], keyMeanings: "Самовыражение, творчество, сила воли", psychologicalManifestations: "Стремление к признанию, мужественность", emotions: "Радость, гордость, уверенность", strengths: "Лидер, артист, щедрый", weaknesses: "Гордыня, тщеславие", recommendations: "Творчествуйте, выражайте себя, дарите", warnings: "Остерегайтесь гордыни, тщеславия" },
    { name: "Дева", code: "virgo", symbol: "♍", lifeThemes: ["Здоровье", "Учёба", "Работа"], keyMeaningsArr: ["Анализ", "Сервис", "Совершенство", "Здоровье"], positiveQualities: ["Точность", "Скромность", "Практичность"], shadowQualities: ["Критичность", "Тревожность", "Переборчивость"], positiveEmotions: ["Спокойствие", "Удовлетворенность", "Уверенность"], negativeEmotions: ["Тревожность", "Критичность", "Переборчивость"], strengthsArr: ["Аналитик", "Целитель", "Сервис"], weaknessesArr: ["Критичность", "Тревожность", "Переборчивость"], archetypes: ["Целитель", "Сервис", "Аналитик"], keyMeanings: "Анализ, сервис, совершенство", psychologicalManifestations: "Аналитическое мышление, стремление к порядку", emotions: "Спокойствие, удовлетворенность, тревожность", strengths: "Аналитик, целитель, сервис", weaknesses: "Критичность, тревожность", recommendations: "Работайте систематически, заботьтесь о здоровье", warnings: "Не критикуйте себя слишком" },
    { name: "Весы", code: "libra", symbol: "♎", lifeThemes: ["Любовь", "Гармония", "Справедливость"], keyMeaningsArr: ["Гармония", "Справедливость", "Красота", "Отношения"], positiveQualities: ["Дипломатичность", "Справедливость", "Эстетичность"], shadowQualities: ["Нерешительность", "Зависимость", "Поверхность"], positiveEmotions: ["Гармония", "Удовлетворенность", "Радость"], negativeEmotions: ["Нерешительность", "Растерянность", "Тоска"], strengthsArr: ["Дипломат", "Художник", "Переговорщик"], weaknessesArr: ["Нерешительность", "Зависимость", "Поверхность"], archetypes: ["Дипломат", "Художник", "Судья"], keyMeanings: "Гармония, справедливость, красота", psychologicalManifestations: "Дипломатичность, стремление к гармонии", emotions: "Гармония, удовлетворенность, нерешительность", strengths: "Дипломат, художник, переговорщик", weaknesses: "Нерешительность, зависимость", recommendations: "Создавайте красоту, ищите баланс", warnings: "Не теряйте себя, остерегайтесь поверхности" },
    { name: "Скорпион", code: "scorpio", symbol: "♏", lifeThemes: ["Трансформация", "Секс", "Тайны"], keyMeaningsArr: ["Глубина", "Трансформация", "Страсть", "Интенсивность"], positiveQualities: ["Решимость", "Глубина", "Психологическая сила"], shadowQualities: ["Манипуляция", "Мстительность", "Ревность"], positiveEmotions: ["Страсть", "Глубина", "Уверенность"], negativeEmotions: ["Ревность", "Обсессия", "Ненависть"], strengthsArr: ["Психолог", "Исследователь", "Целитель"], weaknessesArr: ["Манипуляция", "Мстительность", "Ревность"], archetypes: ["Шаман", "Маг", "Исцелитель"], keyMeanings: "Глубина, трансформация, страсть", psychologicalManifestations: "Психологическая глубина, интенсивность", emotions: "Страсть, глубина, ревность", strengths: "Психолог, исследователь, целитель", weaknesses: "Манипуляция, мстительность", recommendations: "Исследуйте подсознанное, практикуйте психотерапию", warnings: "Остерегайтесь манипуляций, не торгуйте прошлым" },
    { name: "Стрелец", code: "sagittarius", symbol: "♐", lifeThemes: ["Путешествия", "Мудрость", "Свобода"], keyMeaningsArr: ["Экспансия", "Философия", "Вера", "Свобода"], positiveQualities: ["Оптимизм", "Щедрота", "Открытость"], shadowQualities: ["Небрежность", "Прямота", "Неумеренность"], positiveEmotions: ["Восхищение", "Веселье", "Открытость"], negativeEmotions: ["Беспокойство", "Небрежность", "Импульсивность"], strengthsArr: ["Философ", "Путешественник", "Учитель"], weaknessesArr: ["Небрежность", "Прямота", "Неумеренность"], archetypes: ["Философ", "Путешественник", "Жрец"], keyMeanings: "Экспансия, философия, вера", psychologicalManifestations: "Оптимизм, открытость, стремление к знаниям", emotions: "Восхищение, веселье, открытость", strengths: "Философ, путешественник, учитель", weaknesses: "Небрежность, прямота", recommendations: "Путешествуйте, учитесь, используйте знания", warnings: "Остерегайтесь небрежности, прямоты" },
    { name: "Козерог", code: "capricorn", symbol: "♑", lifeThemes: ["Карьера", "Деньги", "Статус"], keyMeaningsArr: ["Цель", "Дисциплина", "Ответственность", "Время"], positiveQualities: ["Целеустремлённость", "Практичность", "Настойчивость"], shadowQualities: ["Жестокость", "Расчётливость", "Ограниченность"], positiveEmotions: ["Спокойствие", "Уважение", "Уверенность"], negativeEmotions: ["Одиночество", "Страх", "Отчаяние"], strengthsArr: ["Организатор", "Лидер", "Строитель"], weaknessesArr: ["Жестокость", "Холодность", "Пессимизм"], archetypes: ["Отец", "Строитель", "Правитель"], keyMeanings: "Цель, дисциплина, ответственность", psychologicalManifestations: "Целеустремлённость, необходимость порядка", emotions: "Спокойствие, уважение, одиночество", strengths: "Организатор, лидер, строитель", weaknesses: "Жестокость, холодность", recommendations: "Работайте систематически, планируйте", warnings: "Не застривайте в ограничениях" },
    { name: "Водолей", code: "aquarius", symbol: "♒", lifeThemes: ["Свобода", "Инновации", "Сообщество"], keyMeaningsArr: ["Новаторство", "Свобода", "Оригинальность", "Гуманизм"], positiveQualities: ["Оригинальность", "Независимость", "Интеллект"], shadowQualities: ["Отчуждение", "Упрямство", "Беспокойство"], positiveEmotions: ["Воодушевление", "Свобода", "Открытость"], negativeEmotions: ["Отчуждение", "Нервозность", "Беспокойство"], strengthsArr: ["Инноватор", "Реформатор", "Философ"], weaknessesArr: ["Отчуждение", "Упрямство", "Беспокойство"], archetypes: ["Гений", "Реформатор", "Учёный"], keyMeanings: "Новаторство, свобода, оригинальность", psychologicalManifestations: "Независимость, оригинальность, интеллект", emotions: "Воодушевление, свобода, отчуждение", strengths: "Инноватор, реформатор, философ", weaknesses: "Отчуждение, упрямство", recommendations: "Экспериментируйте, делитесь идеями", warnings: "Не разрушайте всё вокруг, остерегайтесь отчуждения" },
    { name: "Рыбы", code: "pisces", symbol: "♓", lifeThemes: ["Духовность", "Искусство", "Сострадание"], keyMeaningsArr: ["Эмпатия", "Интуиция", "Трансцендентность", "Сострадание"], positiveQualities: ["Эмпатия", "Творчество", "Сострадание"], shadowQualities: ["Иллюзии", "Уязвимость", "Эскапизм"], positiveEmotions: ["Сострадание", "Восхищение", "Успокоение"], negativeEmotions: ["Рассеянность", "Обида", "Сожаление"], strengthsArr: ["Мистик", "Художник", "Целитель"], weaknessesArr: ["Уязвимость", "Избегание", "Иллюзии"], archetypes: ["Мистик", "Спаситель", "Художник"], keyMeanings: "Эмпатия, интуиция, трансцендентность", psychologicalManifestations: "Эмпатия, интуиция, стремление к идеальному", emotions: "Сострадание, восхищение, рассеянность", strengths: "Мистик, художник, целитель", weaknesses: "Уязвимость, избегание, иллюзии", recommendations: "Медитируйте, занимайтесь искусством", warnings: "Остерегайтесь иллюзий, проверяйте реальность" },
  ];

  const houseDefs = Array.from({ length: 12 }, (_, i) => {
    const nums = ["Первый", "Второй", "Третий", "Четвёртый", "Пятый", "Шестой", "Седьмой", "Восьмой", "Девятый", "Десятый", "Одиннадцатый", "Двенадцатый"];
    const names = ["Я", "Деньги", "Общение", "Семья", "Творчество", "Работа", "Отношения", "Трансформация", "Путешествия", "Карьера", "Друзья", "Тайны"];
    const id = i + 1;
    return {
      name: `${nums[i]} дом (${names[i]})`,
      code: `house_${id}`,
      symbol: `H${id}`,
      lifeThemes: [names[i]],
      keyMeaningsArr: [`Сфера: ${names[i]}`, "Практика", "Развитие"],
      positiveQualities: ["Активность", "Ответственность"],
      shadowQualities: ["Пассивность", "Ограничения"],
      positiveEmotions: ["Спокойствие", "Удовлетворенность"],
      negativeEmotions: ["Тревожность", "Фрустрация"],
      strengthsArr: ["Стабильность", "Надёжность"],
      weaknessesArr: ["Ригидность", "Упрямство"],
      archetypes: ["Строитель", "Хранитель"],
      keyMeanings: `Сфера жизни: ${names[i]}`,
      psychologicalManifestations: `Проявление в области ${names[i].toLowerCase()}`,
      emotions: `Эмоции, связанные с ${names[i].toLowerCase()}`,
      strengths: `Силы в ${names[i].toLowerCase()}`,
      weaknesses: `Слабости в ${names[i].toLowerCase()}`,
      recommendations: `Развивайте ${names[i].toLowerCase()}`,
      warnings: `Остерегайтесь проблем в ${names[i].toLowerCase()}`,
    };
  });

  const aspectDefs = [
    { name: "Соединение", code: "conjunction", symbol: "☌", lifeThemes: ["Единство", "Концентрация", "Сила"], keyMeaningsArr: ["Слияние", "Концентрация", "Усиление"], positiveQualities: ["Сила", "Фокус", "Яркость"], shadowQualities: ["Избыточность", "Перегрузка", "Одноборство"], positiveEmotions: ["Уверенность", "Энергия", "Яркость"], negativeEmotions: ["Перегрузка", "Напряженность", "Экстремизм"], strengthsArr: ["Сила", "Яркость", "Фокус"], weaknessesArr: ["Избыточность", "Перегрузка", "Одноборство"], archetypes: ["Соединитель", "Фокусировка"], keyMeanings: "Слияние, концентрация, усиление", psychologicalManifestations: "Сильное поглощение, яркость, фокус", emotions: "Энергия, яркость, перегрузка", strengths: "Сила, яркость, фокус", weaknesses: "Избыточность, перегрузка", recommendations: "Используйте энергию созидательно", warnings: "Остерегайтесь перегрузки" },
    { name: "Секстиль", code: "sextile", symbol: "✶", lifeThemes: ["Возможности", "Гармония", "Обучение"], keyMeaningsArr: ["Гармония", "Возможности", "Кооперация"], positiveQualities: ["Гармония", "Сотрудничество", "Лёгкость"], shadowQualities: ["Поверхность", "Небрежность", "Лень"], positiveEmotions: ["Удовлетворенность", "Открытость", "Возбуждение"], negativeEmotions: ["Невнимательность", "Поверхность", "Рассеянность"], strengthsArr: ["Гармонизатор", "Кооператор", "Ученик"], weaknessesArr: ["Лень", "Поверхность", "Небрежность"], archetypes: ["Союзник", "Помощник"], keyMeanings: "Гармония, возможности, кооперация", psychologicalManifestations: "Сотрудничество, лёгкость", emotions: "Удовлетворенность, открытость", strengths: "Гармонизатор, кооператор", weaknesses: "Лень, поверхность", recommendations: "Используйте возможности, сотрудничайте", warnings: "Не упускайте возможности" },
    { name: "Квадрат", code: "square", symbol: "■", lifeThemes: ["Борьба", "Препятствия", "Вызов"], keyMeaningsArr: ["Напряжение", "Препятствие", "Внутренний конфликт"], positiveQualities: ["Динамизм", "Прорванность", "Решимость"], shadowQualities: ["Агрессия", "Нетерпение", "Конфликт"], positiveEmotions: ["Энергия", "Мотивация", "Стремление"], negativeEmotions: ["Гнев", "Раздражение", "Напряженность"], strengthsArr: ["Боец", "Прорватель", "Побеждитель"], weaknessesArr: ["Агрессия", "Импульсивность", "Конфликтность"], archetypes: ["Боец", "Прорватель", "Трудоголик"], keyMeanings: "Напряжение, препятствие, внутренний конфликт", psychologicalManifestations: "Внутренний конфликт, динамизм, прорванность", emotions: "Энергия, мотивация, гнев", strengths: "Боец, прорватель, побеждитель", weaknesses: "Агрессия, импульсивность", recommendations: "Работайте с конфликтом, развивайте динамизм", warnings: "Остерегайтесь агрессии, конфликтов" },
    { name: "Трин", code: "trine", symbol: "△", lifeThemes: ["Удача", "Гармония", "Поток"], keyMeaningsArr: ["Гармония", "Поток", "Благо", "Естественность"], positiveQualities: ["Гармония", "Лёгкость", "Естественность"], shadowQualities: ["Лень", "Поверхность", "Пассивность"], positiveEmotions: ["Спокойствие", "Радость", "Удовлетворенность"], negativeEmotions: ["Пассивность", "Лень", "Невнимательность"], strengthsArr: ["Гармонизатор", "Союзник", "Умелец"], weaknessesArr: ["Лень", "Поверхность", "Пассивность"], archetypes: ["Гармонизатор", "Помощник", "Благотворитель"], keyMeanings: "Гармония, поток, благо", psychologicalManifestations: "Естественный поток, лёгкость", emotions: "Спокойствие, радость, удовлетворенность", strengths: "Гармонизатор, союзник, умелец", weaknesses: "Лень, поверхность", recommendations: "Используйте поток, не лените", warnings: "Остерегайтесь лени, пассивности" },
    { name: "Оппозиция", code: "opposition", symbol: "☍", lifeThemes: ["Конфликт", "Отношения", "Баланс"], keyMeaningsArr: ["Противоположность", "Конфликт", "Баланс", "Отношения"], positiveQualities: ["Баланс", "Осознанность", "Сотрудничество"], shadowQualities: ["Конфликт", "Нерешительность", "Раскол"], positiveEmotions: ["Осознанность", "Гармония", "Удовлетворенность"], negativeEmotions: ["Конфликт", "Нерешительность", "Напряженность"], strengthsArr: ["Миротворец", "Дипломат", "Переговорщик"], weaknessesArr: ["Конфликт", "Нерешительность", "Раскол"], archetypes: ["Переговорщик", "Миротворец", "Арбитр"], keyMeanings: "Противоположность, конфликт, баланс", psychologicalManifestations: "Осознанность, необходимость баланса", emotions: "Осознанность, гармония, конфликт", strengths: "Миротворец, дипломат, переговорщик", weaknesses: "Конфликт, нерешительность", recommendations: "Ищите баланс, развивайте осознанность", warnings: "Остерегайтесь конфликтов, раскола" },
  ];

  // Все сущности астрологии
  const allAstrologyEntities = [
    ...planetDefs.map((d) => ({ ...d, system: "astrology" as const, type: "planet" as const })),
    ...signDefs.map((d) => ({ ...d, system: "astrology" as const, type: "sign" as const })),
    ...houseDefs.map((d) => ({ ...d, system: "astrology" as const, type: "house" as const })),
    ...aspectDefs.map((d) => ({ ...d, system: "astrology" as const, type: "aspect" as const })),
  ];

  const entityRows = await db
    .insert(ontologyEntitiesTable)
    .values(allAstrologyEntities.map((d) => ({
      name: d.name,
      code: d.code,
      system: d.system,
      type: d.type,
      symbol: d.symbol,
    })))
    .onConflictDoNothing({ target: ontologyEntitiesTable.code })
    .returning();

  const entityMap = new Map(entityRows.map((e) => [e.code, e]));

  // Профили с JSONB массивами
  const profileInserts = allAstrologyEntities
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
      };
    })
    .filter(Boolean) as any[];

  if (profileInserts.length > 0) {
    await db
      .insert(ontologyEntityProfilesTable)
      .values(profileInserts)
      .onConflictDoNothing({ target: ontologyEntityProfilesTable.entityId });
  }

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
  addLink("mercury", "education", 0.9, "positive");
  addLink("mercury", "communication", 1.0, "positive");
  addLink("venus", "love", 1.0, "positive");
  addLink("venus", "creativity", 0.8, "positive");
  addLink("mars", "career", 0.7, "positive");
  addLink("mars", "struggle", 0.6, "neutral");
  addLink("jupiter", "travel", 0.8, "positive");
  addLink("jupiter", "money", 0.9, "positive");
  addLink("saturn", "career", 1.0, "positive");
  addLink("saturn", "money", 0.8, "positive");
  addLink("uranus", "freedom", 1.0, "positive");
  addLink("uranus", "travel", 0.6, "positive");
  addLink("neptune", "spirituality", 1.0, "positive");
  addLink("neptune", "creativity", 0.9, "positive");
  addLink("pluto", "struggle", 0.8, "neutral");
  addLink("pluto", "spirituality", 0.7, "positive");

  // Знаки
  addLink("aries", "struggle", 0.8, "neutral");
  addLink("taurus", "money", 0.8, "positive");
  addLink("gemini", "communication", 1.0, "positive");
  addLink("cancer", "family", 1.0, "positive");
  addLink("leo", "creativity", 0.9, "positive");
  addLink("virgo", "health", 0.9, "positive");
  addLink("libra", "love", 0.9, "positive");
  addLink("scorpio", "struggle", 0.7, "neutral");
  addLink("sagittarius", "travel", 0.9, "positive");
  addLink("capricorn", "career", 1.0, "positive");
  addLink("aquarius", "freedom", 0.9, "positive");
  addLink("pisces", "spirituality", 0.9, "positive");

  // Дома
  addLink("house_1", "freedom", 0.7, "positive");
  addLink("house_2", "money", 1.0, "positive");
  addLink("house_3", "communication", 0.9, "positive");
  addLink("house_4", "family", 1.0, "positive");
  addLink("house_5", "creativity", 1.0, "positive");
  addLink("house_6", "health", 0.9, "positive");
  addLink("house_7", "love", 0.9, "positive");
  addLink("house_8", "struggle", 0.7, "neutral");
  addLink("house_9", "travel", 0.9, "positive");
  addLink("house_10", "career", 1.0, "positive");
  addLink("house_11", "freedom", 0.8, "positive");
  addLink("house_12", "spirituality", 0.9, "positive");

  // Аспекты
  addLink("conjunction", "struggle", 0.5, "neutral");
  addLink("sextile", "love", 0.6, "positive");
  addLink("square", "struggle", 0.8, "neutral");
  addLink("trine", "love", 0.8, "positive");
  addLink("opposition", "struggle", 0.7, "neutral");

  if (entityThemeLinks.length > 0) {
    await db
      .insert(ontologyEntityThemesTable)
      .values(entityThemeLinks)
      .onConflictDoNothing();
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

  if (relationInserts.length > 0) {
    await db
      .insert(ontologyEntityRelationsTable)
      .values(relationInserts)
      .onConflictDoNothing();
  }

  console.log(
    "Seeded:",
    entityRows.length,
    "entities,",
    themeRows.length,
    "themes,",
    profileInserts.length,
    "profiles,",
    entityThemeLinks.length,
    "entity-theme links,",
    relationInserts.length,
    "entity relations",
  );
  process.exit(0);
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});
