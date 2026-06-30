export interface FlyingStarData {
  direction: string;
  starNumber: number;
  starName: string;
  influence: string;
  recommendation: string;
  isUnfavorable: boolean;
}

export const DIRECTIONS = [
  "Север",
  "Северо-восток",
  "Восток",
  "Юго-восток",
  "Юг",
  "Юго-запад",
  "Запад",
  "Северо-запад",
  "Центр",
];

// Летящие звёзды на 2026 год (год Огненной Лошади, период 9).
export const FLYING_STARS_2026: Record<string, FlyingStarData> = {
  Центр: {
    direction: "Центр",
    starNumber: 1,
    starName: "Белая звезда (Тань Лан)",
    influence:
      "Звезда карьеры, мудрости и новых начинаний. Благоприятна для роста и личного развития.",
    recommendation:
      "Активируйте центр дома водой или металлическими предметами. Хорошо для рабочего места.",
    isUnfavorable: false,
  },
  "Северо-запад": {
    direction: "Северо-запад",
    starNumber: 2,
    starName: "Чёрная звезда болезней (Цзюй Мэнь)",
    influence:
      "Неблагоприятная звезда здоровья. Может ослаблять иммунитет и приносить недомогания.",
    recommendation:
      "Держите сектор в тишине и порядке. Повесьте металлический колокольчик «у-лоу», избегайте красного. Не ставьте здесь кровать надолго.",
    isUnfavorable: true,
  },
  Запад: {
    direction: "Запад",
    starNumber: 3,
    starName: "Нефритовая звезда ссор (Лу Цунь)",
    influence:
      "Звезда конфликтов и споров. Может провоцировать раздражительность и недопонимание.",
    recommendation:
      "Добавьте красный декор или свет, чтобы ослабить звезду. Избегайте зелёного и воды в этом секторе.",
    isUnfavorable: true,
  },
  "Северо-восток": {
    direction: "Северо-восток",
    starNumber: 4,
    starName: "Звезда романтики и учёбы (Вэнь Цюй)",
    influence:
      "Благоприятна для отношений, творчества и обучения. Поддерживает интеллект.",
    recommendation:
      "Поставьте здесь рабочий стол или живые растения. Хорошо для занятий и творчества.",
    isUnfavorable: false,
  },
  Юг: {
    direction: "Юг",
    starNumber: 5,
    starName: "Жёлтая звезда (У Хуан)",
    influence:
      "Самая неблагоприятная звезда года — несчастья и препятствия. Требует осторожности.",
    recommendation:
      "Держите сектор спокойным, без активности и ремонта. Используйте металл и соляные лампы. Не спите здесь, если возможно.",
    isUnfavorable: true,
  },
  Север: {
    direction: "Север",
    starNumber: 6,
    starName: "Белая звезда небес (У Цюй)",
    influence:
      "Благоприятная звезда покровительства и силы. Приносит поддержку и авторитет.",
    recommendation:
      "Активируйте металлом и светлыми тонами. Хорошо для кабинета и важных дел.",
    isUnfavorable: false,
  },
  "Юго-запад": {
    direction: "Юго-запад",
    starNumber: 7,
    starName: "Красная звезда (По Цзюнь)",
    influence:
      "Звезда возможных потерь и обмана. Требует внимательности в финансах.",
    recommendation:
      "Добавьте воду для смягчения. Будьте осторожны с документами и деньгами в этом секторе.",
    isUnfavorable: true,
  },
  Восток: {
    direction: "Восток",
    starNumber: 8,
    starName: "Белая звезда богатства (Цзо Фу)",
    influence:
      "Самая благоприятная звезда процветания и изобилия. Приносит достаток и удачу.",
    recommendation:
      "Активируйте водой, кристаллами и активностью. Отличное место для кровати, стола и важных дел.",
    isUnfavorable: false,
  },
  "Юго-восток": {
    direction: "Юго-восток",
    starNumber: 9,
    starName: "Пурпурная звезда (Ю Би)",
    influence:
      "Звезда будущего процветания, радости и исполнения желаний. Очень благоприятна в период 9.",
    recommendation:
      "Активируйте ярким светом и живыми цветами. Прекрасно для спальни и зон отдыха.",
    isUnfavorable: false,
  },
};

export function getFlyingStar(direction: string): FlyingStarData {
  return FLYING_STARS_2026[direction] ?? FLYING_STARS_2026["Центр"];
}

// Each of the nine flying stars appears exactly once in the 2026 annual chart,
// so the chart doubles as a star-number -> meaning lookup. This is reused to
// describe the MONTHLY flying star that visits a sector in a given Bazi month.
const STAR_BY_NUMBER: Record<number, FlyingStarData> = Object.fromEntries(
  Object.values(FLYING_STARS_2026).map((s) => [s.starNumber, s]),
);

export function getStarByNumber(starNumber: number): FlyingStarData {
  return STAR_BY_NUMBER[starNumber] ?? FLYING_STARS_2026["Центр"];
}
