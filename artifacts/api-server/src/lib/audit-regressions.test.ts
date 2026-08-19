import { describe, expect, it } from "vitest";
import { parseNatalChartInput } from "./birthInput";
import { MONEY_STUDIO_SEEDS } from "./moneyStudioSeeds";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const validBirth = {
  birthDate: "1980-02-05",
  birthTime: "16:01",
  birthLatitude: 42.9,
  birthLongitude: 71.4,
  birthTimezone: "Asia/Almaty",
};

describe("audit regressions", () => {
  it("accepts valid ISO birth data and rejects impossible dates", () => {
    expect(parseNatalChartInput(validBirth)).toMatchObject({
      year: 1980,
      month: 2,
      day: 5,
      hour: 16,
      minute: 1,
    });
    expect(
      parseNatalChartInput({ ...validBirth, birthDate: "1980-02-31" }),
    ).toBeNull();
    expect(
      parseNatalChartInput({ ...validBirth, birthTime: "24:00" }),
    ).toBeNull();
  });


  it("keeps the complete Money Houses Studio library", () => {
    expect(MONEY_STUDIO_SEEDS).toHaveLength(84);
    expect(
      new Set(MONEY_STUDIO_SEEDS.map((seed) => `${seed.category}:${seed.context}:${seed.key}`)).size,
    ).toBe(84);
    expect(MONEY_STUDIO_SEEDS.every((seed) => seed.sourceNote.includes("ДЕНЬГИВНАТАЛЬНОЙКАРТЕ"))).toBe(true);
  });

  it("keeps the daily Sun-opposition-Mercury Studio components seeded", () => {
    const runtimeSchema = readFileSync(
      resolve(process.cwd(), "src/lib/runtimeSchema.ts"),
      "utf8",
    );
    expect(runtimeSchema).toContain("('entity', 'transit', 'sun'");
    expect(runtimeSchema).toContain("('entity', 'natal', 'mercury'");
    expect(runtimeSchema).toContain("('aspect', 'opposition', 'default'");
    expect(runtimeSchema).toContain("'composition',\n      'opposition'");
  });
});
