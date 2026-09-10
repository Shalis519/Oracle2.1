import { describe, expect, it } from "vitest";
import { computeSolarArcDirections } from "./progressions";

describe("solar arc direction house display", () => {
  it("uses natal cusps for the directed planet house", () => {
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
    const result = computeSolarArcDirections(input, new Date(Date.UTC(2026, 11, 17)));
    const aspect = result.aspects.find(
      (item) =>
        item.sourceBodyKey === "jupiter" &&
        item.targetBodyKey === "mercury" &&
        item.aspectKey === "conjunction",
    );

    expect(aspect).toBeDefined();
    expect(aspect?.sourceHouse).toBe(11);
    expect(aspect?.targetHouse).toBe(11);
  });
});
