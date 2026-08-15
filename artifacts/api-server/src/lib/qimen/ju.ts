// Qi Men Dun Jia — 排局 (ju selection) using 置闰法 (Zhi Run / leap method).
//
// Principle: 符头 (甲/己 days) march contiguously every 5 days, each block = one 元.
// Terms consume 3 元 (上中下) in order; a 闰 (leap) gives 芒种/大雪 six 元 when the
// 超神 (days the 上元符头 leads the term) reaches >= 9. The dun (阴/阳) and ju number
// come from the term-block the target day lands in (三元歌 table).

import {
  currentTerm,
  dateToIso,
  dayNumber,
  dayInfo,
  isoToDate,
  nextTerm,
} from "./calendar";

const YANG_JU: Record<string, [number, number, number]> = {
  冬至: [1, 7, 4],
  小寒: [2, 8, 5],
  大寒: [3, 9, 6],
  立春: [8, 5, 2],
  雨水: [9, 6, 3],
  惊蛰: [1, 7, 4],
  春分: [3, 9, 6],
  清明: [4, 1, 7],
  谷雨: [5, 2, 8],
  立夏: [4, 1, 7],
  小满: [5, 2, 8],
  芒种: [6, 3, 9],
};
const YIN_JU: Record<string, [number, number, number]> = {
  夏至: [9, 3, 6],
  小暑: [8, 2, 5],
  大暑: [7, 1, 4],
  立秋: [2, 5, 8],
  处暑: [1, 4, 7],
  白露: [9, 3, 6],
  秋分: [7, 1, 4],
  寒露: [6, 9, 3],
  霜降: [5, 8, 2],
  立冬: [6, 9, 3],
  小雪: [5, 8, 2],
  大雪: [4, 7, 1],
};

function isYin(term: string): boolean {
  return term in YIN_JU;
}
function juRow(term: string): [number, number, number] {
  return isYin(term) ? YIN_JU[term] : YANG_JU[term];
}

const SOLSTICES = new Set(["冬至", "夏至"]);
// 上元符头 sexagenary indices: 甲子=0, 己卯=15, 甲午=30, 己酉=45.
const SHANG_FUTOU = [0, 15, 30, 45];

function addDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

/** Most recent solstice (冬至/夏至) at or before date d. */
function recentSolstice(d: Date): { name: string; date: Date } {
  let t = currentTerm(d);
  let guard = 0;
  while (!SOLSTICES.has(t.name) && guard++ < 30) {
    t = currentTerm(addDays(t.date, -1));
  }
  return t;
}

export interface JuResult {
  yin: boolean; // true = 阴遁, false = 阳遁
  ju: number; // 1..9
  term: string; // governing solar term (Chinese)
  yuan: 0 | 1 | 2; // 上/中/下 元
}

/** Determine dun + ju for the day containing date d (using 置闰法). */
export function juForDate(d: Date): JuResult {
  // Anchor at the solstice ~6 months before d so we simulate across one dun flip
  // and capture any leap that overruns the upcoming solstice.
  const s1 = recentSolstice(d);
  const s0 = recentSolstice(addDays(s1.date, -10));

  // 上元符头 nearest s0.
  const s0Idx = dayInfo(s0.date).index;
  let best = { c: SHANG_FUTOU[0], off: Infinity };
  for (const c of SHANG_FUTOU) {
    let off = (((c - s0Idx) % 60) + 60) % 60;
    if (off > 30) off -= 60;
    if (Math.abs(off) < Math.abs(best.off)) best = { c, off };
  }
  let fuTouDate = addDays(s0.date, best.off);

  // Ordered term list from s0 forward until well past d.
  const terms: { name: string; date: Date }[] = [
    { name: s0.name, date: s0.date },
  ];
  let cursor = s0.date;
  for (let i = 0; i < 40; i++) {
    const nt = nextTerm(cursor);
    terms.push(nt);
    cursor = addDays(nt.date, 1);
    if (dayNumber(nt.date) - dayNumber(d) > 35) break;
  }

  const dNum = dayNumber(d);
  for (const term of terms) {
    const chaoShen = dayNumber(term.date) - dayNumber(fuTouDate); // >0 => 符头 leads
    const leap =
      (term.name === "芒种" || term.name === "大雪") && chaoShen >= 9;
    const yuanCount = leap ? 6 : 3;
    const spanDays = 5 * yuanCount;
    const offset = dNum - dayNumber(fuTouDate);
    if (offset >= 0 && offset < spanDays) {
      const yuan = (Math.floor(offset / 5) % 3) as 0 | 1 | 2;
      return {
        yin: isYin(term.name),
        ju: juRow(term.name)[yuan],
        term: term.name,
        yuan,
      };
    }
    fuTouDate = addDays(fuTouDate, spanDays);
  }

  // Чай Бу не является допустимым fallback для проекта.
  // Если 置闰法 не смогла определить Цзюй, лучше остановить расчёт,
  // чем незаметно выдать карту другой методики.
  throw new Error(
    `Не удалось определить Цзюй по системе Чжи Рен для даты ${dateToIso(d)}`,
  );
}

/** Convenience for ISO date string. */
export function juForIso(iso: string): JuResult {
  return juForDate(isoToDate(iso));
}

export { dateToIso };
