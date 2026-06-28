// Parses monthly Feng Shui activation events (extracted from PDF via
// `pdftotext -layout`) into the generated data file consumed by the API server.
//
// Usage (from repo root or via pnpm):
//   node scripts/src/parse-activations.mjs <input.txt> <MM> <YYYY> <monthGenitive>
//   pnpm --filter @workspace/scripts run parse-activations
//
// Defaults parse attached_assets/july.txt as 2026-07 (genitive "Июля").
// The output file is OVERWRITTEN with the parsed month.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

const [, , argIn, argMonth, argYear, argGenitive] = process.argv;
const SRC = path.resolve(repoRoot, argIn ?? "attached_assets/july.txt");
const MONTH = argMonth ?? "07";
const YEAR = argYear ?? "2026";
const GENITIVE = argGenitive ?? "Июля"; // month name as it appears in the date cell
const OUT = path.resolve(repoRoot, "artifacts/api-server/src/lib/data/activations.ts");
const SPLIT = 23; // column where the activation (third) column begins

const ANIMALS = new Set([
  "Крыса", "Бык", "Тигр", "Кролик", "Дракон", "Змея",
  "Лошадь", "Коза", "Обезьяна", "Петух", "Собака", "Свинья",
]);

const AUDIENCE_RE = /^(Не рекомендуется|Рекомендуется|Для людей|Для рожденных|Для всех|Подходит для всех|Для тех)/;
const MONTH_HEADER_RE = new RegExp(`^[А-ЯЁ]{3,}\\s*${YEAR}`); // e.g. "ИЮЛЬ 2026"

const raw = fs.readFileSync(SRC, "utf8").split("\n");

// The date cell ("4" then "Июля") is rendered vertically and bleeds onto
// body rows at column 0. Strip that noise from the left (animal) column.
function cleanLeft(leftRaw) {
  let s = leftRaw.trim();
  let dayNum = null;
  const dm = s.match(/^(\d{1,2})\b\s*/);
  if (dm) {
    dayNum = Number(dm[1]);
    s = s.slice(dm[0].length).trim();
  }
  if (s === GENITIVE) s = "";
  s = s.replace(MONTH_HEADER_RE, "").trim();
  const animal = ANIMALS.has(s) ? s : "";
  return { dayNum, animal };
}

const isSkippable = (t) =>
  t === "" ||
  /^\d{1,2}$/.test(t) ||
  MONTH_HEADER_RE.test(t) ||
  t.startsWith("Дата") ||
  t === GENITIVE;

/** @type {Record<string, {hour:string,title:string,bodyLines:string[]}[]>} */
const byDate = {};
let curDate = null;
let afterSep = true;
let inheritedAnimal = "";
let curAct = null;

const ensureDay = (dd) => {
  curDate = `${YEAR}-${MONTH}-${String(dd).padStart(2, "0")}`;
  if (!byDate[curDate]) byDate[curDate] = [];
  inheritedAnimal = "";
  curAct = null;
  afterSep = true;
};

for (let i = 0; i < raw.length; i++) {
  const line = raw[i];
  const t = line.trim();

  // Standalone date cell: number on its own line followed by the month name.
  if (/^\d{1,2}$/.test(t) && (raw[i + 1] || "").trim() === GENITIVE) {
    ensureDay(Number(t));
    continue;
  }

  if (isSkippable(t)) {
    afterSep = true;
    curAct = null;
    continue;
  }

  const left = line.slice(0, SPLIT);
  const right = line.slice(SPLIT).trim();
  const { dayNum, animal } = cleanLeft(left);

  // Inline date cell: the day number shares the first activation row.
  if (dayNum != null) ensureDay(dayNum);

  if (!curDate) continue;

  if (afterSep) {
    if (!right) continue;
    const hour = animal || inheritedAnimal;
    if (animal) inheritedAnimal = animal;
    curAct = { hour, title: right, bodyLines: [] };
    byDate[curDate].push(curAct);
    afterSep = false;
  } else if (curAct && right) {
    // Body rows: ignore the left column entirely (date-cell noise only).
    curAct.bodyLines.push(right);
  }
}

const result = {};
for (const [date, acts] of Object.entries(byDate)) {
  result[date] = acts.map((a) => {
    const lines = [...a.bodyLines];
    let audience = null;
    if (lines.length && AUDIENCE_RE.test(lines[0])) {
      audience = lines.shift();
    }
    // Join wrapped lines, then split into paragraphs on bullet markers
    // (both leading and inline "⁃").
    const paragraphs = lines
      .join(" ")
      .split(/\s*⁃\s*/)
      .map((p) => p.trim())
      .filter(Boolean);
    return { hour: a.hour, title: a.title.trim(), audience, paragraphs };
  });
}

const dates = Object.keys(result).sort();
const totalItems = dates.reduce((n, d) => n + result[d].length, 0);

// Validation: catch parsing corruption before writing.
const errors = [];
for (const d of dates) {
  for (const it of result[d]) {
    if (/^\d/.test(it.title)) errors.push(`${d}: title starts with digit: ${it.title}`);
    if (it.title.includes(GENITIVE)) errors.push(`${d}: '${GENITIVE}' in title: ${it.title}`);
    if (it.hour && !ANIMALS.has(it.hour)) errors.push(`${d}: bad hour: ${it.hour}`);
    for (const p of it.paragraphs) {
      if (p.includes(` ${GENITIVE} `)) errors.push(`${d}: '${GENITIVE}' leaked in body: ${p.slice(0, 60)}…`);
    }
  }
}

console.log("Dates:", dates.length, "| Activations:", totalItems);
console.log(dates.join(", "));
if (errors.length) {
  console.error("\nVALIDATION ERRORS:\n" + errors.join("\n"));
  process.exit(1);
}

const header = `// AUTO-GENERATED from monthly activation PDFs. Do not edit by hand.
// Regenerate with: pnpm --filter @workspace/scripts run parse-activations

export interface ActivationItem {
  hour: string;
  title: string;
  audience: string | null;
  paragraphs: string[];
}

export type ActivationsByDate = Record<string, ActivationItem[]>;

export const ACTIVATIONS: ActivationsByDate = ${JSON.stringify(result, null, 2)};

export function getActivationsForDate(date: string): ActivationItem[] {
  return ACTIVATIONS[date] ?? [];
}
`;

fs.writeFileSync(OUT, header, "utf8");
console.log("Wrote", path.relative(repoRoot, OUT));
