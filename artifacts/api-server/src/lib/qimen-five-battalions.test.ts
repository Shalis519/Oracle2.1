import { describe, expect, test } from "vitest";
import { GetQimenResponse } from "@workspace/api-zod";
import { computeQimenStructures } from "./qimen";
import {
  FIVE_BATTALIONS_GOAL,
  hasDoorPalaceConflict,
} from "./qimen/structures";

const GOOD_EARTH_STEMS: Record<string, Set<string>> = {
  甲: new Set(["丙", "丁"]),
  乙: new Set(["丙", "丁"]),
  丙: new Set(["甲", "乙", "丁", "戊", "辛"]),
  丁: new Set(["甲", "乙", "丙", "丁", "戊", "壬"]),
  戊: new Set(["丙", "丁"]),
};

const ALL_DOORS = [
  "休门",
  "生门",
  "伤门",
  "杜门",
  "景门",
  "死门",
  "惊门",
  "开门",
];

function firstFiveBattalionsResult() {
  const start = new Date(2026, 7, 25, 12, 0, 0);
  const result = computeQimenStructures({
    from: start,
    days: 180,
    birthDate: "1980-02-05",
    birthTime: "16:01",
  });
  if (result.fiveBattalions.length === 0) {
    throw new Error(
      "Контрольный пример Пяти Батальонов не найден в 180-дневном окне",
    );
  }
  return result;
}

describe("Пять Батальонов", () => {
  test("содержит понятную цель для каждых из восьми Врат", () => {
    expect(Object.keys(FIVE_BATTALIONS_GOAL).sort()).toEqual(
      [...ALL_DOORS].sort(),
    );
    for (const door of ALL_DOORS) {
      expect(FIVE_BATTALIONS_GOAL[door]).toMatch(/^.+/);
    }
    expect(FIVE_BATTALIONS_GOAL.休门).toContain("путешествие");
    expect(FIVE_BATTALIONS_GOAL.休门).toContain("свидание");
    expect(FIVE_BATTALIONS_GOAL.死门).toContain("разорвать отношения");
  });

  test("исключает любое контролирующее взаимодействие Врат и дворца", () => {
    expect(hasDoorPalaceConflict("杜门", 7)).toBe(true); // Металл Запада контролирует Дерево Тайника.
    expect(hasDoorPalaceConflict("杜门", 6)).toBe(true); // Северо-запад также Металл.
    expect(hasDoorPalaceConflict("杜门", 8)).toBe(true); // Дерево Врат контролирует Землю дворца.
    expect(hasDoorPalaceConflict("杜门", 1)).toBe(false); // Вода дворца поддерживает Дерево Врат.
    expect(hasDoorPalaceConflict("休门", 9)).toBe(true);
    expect(hasDoorPalaceConflict("生门", 1)).toBe(true);
    expect(hasDoorPalaceConflict("开门", 3)).toBe(true);
  });

  test("публикует только личные часы с разрешёнными стволами и строгими связками", () => {
    const result = firstFiveBattalionsResult();
    const checked = GetQimenResponse.parse(result);
    const wealthPalace = result.birthChart?.cells.find(
      (cell) => cell.door === "生门",
    )?.palace;

    expect(wealthPalace).toBeDefined();
    expect(checked.fiveBattalions.length).toBeGreaterThan(0);
    for (const hit of checked.fiveBattalions) {
      expect(["甲", "乙", "丙", "丁", "戊"]).toContain(hit.heavenStem);
      expect(GOOD_EARTH_STEMS[hit.heavenStem]?.has(hit.earthStem)).toBe(true);
      expect(ALL_DOORS).toContain(hit.door);
      expect(hit.goal).toBe(FIVE_BATTALIONS_GOAL[hit.door]);
      expect(hasDoorPalaceConflict(hit.door, wealthPalace!)).toBe(false);
    }
  }, 30_000);

  test("не публикует Пять Батальонов без времени рождения", () => {
    const result = computeQimenStructures({
      from: new Date(2026, 7, 25, 12, 0, 0),
      days: 14,
      birthDate: "1980-02-05",
    });
    expect(GetQimenResponse.parse(result).fiveBattalions).toEqual([]);
  });
});
