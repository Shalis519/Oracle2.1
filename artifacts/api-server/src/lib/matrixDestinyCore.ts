export type FullMatrixPointId =
  | "day"
  | "month"
  | "year"
  | "foundation"
  | "center"
  | "directTopLeft"
  | "directTopRight"
  | "directBottomRight"
  | "directBottomLeft"
  | "heaven"
  | "earth"
  | "personalPurpose"
  | "fatherLine"
  | "motherLine"
  | "socialPurpose"
  | "spiritualPurpose"
  | "planetaryPurpose";

export type MatrixSection = "diagonal" | "direct" | "line" | "purpose";

export interface FullMatrixPoint {
  id: FullMatrixPointId;
  section: MatrixSection;
  value: number;
  formula: string;
}

export interface FullMatrixNumbers {
  points: Record<FullMatrixPointId, FullMatrixPoint>;
}

interface DateParts {
  year: number;
  month: number;
  day: number;
}

/**
 * Reduces a non-negative value to the 1..22 arcana range by repeatedly adding
 * digits. Zero is represented by the 22nd arcana in the established method.
 */
export function reduceMatrixArcana(value: number): number {
  let result = Math.abs(Math.trunc(value));
  while (result > 22) {
    result = String(result)
      .split("")
      .reduce((sum, digit) => sum + Number(digit), 0);
  }
  return result === 0 ? 22 : result;
}

export function sumDigits(value: number): number {
  return String(Math.abs(Math.trunc(value)))
    .split("")
    .reduce((sum, digit) => sum + Number(digit), 0);
}

export function isValidMatrixBirthDate(parts: DateParts): boolean {
  if (parts.year < 1 || parts.month < 1 || parts.month > 12 || parts.day < 1) {
    return false;
  }
  const date = new Date(Date.UTC(parts.year, parts.month - 1, parts.day));
  return (
    date.getUTCFullYear() === parts.year &&
    date.getUTCMonth() === parts.month - 1 &&
    date.getUTCDate() === parts.day
  );
}

function calculation(terms: number[]): { value: number; formula: string } {
  const raw = terms.reduce((sum, term) => sum + term, 0);
  const value = reduceMatrixArcana(raw);
  return {
    value,
    formula: raw === value ? terms.join(" + ") : `${terms.join(" + ")} = ${raw} → ${value}`,
  };
}

function singleValue(value: number, formula: string): { value: number; formula: string } {
  return { value: reduceMatrixArcana(value), formula };
}

/**
 * Builds the complete base wheel documented in the primary source: a diagonal
 * square, a direct square, the centre, the Heaven and Earth lines, and four
 * purpose values. It intentionally contains arithmetic only, no interpretation.
 */
export function buildFullMatrixNumbers(parts: DateParts): FullMatrixNumbers | null {
  if (!isValidMatrixBirthDate(parts)) return null;

  const day = singleValue(parts.day, `День рождения: ${parts.day}`);
  const month = singleValue(parts.month, `Месяц рождения: ${parts.month}`);
  const yearDigits = sumDigits(parts.year);
  const year = singleValue(yearDigits, `Цифры года: ${String(parts.year).split("").join(" + ")} = ${yearDigits}`);
  const foundation = calculation([day.value, month.value, year.value]);
  const center = calculation([day.value, month.value, year.value, foundation.value]);

  const directTopLeft = calculation([month.value, year.value]);
  const directTopRight = calculation([month.value, day.value]);
  const directBottomRight = calculation([day.value, foundation.value]);
  const directBottomLeft = calculation([year.value, foundation.value]);

  const heaven = calculation([month.value, foundation.value]);
  const earth = calculation([day.value, year.value]);
  const personalPurpose = calculation([heaven.value, earth.value]);
  const fatherLine = calculation([directTopRight.value, directBottomLeft.value]);
  const motherLine = calculation([directTopLeft.value, directBottomRight.value]);
  const socialPurpose = calculation([fatherLine.value, motherLine.value]);
  const spiritualPurpose = calculation([personalPurpose.value, socialPurpose.value]);
  const planetaryPurpose = calculation([socialPurpose.value, spiritualPurpose.value]);

  return {
    points: {
      day: { id: "day", section: "diagonal", ...day },
      month: { id: "month", section: "diagonal", ...month },
      year: { id: "year", section: "diagonal", ...year },
      foundation: { id: "foundation", section: "diagonal", ...foundation },
      center: { id: "center", section: "diagonal", ...center },
      directTopLeft: { id: "directTopLeft", section: "direct", ...directTopLeft },
      directTopRight: { id: "directTopRight", section: "direct", ...directTopRight },
      directBottomRight: { id: "directBottomRight", section: "direct", ...directBottomRight },
      directBottomLeft: { id: "directBottomLeft", section: "direct", ...directBottomLeft },
      heaven: { id: "heaven", section: "line", ...heaven },
      earth: { id: "earth", section: "line", ...earth },
      personalPurpose: { id: "personalPurpose", section: "purpose", ...personalPurpose },
      fatherLine: { id: "fatherLine", section: "line", ...fatherLine },
      motherLine: { id: "motherLine", section: "line", ...motherLine },
      socialPurpose: { id: "socialPurpose", section: "purpose", ...socialPurpose },
      spiritualPurpose: { id: "spiritualPurpose", section: "purpose", ...spiritualPurpose },
      planetaryPurpose: { id: "planetaryPurpose", section: "purpose", ...planetaryPurpose },
    },
  };
}
