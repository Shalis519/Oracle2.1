const SIGN_PREPOSITIONAL: Record<string, string> = {
  Овен: "Овне",
  Телец: "Тельце",
  Близнецы: "Близнецах",
  Рак: "Раке",
  Лев: "Льве",
  Дева: "Деве",
  Весы: "Весах",
  Скорпион: "Скорпионе",
  Стрелец: "Стрельце",
  Козерог: "Козероге",
  Водолей: "Водолее",
  Рыбы: "Рыбах",
};

const BODY_DATIVE: Record<string, string> = {
  "северный узел": "Северному узлу",
  "южный узел": "Южному узлу",
  хирон: "Хирону",
  плутон: "Плутону",
  нептун: "Нептуну",
  уран: "Урану",
  сатурн: "Сатурну",
  юпитер: "Юпитеру",
  марс: "Марсу",
  венера: "Венере",
  меркурий: "Меркурию",
  луна: "Луне",
  солнце: "Солнцу",
};

const BODY_INSTRUMENTAL: Record<string, string> = {
  "северный узел": "Северным узлом",
  "южный узел": "Южным узлом",
  хирон: "Хироном",
  плутон: "Плутоном",
  нептун: "Нептуном",
  уран: "Ураном",
  сатурн: "Сатурном",
  юпитер: "Юпитером",
  марс: "Марсом",
  венера: "Венерой",
  меркурий: "Меркурием",
  луна: "Луной",
  солнце: "Солнцем",
};

export function signInPrepositional(sign: string): string {
  const form = SIGN_PREPOSITIONAL[sign] ?? sign;
  return form.toLowerCase().startsWith("ль") ? `во ${form}` : `в ${form}`;
}

export function bodyDative(name: string): string {
  return BODY_DATIVE[name.toLowerCase()] ?? name;
}

export function bodyInstrumental(name: string): string {
  return BODY_INSTRUMENTAL[name.toLowerCase()] ?? name;
}

export function transitBodyPhrase(name: string): string {
  const feminine = new Set(["венера", "луна"]);
  const neuter = new Set(["солнце"]);
  const lower = name.toLowerCase();
  const adjective = feminine.has(lower) ? "Транзитная" : neuter.has(lower) ? "Транзитное" : "Транзитный";
  return `${adjective} ${name}`;
}

export function natalBodyInHouse(name: string, house: number): string {
  const lower = name.toLowerCase();
  const feminine = new Set(["венера", "луна"]);
  const neuter = new Set(["солнце"]);
  const adjective = feminine.has(lower) ? "Натальная" : neuter.has(lower) ? "Натальное" : "Натальный";
  const verb = feminine.has(lower) ? "расположена" : neuter.has(lower) ? "расположено" : "расположен";
  return `${adjective} ${name} ${verb} в Вашем ${house}-м доме.`;
}

export function aspectAccusative(aspect: string): string {
  return aspect.toLowerCase() === "оппозиция" ? "оппозицию" : aspect.toLowerCase();
}

export function firstSentence(text: string): string {
  const value = text.trim();
  const match = /^[^.!?]+[.!?]/.exec(value);
  return match ? match[0].trim() : value;
}

export function ensureSentence(text: string): string {
  const value = text.trim();
  if (!value) return value;
  return /[.!?…]$/.test(value) ? value : `${value}.`;
}

export function lowerFirst(text: string): string {
  return text.charAt(0).toLowerCase() + text.slice(1);
}

export function formatList(items: string[], limit = 4): string {
  const clean = items
    .map((item) => lowerFirst(item.trim().replace(/[.!?]+$/g, "")))
    .filter(Boolean)
    .slice(0, limit);
  if (clean.length === 0) return "";
  if (clean.length === 1) return clean[0];
  if (clean.length === 2) return `${clean[0]} и ${clean[1]}`;
  return `${clean.slice(0, -1).join(", ")} и ${clean[clean.length - 1]}`;
}

export function toPersonalThemes(text: string): string {
  return lowerFirst(text.trim())
    .replace(/\bмышление\b/gi, "Ваше мышление")
    .replace(/\bречь\b/gi, "Вашу речь")
    .replace(/\bанализ\b/gi, "Ваш анализ")
    .replace(/\bкоммуникация\b/gi, "Вашу коммуникацию")
    .replace(/\bсила воли\b/gi, "Вашу силу воли")
    .replace(/\bтворчество\b/gi, "Ваше творчество")
    .replace(/\bсамовыражение\b/gi, "Ваше самовыражение")
    .replace(/\bучёба\b/gi, "Вашу учёбу")
    .replace(/\bобщение\b/gi, "Ваше общение");
}

