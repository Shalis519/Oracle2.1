import fs from "node:fs";

const inputPath = process.argv[2];
const outputPath = process.argv[3];
const cards = JSON.parse(fs.readFileSync(inputPath, "utf8"));
const parsed = cards.filter((card) => card.status === "parsed");
const byKey = new Map();
for (const card of parsed) {
  const list = byKey.get(card.key) ?? [];
  list.push(card);
  byKey.set(card.key, list);
}
const duplicateKeys = [...byKey.entries()].filter(([, list]) => list.length > 1);
const lines = [
  "# Черновой реестр транзитных карточек",
  "",
  "Источник: `длякарточек.docx`. Реестр не подключён к генерации прогнозов.",
  "",
  `Распознано карточек: **${parsed.length}**. Уникальных общих ключей без домов: **${byKey.size}**. Ключей с несколькими вариантами домов: **${duplicateKeys.length}**.`,
  "",
  "## Структура ключа",
  "",
  "Текущий нормализованный ключ: `транзитная планета:аспект:натальная планета`. Дома приведены отдельно и пока не включены в ключ.",
  "",
  "| № | Общий ключ | Дом транзита | Натальный дом | Даты и начало карточки |",
  "|---:|---|---:|---:|---|",
];
for (const card of parsed) {
  const firstSentence = card.raw.split(/(?<=\.)\s+/)[0].replace(/\|/g, "\\|");
  lines.push(`| ${card.index + 1} | \`${card.key}\` | ${card.transitHouse ?? "—"} | ${card.natalHouse ?? "—"} | ${firstSentence} |`);
}
lines.push("", "## Ключи, которые повторяются с разными домами", "");
if (!duplicateKeys.length) lines.push("Повторяющихся общих ключей не обнаружено.");
for (const [key, list] of duplicateKeys) {
  lines.push(`### \`${key}\``, "", "| Вариант | Дом транзита | Натальный дом |", "|---:|---:|---:|");
  list.forEach((card, index) => lines.push(`| ${index + 1} | ${card.transitHouse ?? "—"} | ${card.natalHouse ?? "—"} |`));
  lines.push("");
}
lines.push("## Рекомендация по следующей структуре", "", "Для этих записей безопаснее хранить точный ключ с домами, например `pluto:square:mercury:transitHouse:12:natalHouse:4`, а общий ключ оставлять только как отдельную карточку без домовой специфики. До вашего подтверждения ничего не импортируется в production Studio.", "");
fs.writeFileSync(outputPath, lines.join("\n"));
console.log(JSON.stringify({ parsed: parsed.length, uniqueKeys: byKey.size, duplicateKeys: duplicateKeys.length, outputPath }, null, 2));
