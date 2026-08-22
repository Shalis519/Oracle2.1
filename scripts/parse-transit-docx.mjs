import fs from "node:fs";

const inputPath = process.argv[2];
const outputPath = process.argv[3];
if (!inputPath || !outputPath) {
  console.error("Usage: node parse-transit-docx.mjs <input> <output>");
  process.exit(1);
}

const paragraphs = fs.readFileSync(inputPath, "utf8")
  .replace(/\uFEFF/g, "")
  .replace(/[ \t]+/g, " ")
  .split(/\n+/)
  .map((line) => line.trim())
  .filter(Boolean);

const source = [];
for (const paragraph of paragraphs) {
  const startsCard = /(?:^|\s)(?:с|С)?\s*(?:\d{1,2}[.\-/]|\d{1,2}\s|\d{4}|транзитн)/.test(paragraph);
  if (startsCard || source.length === 0) source.push(paragraph);
  else source[source.length - 1] += ` ${paragraph}`;
}

const planetMap = new Map([
  ["Солнце", "sun"], ["Луна", "moon"], ["Меркурий", "mercury"],
  ["Венера", "venus"], ["Марс", "mars"], ["Юпитер", "jupiter"],
  ["Сатурн", "saturn"], ["Уран", "uranus"], ["Нептун", "neptune"],
  ["Плутон", "pluto"],
]);
const aspectMap = new Map([
  ["соединение", "conjunction"], ["соединением", "conjunction"],
  ["квадрат", "square"], ["квадратуру", "square"],
  ["оппозиция", "opposition"], ["оппозиции", "opposition"],
  ["тригон", "trine"], ["тригоном", "trine"],
  ["секстиль", "sextile"], ["секстилем", "sextile"],
]);

const planetStemPattern = "Солнц[а-яё]*|Лун[а-яё]*|Меркур[а-яё]*|Венер[а-яё]*|Марс[а-яё]*|Юпитер[а-яё]*|Сатурн[а-яё]*|Уран[а-яё]*|Нептун[а-яё]*|Плутон[а-яё]*";

function normalizePlanetLabel(value) {
  for (const [label, key] of planetMap) {
    if (value.startsWith(label.slice(0, Math.max(4, label.length - 2)))) return { label, key };
  }
  return null;
}

function findTransitPlanet(text, start = 0) {
  const match = new RegExp(`транзитн[а-яё]*\\s+(?:ретро\\s+)?(${planetStemPattern})`, "i").exec(text.slice(start));
  const planet = match ? normalizePlanetLabel(match[1]) : null;
  return planet && match ? { ...planet, index: start + match.index + match[0].indexOf(match[1]), endIndex: start + match.index + match[0].length } : null;
}

function findNatalPlanet(text, start = 0) {
  const match = new RegExp(`натальн[а-яё]*\\s+(${planetStemPattern})`, "i").exec(text.slice(start));
  const planet = match ? normalizePlanetLabel(match[1]) : null;
  return planet && match ? { ...planet, index: start + match.index + match[0].indexOf(match[1]), endIndex: start + match.index + match[0].length } : null;
}

function findAllNatalPlanets(text, start = 0) {
  const pattern = new RegExp(`натальн[а-яё]*\\s+(${planetStemPattern})`, "gi");
  return [...text.slice(start).matchAll(pattern)]
    .map((match) => normalizePlanetLabel(match[1]))
    .filter(Boolean);
}

function parseRecord(raw, index) {
  const transitMarker = raw.search(/транзитн[а-яё]*\s+/i);
  if (transitMarker < 0) return { index, raw, status: "unparsed", reason: "no transit marker" };
  const transit = findTransitPlanet(raw, transitMarker);
  const transitHouseMatch = raw.match(/проходя\s+по\s+Вашему\s+натальному\s+(\d{1,2})\s+дому/i);
  const natal = findNatalPlanet(raw, transit ? transit.index + transit.label.length : transitMarker);
  const natalPlanets = findAllNatalPlanets(raw, transit ? transit.index + transit.label.length : transitMarker);
  const natalHouseMatch = natal
    ? raw.slice(natal.endIndex).match(/\s+в\s+(?:Вашем\s+)?(\d{1,2})\s+д[оа]м[уеа]?/i)
    : null;
  const aspectMatch = raw.match(/образует\s+(соединение|квадрат(?:уру)?|оппозици(?:ю|и)|тригон(?:ом)?|секстиль(?:ем)?)|в\s+(соединение|оппозици(?:и|ю))/i);
  const aspectLabel = (aspectMatch?.[1] ?? aspectMatch?.[2] ?? "").toLowerCase();
  const key = transit && natal && aspectMap.has(aspectLabel)
    ? `${transit.key}:${aspectMap.get(aspectLabel)}:${natal.key}`
    : null;
  const hasMultipleNatalTargets = new Set(natalPlanets.map((planet) => planet.key)).size > 1;
  return {
    index,
    status: key && !hasMultipleNatalTargets ? "parsed" : "needs_review",
    raw,
    key,
    transitBody: transit?.key ?? null,
    transitBodyLabel: transit?.label ?? null,
    aspect: aspectMap.get(aspectLabel) ?? null,
    aspectLabel: aspectLabel || null,
    natalBody: natal?.key ?? null,
    natalBodyLabel: natal?.label ?? null,
    natalBodies: natalPlanets.map((planet) => planet.key),
    transitHouse: transitHouseMatch ? Number(transitHouseMatch[1]) : null,
    natalHouse: natalHouseMatch ? Number(natalHouseMatch[1]) : null,
  };
}

const records = source.map(parseRecord);
fs.writeFileSync(outputPath, JSON.stringify(records, null, 2) + "\n");
const counts = records.reduce((acc, record) => {
  acc[record.status] = (acc[record.status] ?? 0) + 1;
  return acc;
}, {});
console.log(JSON.stringify({ total: records.length, counts, outputPath }, null, 2));
for (const record of records.filter((item) => item.status !== "parsed")) {
  console.log(`REVIEW ${record.index}: ${record.reason ?? record.raw.slice(0, 180)}`);
}
