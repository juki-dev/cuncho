import { PlaceAggregate, TastingContribution } from './place';

const round2 = (n: number) => Math.round(n * 100) / 100;

const union = (a: readonly string[], b: readonly string[]) => [...new Set([...a, ...b])].sort();

/**
 * Suma una catación al agregado del lugar: promedio incremental del puntaje
 * normalizado, unión de descriptores y notas, y catación destacada (la de
 * mayor puntaje; en empate gana la más reciente).
 */
export function applyTasting(agg: PlaceAggregate, t: TastingContribution): PlaceAggregate {
  const count = agg.tastingsCount + 1;
  const prevSum = (agg.avgScore ?? 0) * agg.tastingsCount;
  const featured =
    !agg.featured || t.normalizedScore >= agg.featured.normalizedScore
      ? {
          tastingId: t.tastingId,
          normalizedScore: t.normalizedScore,
          variety: t.variety,
          process: t.process,
          method: t.method,
          notes: [...t.notes],
        }
      : agg.featured;
  return {
    avgScore: round2((prevSum + t.normalizedScore) / count),
    tastingsCount: count,
    descriptors: union(agg.descriptors, t.descriptors),
    notes: union(agg.notes, t.notes),
    featured,
  };
}
