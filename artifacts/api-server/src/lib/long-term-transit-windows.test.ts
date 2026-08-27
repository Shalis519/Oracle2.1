import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it, vi } from "vitest";
vi.mock("./astrology", () => ({
  computeTransits: vi.fn(),
}));

import type { TransitAspect } from "./astrology";
import {
  groupTransitAspectSamples,
  isFastTransitBody,
  type TransitAspectSample,
} from "./longTermTransitWindows";

function aspect(orb: number): TransitAspect {
  return {
    transitBodyKey: "mercury",
    transitBody: "Меркурий",
    transitBodySymbol: "☿",
    transitSign: "Дева",
    transitSignSymbol: "♍",
    transitHouse: 11,
    transitRetrograde: false,
    natalBodyKey: "neptune",
    natalBody: "Нептун",
    natalBodySymbol: "♆",
    natalSign: "Стрелец",
    natalSignSymbol: "♐",
    natalHouse: 4,
    type: "Тригон",
    typeKey: "trine",
    typeSymbol: "△",
    orb,
    durationDays: 2,
  };
}

function sample(date: string, orb: number): TransitAspectSample {
  return { date, aspect: aspect(orb) };
}

describe("ежедневные окна быстрых транзитов", () => {
  it("объединяет последовательные дни в один период и выбирает день минимального орбиса", () => {
    const [window] = groupTransitAspectSamples(
      [
        sample("2026-08-31", 0.84),
        sample("2026-09-01", 0.42),
        sample("2026-09-02", 0.02),
        sample("2026-09-03", 0.38),
      ],
      "2026-09-01",
    );

    expect(window).toMatchObject({
      startDate: "2026-08-31",
      peakDate: "2026-09-02",
      endDate: "2026-09-03",
      peakOrb: 0.02,
      focusDate: "2026-09-01",
      focusOrb: 0.42,
      phase: "applying",
      phaseReference: "forecast_start",
    });
  });

  it("не склеивает разные периоды, если между днями аспекта есть разрыв", () => {
    const windows = groupTransitAspectSamples(
      [
        sample("2026-09-01", 0.5),
        sample("2026-09-02", 0.12),
        sample("2026-09-05", 0.2),
      ],
      "2026-09-01",
    );

    expect(windows).toHaveLength(2);
    expect(windows[0]).toMatchObject({
      startDate: "2026-09-01",
      endDate: "2026-09-02",
      peakDate: "2026-09-02",
    });
    expect(windows[1]).toMatchObject({
      startDate: "2026-09-05",
      endDate: "2026-09-05",
      phase: "exact",
      phaseReference: "window_start",
    });
  });

  it("считает Солнце, Меркурий, Венеру и Марс быстрыми транзитными планетами", () => {
    expect(isFastTransitBody("sun")).toBe(true);
    expect(isFastTransitBody("mercury")).toBe(true);
    expect(isFastTransitBody("venus")).toBe(true);
    expect(isFastTransitBody("mars")).toBe(true);
    expect(isFastTransitBody("jupiter")).toBe(false);
    expect(isFastTransitBody("moon")).toBe(false);
  });

  it("использует ежедневные окна для быстрых транзитов и сохраняет недельный путь для медленных", () => {
    const route = readFileSync(
      resolve(process.cwd(), "src/routes/adminLongTermForecasts.ts"),
      "utf8",
    );

    expect(route).toContain("computeFastTransitAspectWindows(input, natal, parsedDateFrom, parsedDateTo)");
    expect(route).toContain("if (isFastTransitBody(transitBodyKey)) continue;");
    expect(route).toContain("экзакт - ${formatDisplayDate(window.peakDate)}");
    expect(route).toContain("фаза ${transitPhaseLabel(window.phase)}");
  });
});
