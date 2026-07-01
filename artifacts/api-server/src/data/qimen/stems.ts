// Небесные Стволы — роли и значения в Ци Мэнь Дун Цзя (по материалу fengi.ru).
// Стволы делятся на три группы: Главнокомандующий (甲), Мистики (乙丙丁),
// Инструменты (戊己庚辛壬癸). Эти роли используются логикой расчёта структур.

export type StemRole = "commander" | "mystic" | "instrument";

export interface StemInfo {
  stem: string; // ханьцзы
  nameRu: string; // русская транскрипция
  role: StemRole;
  secondName?: string; // напр. "Звёздный Мистик" для 丁
  isEnemy?: boolean; // 庚 — главный противник
  note?: string;
}

export const STEM_INFO: Record<string, StemInfo> = {
  甲: {
    stem: "甲",
    nameRu: "Цзя",
    role: "commander",
    note: "Главнокомандующий; никогда не виден открыто — прячется за 旬首仪.",
  },
  乙: {
    stem: "乙",
    nameRu: "И",
    role: "mystic",
    secondName: "Солнечный Мистик",
    note: "Отношения: супружеские, деловые, партнёрские.",
  },
  丙: {
    stem: "丙",
    nameRu: "Бин",
    role: "mystic",
    secondName: "Лунный Мистик",
    note: "Активизация денег и бизнеса; самый активный оператор.",
  },
  丁: {
    stem: "丁",
    nameRu: "Дин",
    role: "mystic",
    secondName: "Звёздный Мистик",
    note: "Прогнозы, документы, красота; ядро структуры «Нефритовая Дева».",
  },
  戊: { stem: "戊", nameRu: "У", role: "instrument", note: "Деньги, капитал, стабильность." },
  己: { stem: "己", nameRu: "Цзи", role: "instrument", note: "Забота, планирование." },
  庚: {
    stem: "庚",
    nameRu: "Гэн",
    role: "instrument",
    isEnemy: true,
    note: "Главный противник, враг, агрессия; взаимодействия почти всегда неблагоприятны.",
  },
  辛: { stem: "辛", nameRu: "Синь", role: "instrument", note: "Наказание, изящество." },
  壬: { stem: "壬", nameRu: "Жэнь", role: "instrument", note: "Скрытое, тайное, стремительность." },
  癸: { stem: "癸", nameRu: "Гуй", role: "instrument", note: "Осторожное движение к цели." },
};

const stemsWithRole = (role: StemRole) =>
  Object.values(STEM_INFO).filter((s) => s.role === role).map((s) => s.stem);

// Три Мистика (乙丙丁) — «позитивные» стволы, благоприятные операторы карты.
export const MYSTICS: ReadonlySet<string> = new Set(stemsWithRole("mystic"));

// Главнокомандующий 甲 — прячется за 旬首仪, открыто в карте не стоит.
export const COMMANDER = stemsWithRole("commander")[0]!;

// 庚 Гэн — враг; его присутствие портит благоприятную структуру отношений.
export const ENEMY = Object.values(STEM_INFO).find((s) => s.isEnemy)!.stem;
