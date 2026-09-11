import { describe, expect, it } from "vitest";
import { computeNatalChart } from "./astrology";
import { computeSecondaryProgressionAspectWindows } from "./progressions";

describe("secondary progression source house display", () => {
  it("uses natal cusps for the progressed Moon", () => {
    const input = {
      year: 1983,
      month: 2,
      day: 6,
      hour: 9,
      minute: 30,
      latitude: 46.84,
      longitude: 29.63,
      timezone: "Europe/Chisinau",
    };
    const natal = computeNatalChart(input);
    const windows = computeSecondaryProgressionAspectWindows(
      input,
      new Date(Date.UTC(2026, 7, 25)),
      new Date(Date.UTC(2026, 10, 11)),
      natal,
    );
    const aspect = windows.find(
      (item) =>
        item.sourceBodyKey === "moon" &&
        item.targetBodyKey === "neptune" &&
        item.aspectKey === "opposition",
    );

    expect(aspect).toBeDefined();
    expect(aspect?.sourceHouse).toBe(4);
    expect(aspect?.targetHouse).toBe(10);
    expect(aspect?.sourceSign).toBe("Близнецы");
    expect(aspect?.targetSign).toBe("Стрелец");
  });
});
