import { test } from "vitest";
import { buildChart } from "./qimen/chart";
import { detectThreeGenerals } from "./qimen/structures";

test("diagnose rat charts", () => {
  const date = new Date(2026, 7, 20, 12, 0, 0);
  for (const lateZi of [false, true]) {
    const chart = buildChart(date, 0, lateZi);
    console.log(JSON.stringify({
      lateZi,
      hourGz: chart.hourGz,
      fuYin: chart.fuYin,
      zhiShiDoor: chart.zhiShiDoor,
      zhiFuStar: chart.zhiFuStar,
      cells: Object.entries(chart.cells).map(([palace, cell]) => ({
        palace,
        heavenStem: cell.heavenStem,
        earthStem: cell.earthStem,
        star: cell.star,
        door: cell.door,
        isVoid: cell.isVoid,
      })),
      hits: detectThreeGenerals(date, 0, lateZi),
    }, null, 2));
  }
});
