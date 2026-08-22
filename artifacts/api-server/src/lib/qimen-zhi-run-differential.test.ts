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
};

const cases: Case[] = [
  { id: "zi-early", date: "2026-08-20", time: "00:30" },
  { id: "chou", date: "2026-08-20", time: "02:30" },
  { id: "yin", date: "2026-08-20", time: "04:30" },
  { id: "mao", date: "2026-08-20", time: "06:30" },
  { id: "chen", date: "2026-08-20", time: "08:30" },
  { id: "si", date: "2026-08-20", time: "10:30" },
  { id: "wu", date: "2026-08-20", time: "12:30" },
  { id: "wei", date: "2026-08-20", time: "14:30" },
  { id: "shen", date: "2026-08-20", time: "16:30" },
  { id: "you", date: "2026-08-20", time: "18:30" },
  { id: "xu", date: "2026-08-20", time: "20:30" },
  { id: "hai", date: "2026-08-20", time: "22:30" },
  { id: "summer-solstice", date: "2026-06-22", time: "03:00" },
  { id: "winter-control", date: "2026-01-15", time: "12:00" },
  { id: "solar-term-edge", date: "2026-08-07", time: "10:00" },
];

function localDate(item: Case): Date {
  const [year, month, day] = item.date.split("-").map(Number);
  const [hour, minute] = item.time.split(":").map(Number);
  return new Date(year, month - 1, day, hour, minute, 0);
}

function hourBranch(item: Case): number {
  const [hour] = item.time.split(":").map(Number);
  return Math.floor((hour + 1) / 2) % 12;
}

function runQmenpowers(item: Case): any {
  const adapter = resolve(process.cwd(), "../../tools/qimen-differential/qmenpowers-adapter.mjs");
  const result = spawnSync(process.execPath, [adapter, JSON.stringify({ datetime: `${item.date} ${item.time}`, tz: "Asia/Shanghai" })], {
    encoding: "utf8",
    env: { ...process.env, TZ: "Asia/Shanghai" },
  });
  if (result.status !== 0) throw new Error(`qmenpowers failed for ${item.id}: ${result.stderr}`);
  return JSON.parse(result.stdout).raw;
}

function normalizeAether(item: Case) {
  const chart = buildChart(localDate(item), hourBranch(item), false);
  return {
    day: `${STEMS[chart.day.stem]}${BRANCHES[chart.day.branch]}`,
    hour: chart.hourGz,
    ju: chart.ju.ju,
    dun: chart.ju.yin ? "阴遁" : "阳遁",
    zhiFu: chart.zhiFuStar,
    zhiShi: chart.zhiShiDoor,
    zhiFuPalace: chart.zhiFuPalace,
    zhiShiPalace: chart.zhiShiPalace,
    cells: Object.values(chart.cells).map((cell) => ({
      palace: cell.palace,
      earthStem: cell.earthStem,
      heavenStem: cell.heavenStem,
      star: cell.star,
      door: cell.door,
      deity: cell.deity,
    })),
  };
}

function normalizeQmenpowers(raw: any) {
  return {
    day: raw.si_zhu?.day ?? null,
    hour: raw.si_zhu?.hour ?? null,
    ju: raw.ju?.number ?? raw.ju?.ju ?? raw.ju ?? null,
    dun: raw.ju?.type ?? raw.ju?.dun ?? null,
    zhiFu: raw.zhi_fu?.star ?? raw.zhi_fu?.name ?? raw.zhi_fu ?? null,
    zhiShi: raw.zhi_shi?.gate ?? raw.zhi_shi?.name ?? raw.zhi_shi ?? null,
    zhiFuPalace: raw.zhi_fu?.palace ?? raw.zhi_fu?.target_palace ?? null,
    zhiShiPalace: raw.zhi_shi?.palace ?? raw.zhi_shi?.target_palace ?? null,
    cells: Object.entries(raw.palaces ?? {}).map(([palace, cell]: [string, any]) => ({
      palace: Number(palace),
      earthStem: cell.di_gan ?? null,
      heavenStem: cell.tian_gan ?? null,
      star: cell.star ?? null,
      door: cell.gate ?? null,
      deity: cell.deity ?? null,
    })),
  };
}

describe("Qi Men Zhi Run differential: Aether vs qmenpowers", () => {
  it("records normalized hourly chart comparison", () => {
    const rows = cases.map((item) => {
      const aether = normalizeAether(item);
      const qmenpowers = normalizeQmenpowers(runQmenpowers(item));
      const compareLayer = (field: keyof typeof aether) => JSON.stringify(aether[field]) === JSON.stringify(qmenpowers[field]);
      return {
        case: item,
        aether,
        qmenpowers,
        comparison: {
          dayEqual: aether.day === qmenpowers.day,
          hourEqual: aether.hour === qmenpowers.hour,
          juEqual: aether.ju === qmenpowers.ju,
          dunEqual: aether.dun === qmenpowers.dun,
          zhiFuEqual: aether.zhiFu === qmenpowers.zhiFu,
          zhiShiEqual: aether.zhiShi === qmenpowers.zhiShi,
          zhiFuPalaceEqual: aether.zhiFuPalace === qmenpowers.zhiFuPalace,
          zhiShiPalaceEqual: aether.zhiShiPalace === qmenpowers.zhiShiPalace,
          earthEqual: compareLayer("cells"),
        },
      };
    });

    const outputDir = resolve(process.cwd(), "../../docs/differential-tests");
    mkdirSync(outputDir, { recursive: true });
    writeFileSync(resolve(outputDir, "aether-vs-qmenpowers-zhi-run-hourly.json"), `${JSON.stringify(rows, null, 2)}\n`, "utf8");
    expect(rows).toHaveLength(cases.length);
  }, 30_000);
});
