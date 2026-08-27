import { describe, expect, test } from "vitest";
import { GetQimenResponse } from "@workspace/api-zod";
import { computeQimenStructures } from "./qimen";
import { detectTigerDun, isTigerDunEarthStemAllowed } from "./qimen/structures";
import {
  buildChart,
  DOOR_ELEMENT,
  isHourControlsDay,
  STAR_ELEMENT,
} from "./qimen/chart";
import { controls, PALACES } from "./qimen/constants";
import { flyingStarYear, getFlyingStar } from "./data/fengshui";

const START = new Date(2026, 7, 25, 12, 0, 0);

type RawTigerHit = ReturnType<typeof detectTigerDun>[number] & {
  date: Date;
  hourBranch: number;
};

function findTigerHits(): RawTigerHit[] {
  const hits: RawTigerHit[] = [];
  for (let offset = 0; offset < 365; offset++) {
    const date = new Date(START);
    date.setDate(START.getDate() + offset);
    for (let hourBranch = 0; hourBranch < 12; hourBranch++) {
      for (const hit of detectTigerDun(date, hourBranch)) {
        hits.push({ ...hit, date, hourBranch });
      }
    }
  }
  if (hits.length === 0) {
    throw new Error("Не найдено ни одной допустимой структуры Тигрового Дунь");
  }
  return hits;
}

function firstSupportedTigerHit() {
  for (const raw of findTigerHits()) {
    for (let birthYearStem = 0; birthYearStem < 10; birthYearStem++) {
      const supported = detectTigerDun(
        raw.date,
        raw.hourBranch,
        false,
        birthYearStem,
        birthYearStem,
      ).find(
        (hit) =>
          hit.palace === raw.palace &&
          hit.variant === raw.variant &&
          hit.heavenStem === raw.heavenStem &&
          hit.earthStem === raw.earthStem,
      );
      if (supported?.support?.supported) return supported;
    }
  }
  throw new Error("Не найден подходящий контрольный пример Тигрового Дунь");
}

describe("Тигровый Дунь", () => {
  test("публикует только точные варианты и разрешённые сочетания Земной тарелки", () => {
    const hits = findTigerHits();

    for (const hit of hits) {
      expect(hit.earthStem).not.toBe("庚");

      if (hit.variant === 1) {
        expect(hit).toMatchObject({
          palace: 8,
          heavenStem: "乙",
          earthStem: "辛",
          door: "休门",
        });
      }
      if (hit.variant === 2) {
        expect(hit).toMatchObject({
          palace: 8,
          heavenStem: "乙",
          door: "生门",
        });
        expect(["丁", "己"]).toContain(hit.earthStem);
      }
      if (hit.variant === 3) {
        expect(hit).toMatchObject({
          palace: 8,
          heavenStem: "辛",
          earthStem: "乙",
          door: "生门",
        });
      }
      if (hit.variant === 4) {
        expect(hit).toMatchObject({
          palace: 7,
          heavenStem: "庚",
          door: "开门",
          earthStem: "丁",
        });
      }
    }
  }, 30_000);

  test("допускает только утверждённый белый список Земной тарелки", () => {
    expect(isTigerDunEarthStemAllowed(1, "辛")).toBe(true);
    expect(isTigerDunEarthStemAllowed(1, "丁")).toBe(false);
    expect(isTigerDunEarthStemAllowed(2, "丁")).toBe(true);
    expect(isTigerDunEarthStemAllowed(2, "己")).toBe(true);
    expect(isTigerDunEarthStemAllowed(2, "庚")).toBe(false);
    expect(isTigerDunEarthStemAllowed(2, "辛")).toBe(false);
    expect(isTigerDunEarthStemAllowed(3, "乙")).toBe(true);
    expect(isTigerDunEarthStemAllowed(3, "丁")).toBe(false);
    expect(isTigerDunEarthStemAllowed(4, "丁")).toBe(true);
    expect(isTigerDunEarthStemAllowed(4, "己")).toBe(false);
    expect(isTigerDunEarthStemAllowed(4, "庚")).toBe(false);
  });

  test("применяет Пустоту, Фу Инь, час пяти дисгармоний и контроль Врат над звездой", () => {
    for (const hit of findTigerHits()) {
      const chart = buildChart(hit.date, hit.hourBranch);
      const cell = chart.cells[hit.palace];
      expect(chart.fuYin).toBe(false);
      expect(isHourControlsDay(chart)).toBe(false);
      expect(cell.isVoid).toBe(false);
      expect(
        getFlyingStar(PALACES[hit.palace].dir, flyingStarYear(hit.date))
          .starNumber,
      ).not.toBe(5);
      expect(controls(DOOR_ELEMENT[cell.door], STAR_ELEMENT[cell.star])).toBe(
        false,
      );
    }
  }, 30_000);

  test("рассчитывает Тигровый Дунь на отдельном 30-дневном горизонте", () => {
    const shared = {
      from: START,
      days: 14,
      birthDate: "1980-02-05",
      birthTime: "16:01",
    };
    const standard = computeQimenStructures(shared);
    const tigerMonth = computeQimenStructures({ ...shared, tigerDunDays: 30 });
    const allMonth = computeQimenStructures({ ...shared, days: 30 });

    expect(tigerMonth.structures).toEqual(standard.structures);
    expect(tigerMonth.fiveBattalions).toEqual(standard.fiveBattalions);
    expect(tigerMonth.tigerDuns).toEqual(allMonth.tigerDuns);
  }, 30_000);

  test("не публикует структуру без данных рождения, а при публикации пропускает только поддерживающее отношение двух дворцов", () => {
    const withoutBirth = computeQimenStructures({ from: START, days: 14 });
    expect(GetQimenResponse.parse(withoutBirth).tigerDuns).toEqual([]);

    const hit = firstSupportedTigerHit();
    expect(
      hit.support?.relation === "same" || hit.support?.relation === "supports",
    ).toBe(true);
    expect(hit.support?.supported).toBe(true);
    expect(hit.support?.personPalace).not.toBe(5);
    if (hit.variant === 1 || hit.variant === 3)
      expect(hit.earthStem === (hit.variant === 1 ? "辛" : "乙")).toBe(true);
    else expect(["丁", "己"]).toContain(hit.earthStem);
  }, 30_000);
});
