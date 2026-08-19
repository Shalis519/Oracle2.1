import { describe, expect, it } from "vitest";
import { buildChart, mainGateStar } from "./qimen/chart";

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

  it("matches the book examples with the center main star 28.01.2022", () => {
    const yangBuilt = chart(2022, 1, 28, 2);
    const yinBuilt = chart(2022, 1, 28, 3);
    const yang = mainGateStar(yangBuilt);
    const yin = mainGateStar(yinBuilt);
    expect(yang).toEqual({ gate: "死门", star: "天禽", palace: 2 });
    expect(yin).toEqual({ gate: "死门", star: "天禽", palace: 3 });
  });
});
