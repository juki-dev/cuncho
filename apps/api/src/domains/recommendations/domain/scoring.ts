import { jaccard } from '../../../shared/utils';

export interface ScoringWeights {
  jaccard: number;
  distance: number;
  score: number;
}

export interface Candidate {
  id: string;
  distanceM: number;
  /** Promedio normalizado 0–100 (null si no tiene cataciones). */
  avgScore: number | null;
  descriptors: readonly string[];
}

export interface RankedCandidate<C extends Candidate> {
  candidate: C;
  jaccard: number;
  score: number;
}

const clamp01 = (n: number) => Math.min(1, Math.max(0, n));

/** S = wJ·J + wD·(1 − d/R) + wS·(puntaje/100). */
export function scoreCandidate(
  input: { jaccard: number; distanceM: number; radiusM: number; avgScore: number | null },
  w: ScoringWeights,
): number {
  const proximity = input.radiusM > 0 ? clamp01(1 - input.distanceM / input.radiusM) : 0;
  const quality = clamp01((input.avgScore ?? 0) / 100);
  return w.jaccard * input.jaccard + w.distance * proximity + w.score * quality;
}

/**
 * Ranking: descarta J = 0 y lo que quede fuera del radio, ordena por S
 * descendente (desempate: más cerca primero, luego id para que sea estable).
 */
export function rankCandidates<C extends Candidate>(
  requested: readonly string[],
  candidates: readonly C[],
  radiusM: number,
  weights: ScoringWeights,
): RankedCandidate<C>[] {
  return candidates
    .filter((c) => c.distanceM <= radiusM)
    .map((candidate) => {
      const j = jaccard(requested, candidate.descriptors);
      return {
        candidate,
        jaccard: j,
        score: scoreCandidate({ jaccard: j, distanceM: candidate.distanceM, radiusM, avgScore: candidate.avgScore }, weights),
      };
    })
    .filter((r) => r.jaccard > 0)
    .sort(
      (a, b) =>
        b.score - a.score ||
        a.candidate.distanceM - b.candidate.distanceM ||
        a.candidate.id.localeCompare(b.candidate.id),
    );
}
