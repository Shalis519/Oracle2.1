import { describe, expect, test } from "vitest";
import { deitiesForDun } from "./qimen/constants";

describe("Сезонные пары духов в стиле Захарова", () => {
  test("Янская половина использует Крюк и Красный Феникс", () => {
    expect(deitiesForDun(false)).toEqual([
      "值符",
      "螣蛇",
      "太阴",
      "六合",
      "勾陈",
      "朱雀",
      "九地",
      "九天",
    ]);
  });

  test("Иньская половина использует Белый Тигр и Тёмного Воина", () => {
    expect(deitiesForDun(true)).toEqual([
      "值符",
      "螣蛇",
      "太阴",
      "六合",
      "白虎",
      "玄武",
      "九地",
      "九天",
    ]);
  });

  test("в каждой сезонной версии остаётся ровно восемь духов", () => {
    expect(new Set(deitiesForDun(false)).size).toBe(8);
    expect(new Set(deitiesForDun(true)).size).toBe(8);
  });
});
