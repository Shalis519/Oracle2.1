import { describe, expect, it } from "vitest";
import { spawnSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { buildChart } from "./qimen/chart";
import { BRANCHES, STEMS } from "./qimen/constants";

type Case = {
  id: string;
  date: string;
  time: string;
  offset: string;
  lateZi?: boolean;
};

const cases: Case[] = [
  { id: "readme-summer-solstice", date: "2026-06-22", time: "03:00", offset: "+08:00" },
  { id: "moscow-midday", date: "2026-08-20", time: "12:00", offset: "+03:00" },
  { id: "moscow-early-zi", date: "2026-08-20", time: "00:30", offset: "+03:00" },
  { id: "moscow-late-zi", date: "2026-08-20", time: "23:40", offset: "+03:00", lateZi: true },
  { id: "taraz-birth-civil", date: "1980-02-05", time: "16:01", offset: "+06:00" },
  { id: "severobaikalsk-birth-civil", date: "1986-06-26", time: "16:40", offset: "+09:00" },
  { id: "khazar-birth-civil", date: "1981-05-17", time: "06:30", offset: "+06:00" },
  { id: "omsk-birth-civil", date: "1978-07-11", time: "00:30", offset: "+06:00" },
];

function localDate(caseItem: Case): Date {
  const [year, month, day] = caseItem.date.split("-").map(Number);
  const [hour, minute] = caseItem.time.split(":").map(Number);
  return new Date(year, month - 1, day, hour, minute, 0);
}

function hourBranch(caseItem: Case): number {
  const [hour, minute] = caseItem.time.split(":").map(Number);
  return Math.floor((hour + 1) / 2) % 12;
}

function runMrJelly(caseItem: Case): unknown {
  const adapter = resolve(process.cwd(), "../../tools/qimen-differential/mrjelly-adapter.mjs");
  const iso = `${caseItem.date}T${caseItem.time}:00${caseItem.offset}`;
  const tzHours = Number(caseItem.offset.slice(0, 3));
  const tz = `Etc/GMT${tzHours >= 0 ? "-" : "+"}${Math.abs(tzHours)}`;
  const processResult = spawnSync(
    process.execPath,
    [adapter, JSON.stringify({ iso, lateZiHourMode: "same-day" })],
    { encoding: "utf8", env: { ...process.env, TZ: tz } },
  );
  if (processResult.status !== 0) {
    throw new Error(`MrJelly failed for ${caseItem.id}: ${processResult.stderr}`);
  }
  return JSON.parse(processResult.stdout);
}

const chineseNumbers = ["零", "一", "二", "三", "四", "五", "六", "七", "八", "九"];

function juMatches(juText: string | null | undefined, ju: number, yin: boolean): boolean {
  if (!juText) return false;
  return juText.includes(`${yin ? "阴遁" : "阳遁"}${chineseNumbers[ju]}`);
}

function normalizeAether(caseItem: Case) {
  const chart = buildChart(localDate(caseItem), hourBranch(caseItem), caseItem.lateZi ?? false);
  return {
    day: `${STEMS[chart.day.stem]}${BRANCHES[chart.day.branch]}`,
    time: chart.hourGz,
    ju: chart.ju.ju,
    dun: chart.ju.yin ? "阴遁" : "阳遁",
    zhiFu: chart.zhiFuStar,
    zhiShi: chart.zhiShiDoor,
    zhiFuPalace: chart.zhiFuPalace,
    zhiShiPalace: chart.zhiShiPalace,
    earthPlate: Object.values(chart.cells).map((cell) => ({ palace: cell.palace, stem: cell.earthStem })),
    heavenPlate: Object.values(chart.cells).map((cell) => ({ palace: cell.palace, stem: cell.heavenStem })),
    stars: Object.values(chart.cells).map((cell) => ({ palace: cell.palace, star: cell.star })),
    doors: Object.values(chart.cells).map((cell) => ({ palace: cell.palace, door: cell.door })),
  };
}

describe("Qi Men differential baseline: Aether Oracle vs MrJelly", () => {
  it("records comparable outputs for all control cases", () => {
    const rows = cases.map((caseItem) => {
      const aether = normalizeAether(caseItem);
      const mrjelly = runMrJelly(caseItem);
      const info = (mrjelly as { info?: { siZhu?: Record<string, string>; ju?: string; fu?: string; shi?: string } }).info ?? {};
      const mrSiZhu = info.siZhu ?? {};
      return {
        case: caseItem,
        aether,
        mrjelly: {
          siZhu: mrSiZhu,
          ju: info.ju ?? null,
          fu: info.fu ?? null,
          shi: info.shi ?? null,
        },
        comparison: {
          dayEqual: aether.day === mrSiZhu.day,
          timeEqual: aether.time === mrSiZhu.time,
          juEqual: juMatches(info.ju, aether.ju, aether.dun === "阴遁"),
          zhiFuVisible: info.fu ?? null,
          zhiShiVisible: info.shi ?? null,
        },
      };
    });

    const outputDir = resolve(process.cwd(), "../../docs/differential-tests");
    mkdirSync(outputDir, { recursive: true });
    writeFileSync(
      resolve(outputDir, "aether-vs-mrjelly-hourly.json"),
      `${JSON.stringify(rows, null, 2)}\n`,
      "utf8",
    );

    expect(rows).toHaveLength(cases.length);
    expect(rows.every((row) => row.aether.time.length === 2)).toBe(true);
  });
});
