import fs from "node:fs";
const source = JSON.parse(fs.readFileSync(new URL("./test-marriage-taraz-result.json", import.meta.url), "utf8"));
const indicators = source.windows.flatMap((window) => window.indicators).sort((a, b) => String(a.date).localeCompare(String(b.date)));
const windows = [];
for (const indicator of indicators) {
  const date = new Date(`${indicator.date}T00:00:00Z`);
  const current = windows.at(-1);
  if (!current || date - new Date(`${current.dateFrom}T00:00:00Z`) > 30 * 86400000) {
    windows.push({ dateFrom: indicator.date, dateTo: indicator.date, indicators: [indicator] });
  } else {
    current.dateTo = indicator.date;
    current.indicators.push(indicator);
  }
}
console.log(JSON.stringify({
  indicatorCount: indicators.length,
  windowCount: windows.length,
  windows: windows.map((window) => ({ dateFrom: window.dateFrom, dateTo: window.dateTo, indicatorCount: window.indicators.length, kinds: [...new Set(window.indicators.map((item) => item.kind))] })),
}, null, 2));
