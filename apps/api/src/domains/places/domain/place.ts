import type { GeoPoint } from '../../../shared/geo';

/** Resumen de la catación mejor puntuada del lugar (popup y tarjeta de recomendación). */
export interface FeaturedTasting {
  tastingId: string;
  normalizedScore: number;
  variety: string;
  process: string;
  method: string;
  notes: string[];
}

export interface PlaceAggregate {
  avgScore: number | null;
  tastingsCount: number;
  descriptors: string[];
  notes: string[];
  featured: FeaturedTasting | null;
}

export interface Place extends PlaceAggregate {
  id: string;
  name: string;
  location: GeoPoint;
}

export interface PlaceWithDistance extends Place {
  distanceM: number;
}

/** Referencia mínima que usan otros dominios (p. ej. `lugar` dentro de una catación). */
export interface PlaceRef {
  id: string;
  name: string;
  location: GeoPoint;
}

/** Aporte de una catación nueva al agregado de su lugar. */
export interface TastingContribution {
  tastingId: string;
  normalizedScore: number;
  descriptors: readonly string[];
  notes: readonly string[];
  variety: string;
  process: string;
  method: string;
}

export class PlaceNotFoundError extends Error {
  constructor(readonly placeId: string) {
    super(`Lugar ${placeId} no encontrado`);
  }
}
