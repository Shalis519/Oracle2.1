import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { NEPTUNE_TRANSIT_SEEDS } from "./neptuneTransitSeeds";

describe("пакет общих транзитов Нептуна", () => {
  it("заполняет 34 пустых сочетания только к согласованным натальным планетам", () => {
    expect(NEPTUNE_TRANSIT_SEEDS).toHaveLength(34);
    expect(new Set(NEPTUNE_TRANSIT_SEEDS.map((seed) => seed.key)).size).toBe(
      34,
    );

    const natalBodies = new Set(
      NEPTUNE_TRANSIT_SEEDS.map((seed) => seed.key.split(":")[2]),
    );
    expect([...natalBodies].sort()).toEqual([
      "jupiter",
      "mars",
      "mercury",
      "moon",
      "saturn",
      "sun",
      "venus",
    ]);
  });

  it("сохраняет ранее заполненную оппозицию Нептуна к Луне", () => {
    const keys = new Set(NEPTUNE_TRANSIT_SEEDS.map((seed) => seed.key));
    expect(keys.has("neptune:opposition:moon")).toBe(false);
  });

  it("не добавляет связи Нептуна с высшими натальными планетами", () => {
    const natalBodies = new Set(
      NEPTUNE_TRANSIT_SEEDS.map((seed) => seed.key.split(":")[2]),
    );
    expect(natalBodies.has("uranus")).toBe(false);
    expect(natalBodies.has("neptune")).toBe(false);
    expect(natalBodies.has("pluto")).toBe(false);
  });

  it("сохраняет техническую строку и источник для каждой карточки", () => {
    for (const seed of NEPTUNE_TRANSIT_SEEDS) {
      expect(seed.text).toContain("{technicalLine}");
      expect(seed.sourceNote).toBe(
        "Утверждённый пакет: Транзиты Нептуна к натальным планетам, v1",
      );
    }
  });

  it("подключает пакет отдельно и не изменяет точные карточки с парами домов", () => {
    const runtimeSchema = readFileSync(
      resolve(process.cwd(), "src/lib/runtimeSchema.ts"),
      "utf8",
    );
    const exactCards = readFileSync(
      resolve(process.cwd(), "src/lib/longTermTransitCardSeeds.ts"),
      "utf8",
    );

    expect(runtimeSchema).toContain("await ensureNeptuneTransitSeeds();");
    expect(runtimeSchema).toContain('context: "major_aspect"');
    expect(exactCards).not.toContain(
      "Утверждённый пакет: Транзиты Нептуна к натальным планетам, v1",
    );
  });
});
