import { describe, expect, test } from "vitest";
import { GetQimenResponse } from "@workspace/api-zod";
import { computeQimenStructures } from "./qimen";
import { detectTigerDun } from "./qimen/structures";
import {
  buildChart,
  DOOR_ELEMENT,
  isHourControlsDay,
  STAR_ELEMENT,
} from "./qimen/chart";
import { birthYearBranch, dayInfo } from "./qimen/calendar";
import { controls, clashesBranch, PALACES } from "./qimen/constants";
import { flyingStarYear, getFlyingStar } from "./data/fengshui";

const START = new Date(2026, 7, 25, 12, 0, 0);

type RawTigerHit = ReturnType<typeof detectTigerDun>[number] & {
  date: Date;
  hourBranch: number;
};

function findTigerHits(): RawTigerHit[] {
  const hits: RawTigerHit[] = [];
  const variants = new Set<number>();
  for (let offset = 0; offset < 365 && variants.size < 4; offset++) {
    const date = new Date(START);
    date.setDate(START.getDate() + offset);
    for (let hourBranch = 0; hourBranch < 12; hourBranch++) {
      for (const hit of detectTigerDun(date, hourBranch)) {
        hits.push({ ...hit, date, hourBranch });
        variants.add(hit.variant);
      }
    }
  }
  if (variants.size !== 4) {
    throw new Error(
      `Не найдены все варианты Тигрового Дунь: ${Array.from(variants).join(", ")}`,
    );
  }
  return hits;
}

function firstPersonalResult() {
  const result = computeQimenStructures({
    from: START,
    days: 120,
    birthDate: "1980-02-05",
    birthTime: "16:01",
  });
  if (result.tigerDuns.length === 0) {
    throw new Error(
      "Не найден персонально подходящий Тигровый Дунь в 120-дневном окне",
    );
  }
  return result;
}

describe("Тигровый Дунь", () => {
  test("находит все четыре точных варианта из схемы", () => {
    const hits = findTigerHits();
    const variants = new Set(hits.map((hit) => hit.variant));
    expect(variants).toEqual(new Set([1, 2, 3, 4]));

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
        });
      }
    }
  }, 30_000);

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

  test("не публикует структуру без данных рождения, а при публикации подтверждает пользу по НС года", () => {
    const withoutBirth = computeQimenStructures({ from: START, days: 14 });
    expect(GetQimenResponse.parse(withoutBirth).tigerDuns).toEqual([]);

    const checked = GetQimenResponse.parse(firstPersonalResult());
    expect(checked.tigerDuns.length).toBeGreaterThan(0);
    const userYearBranch = birthYearBranch("1980-02-05", "16:01");
    for (const hit of checked.tigerDuns) {
      const date = new Date(`${hit.date}T12:00:00`);
      expect(clashesBranch(userYearBranch, dayInfo(date).branch)).toBe(false);
      expect(
        hit.supportRelation === "same" || hit.supportRelation === "supports",
      ).toBe(true);
      expect(hit.supportMessage).toContain("НС вашего года");
      if (hit.variant === 1 || hit.variant === 3)
        expect(hit.earthStemRequired).toBe(true);
      else expect(hit.earthStemRequired).toBe(false);
    }
  }, 30_000);
});
