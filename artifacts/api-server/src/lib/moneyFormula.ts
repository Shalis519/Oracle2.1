import type { NatalChart, NatalBody } from "./astrology";

export type MoneySection = {
  key: string;
  title: string;
  paragraphs: string[];
};

export type MoneyFormulaResult = {
  formula: "money";
  formulaLabel: string;
  title: string;
  sections: MoneySection[];
  methodology: {
    houseSystem: "Placidus";
    source: "Денежные дома";
    includedHouses: number[];
    note: string;
  };
};

const RULERS: Record<string, string[]> = {
  aries: ["mars"],
  taurus: ["venus"],
  gemini: ["mercury"],
  cancer: ["moon"],
  leo: ["sun"],
  virgo: ["mercury"],
  libra: ["venus"],
  scorpio: ["mars", "pluto"],
  sagittarius: ["jupiter"],
  capricorn: ["saturn"],
  aquarius: ["saturn", "uranus"],
  pisces: ["jupiter", "neptune"],
};

const BODY_NAMES: Record<string, string> = {
  sun: "Солнце",
  moon: "Луна",
  mercury: "Меркурий",
  venus: "Венера",
  mars: "Марс",
  jupiter: "Юпитер",
  saturn: "Сатурн",
  uranus: "Уран",
  neptune: "Нептун",
  pluto: "Плутон",
};

const HOUSE_ROMAN: Record<number, string> = { 2: "II", 5: "V", 8: "VIII", 11: "XI" };
const SIGN_LOCATIVE: Record<string, string> = {
  aries: "Овне",
  taurus: "Тельце",
  gemini: "Близнецах",
  cancer: "Раке",
  leo: "Льве",
  virgo: "Деве",
  libra: "Весах",
  scorpio: "Скорпионе",
  sagittarius: "Стрельце",
  capricorn: "Козероге",
  aquarius: "Водолее",
  pisces: "Рыбах",
};

function houseTitle(chart: NatalChart, number: number): string {
  const house = chart.houses.find((item) => item.number === number);
  return `${HOUSE_ROMAN[number]} дом в ${SIGN_LOCATIVE[house?.signKey ?? ""] ?? house?.sign ?? "неопределённом знаке"}`;
}

function rulerKeys(chart: NatalChart, number: number): string[] {
  const house = chart.houses.find((item) => item.number === number);
  return house ? RULERS[house.signKey] ?? [] : [];
}

function bodiesInHouse(chart: NatalChart, number: number): NatalBody[] {
  return chart.bodies.filter((body) => body.house === number && BODY_NAMES[body.key]);
}

function bodyHouseText(chart: NatalChart, bodyKey: string): string {
  const body = chart.bodies.find((item) => item.key === bodyKey);
  return body?.house ? `${BODY_NAMES[bodyKey] ?? bodyKey} находится в ${HOUSE_ROMAN[body.house] ?? body.house} доме.` : `${BODY_NAMES[bodyKey] ?? bodyKey} в доме не определён.`;
}

function section(key: string, title: string, paragraphs: string[]): MoneySection {
  return { key, title, paragraphs };
}

function buildSecondHouseSection(chart: NatalChart): MoneySection {
  const house = chart.houses.find((item) => item.number === 2);
  const paragraphs = [
    "Это сфера самостоятельного заработка, ваших талантов, ценностей и всего, что вы можете «схватить» руками.",
  ];
  if (house?.signKey === "capricorn") {
    paragraphs.push(
      "Козерог на куспиде II дома говорит: ваши деньги любят порядок, структуру и время. Вы зарабатываете не взрывами, а методичным трудом, шаг за шагом. Финансовый успех приходит с опытом. Чем старше вы становитесь, тем стабильнее поток.",
      "Профессии и направления\n• Недвижимость, строительство, производство мебели.\n• Работа в пожилом коллективе, государственных учреждениях.\n• Нумизматика, часовое дело, гравировка, работа каменщиком, чиновничья деятельность.",
      "Отдельно стоит отметить направление работы с людьми старшего поколения. Это может быть заработок в коллективе, где работают возрастные сотрудники, а также создание услуг, товаров или бизнеса для пожилых людей.",
      "Территория и услуги\n• Компанию или офис хорошо размещать около министерств, правительственных зданий и складов.\n• Подходящие услуги: склады для долгохранящихся продуктов, тендеры, земледелие, холодильное оборудование.",
      "Ваши денежные привычки\n• Важно быть официально устроенным, вести ежедневник и развивать тайм-менеджмент.\n• Хорошо иметь счет в надежном банке и дебетовую карту с символом Козерога или Сатурна. Сейчас это реализовать очень легко, многие банки позволяют выбрать индивидуальную гравировку на дебетовой карте.\n• Работа на севере или с северными регионами может приносить доход.",
      "Денежный период\nДекабрь и январь, время, когда финансовые потоки активизируются лучше всего. Это можно учитывать при запуске проектов.",
      "Медицинская сфера\nОбратите внимание на колени, надколенники, волосы и кожу. Инвестиции в здоровье этих зон возвращаются ресурсом.",
      "Страны и города\nГермания, Англия и Болгария. Эти точки мира могут стать источником дохода или удачными направлениями для деловых поездок.",
    );
  }
  return section("house-2", houseTitle(chart, 2), paragraphs);
}

