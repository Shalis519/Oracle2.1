import fs from "node:fs";

const path = process.argv[2];
const cards = JSON.parse(fs.readFileSync(path, "utf8"));
const matches = cards.filter((card) =>
  card.transitBody === "pluto" &&
  card.aspect === "square" &&
  card.natalBody === "mercury" &&
  card.transitHouse == null &&
  card.natalHouse == null,
);
if (matches.length !== 1) {
  throw new Error(`Expected exactly one Pluto-square-Mercury card without houses, found ${matches.length}`);
}
const filtered = cards.filter((card) => card !== matches[0]);
fs.writeFileSync(path, JSON.stringify(filtered, null, 2) + "\n");
console.log(JSON.stringify({ removedIndex: matches[0].index, remaining: filtered.length }, null, 2));