export function toAccusativeThemes(text: string): string {
  return text
    .replace(/\bмышление\b/gi, "мышление")
    .replace(/\bречь\b/gi, "речь")
    .replace(/\bанализ\b/gi, "анализ")
    .replace(/\bкоммуникация\b/gi, "коммуникацию")
    .replace(/\bсила воли\b/gi, "силу воли")
    .replace(/\bтворчество\b/gi, "творчество")
    .replace(/\bсамовыражение\b/gi, "самовыражение")
    .replace(/\bучёба\b/gi, "учёбу")
    .replace(/\bобщение\b/gi, "общение");
}

export function plantForTea(plant: string): string {
  const forms: Record<string, string> = {
    мята: "мятой",
    ромашка: "ромашкой",
    мелисса: "мелиссой",
    лаванда: "лавандой",
    шалфей: "шалфеем",
    чабрец: "чабрецом",
    розмарин: "розмарином",
    валериана: "валерианой",
    пустырник: "пустырником",
    имбирь: "имбирём",
  };
  return forms[plant.trim().toLowerCase()] ?? plant;
}

export function colorShades(color: string): string {
  const value = lowerFirst(color.trim());
  const forms: Record<string, string> = {
    зелёный: "зелёные",
    зеленый: "зелёные",
    фиолетовый: "фиолетовые",
    розовый: "розовые",
    жёлтый: "жёлтые",
    желтый: "жёлтые",
    золотой: "золотистые",
    серебряный: "серебристые",
    голубой: "голубые",
    синий: "синие",
    красный: "красные",
    оранжевый: "оранжевые",
    белый: "белые",
    серый: "серые",
    чёрный: "чёрные",
    черный: "чёрные",
  };
  return `${forms[value] ?? value} оттенки`;
}

export function profileListText(profile: { keyMeaningsArr?: string[]; keyMeanings?: string | null } | null): string[] {
  if (!profile) return [];
  if (profile.keyMeaningsArr?.length) return Array.from(new Set(profile.keyMeaningsArr.map((item) => lowerFirst(item.trim())).filter(Boolean)));
  return Array.from(new Set(profile.keyMeanings?.split(/[,;]+/).map((item) => lowerFirst(item.trim())).filter(Boolean) ?? []));
}

export function buildTransitOpening(input: {
  transitBody: string;
  transitSign: string;
  aspect: string;
  natalBody: string;
  natalSign: string;
  transitHouse?: number | null;
}): string {
  const housePart = input.transitHouse ? ` Транзит проходит через Ваш ${input.transitHouse}-й дом.` : "";
  return `Сегодня ${transitBodyPhrase(input.transitBody)} находится ${signInPrepositional(input.transitSign)} и образует ${aspectAccusative(input.aspect)} с ${bodyInstrumental(input.natalBody)} ${signInPrepositional(input.natalSign)}.${housePart}`;
}

export function buildPersonalInfluence(themes: string): string {
  return `Этот транзит в первую очередь влияет на ${toPersonalThemes(themes)}.`;
}

export function buildPrimaryFocus(themes: string, evidence?: string): string {
  return evidence
    ? `Основной акцент дня - ${themes}. Он подтверждается несколькими факторами: ${evidence}.`
    : `Основной акцент дня - ${themes}.`;
}

export function buildHouseThemes(house: number, themes: string): string {
  return `В ${house}-м доме усиливаются темы: ${themes}`;
}

export function buildSignThemes(themes: string): string {
  return `Положение в знаке направляет внимание на ${toAccusativeThemes(themes)}`;
}

export function renderParagraphs(paragraphs: string[]): string {
  const unique = paragraphs
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
    .map(ensureSentence)
    .filter((paragraph, index, all) => all.indexOf(paragraph) === index);
  return unique.join("\n\n");
}

export function relationToPersonalInfluence(description: string): string | null {
  const match = description.trim().match(/(?:это\s+)?затрагивает\s+темы?\s*:?\s*(.+?)(?:[.!?]|$)/i);
  return match?.[1] ? `Этот транзит в первую очередь влияет на ${toPersonalThemes(match[1].trim())}.` : null;
}
