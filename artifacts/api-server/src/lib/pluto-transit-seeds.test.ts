import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { PLUTO_TRANSIT_SEEDS } from "./plutoTransitSeeds";

describe("пакет общих транзитов Плутона", () => {
  it("заполняет 33 пустых сочетания только к согласованным натальным планетам", () => {
    expect(PLUTO_TRANSIT_SEEDS).toHaveLength(33);
    expect(new Set(PLUTO_TRANSIT_SEEDS.map((seed) => seed.key)).size).toBe(
      33,
    );

    const natalBodies = new Set(
      PLUTO_TRANSIT_SEEDS.map((seed) => seed.key.split(":")[2]),
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

  it("сохраняет ранее заполненные тригоны Плутона к Луне и Юпитеру", () => {
    const keys = new Set(PLUTO_TRANSIT_SEEDS.map((seed) => seed.key));
    expect(keys.has("pluto:trine:moon")).toBe(false);
    expect(keys.has("pluto:trine:jupiter")).toBe(false);
  });

  it("не добавляет связи Плутона с высшими натальными планетами", () => {
    const natalBodies = new Set(
      PLUTO_TRANSIT_SEEDS.map((seed) => seed.key.split(":")[2]),
    );
    expect(natalBodies.has("uranus")).toBe(false);
    expect(natalBodies.has("neptune")).toBe(false);
    expect(natalBodies.has("pluto")).toBe(false);
  });

  it("сохраняет техническую строку и источник для каждой карточки", () => {
    for (const seed of PLUTO_TRANSIT_SEEDS) {
      expect(seed.text).toContain("{technicalLine}");
      expect(seed.sourceNote).toBe(
        "Утверждённый пакет: Транзиты Плутона к натальным планетам, v1",
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

    expect(runtimeSchema).toContain("await ensurePlutoTransitSeeds();");
    expect(runtimeSchema).toContain('context: "major_aspect"');
    expect(exactCards).not.toContain(
      "Утверждённый пакет: Транзиты Плутона к натальным планетам, v1",
    );
  });
});
