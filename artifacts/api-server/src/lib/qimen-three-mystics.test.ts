import { describe, expect, test } from "vitest";
import { GetQimenResponse } from "@workspace/api-zod";
import { computeQimenStructures } from "./qimen";
import { detectThreeMystics } from "./qimen/structures";
import { BRANCHES, STEMS } from "./qimen/constants";
import { dayInfo } from "./qimen/calendar";

const ALLOWED_DOORS = new Set(["休门", "生门", "开门", "景门", "杜门"]);
const ALLOWED_STARS = new Set(["天辅", "天心", "天任"]);
const GOOD_EARTH_STEMS: Record<string, Set<string>> = {
  乙: new Set(["丙", "丁"]),
  丙: new Set(["甲", "乙", "丁", "戊", "辛"]),
  丁: new Set(["甲", "乙", "丙", "丁", "戊", "壬"]),
};
const ACTIVATION_BY_STAR: Record<string, string> = {
  天辅: "Фонтанчик",
  天心: "Вентилятор",
  天任: "Свеча или газовая конфорка",
};
const BIRTH_DATES = [
  "1984-06-01", "1985-06-01", "1986-06-01", "1987-06-01", "1988-06-01",
  "1989-06-01", "1990-06-01", "1991-06-01", "1992-06-01", "1993-06-01",
];

function firstThreeMysticsDate(): Date {
  const start = new Date(2026, 7, 20, 12, 0, 0);
  for (let offset = 0; offset < 60; offset++) {
    const date = new Date(start);
    date.setDate(start.getDate() + offset);
    for (let hourBranch = 0; hourBranch < 12; hourBranch++) {
      if (detectThreeMystics(date, hourBranch).length > 0) return date;
    }
  }
  throw new Error("Контрольная структура «Три Мистика» не найдена в 60-дневном окне");
}

function firstPersonalResult() {
  const start = new Date(2026, 7, 20, 12, 0, 0);
  for (let offset = 0; offset < 60; offset++) {
    const date = new Date(start);
    date.setDate(start.getDate() + offset);
    for (const birthDate of BIRTH_DATES) {
      const result = computeQimenStructures({ from: date, days: 1, birthDate });
      if (result.threeMystics.length > 0) return result;
    }
  }
  throw new Error("Не найден персонально подходящий контрольный пример «Трёх Мистиков»");
}

describe("Три Мистика: домашняя активация", () => {
  test("находит только разрешённые Врата, звёзды и благоприятные пары стволов", () => {
    const date = firstThreeMysticsDate();
    const hits = Array.from({ length: 12 }, (_, hourBranch) =>
      detectThreeMystics(date, hourBranch),
    ).flat();

    expect(hits.length).toBeGreaterThan(0);
    for (const hit of hits) {
      expect(["乙", "丙", "丁"]).toContain(hit.wonder);
      expect(ALLOWED_STARS.has(hit.star)).toBe(true);
      expect(ALLOWED_DOORS.has(hit.door)).toBe(true);
      expect(GOOD_EARTH_STEMS[hit.wonder].has(hit.earthStem)).toBe(true);
      expect(hit.activation).toBe(ACTIVATION_BY_STAR[hit.star]);
      expect(hit.goal.length).toBeGreaterThan(0);
    }
  });

  test("не показывает структуру без даты рождения: польза по НС года не проверена", () => {
    const date = firstThreeMysticsDate();
    const result = computeQimenStructures({ from: date, days: 1 });

    expect(result.hasBirthDate).toBe(false);
    expect(GetQimenResponse.parse(result).threeMystics).toEqual([]);
  });

  test("публикует только поддерживающие пользователя варианты и передаёт обоснование", () => {
    const result = firstPersonalResult();
    const checked = GetQimenResponse.parse(result);

    expect(checked.threeMystics.length).toBeGreaterThan(0);
    for (const hit of checked.threeMystics) {
      const [year, month, day] = hit.date.split("-").map(Number);
      const calendarDay = dayInfo(new Date(year, month - 1, day, 12, 0, 0));
      const expectedDayGanZhi = STEMS[calendarDay.stem] + BRANCHES[calendarDay.branch];
      expect(hit.dayGanZhi).toBe(expectedDayGanZhi);
      expect(hit.supportRelation === "same" || hit.supportRelation === "supports").toBe(true);
      expect(hit.supportMessage).toContain("НС вашего года");
      expect(ALLOWED_DOORS.has(hit.door)).toBe(true);
      expect(GOOD_EARTH_STEMS[hit.wonder].has(hit.earthStem ?? "")).toBe(true);
    }
  });
});
