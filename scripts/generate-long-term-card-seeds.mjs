import fs from "node:fs";

const inputPath = process.argv[2];
const outputPath = process.argv[3];
const cards = JSON.parse(fs.readFileSync(inputPath, "utf8"));
const parsed = cards.filter((card) => card.status === "parsed");

function escape(value) {
  return value
    .replaceAll("\\", "\\\\")
    .replaceAll("`", "\\`")
    .replaceAll("${", "\\${");
}

function interpretation(raw) {
  const match = raw.match(/\.[ \t]+(.+)$/s);
  return (match?.[1] ?? raw).trim();
}

const entries = parsed.map((card) => {
  const exactKey = `${card.key}:transitHouse:${card.transitHouse}:natalHouse:${card.natalHouse}`;
  return `  {\n    key: ${JSON.stringify(exactKey)},\n    title: ${JSON.stringify(`Транзитный ${card.transitBodyLabel} — ${card.aspectLabel} — натальный ${card.natalBodyLabel}, дома ${card.transitHouse} → ${card.natalHouse}`)},\n    text: \`${escape(interpretation(card.raw))}\`,\n    sourceNote: "Авторская база для карточек.docx",\n  },`;
}).join("\n");

const output = `export interface LongTermTransitCardSeed {\n  key: string;\n  title: string;\n  text: string;\n  sourceNote: string;\n}\n\nexport const LONG_TERM_TRANSIT_CARD_SEEDS: LongTermTransitCardSeed[] = [\n${entries}\n];\n`;
fs.writeFileSync(outputPath, output);
console.log(JSON.stringify({ count: parsed.length, outputPath }, null, 2));
