import { describe, it } from "vitest";
import { localSolarTime, hourBranchFromClock, isLateZiClock } from "./qimen/birthTime";
import { buildChart } from "./qimen/chart";

const CASES = [
  { name: "Тараз", date: "1980-02-05", time: "16:01", timezone: "Asia/Almaty", offset: 6, longitude: 71.39843 },
  { name: "Татьяна / Северобайкальск", date: "1986-06-26", time: "16:40", timezone: "Asia/Irkutsk", offset: 9, longitude: 109.322 },
  { name: "Ангелина / Хазар", date: "1981-05-17", time: "06:30", timezone: "Asia/Ashgabat", offset: 6, longitude: 53.12 },
  { name: "Анна / Омск", date: "1978-07-11", time: "00:30", timezone: "Asia/Omsk", offset: 6, longitude: 73.3645 },
] as const;

function mapSummary(dateText: string, timeText: string, lateZi: boolean) {
  const [y, m, d] = dateText.split("-").map(Number);
  const [h, min] = timeText.split(":").map(Number);
  const hourBranch = hourBranchFromClock(timeText);
  const chart = buildChart(new Date(y, m - 1, d, h, min), hourBranch, lateZi);
  return { hourBranch, lateZi, hourGz: chart.hourGz, ju: chart.ju.ju, yin: chart.ju.yin, zhiFuStar: chart.zhiFuStar, zhiFuPalace: chart.zhiFuPalace, zhiShiDoor: chart.zhiShiDoor, zhiShiPalace: chart.zhiShiPalace };
}

describe("Qimen birth control cases", () => {
  it("prints civil versus mean local solar maps", () => {
    for (const item of CASES) {
      const solar = localSolarTime({ isoDate: item.date, time: item.time, timezone: item.timezone, longitude: item.longitude, solarTimeMode: "true" });
      const civilLate = isLateZiClock(item.date, item.time);
      const solarLate = solar ? (solar.solarDate < item.date || isLateZiClock(solar.solarDate, solar.solarTime)) : false;
      console.log(JSON.stringify({
        ...item,
        solar,
        civil: mapSummary(item.date, item.time, civilLate),
        solarMap: solar ? mapSummary(item.date, solar.solarTime, solarLate) : null,
      }, null, 2));
    }
  });
});
