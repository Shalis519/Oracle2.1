import { describe, expect, it } from "vitest";
import { buildChart, buildPeriodMap, mainGateStar } from "./qimen/chart";
import { Solar } from "lunar-typescript";
import { parseGanZhi, STEMS, BRANCHES } from "./qimen/constants";
import { detectJadeMaiden, jadeMaidenVariant } from "./qimen/structures";

function chart(year: number, month: number, day: number, hourBranch: number) {
  return buildChart(new Date(year, month - 1, day, 12, 0, 0), hourBranch);
}

describe("Главная звезда и Главные Врата по учебнику Ци Мэнь", () => {
  it("matches the book example 08.06.2017 丙申, 6 Ян", () => {
    const built = chart(2017, 6, 8, 8);
    expect(mainGateStar(built)).toEqual({ gate: "景门", star: "天英", palace: 2 });
    expect(built.cells[4]?.star).toBe("天英");
    expect(built.cells[2]?.door).toBe("景门");
  });

  it("matches the book example 31.12.2021 丁巳, 1 Ян", () => {
    const built = chart(2021, 12, 31, 5);
    expect(mainGateStar(built)).toEqual({ gate: "开门", star: "天心", palace: 9 });
    expect(built.cells[7]?.star).toBe("天心");
    expect(built.cells[9]?.door).toBe("开门");
  });

  it("matches the Mingli annual 2026 reference map", () => {
    const date = new Date(2026, 11, 15, 12, 0, 0);
    const year = parseGanZhi(
      Solar.fromYmdHms(2026, 12, 15, 12, 0, 0).getLunar().getYearInGanZhiExact(),
    );
    const built = buildPeriodMap(date, "year", {
      stem: year.stem,
      effectiveStem: year.stem,
      branch: year.branch,
      index: year.index,
      label: STEMS[year.stem] + BRANCHES[year.branch],
    }, { yin: true, ju: 1, term: "年家 Mingli", yuan: 0 });
    expect(mainGateStar(built)).toEqual({ gate: "开门", star: "天心", palace: 4 });
  });

  it("matches the Mingli annual 2027 main gate and main star positions", () => {
    const date = new Date(2027, 11, 15, 12, 0, 0);
    const year = parseGanZhi(
      Solar.fromYmdHms(2027, 12, 15, 12, 0, 0).getLunar().getYearInGanZhiExact(),
    );
    const built = buildPeriodMap(date, "year", {
      stem: year.stem,
      effectiveStem: year.stem,
      branch: year.branch,
      index: year.index,
      label: STEMS[year.stem] + BRANCHES[year.branch],
    }, { yin: true, ju: 9, term: "年家 Mingli", yuan: 0 });

    expect(built.zhiShiDoor).toBe("死门");
    expect(built.zhiShiPalace).toBe(2); // ЮЗ
    expect(built.zhiFuStar).toBe("天芮");
    expect(built.zhiFuPalace).toBe(3); // Восток
    expect(built.cells[3]).toMatchObject({ star: "天芮", pairedStar: "天禽" });
    expect(built.cells[1]?.star).toBe("天辅");
    expect(built.cells[7]?.star).toBe("天冲");
  });

  it("classifies all four Jade Maiden variants from the one-page scheme", () => {
    expect(jadeMaidenVariant("丁", "丁", true)).toBe(1);
    expect(jadeMaidenVariant("丁", "丁", false)).toBe(2);
    expect(jadeMaidenVariant("丁", "戊", true)).toBe(3);
    expect(jadeMaidenVariant("丁", "乙", true)).toBe(3);
    expect(jadeMaidenVariant("戊", "丁", true)).toBe(4);
    expect(jadeMaidenVariant("丙", "丁", true)).toBe(4);
    expect(jadeMaidenVariant("丁", "己", true)).toBe(0);
  });

  it("matches the book examples with the center main star 28.01.2022", () => {
    const yangBuilt = chart(2022, 1, 28, 2);
    const yinBuilt = chart(2022, 1, 28, 3);
    const yang = mainGateStar(yangBuilt);
    const yin = mainGateStar(yinBuilt);
    expect(yang).toEqual({ gate: "死门", star: "天禽", palace: 2 });
    expect(yin).toEqual({ gate: "死门", star: "天禽", palace: 3 });
  });

  it("places the hour stem on the main star and matches the Mingli Jade Maiden fixtures", () => {
    const rabbit = chart(2026, 8, 20, 3);
    expect(rabbit.cells[1]).toMatchObject({
      earthStem: "戊",
      heavenStem: "丁",
      door: "生门",
    });
    expect(jadeMaidenVariant(rabbit.cells[1].heavenStem, rabbit.cells[1].earthStem, true)).toBe(3);
    expect(detectJadeMaiden(new Date(2026, 7, 20, 12), 3)).toEqual(expect.arrayContaining([
      expect.objectContaining({ palace: 1, variant: 3, heavenStem: "丁", earthStem: "戊" }),
    ]));

    const horse = chart(2026, 8, 21, 6);
    expect(horse.cells[4]).toMatchObject({
      earthStem: "丁",
      heavenStem: "戊",
      door: "开门",
    });
    expect(jadeMaidenVariant(horse.cells[4].heavenStem, horse.cells[4].earthStem, true)).toBe(4);
    expect(detectJadeMaiden(new Date(2026, 7, 21, 12), 6)).toEqual(expect.arrayContaining([
      expect.objectContaining({ palace: 4, variant: 4, heavenStem: "戊", earthStem: "丁" }),
    ]));
  });
});
