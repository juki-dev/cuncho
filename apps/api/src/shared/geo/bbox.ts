/** Caja [minLng, minLat, maxLng, maxLat] en grados. */
export interface BBox {
  minLng: number;
  minLat: number;
  maxLng: number;
  maxLat: number;
}

export class InvalidBBoxError extends Error {}

/** Área máxima permitida (en grados²) para evitar consultas de todo el país a nivel de detalle. */
export const MAX_BBOX_AREA_DEG2 = 25;

/** Parsea `minLng,minLat,maxLng,maxLat`. No admite cajas que crucen el antimeridiano. */
export function parseBBox(raw: string): BBox {
  const parts = raw.split(',').map((p) => p.trim());
  if (parts.length !== 4 || parts.some((p) => p === '')) {
    throw new InvalidBBoxError('bbox debe tener el formato minLng,minLat,maxLng,maxLat');
  }
  const nums = parts.map(Number);
  if (nums.some((n) => !Number.isFinite(n))) throw new InvalidBBoxError('bbox contiene valores no numéricos');
  const [minLng, minLat, maxLng, maxLat] = nums as [number, number, number, number];
  if ([minLng, maxLng].some((v) => v < -180 || v > 180)) throw new InvalidBBoxError('longitud fuera de rango');
  if ([minLat, maxLat].some((v) => v < -90 || v > 90)) throw new InvalidBBoxError('latitud fuera de rango');
  if (minLng >= maxLng || minLat >= maxLat) throw new InvalidBBoxError('bbox con mínimos mayores o iguales a los máximos');
  if ((maxLng - minLng) * (maxLat - minLat) > MAX_BBOX_AREA_DEG2) throw new InvalidBBoxError('bbox demasiado grande');
  return { minLng, minLat, maxLng, maxLat };
}
