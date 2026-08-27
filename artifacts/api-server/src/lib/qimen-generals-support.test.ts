import { describe, expect, test } from "vitest";
import { GetQimenResponse } from "@workspace/api-zod";
import { computeQimenStructures } from "./qimen";

const BIRTH_DATES = [
  "1984-06-01",
  "1985-06-01",
  "1986-06-01",
  "1987-06-01",
  "1988-06-01",
  "1989-06-01",
  "1990-06-01",
  "1991-06-01",
  "1992-06-01",
  "1993-06-01",
];

function firstSupportedGeneralsInput() {
  const start = new Date(2026, 7, 20, 12, 0, 0);
  for (let offset = 0; offset < 60; offset++) {
    const from = new Date(start);
    from.setDate(start.getDate() + offset);
    for (const birthDate of BIRTH_DATES) {
      const result = computeQimenStructures({ from, days: 1, birthDate });
      if (result.structures.length > 0) return { from, birthDate };
    }
  }
  throw new Error(
    "Не найден персонально подходящий контрольный пример «Трёх Генералов»",
  );
}

function firstSupportedGeneralsResult() {
  return computeQimenStructures({ ...firstSupportedGeneralsInput(), days: 1 });
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
      expect(
        hit.supportRelation === "same" || hit.supportRelation === "supports",
      ).toBe(true);
      expect(hit.supportMessage).toMatch(/^Дворец структуры - стихия /);
      expect(hit.supportMessage).toContain("Личный дворец НС вашего года");
    }
  });

  test("публикует Три Генерала только на ближайшие три календарных дня", () => {
    const { from, birthDate } = firstSupportedGeneralsInput();
    const result = GetQimenResponse.parse(
      computeQimenStructures({ from, days: 14, birthDate }),
    );
    const endExclusive = new Date(
      from.getFullYear(),
      from.getMonth(),
      from.getDate() + 3,
    );

    expect(result.structures.length).toBeGreaterThan(0);
    for (const hit of result.structures) {
      expect(new Date(hit.date).getTime()).toBeLessThan(endExclusive.getTime());
    }
  });
});
