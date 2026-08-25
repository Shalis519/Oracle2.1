import { describe, expect, test } from "vitest";
import { GetQimenResponse } from "@workspace/api-zod";
import { computeQimenStructures } from "./qimen";
import {
  FIVE_BATTALIONS_GOAL,
  hasDoorPalaceConflict,
} from "./qimen/structures";
import { isHourControlsDay } from "./qimen/chart";
import { DOOR_NAME_RU } from "../data/qimen/maidens";

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

  test("использует согласованное название Врат Ужаса", () => {
    expect(DOOR_NAME_RU.惊门).toBe("Врата Ужаса");
  });

  test("исключает только положения, где Врата контролируют дворец", () => {
    const forbidden: Record<string, number[]> = {
      生门: [1],
      开门: [3, 4],
      休门: [9],
      景门: [6, 7],
      伤门: [2, 8],
      惊门: [3, 4],
      死门: [1],
      杜门: [2, 8],
    };

    for (const [door, palaces] of Object.entries(forbidden)) {
      for (const palace of palaces)
        expect(hasDoorPalaceConflict(door, palace)).toBe(true);
    }
    // Металл Запада контролирует Дерево Врат Тайника, но это обратное
    // отношение не является запретом на приложенной схеме.
    expect(hasDoorPalaceConflict("杜门", 7)).toBe(false);
    expect(hasDoorPalaceConflict("杜门", 6)).toBe(false);
    expect(hasDoorPalaceConflict("杜门", 1)).toBe(false);
  });

  test("распознаёт час пяти дисгармоний по контролю часа над днём", () => {
    const check = (hourStem: number, dayStem: number) =>
      isHourControlsDay({ hourStem, day: { stem: dayStem } } as Parameters<
        typeof isHourControlsDay
      >[0]);

    expect(check(6, 0)).toBe(true); // Металл часа контролирует Дерево дня.
    expect(check(2, 6)).toBe(true); // Огонь часа контролирует Металл дня.
    expect(check(0, 8)).toBe(false); // Дерево часа не контролирует Воду дня.
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
