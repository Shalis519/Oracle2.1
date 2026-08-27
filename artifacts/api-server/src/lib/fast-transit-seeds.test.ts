import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { FAST_TRANSIT_SEEDS } from "./fastTransitSeeds";

describe("пакет быстрых транзитных планет", () => {
  it("заполняет 160 недостающих сочетаний Солнца, Меркурия, Венеры и Марса", () => {
    expect(FAST_TRANSIT_SEEDS).toHaveLength(160);
    expect(new Set(FAST_TRANSIT_SEEDS.map((seed) => seed.key)).size).toBe(160);

    const transitBodies = new Set(
      FAST_TRANSIT_SEEDS.map((seed) => seed.key.split(":")[0]),
    );
    expect([...transitBodies].sort()).toEqual(["mars", "mercury", "sun", "venus"]);

    const natalBodies = new Set(
      FAST_TRANSIT_SEEDS.map((seed) => seed.key.split(":")[2]),
    );
    expect([...natalBodies].sort()).toEqual([
      "jupiter",
      "mars",
      "mercury",
      "moon",
      "neptune",
      "pluto",
      "saturn",
      "sun",
      "uranus",
      "venus",
    ]);
  });

  it("оставляет без перезаписи уже существующие общие шаблоны", () => {
    const keys = new Set(FAST_TRANSIT_SEEDS.map((seed) => seed.key));
    expect(keys.has("sun:square:uranus")).toBe(false);
    expect(keys.has("mercury:conjunction:mars")).toBe(false);
    expect(keys.has("venus:trine:sun")).toBe(false);
    expect(keys.has("mars:conjunction:uranus")).toBe(false);
  });

  it("покрывает сочетания из проверочного месячного прогноза", () => {
    const keys = new Set(FAST_TRANSIT_SEEDS.map((seed) => seed.key));
    expect(keys.has("mercury:trine:neptune")).toBe(true);
    expect(keys.has("venus:square:jupiter")).toBe(true);
    expect(keys.has("mars:opposition:neptune")).toBe(true);
    expect(keys.has("mars:opposition:saturn")).toBe(true);
    expect(keys.has("mercury:square:uranus")).toBe(true);
    expect(keys.has("venus:sextile:uranus")).toBe(true);
    expect(keys.has("venus:opposition:mars")).toBe(true);
    expect(keys.has("mars:conjunction:sun")).toBe(true);
  });

  it("сохраняет техническую строку и источник для каждой карточки", () => {
    for (const seed of FAST_TRANSIT_SEEDS) {
      expect(seed.text).toContain("{technicalLine}");
      expect(seed.sourceNote).toBe(
        "Авторский файл Транзиты: быстрые транзитные планеты, v1",
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

    expect(runtimeSchema).toContain("await ensureFastTransitSeeds();");
    expect(runtimeSchema).toContain('context: "major_aspect"');
    expect(exactCards).not.toContain(
      "Авторский файл Транзиты: быстрые транзитные планеты, v1",
    );
  });
});
