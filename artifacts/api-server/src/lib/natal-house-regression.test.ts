import { describe, expect, it } from "vitest";
import { computeNatalChart } from "./astrology";

describe("натальная карта — Тараз, 05.02.1980 16:01", () => {
  it("помещает натальное Солнце в VIII дом Плацидуса", () => {
    const chart = computeNatalChart({
      year: 1980,
      month: 2,
      day: 5,
      hour: 16,
      minute: 1,
      latitude: 42.9,
      longitude: 71.4,
      timezone: "Asia/Almaty",
    });

    const sun = chart.bodies.find((body) => body.key === "sun");
    const eighthHouse = chart.houses.find((house) => house.number === 8);
    const ninthHouse = chart.houses.find((house) => house.number === 9);

    expect(sun).toMatchObject({
      signKey: "aquarius",
      house: 8,
    });
    expect(eighthHouse?.longitude).toBeLessThan(sun!.longitude);
    expect(sun!.longitude).toBeLessThan(ninthHouse!.longitude);
  });
});
