import fs from "node:fs";
import { execFileSync } from "node:child_process";

const file = process.argv[2];
if (!file) throw new Error("Укажите путь к DOCX");
const xml = execFileSync("unzip", ["-p", file, "word/document.xml"], { encoding: "utf8" });
const decode = (value) => value
  .replace(/&amp;/g, "&")
  .replace(/&lt;/g, "<")
  .replace(/&gt;/g, ">");
const text = [...xml.matchAll(/<w:p[\s\S]*?<\/w:p>/g)]
  .map(([paragraph]) => [...paragraph.matchAll(/<w:t[^>]*>([\s\S]*?)<\/w:t>/g)].map(([, value]) => decode(value)).join(""))
  .join("\n");
const labels = { "Солнце": "sun", "Луна": "moon", "Меркурий": "mercury", "Венера": "venus", "Марс": "mars", "Юпитер": "jupiter", "Сатурн": "saturn", "Уран": "uranus", "Нептун": "neptune", "Плутон": "pluto" };
const aspects = { "соединение": "conjunction", "оппозиция": "opposition", "квадрат": "square", "тригон": "trine", "секстиль": "sextile" };
const keys = new Set();
for (const line of text.split(/\r?\n/)) {
  const m = line.match(/транзитн(?:ый|ая|ое|ый)\s+(Солнце|Луна|Меркурий|Венера|Марс|Юпитер|Сатурн|Уран|Нептун|Плутон).*?образует\s+(соединение|оппозиция|квадрат|тригон|секстиль).*?натальн(?:ый|ая|ое|ой)\s+(Солнце|Луна|Меркурий|Венера|Марс|Юпитер|Сатурн|Уран|Нептун|Плутон)/i);
  if (m) keys.add(`${labels[m[1]]}:${aspects[m[2]]}:${labels[m[3]]}`);
}
console.log([...keys].sort().join("\n"));
