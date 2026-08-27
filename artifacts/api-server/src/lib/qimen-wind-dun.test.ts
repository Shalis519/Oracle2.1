import { describe, expect, test } from "vitest";
import {
  detectThreeGenerals,
  detectWindDun,
  isAnnualYellowFive,
  windDunVariant,
} from "./qimen/structures";

const ALLOWED_DOORS = ["休门", "生门", "开门"];

describe("Ветряной Дунь", () => {
  test("распознаёт только четыре утверждённых варианта", () => {
    for (const door of ALLOWED_DOORS) {
      expect(windDunVariant(4, "乙", "戊", door, "六合")).toBe(1);
      expect(windDunVariant(4, "乙", "戊", door, "值符")).toBe(2);
      expect(windDunVariant(7, "辛", "乙", door, "值符")).toBe(4);
    }

    expect(windDunVariant(4, "丙", "戊", "开门", "值符")).toBe(3);
    expect(windDunVariant(4, "丙", "戊", "休门", "值符")).toBeNull();
    expect(windDunVariant(7, "乙", "戊", "休门", "六合")).toBeNull();
    expect(windDunVariant(7, "辛", "丙", "休门", "值符")).toBeNull();
  });

  test("четвёртый вариант не ограничен Юго-Востоком", () => {
    expect(windDunVariant(1, "辛", "乙", "生门", "值符")).toBe(4);
    expect(windDunVariant(7, "辛", "乙", "开门", "值符")).toBe(4);
    expect(windDunVariant(9, "辛", "乙", "休门", "值符")).toBe(4);
  });

  test("при передаче НС года публикует только поддерживающие человеку варианты", () => {
    const start = new Date(2026, 0, 1, 12, 0, 0);
    for (let offset = 0; offset < 365; offset++) {
      const date = new Date(start);
      date.setDate(start.getDate() + offset);
      for (let hourBranch = 0; hourBranch < 12; hourBranch++) {
        for (let yearStem = 0; yearStem < 10; yearStem++) {
          const hits = detectWindDun(
            date,
            hourBranch,
            false,
            yearStem,
            yearStem,
          );
          if (hits.length > 0) {
            expect(
              hits.every(
                (hit) =>
                  hit.support?.relation === "same" ||
                  hit.support?.relation === "supports",
              ),
            ).toBe(true);
            return;
          }
        }
      }
    }

    throw new Error("Не найден контрольный пример Ветряного Дунь");
  });
});

describe("Жёлтая Пятёрка в Трёх Генералах", () => {
  test("не публикует Три Генерала в секторе годовой Жёлтой Пятёрки", () => {
    const start = new Date(2026, 0, 1, 12, 0, 0);
    let checked = false;

    for (let offset = 0; offset < 365; offset++) {
      const date = new Date(start);
      date.setDate(start.getDate() + offset);
      for (let hourBranch = 0; hourBranch < 12; hourBranch++) {
        const hits = detectThreeGenerals(date, hourBranch);
        if (hits.length > 0) checked = true;
        for (const hit of hits) {
          expect(isAnnualYellowFive(hit.palace, date)).toBe(false);
        }
      }
    }

    expect(checked).toBe(true);
  }, 15_000);
});
