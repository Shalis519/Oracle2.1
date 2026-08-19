import { describe, expect, test } from "vitest";
import { computeQimenStructures } from "./qimen";

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
});