function buildPlanetSections(chart: NatalChart, houseNumber: number): MoneySection[] {
  const sections: MoneySection[] = [];
  if (houseNumber === 2 && bodiesInHouse(chart, 2).some((body) => body.key === "neptune")) {
    sections.push(section("planet-neptune-house-2", "Нептун во II доме", [
    "Во II доме также стоит Нептун, планета мечты, интуиции и тонких энергий.",
    "Это добавляет:\n• Лёгкие деньги через медитации, ритуалы, визуализации. Ваш ресурс растёт, когда вы верите в изобилие.\n• «Розовые очки» мешают видеть реальность. Возможен риск финансовых иллюзий, мнимых схем и «пузырей». Важно перепроверять цифры и не вестись на слишком прекрасные обещания.",
    "Важно помнить, что у планет нет задачи вредить землянам. Они всего лишь закручивают человека в определенные энергетические вихри. В данном случае Нептун может дать три варианта развития:\n\n    1 Обманные схемы заработков для улучшения благосостояния используете вы.\n    2 Вы попадаетесь на мошенников и теряете свои деньги и сбережения.\n    3 Вы знаете, что можете обмануть, знаете, что вас могут обмануть, но выбираете не участвовать в этих историях.",
    "Направления по Нептуну: актёрство, лечение, морские виды спорта и деятельности, карты желаний как один из способов напоминать своему бессознательному, куда вы движетесь, трансерфинг, музыка, работа DJ, продажа «мечты», косметика, ароматы, психология, жидкости, сомелье, рисование, аромо-диагностика и фотография.",
    "Важно учесть, что когда человек находится в жизненной ситуации, в которой он не готов переучиваться, но хочет увеличить доход, эти направления можно использовать без полной смены деятельности. Например, бухгалтер может начать работать с фотографами и вести их бухгалтерию.",
    "Нептун во II доме делает ваш заработок чувствительным к настроению. Когда вы в гармонии с собой, деньги тянутся сами. Когда вы в тревоге, они могут утекать незаметно.",
    ]));
  }
  return sections;
}

function buildEighthHouseSection(chart: NatalChart): MoneySection | null {
  const house = chart.houses.find((item) => item.number === 8);
  const paragraphs: string[] = [];
  if (house?.signKey === "cancer") {
    paragraphs.push("VIII дом в Раке связывает тему общих и чужих денег с семьей, родителями, наследством, недвижимостью и семейным имуществом. Здесь могут быть актуальны семейный бизнес, вопросы жилья, страхование имущества и финансовые вопросы, связанные с родом.\nТакже здесь есть показатель денег от женщин, а также наследства и финансовых ресурсов, связанных с женской линией семьи.");
  }
  const rulers = rulerKeys(chart, 8);
  if (rulers.includes("moon") && chart.bodies.find((body) => body.key === "moon")?.house === 4) {
    paragraphs.push("Управитель VIII дома, Луна, находится в Овне и расположена в IV доме. Это усиливает темы недвижимости, семейного бизнеса с родителями, наследства и страхования недвижимого имущества. В финансовых вопросах, связанных с семьей и жильем, вы можете действовать самостоятельно, быстро принимать решения и брать инициативу на себя.");
  }
  return paragraphs.length ? section("house-8", houseTitle(chart, 8), paragraphs) : null;
}

function buildFifthHouseSection(chart: NatalChart): MoneySection {
  const paragraphs = ["V дом связан с удачей, везением, подарками, выигрышами, творчеством, развлечениями и хобби."];
  const rulers = rulerKeys(chart, 5);
  if (rulers.includes("venus") && chart.bodies.find((body) => body.key === "venus")?.house === 9) {
    paragraphs.push("V домом управляет Венера. Венера находится в IX доме. Поэтому темы творчества, удачи и дополнительных возможностей могут реализовываться через образование, обучение, путешествия и международные направления.", "Венера также может связывать финансовые возможности с красотой, эстетикой, искусством, созданием привлекательных продуктов и работой с женской аудиторией. Положение в IX доме добавляет к этому обучение, преподавание, поездки, иностранные контакты и расширение кругозора.", "Венера в IX доме также дает возможность ловить удачу через иностранные направления. Это могут быть покупка иностранных лотерейных билетов, участие в зарубежных конкурсах, международных розыгрышах и проектах, связанных с иностранной аудиторией.");
  }
  return section("house-5", houseTitle(chart, 5), paragraphs);
}

