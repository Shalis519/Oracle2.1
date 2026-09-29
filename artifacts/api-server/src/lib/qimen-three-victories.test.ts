import { describe, it, expect } from "vitest";
import {
  computeThreeVictories,
  DayHourCheckItem,
  PalaceChartInfo,
} from "./qimen/threeVictories";
import { QimenBirthChart, QimenMonthChart } from "./qimen";

describe("Qimen Three Victories (三胜)", () => {
  const mockPalaces: Record<number, PalaceChartInfo> = {
    1: { palace: 1, doorName: "Открытие", deityName: "Великий Инь", heavenStem: "Bing", earthStem: "Yi" },
    2: { palace: 2, doorName: "Рождение", deityName: "Девять Небес", heavenStem: "Bing", earthStem: "Wu" }, // Bird in nest + 生门 + 九天
    3: { palace: 3, doorName: "Отдых", deityName: "Девять Земель", heavenStem: "Geng", earthStem: "Geng" },
    4: { palace: 4, doorName: "Ранение", deityName: "Чжи Фу", heavenStem: "Jia", earthStem: "Gui" },
    6: { palace: 6, doorName: "Смерть", deityName: "Девять Небес", heavenStem: "Xin", earthStem: "Ren" },
    7: { palace: 7, doorName: "Страх", deityName: "Белый Тигр", heavenStem: "Ren", earthStem: "Bing" },
    8: { palace: 8, doorName: "Иллюзия", deityName: "Красный Феникс", heavenStem: "Gui", earthStem: "Wu" },
    9: { palace: 9, doorName: "Смерть", deityName: "Змей", heavenStem: "Ding", earthStem: "Xin" },
  };

  const mockMonthChart: QimenMonthChart = {
    yearGanZhi: "Bing Wu",
    monthGanZhi: "Geng Yin",
    solarTerm: "Yushui",
    yinYang: "Yang",
    structureNumber: 8,
    leadLeaderStem: "Jia",
    leadLeaderStar: "Tian Xin",
    leadGateDoor: "Открытие",
    cells: mockPalaces as any,
  };

  const mockBirthChart: QimenBirthChart = {
    destinyPalace: 2,
    cells: mockPalaces as any,
  } as any;

  const mockDayHour: DayHourCheckItem = {
    date: new Date(2026, 8, 29, 10, 0, 0),
    dateBadge: "2026-09-29",
    hourLabel: "巳 (09:00 - 11:00)",
    level: "day_hour",
    levelLabel: "День + Час",
    palaces: mockPalaces,
  };

  it("computes Three Victories properly for month, month_day and day_hour levels", () => {
    const victories = computeThreeVictories({
      birthChart: mockBirthChart,
      monthChart: mockMonthChart,
      daysAndHours: [mockDayHour],
      now: new Date(2026, 8, 29),
    });

    expect(victories).toBeDefined();
    expect(victories.length).toBeGreaterThan(0);

    // Проверяем наличие уровней
    const levels = new Set(victories.map((v) => v.level));
    expect(levels.has("month") || levels.has("day_hour")).toBe(true);

    // Проверяем заполненность полей
    for (const v of victories) {
      expect(v.id).toBeDefined();
      expect(v.badge).toBeDefined();
      expect(v.targetPalace).toBeGreaterThanOrEqual(1);
      expect(v.targetPalace).toBeLessThanOrEqual(9);
      expect(v.direction).toBeDefined();
      expect(v.instruction).toBeDefined();
    }
  });

  it("detects Bird Falling into Nest (Bing on Wu) and flags isBirdInNest correctly", () => {
    const victories = computeThreeVictories({
      birthChart: mockBirthChart,
      monthChart: mockMonthChart,
      daysAndHours: [mockDayHour],
      now: new Date(2026, 8, 29),
    });

    const birdVictories = victories.filter((v) => v.isBirdInNest);
    expect(birdVictories.length).toBeGreaterThan(0);
  });
});
