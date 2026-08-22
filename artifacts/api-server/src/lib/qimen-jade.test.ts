import { describe, expect, test } from "vitest";
import { computeQimenStructures } from "./qimen";
import { buildChart } from "./qimen/chart";
import { detectThreeGenerals } from "./qimen/structures";

describe("Нефритовая Дева: запрет по столкновению дня и года рождения", () => {
  test("день Тигра исключает рождённых в год Обезьяны", () => {
    const date = new Date(2026, 7, 20, 12, 0, 0);
    const withoutBirth = computeQimenStructures({ from: date, days: 7 });
    const monkeyBirth = computeQimenStructures({
      from: date,
      days: 7,
      birthDate: "1980-06-01",
    });

    expect(withoutBirth.jadeMaidens.some((hit) => hit.date === "2026-08-20")).toBe(true);
    expect(monkeyBirth.jadeMaidens.some((hit) => hit.date === "2026-08-20")).toBe(false);
    expect(withoutBirth.jadeMaidens.every((hit) => hit.date === "2026-08-20")).toBe(true);
    expect(withoutBirth.jadeMaidens.every((hit) => ["休门", "开门", "生门", "景门", "杜门"].includes(hit.door))).toBe(true);
    expect(monkeyBirth.jadeMaidens.every((hit) => hit.date === "2026-08-20")).toBe(true);

    const hourOrder = new Map([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 0].map((branch, index) => [branch, index]));
    const keys = withoutBirth.jadeMaidens.map((hit) => ({
      date: hit.date,
      hour: hourOrder.get(hit.hourBranch) ?? -1,
    }));
    const sortedKeys = [...keys].sort((a, b) => a.date.localeCompare(b.date) || a.hour - b.hour);
    expect(keys).toEqual(sortedKeys);
  });

  test("тот же фильтр скрывает Три Генераала только для конфликтующего профиля", () => {
    const date = new Date(2026, 7, 20, 12, 0, 0);
    const monkeyBirth = computeQimenStructures({
      from: date,
      days: 1,
      birthDate: "1980-06-01",
    });
    const nonMonkeyBirth = computeQimenStructures({
      from: date,
      days: 1,
      birthDate: "1981-06-01",
    });

    expect(monkeyBirth.structures.some((hit) => hit.date === "2026-08-20")).toBe(false);
    expect(nonMonkeyBirth.structures.some((hit) => hit.date === "2026-08-20")).toBe(true);
  });

  test("не публикует Три Генераала с Вратами Тайника или Пейзажа", () => {
    const date = new Date(2026, 7, 20, 12, 0, 0);
    const roosterHits = detectThreeGenerals(date, 9, false);
    expect(roosterHits).toEqual([]);
  });

  test("не меняет карту от одного флага при неизменной календарной дате", () => {
    const date = new Date(2026, 7, 20, 12, 0, 0);
    const early = buildChart(date, 0, false);
    const late = buildChart(date, 0, true);
    expect(early.hourGz).toBe("戊子");
    expect(late.hourGz).toBe(early.hourGz);
    expect(detectThreeGenerals(date, 0, true)).toEqual(detectThreeGenerals(date, 0, false));
  });
});