function buildEleventhHouseSection(chart: NatalChart): MoneySection {
  const house = chart.houses.find((item) => item.number === 11);
  const paragraphs = ["XI дом связан с доходами от общественных организаций, фондов, акционерных обществ, сообществ и коллективных проектов. Также он показывает мечты и желания человека."];
  if (house?.signKey === "scorpio" && rulerKeys(chart, 11).includes("pluto") && chart.bodies.find((body) => body.key === "pluto")?.house === 11) {
    paragraphs.push("Управитель XI дома, Скорпион, Плутон, находится в XI доме.", "Это дает следующие источники дохода:\n• Доходы через интернет, социальные сети и онлайн-платформы.\n• Друзья и сообщества могут приносить деньги.\n• Работа в фондах, общественных организациях и с единомышленниками.\n• Дистанционная работа, фриланс, IT и медиа.\n• Аудитория, подписчики и массовые проекты.", "Плутон в XI доме усиливает эти темы. Деньги могут приходить через трансформацию, работу с большими деньгами сообществ, инвестиции в коллективные проекты и пассивный доход от аудитории. По энергиям, это может напоминать Тони Робинсона, стоя на сцене, через техники НЛП, вводит людей в состояние коллективного гипноза и задает им некий вектор к действиям. Еще для сравнения, можно вспомнишь Кашпировского, который через экран телевизора, вводил людей в гипнотическое состояние. Как использовать этот показатель в натальной карте, решать вам.");
  }
  return section("house-11", houseTitle(chart, 11), paragraphs);
}

function buildSummary(chart: NatalChart): MoneySection | null {
  const house2 = chart.houses.find((item) => item.number === 2);
  const house8 = chart.houses.find((item) => item.number === 8);
  const house5 = chart.houses.find((item) => item.number === 5);
  const clauses: string[] = [];
  if (house2?.signKey === "capricorn") clauses.push("системной и официальной работы");
  if (house8?.signKey === "cancer") clauses.push("семейно-имущественных вопросов");
  if (house5 && rulerKeys(chart, 5).includes("venus") && chart.bodies.find((body) => body.key === "venus")?.house === 9) clauses.push("образования либо международной деятельности");

  // The source document contains this synthesis only for the complete
  // three-indicator configuration above. Do not reuse it for another chart.
  if (clauses.length !== 3) return null;

  return section("summary", "Итог", [
    "Ваш денежный потенциал связан с сочетанием трех основных направлений: системной и официальной работы, семейно-имущественных вопросов и образования либо международной деятельности.",
    "Наиболее подходящая финансовая стратегия: действовать последовательно, вести учет, планировать накопления, внимательно работать с документами и постепенно создавать устойчивую материальную базу. Дополнительные возможности могут открываться через недвижимость, семейные проекты, обучение, путешествия, творческие направления и работу с коллективами.",
    "В денежных вопросах важно сохранять ясность, не принимать решения только под влиянием эмоций и тщательно проверять финансовые предложения, особенно если они кажутся слишком легкими или быстро доходными. Обязательно иметь подушку безопасности.",
  ]);
}

export function computeMoneyFormula(chart: NatalChart): MoneyFormulaResult {
  const sections: MoneySection[] = [
    buildSecondHouseSection(chart),
    ...buildPlanetSections(chart, 2),
    buildFifthHouseSection(chart),
    ...buildPlanetSections(chart, 5),
    buildEighthHouseSection(chart),
    ...buildPlanetSections(chart, 8),
    buildEleventhHouseSection(chart),
    ...buildPlanetSections(chart, 11),
    buildSummary(chart),
  ].filter((item): item is MoneySection => Boolean(item));
  return {
    formula: "money",
    formulaLabel: "Денежные дома",
    title: "Денежные дома вашей натальной карты",
    sections,
    methodology: {
      houseSystem: "Placidus",
      source: "Денежные дома",
      includedHouses: [2, 5, 8, 11],
      note: "Тексты и правила интерпретации взяты только из файла «Денежные дома». Дополнительные авторские примеры не включены в автоматический расчёт.",
    },
  };
}

export function getBodyHouseLabel(chart: NatalChart, bodyKey: string): string {
  return bodyHouseText(chart, bodyKey);
}
