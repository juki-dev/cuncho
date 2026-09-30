/** Similitud de Jaccard |A ∩ B| / |A ∪ B|. Devuelve 0 si ambos conjuntos están vacíos. */
export function jaccard<T>(a: Iterable<T>, b: Iterable<T>): number {
  const setA = new Set(a);
  const setB = new Set(b);
  if (setA.size === 0 && setB.size === 0) return 0;
  let inter = 0;
  for (const x of setA) if (setB.has(x)) inter++;
  return inter / (setA.size + setB.size - inter);
}
