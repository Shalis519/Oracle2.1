import { describe, expect, test } from "vitest";
import {
  computeJiFuWishes,
  dayJiFuPalace,
  hourJiFuPalace,
  monthJiFuPalace,
  yearJiFuPalace,
} from "./qimen/jifu";

const VALID_PALACES = new Set([1, 2, 3, 4, 6, 7, 8, 9]);

describe("Джи Фу: четыре масштаба карты", () => {
  test("сохраняет годовой, месячный, дневной и часовой дворцы", () => {
    const date = new Date(2026, 7, 21, 12, 0, 0);
    const yearPalace = yearJiFuPalace(date);
    const monthPalace = monthJiFuPalace(date);
    const dayPalace = dayJiFuPalace(date);

    expect(VALID_PALACES.has(yearPalace)).toBe(true);
    expect(VALID_PALACES.has(monthPalace)).toBe(true);
    expect(VALID_PALACES.has(dayPalace)).toBe(true);

    const wishes = computeJiFuWishes(date, 1);
    for (const wish of wishes) {
      expect(wish.yearPalace).toBe(yearPalace);
      expect(wish.monthPalace).toBe(monthPalace);
      expect(wish.dayPalace).toBe(dayPalace);
      expect(wish.hourPalace).toBe(hourJiFuPalace(date, wish.hourBranch));
      expect(wish.strength).toBe(
        1 +
          Number(wish.matchYear) +
          Number(wish.matchMonth) +
          Number(wish.matchDay),
      );
      expect(wish.strength).toBeGreaterThanOrEqual(2);
    }
  });
});
