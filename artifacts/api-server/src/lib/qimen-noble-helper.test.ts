import { describe, expect, test } from "vitest";
import {
  NOBLE_HELPER_BRANCHES_BY_STEM,
  detectNobleHelperDoor,
} from "./qimen/structures";
import { BRANCHES, BRANCH_PALACE, PALACES, STEMS } from "./qimen/constants";

describe("Личная дверь Великого Благородного", () => {
  test("содержит Янского и Иньского Благородного для всех десяти НС", () => {
    const expected = [
      ["甲", "未", "丑"],
      ["乙", "申", "子"],
      ["丙", "酉", "亥"],
      ["丁", "亥", "酉"],
      ["戊", "丑", "未"],
      ["己", "子", "申"],
      ["庚", "丑", "未"],
      ["辛", "寅", "午"],
      ["壬", "卯", "巳"],
      ["癸", "巳", "卯"],
    ] as const;

    for (const [stem, yangBranch, yinBranch] of expected) {
      const stemIndex = STEMS.indexOf(stem);
      const mapping = NOBLE_HELPER_BRANCHES_BY_STEM[stemIndex];
      expect(mapping).toEqual({
        yang: BRANCHES.indexOf(yangBranch),
        yin: BRANCHES.indexOf(yinBranch),
      });
    }
  });

  test("для 庚 использует СВ для Янского и ЮЗ для Иньского Благородного", () => {
    const mapping = NOBLE_HELPER_BRANCHES_BY_STEM[STEMS.indexOf("庚")];
    expect(PALACES[BRANCH_PALACE[mapping.yang]].dir).toBe("СВ");
    expect(PALACES[BRANCH_PALACE[mapping.yin]].dir).toBe("ЮЗ");
  });

  test("при наличии карты возвращает только тот НС, который стоит на Небесной тарелке", () => {
    const date = new Date(2026, 7, 25, 12, 0, 0);
    const hits = detectNobleHelperDoor(date, 1, STEMS.indexOf("庚"));
    for (const hit of hits) {
      expect(hit.heavenStem).toBe("庚");
      expect(["太阴", "六合"]).toContain(hit.deity);
      expect(hit.nobleBranch).toBe(
        hit.kind === "yang" ? "丑" : "未",
      );
    }
  });
});
