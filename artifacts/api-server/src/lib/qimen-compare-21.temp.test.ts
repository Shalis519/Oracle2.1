import { test } from "vitest";
import { buildChart } from "./qimen/chart";
import { detectThreeGenerals } from "./qimen/structures";

test("compare 21 Aug rat charts", () => {
  const date = new Date(2026, 7, 21, 12, 0, 0);
  for (const [hourBranch, lateZi] of [[0, false], [2, false], [0, true]] as const) {
    const chart = buildChart(date, hourBranch, lateZi);
    console.log(JSON.stringify({
      date: "2026-08-21",
      hourBranch,
      lateZi,
      hourGz: chart.hourGz,
      fuYin: chart.fuYin,
      zhiShiDoor: chart.zhiShiDoor,
      zhiFuStar: chart.zhiFuStar,
      cells: Object.entries(chart.cells).map(([palace, cell]) => ({palace, heavenStem: cell.heavenStem, earthStem: cell.earthStem, star: cell.star, door: cell.door, isVoid: cell.isVoid})),
      hits: detectThreeGenerals(date, hourBranch, lateZi),
    }, null, 2));
  }
});
