function parse(dateStr: string): { year: number; month: number; day: number } | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(dateStr);
  if (!m) return null;
  return { year: Number(m[1]), month: Number(m[2]), day: Number(m[3]) };
}

/** Days until the next anniversary of the given date (0 = today). */
export function daysUntilBirthday(birthDate: string): number | null {
  const d = parse(birthDate);
  if (!d) return null;
  const now = new Date();
  const today = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  );
  let next = new Date(Date.UTC(today.getUTCFullYear(), d.month - 1, d.day));
  if (next.getTime() < today.getTime()) {
    next = new Date(Date.UTC(today.getUTCFullYear() + 1, d.month - 1, d.day));
  }
  return Math.round((next.getTime() - today.getTime()) / 86400000);
}

/** Age the person turns on their next birthday. */
export function turningAge(birthDate: string): number | null {
  const d = parse(birthDate);
  if (!d) return null;
  const now = new Date();
  const today = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  );
  let nextYear = today.getUTCFullYear();
  const thisYearBday = new Date(Date.UTC(nextYear, d.month - 1, d.day));
  if (thisYearBday.getTime() < today.getTime()) nextYear += 1;
  return nextYear - d.year;
}
