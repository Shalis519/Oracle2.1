export function splitMoneyCardText(text: string): string[] {
  const normalized = text
    .replace(/Дополнительно впиши свои ассоциации:?/gi, "")
    .replace(/_{5,}/g, "")
    .replace(/\s+(?=(Профессии:|Территория:|Услуги:|На рабочем месте|Иметь |Статуэтку |Страны и города:|Медицина:|Денежный период:|Дополнительно впиши свои ассоциации:))/g, "\n\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  return normalized
    .split(/\n\s*\n|\n/)
    .map((part) => part.trim())
    .filter(Boolean);
}
export function formatMoneyCardText(text: string): string {
  return splitMoneyCardText(text).join("\n\n");
}
