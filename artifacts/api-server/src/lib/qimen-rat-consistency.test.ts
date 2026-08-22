import { describe, expect, test } from "vitest";
import { buildChart } from "./qimen/chart";

describe("Календарная граница часа Крысы", () => {
  test("lateZi не меняет карту при неизменной календарной дате", () => {
    const date = new Date(2026, 7, 22, 12, 0, 0);
    const first = buildChart(date, 0, false);
    const second = buildChart(date, 0, true);

    expect(second.hourGz).toBe(first.hourGz);
    expect(second.ju).toEqual(first.ju);
    expect(second.zhiFuPalace).toBe(first.zhiFuPalace);
    expect(second.zhiShiPalace).toBe(first.zhiShiPalace);
    expect(second.cells).toEqual(first.cells);
  });

  test("поздняя Крыса 22 августа и ранняя Крыса 23 августа используют разные даты", () => {
    const lateAugust22 = buildChart(new Date(2026, 7, 22, 23, 40, 0), 0, true);
    const earlyAugust23 = buildChart(new Date(2026, 7, 23, 0, 40, 0), 0, false);

    expect(earlyAugust23.day.iso).toBe("2026-08-23");
    expect(lateAugust22.day.iso).toBe("2026-08-22");
    expect(earlyAugust23.cells).not.toEqual(lateAugust22.cells);
  });
});
