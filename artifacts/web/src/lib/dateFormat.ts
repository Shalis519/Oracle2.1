export function formatDisplayDate(value: string | Date | null | undefined): string {
  if (!value) return "—";
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return "—";
    return new Intl.DateTimeFormat("ru-RU", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      timeZone: "UTC",
    }).format(value);
  }

  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (match) return `${match[3]}.${match[2]}.${match[1]}`;

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "UTC",
  }).format(parsed);
}

export function formatDisplayDateRange(from: string | null | undefined, to: string | null | undefined): string {
  return `${formatDisplayDate(from)} — ${formatDisplayDate(to)}`;
}
