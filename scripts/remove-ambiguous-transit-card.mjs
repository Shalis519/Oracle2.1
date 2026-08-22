import fs from "node:fs";

const path = process.argv[2];
const cards = JSON.parse(fs.readFileSync(path, "utf8"));
const ambiguous = cards.filter((card) =>
  card.raw.includes("транзитный Марс") &&
  card.raw.includes("натальным Ураном") &&
  card.raw.includes("натальным Марсом"),
);
if (ambiguous.length !== 1) {
  throw new Error(`Expected exactly one ambiguous card, found ${ambiguous.length}`);
}
const filtered = cards.filter((card) => card !== ambiguous[0]);
fs.writeFileSync(path, JSON.stringify(filtered, null, 2) + "\n");
console.log(JSON.stringify({ removedIndex: ambiguous[0].index, remaining: filtered.length }, null, 2));
