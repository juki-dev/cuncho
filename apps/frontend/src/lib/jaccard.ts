/** Similitud de Jaccard |A ∩ B| / |A ∪ B|. Devuelve 0 si ambos conjuntos están vacíos. */
export function jaccard<T>(a: Iterable<T>, b: Iterable<T>): number {
  const A = new Set(a)
  const B = new Set(b)
  if (A.size === 0 && B.size === 0) return 0
  let inter = 0
  for (const x of A) if (B.has(x)) inter++
  return inter / (A.size + B.size - inter)
}
