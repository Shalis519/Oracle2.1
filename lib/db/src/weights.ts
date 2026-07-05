export const ONTOLOGY_WEIGHTS = {
  MIN: 0.0,
  MAX: 3.0,
  DEFAULT: 1.0,
  STEP: 0.5,
} as const;

export interface WeightLevel {
  value: number;
  label: string;
  color: string;
}

export const WEIGHT_LEVELS: readonly WeightLevel[] = [
  { value: 0.0, label: "нет связи", color: "gray" },
  { value: 0.5, label: "слабая", color: "yellow" },
  { value: 1.0, label: "базовая", color: "green" },
  { value: 1.5, label: "сильная", color: "blue" },
  { value: 2.0, label: "очень сильная", color: "purple" },
  { value: 2.5, label: "критическая", color: "orange" },
  { value: 3.0, label: "максимальная", color: "red" },
];

export function getWeightLabel(weight: number): string {
  let closest = WEIGHT_LEVELS[0];
  for (const level of WEIGHT_LEVELS) {
    if (Math.abs(level.value - weight) < Math.abs(closest.value - weight)) {
      closest = level;
    }
  }
  return closest.label;
}

export function getWeightColor(weight: number): string {
  let closest = WEIGHT_LEVELS[0];
  for (const level of WEIGHT_LEVELS) {
    if (Math.abs(level.value - weight) < Math.abs(closest.value - weight)) {
      closest = level;
    }
  }
  return closest.color;
}

export function parseWeight(value: unknown): number {
  if (typeof value === "number") {
    if (Number.isFinite(value)) return value;
    return ONTOLOGY_WEIGHTS.DEFAULT;
  }
  if (typeof value === "string") {
    const parsed = parseFloat(value);
    return Number.isFinite(parsed) ? parsed : ONTOLOGY_WEIGHTS.DEFAULT;
  }
  return ONTOLOGY_WEIGHTS.DEFAULT;
}

export function clampWeight(weight: number): number {
  return Math.max(ONTOLOGY_WEIGHTS.MIN, Math.min(ONTOLOGY_WEIGHTS.MAX, weight));
}
