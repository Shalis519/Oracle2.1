import { describe, expect, it } from "vitest";
import { computeBaziHours } from "./baziHours";

const cases = [
  { name: "Тараз", date: "1980-02-05", time: "16:01", lat: 42.9, lng: 71.36667, utcOffset: 6 },
  { name: "Татьяна / Северобайкальск", date: "1986-06-26", time: "16:40", lat: 55.65, lng: 109.322, utcOffset: 9 },
  { name: "Ангелина / Хазар", date: "1981-05-17", time: "06:30", lat: 39.402, lng: 53.12, utcOffset: 6 },
  { name: "Анна / Омск", date: "1978-07-11", time: "00:30", lat: 54.9914, lng: 73.3645, utcOffset: 6 },
];

const minutes = (v: string | null) => {
  if (!v) return null;
  const [h, m] = v.split(":").map(Number);
  return h * 60 + m;
};

const contains = (start: string | null, end: string | null, time: string) => {
  const s = minutes(start);
  const e0 = minutes(end);
  const t0 = minutes(time)!;
  if (s === null || e0 === null) return false;
  const e = e0 <= s ? e0 + 1440 : e0;
  const t = t0 < s && e > 1440 ? t0 + 1440 : t0;
  return s <= t && t < e;
};

const at = (list: ReturnType<typeof computeBaziHours>["solar"], time: string) =>
  list.find((x) => contains(x.start, x.end, time))?.animal ?? null;

describe("baziHours Marina modes", () => {
  it("keeps all three modes for four birth cases", () => {
    for (const item of cases) {
      const result = computeBaziHours({ ...item, doubledRat: false });
      console.log(JSON.stringify({
        ...item,
        sunrise: result.sunrise,
        sunset: result.sunset,
        shiftMinutes: result.shiftMinutes,
        solarAtCivil: at(result.solar, item.time),
        rubberAtCivil: at(result.rubber, item.time),
        combinedAtCivil: at(result.combined, item.time),
        solar: result.solar,
        rubber: result.rubber,
        combined: result.combined,
      }, null, 2));
    }
  });

  it("показывает раннюю Крысу первой, а позднюю после Свиньи", () => {
    const result = computeBaziHours({
      lat: 54.9914,
      lng: 73.3645,
      utcOffset: 6,
      date: "1978-07-11",
      doubledRat: false,
    });
    expect(result.equationOfTimeMinutes).toBeLessThan(0);
    expect(result.rubber[0]?.animal).toBe("Крыса (ранняя)");
    expect(result.rubber[0]?.start).not.toBeNull();
    expect(result.rubber[0]?.end).not.toBeNull();

    for (const rows of [result.solar, result.rubber, result.combined]) {
      expect(rows[0]?.animal).toBe("Крыса (ранняя)");
      expect(rows[rows.length - 1]?.animal).toBe("Крыса (поздняя)");
      expect(rows[rows.length - 2]?.animal).toBe("Свинья");
    }
  });
});
