import { describe, it } from "vitest";
import { yearJiFuPalace, monthJoeyYapJiFuPalace, dayJiFuPalace, hourJiFuPalace } from "./qimen/jifu";
import { PALACES } from "./qimen/constants";

describe("diagnose Ji Fu against infengi 2026-08-21", () => {
  it("prints layers", () => {
    const date = new Date(2026, 7, 21, 12, 0, 0);
    const rows = [
      ["year", yearJiFuPalace(date)],
      ["month", monthJoeyYapJiFuPalace(date)],
      ["day", dayJiFuPalace(date)],
      ["hour-午", hourJiFuPalace(new Date(2026, 7, 21, 12, 0, 0), 6)],
      ["hour-申", hourJiFuPalace(new Date(2026, 7, 21, 16, 0, 0), 8)],
      ["hour-酉", hourJiFuPalace(new Date(2026, 7, 21, 18, 0, 0), 9)],
    ];
    console.log(rows.map(([name, palace]) => ({ name, palace, direction: PALACES[palace as number]?.dirFull })));
  });
});
