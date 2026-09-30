import { normalizeText, textSimilarity } from '../../../shared/utils';

/** Radio en metros dentro del cual dos lugares con nombre parecido se consideran el mismo. */
export const DUPLICATE_RADIUS_M = 30;
export const NAME_SIMILARITY_THRESHOLD = 0.8;

/** Palabras genéricas que no distinguen una cafetería de otra. */
const STOPWORDS = new Set(['cafe', 'cafeteria', 'coffee', 'shop', 'tienda', 'de', 'del', 'el', 'la', 'los', 'las', 'y']);

export function distinctiveName(name: string): string {
  const words = normalizeText(name)
    .split(' ')
    .filter((w) => w && !STOPWORDS.has(w));
  // Si el nombre es solo palabras genéricas ("Café"), se compara completo.
  return words.length ? words.join(' ') : normalizeText(name);
}

export function namesLookAlike(a: string, b: string): boolean {
  const na = distinctiveName(a);
  const nb = distinctiveName(b);
  if (!na || !nb) return false;
  if (na === nb) return true;
  const [short, long] = na.length <= nb.length ? [na, nb] : [nb, na];
  if (short.length >= 4 && ` ${long} `.includes(` ${short} `)) return true;
  return textSimilarity(na, nb) >= NAME_SIMILARITY_THRESHOLD;
}

/** Devuelve el candidato más cercano con nombre parecido, o null. Los candidatos ya vienen filtrados por radio. */
export function findDuplicate<T extends { name: string; distanceM: number }>(name: string, candidates: T[]): T | null {
  return (
    candidates
      .filter((c) => c.distanceM <= DUPLICATE_RADIUS_M && namesLookAlike(name, c.name))
      .sort((x, y) => x.distanceM - y.distanceM)[0] ?? null
  );
}
