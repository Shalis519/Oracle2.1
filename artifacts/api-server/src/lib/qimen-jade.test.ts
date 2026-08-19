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
    // Остальные дни семидневного окна не должны исчезать из-за одного столкновения.
    expect(monkeyBirth.jadeMaidens.some((hit) => hit.date !== "2026-08-20")).toBe(true);
  });
});
