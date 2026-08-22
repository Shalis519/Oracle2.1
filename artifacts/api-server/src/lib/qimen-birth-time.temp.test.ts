import { describe, expect, it } from "vitest";
import { hourBranchFromClock, isLateZiClock, trueLocalSolarTime } from "./qimen/birthTime";
import { buildChartForDateTime } from "./qimen/chart";

describe("Qimen birth time diagnostics", () => {
  it("keeps Moscow noon close to local solar time", () => {
    const result = trueLocalSolarTime({ isoDate: "2026-08-21", time: "12:00", timezone: "Europe/Moscow", longitude: 37.6173 });
    expect(result).not.toBeNull();
    expect(result!.solarDate).toBe("2026-08-21");
    expect(result!.solarTime).toMatch(/^11:/);
  });

  it("separates early and late Zi", () => {
    expect(hourBranchFromClock("00:10")).toBe(0);
    expect(hourBranchFromClock("23:40")).toBe(0);
    expect(isLateZiClock("2026-08-21", "00:00")).toBe(false);
    expect(isLateZiClock("2026-08-21", "00:59")).toBe(false);
    expect(isLateZiClock("2026-08-21", "23:00")).toBe(true);
    expect(isLateZiClock("2026-08-21", "23:59")).toBe(true);
  });

  it("строит позднюю и раннюю Крысу по календарным датам фактического времени", () => {
    const late = buildChartForDateTime(new Date(2026, 7, 22, 23, 40));
    const early = buildChartForDateTime(new Date(2026, 7, 23, 0, 40));

    expect(late.hourBranch).toBe(0);
    expect(late.lateZi).toBe(true);
    expect(late.calendarDate.toISOString().slice(0, 10)).toBe("2026-08-22");
    expect(early.hourBranch).toBe(0);
    expect(early.lateZi).toBe(false);
    expect(early.calendarDate.toISOString().slice(0, 10)).toBe("2026-08-23");
    expect(late.chart.cells).not.toEqual(early.chart.cells);
    expect(late.chart.hourGz).not.toBe(early.chart.hourGz);
  });
});
