import { type TransitAspect } from "./astrology";

/** Score weights for transit strength (0–11 scale). */
const ORB_SCORES = [
  { threshold: 0.3, score: 5.0 },
  { threshold: 0.5, score: 4.5 },
  { threshold: 0.7, score: 4.0 },
  { threshold: 1.0, score: 3.5 },
  { threshold: 1.5, score: 3.0 },
  { threshold: 2.0, score: 2.5 },
  { threshold: 2.5, score: 2.0 },
  { threshold: 3.0, score: 1.5 },
] as const;

const PLANET_SCORE: Record<string, number> = {
  "Солнце": 3.0,
  "Луна": 3.0,
  "Меркурий": 2.8,
  "Венера": 2.8,
  "Марс": 2.8,
  "Юпитер": 2.0,
  "Сатурн": 2.0,
  "Уран": 1.2,
  "Нептун": 1.0,
  "Плутон": 0.8,
};

const ASPECT_SCORE: Record<string, number> = {
  "соединение": 2.0,
  "тригон": 1.8,
  "секстиль": 1.6,
  "квадрат": 1.0,
  "оппозиция": 0.8,
  "квинконс": 0.5,
  "полуквадрат": 0.4,
  "полусекстиль": 0.3,
};

const HOUSE_SCORE: Record<number, number> = {
  1: 1.0, 4: 1.0, 7: 1.0, 10: 1.0,
  2: 0.7, 5: 0.7, 8: 0.7, 11: 0.7,
  3: 0.4, 6: 0.4, 9: 0.4, 12: 0.4,
};

/** Calculate numeric strength score for a transit (0–11). */
export function calculateTransitScore(transit: TransitAspect): number {
  let score = 0;

  // 1. Orb (0–5 points) — tighter = stronger
  const orb = Math.abs(transit.orb);
  for (const band of ORB_SCORES) {
    if (orb <= band.threshold) {
      score += band.score;
      break;
    }
  }

  // 2. Planet (0–3 points) — personal > social > outer
  score += PLANET_SCORE[transit.transitBody] ?? 1.0;

  // 3. Aspect (0–2 points) — conjunction & trine score highest
  score += ASPECT_SCORE[transit.type] ?? 0.5;

  // 4. House (0–1 point) — angular > succedent > cadent
  score += HOUSE_SCORE[transit.natalHouse ?? transit.transitHouse ?? 1] ?? 0.3;

  return score;
}

/** Rank transits by composite score (orb < 3°), tightest orb on a tie,
 *  deduplicating repeated transit–natal planet pairs. Returns up to `limit`
 *  candidates; the generator picks the compatible subset from them.
 */
export function selectTopTransits(transits: TransitAspect[], limit = 6): TransitAspect[] {
  const strong = transits.filter((t) => Math.abs(t.orb) < 3);
  if (strong.length === 0) return [];

  strong.sort((a, b) => {
    const scoreA = calculateTransitScore(a);
    const scoreB = calculateTransitScore(b);
    if (scoreB !== scoreA) return scoreB - scoreA; // higher score first
    return Math.abs(a.orb) - Math.abs(b.orb);      // tighter orb on tie
  });

  const seen = new Set<string>();
  const result: TransitAspect[] = [];
  for (const t of strong) {
    const key = `${t.transitBody}|${t.natalBody}`;
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(t);
    if (result.length >= limit) break;
  }
  return result;
}
