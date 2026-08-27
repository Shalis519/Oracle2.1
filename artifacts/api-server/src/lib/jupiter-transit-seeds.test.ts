import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { JUPITER_TRANSIT_SEEDS } from "./jupiterTransitSeeds";

describe("утверждённый пакет общих транзитов Юпитера", () => {
  it("заполняет 33 пустых сочетания только к согласованным натальным планетам", () => {
    expect(JUPITER_TRANSIT_SEEDS).toHaveLength(33);
    expect(new Set(JUPITER_TRANSIT_SEEDS.map((seed) => seed.key)).size).toBe(
      33,
    );

    const natalBodies = new Set(
      JUPITER_TRANSIT_SEEDS.map((seed) => seed.key.split(":")[2]),
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

  it("не перезаписывает две ранее заполненные карточки Юпитера", () => {
    const keys = new Set(JUPITER_TRANSIT_SEEDS.map((seed) => seed.key));
    expect(keys.has("jupiter:square:sun")).toBe(false);
    expect(keys.has("jupiter:opposition:sun")).toBe(false);
  });

  it("сохраняет техническую строку и источник для каждой карточки", () => {
    for (const seed of JUPITER_TRANSIT_SEEDS) {
      expect(seed.text).toContain("{technicalLine}");
      expect(seed.sourceNote).toBe(
        "Авторский файл Транзиты: Юпитер к натальным планетам, v1",
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

    expect(runtimeSchema).toContain("await ensureJupiterTransitSeeds();");
    expect(runtimeSchema).toContain('context: "major_aspect"');
    expect(exactCards).not.toContain(
      "Авторский файл Транзиты: Юпитер к натальным планетам, v1",
    );
  });
});
