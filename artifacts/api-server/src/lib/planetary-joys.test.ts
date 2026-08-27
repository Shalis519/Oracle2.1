import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { PLANETARY_JOY_SEEDS } from "./planetaryJoySeeds";

describe("утверждённые дома радости для долгосрочных транзитов", () => {
  it("содержит только шесть согласованных планет и не добавляет Луну", () => {
    expect(PLANETARY_JOY_SEEDS.map((seed) => seed.key)).toEqual([
      "sun",
      "mercury",
      "venus",
      "mars",
      "jupiter",
      "saturn",
    ]);
    expect(PLANETARY_JOY_SEEDS.some((seed) => seed.key === "moon")).toBe(false);
  });

  it("сохраняет утверждённые формулировки всех шести контекстов", () => {
    const texts = Object.fromEntries(
      PLANETARY_JOY_SEEDS.map((seed) => [seed.key, seed.text]),
    );

    expect(texts.sun).toContain(
      "Солнце проходит свой традиционный дом радости.",
    );
    expect(texts.mercury).toContain(
      "Меркурий проходит свой традиционный дом радости.",
    );
    expect(texts.venus).toContain(
      "Венера проходит свой традиционный дом радости.",
    );
    expect(texts.mars).toContain(
      "Марс проходит свой традиционный дом радости.",
    );
    expect(texts.jupiter).toContain(
      "Юпитер проходит свой традиционный дом радости.",
    );
    expect(texts.saturn).toContain(
      "Сатурн проходит свой традиционный дом радости.",
    );
  });

  it("подключает контекст только к общему шаблону, не затрагивая точные карточки", () => {
    const literary = readFileSync(
      resolve(process.cwd(), "src/lib/longTermTransitLiterary.ts"),
      "utf8",
    );

    expect(literary).toContain(
      "const PLANETARY_JOY_HOUSES: Record<string, string>",
    );
    expect(literary).toContain(
      "!usesExactTemplate && PLANETARY_JOY_HOUSES[transitBodyKey] === transitHouse",
    );
    expect(literary).toContain('item.context === "planetary_joy"');
  });
});
