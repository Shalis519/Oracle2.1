import { describe, expect, test } from "vitest";
import {
  detectFiveBattalions,
  evaluateSupportPalace,
  personalSupportRelation,
} from "./qimen/structures";
import type { Element } from "./qimen/constants";
import { buildChart } from "./qimen/chart";
import { computeQimenStructures } from "./qimen";

const ELEMENTS: Element[] = ["wood", "fire", "earth", "metal", "water"];

const EXPECTED_RELATIONS: Record<Element, Record<Element, string>> = {
  wood: {
    wood: "same",
    fire: "supports",
    earth: "controls",
    metal: "controls",
    water: "receives",
  },
  fire: {
    wood: "receives",
    fire: "same",
    earth: "supports",
    metal: "controls",
    water: "controls",
  },
  earth: {
    wood: "controls",
    fire: "receives",
    earth: "same",
    metal: "supports",
    water: "controls",
  },
  metal: {
    wood: "controls",
    fire: "controls",
    earth: "receives",
    metal: "same",
    water: "supports",
  },
  water: {
    wood: "supports",
    fire: "controls",
    earth: "controls",
    metal: "receives",
    water: "same",
  },
};

describe("Персональная польза структуры по двум дворцам", () => {
  test("классифицирует все 25 отношений пяти стихий согласно утверждённой таблице", () => {
    for (const structureElement of ELEMENTS) {
      for (const personElement of ELEMENTS) {
        expect(personalSupportRelation(structureElement, personElement)).toBe(
          EXPECTED_RELATIONS[structureElement][personElement],
        );
      }
    }
  });

  test("публикует только совпадение и порождение от дворца структуры к личному дворцу", () => {
    const published = new Set(["same", "supports"]);

    for (const structureElement of ELEMENTS) {
      for (const personElement of ELEMENTS) {
        const relation = personalSupportRelation(
          structureElement,
          personElement,
        );
        expect(published.has(relation)).toBe(
          relation === "same" || relation === "supports",
        );
      }
    }
  });

  test("не публикует ни одну персональную структуру без даты рождения", () => {
    const result = computeQimenStructures({
      from: new Date(2026, 7, 25, 12, 0, 0),
      days: 1,
    });

    expect(result.jadeMaidens).toEqual([]);
    expect(result.threeMystics).toEqual([]);
    expect(result.structures).toEqual([]);
    expect(result.fiveBattalions).toEqual([]);
    expect(result.tigerDuns).toEqual([]);
  });

  test("не применяет проверку НС года к самостоятельной формуле Пяти Батальонов", () => {
    const start = new Date(2026, 7, 25, 12, 0, 0);

    for (let offset = 0; offset < 365; offset++) {
      const date = new Date(start);
      date.setDate(start.getDate() + offset);
      for (let hourBranch = 0; hourBranch < 12; hourBranch++) {
        const chart = buildChart(date, hourBranch);
        const hits = detectFiveBattalions(date, hourBranch, chart.zhiShiPalace);
        if (hits.length > 0) {
          expect(hits[0]).not.toHaveProperty("support");
          return;
        }
      }
    }

    throw new Error("Не найден контрольный пример Пяти Батальонов");
  });

  test("определяет личную стихию по дворцу НС года на Небесной тарелке, а не по стихии ствола напрямую", () => {
    const chart = {
      cells: {
        1: { palace: 1, heavenStem: "甲" },
      },
    } as unknown as Parameters<typeof evaluateSupportPalace>[0];

    // НС года 甲 имеет стихию Дерева, но в данной часовой карте он находится
    // в 1-м дворце Воды. Металл дворца структуры порождает Воду и допускается.
    const result = evaluateSupportPalace(chart, 7, 0);

    expect(result).toMatchObject({
      personPalace: 1,
      structureElement: "metal",
      personElement: "water",
      relation: "supports",
      supported: true,
    });
  });
});
