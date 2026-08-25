import { describe, expect, test } from "vitest";
import { GetQimenResponse } from "@workspace/api-zod";
import { computeQimenStructures } from "./qimen";

const BIRTH_DATES = [
  "1984-06-01", "1985-06-01", "1986-06-01", "1987-06-01", "1988-06-01",
  "1989-06-01", "1990-06-01", "1991-06-01", "1992-06-01", "1993-06-01",
];

function firstSupportedGeneralsResult() {
  const start = new Date(2026, 7, 20, 12, 0, 0);
  for (let offset = 0; offset < 60; offset++) {
    const date = new Date(start);
    date.setDate(start.getDate() + offset);
    for (const birthDate of BIRTH_DATES) {
      const result = computeQimenStructures({ from: date, days: 1, birthDate });
      if (result.structures.length > 0) return result;
    }
  }
  throw new Error("Не найден персонально подходящий контрольный пример «Трёх Генералов»");
}

describe("Три Генерала: персональная польза", () => {
  test("без даты рождения не публикует личную структуру", () => {
    const result = computeQimenStructures({
      from: new Date(2026, 7, 20, 12, 0, 0),
      days: 1,
    });

    expect(result.hasBirthDate).toBe(false);
    expect(result.structures).toEqual([]);
  });

  test("публикует только поддерживающие НС года структуры с пояснением как у Нефритовой Девы", () => {
    const result = GetQimenResponse.parse(firstSupportedGeneralsResult());

    expect(result.structures.length).toBeGreaterThan(0);
    for (const hit of result.structures) {
      expect(hit.supportRelation === "same" || hit.supportRelation === "supports").toBe(true);
      expect(hit.supportMessage).toMatch(/^Данная структура находится во дворце стихии /);
      expect(hit.supportMessage).toContain("НС года");
    }
  });
});
