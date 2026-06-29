export const MAX_MESSAGE_LENGTH = 4096;

/**
 * Count characters by Unicode code points so that multi-byte emoji and
 * surrogate pairs count as a single "символ" rather than two UTF-16 units.
 */
export function messageLength(text: string): number {
  return Array.from(text).length;
}

const HOMOGLYPHS: Record<string, string> = {
  a: "а",
  b: "в",
  c: "с",
  e: "е",
  h: "н",
  k: "к",
  m: "м",
  o: "о",
  p: "р",
  t: "т",
  x: "х",
  y: "у",
  "0": "о",
  "3": "е",
  "4": "ч",
  "@": "а",
  $: "с",
};

/**
 * Strip separators used to evade filters (spaces, dots, dashes, underscores)
 * and collapse runs of a repeated letter down to two.
 */
function stripAndCollapse(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-zа-яё0-9]+/gi, "")
    .replace(/(.)\1{2,}/g, "$1$1");
}

/**
 * Fold common latin/digit homoglyphs into Cyrillic so that latin look-alikes
 * (e.g. "xyй") are caught by the Cyrillic profanity patterns.
 */
function foldHomoglyphs(text: string): string {
  let out = "";
  for (const ch of text) {
    out += HOMOGLYPHS[ch] ?? ch;
  }
  return out;
}

// Roots that are evasion-resistant and safe without word boundaries. Tested
// against the separator-stripped form, so they also catch spaced-out evasion
// like "х у й".
const ROOT_PATTERNS: RegExp[] = [
  /х[уy]+[ийёеяюl]/,
  /п[иi]зд/,
  /[еe]б[аоиуёлнши]/,
  /бля[дт]/,
  /муд[аоие]к/,
  /г[ао]вн/,
  /пид[оа]?р/,
  /залуп/,
  /дроч/,
  /херн/,
  /гондон/,
  /мраз/,
  /долбо[её]б/,
  /уеб/,
  /выеб/,
  /заеб/,
  /разъеб/,
  /отъеб/,
  /наеб/,
  /пробл[яе]д/,
  /fuck/,
  /shit/,
  /asshole/,
  /bitch/,
  /nigg/,
  /cunt/,
];

// Words that need boundaries to avoid false positives (e.g. "сукно", "теперь").
// JS \b is ASCII-only, so use explicit lookarounds that treat both Cyrillic and
// Latin letters as word characters.
const WORD_PATTERNS: RegExp[] = [
  /(?<![a-zа-яё])хер(?![a-zа-яё])/i,
  /(?<![a-zа-яё])сук[аи](?![a-zа-яё])/i,
  /(?<![a-zа-яё])dick(?![a-zа-яё])/i,
];

export function containsProfanity(text: string): boolean {
  const base = stripAndCollapse(text);
  const foldedBase = foldHomoglyphs(base);
  if (ROOT_PATTERNS.some((re) => re.test(base) || re.test(foldedBase))) {
    return true;
  }
  const raw = text.toLowerCase();
  const foldedRaw = foldHomoglyphs(raw);
  const forms = [raw, foldedRaw, base, foldedBase];
  return WORD_PATTERNS.some((re) => forms.some((f) => re.test(f)));
}

const URL_PATTERNS: RegExp[] = [
  /https?:\/\//i,
  /www\./i,
  /\b[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.(?:ru|su|рф|com|net|org|io|me|info|biz|xyz|online|site|club|shop|store|app|dev|co|tv|cc|us|uk|de|fr|es|it|pl|ua|by|kz|cn|jp|tk|ml|ga|link|live|fun|top|pro|vip|gg|to|ws)\b/i,
  /\bt\.me\//i,
];

/**
 * Fold common link obfuscations into a canonical form: drop zero-width / bidi
 * control chars and rewrite "(dot)", "[.]", " dot ", " точка " into a literal
 * dot so that "example dot com" / "example[.]com" are detected like a real URL.
 */
function normalizeForLinks(text: string): string {
  return text
    .toLowerCase()
    .replace(/[\u200b-\u200f\u202a-\u202e\ufeff]/g, "")
    .replace(/[[({]\s*(?:\.|dot|точка)\s*[\])}]/g, ".")
    .replace(/([a-z0-9])\s+(?:dot|точка)\s+([a-z0-9])/g, "$1.$2")
    .replace(/([a-z0-9])\s*\.\s*([a-z0-9])/g, "$1.$2");
}

export function containsExternalLink(text: string): boolean {
  const normalized = normalizeForLinks(text);
  return URL_PATTERNS.some((re) => re.test(text) || re.test(normalized));
}

export type ModerationResult = { ok: true } | { ok: false; error: string };

export function moderateMessage(raw: string): ModerationResult {
  const text = raw.trim();
  if (text.length === 0) {
    return { ok: false, error: "Сообщение не может быть пустым." };
  }
  if (messageLength(text) > MAX_MESSAGE_LENGTH) {
    return {
      ok: false,
      error: `Сообщение слишком длинное. Максимум ${MAX_MESSAGE_LENGTH} символов.`,
    };
  }
  if (containsExternalLink(text)) {
    return {
      ok: false,
      error: "Ссылки на сторонние ресурсы запрещены.",
    };
  }
  if (containsProfanity(text)) {
    return {
      ok: false,
      error: "Сообщение содержит ненормативную лексику.",
    };
  }
  return { ok: true };
}
