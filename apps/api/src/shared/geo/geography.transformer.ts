import { ValueTransformer } from 'typeorm';
import { GeoPoint } from './geo-point';

interface GeoJsonPoint {
  type: 'Point';
  coordinates: [number, number];
}

/**
 * Convierte columnas `geography(Point, 4326)` a GeoPoint y viceversa.
 * El driver de Postgres de TypeORM lee las columnas espaciales como GeoJSON
 * (usa ST_AsGeoJSON) y escribe con ST_GeomFromGeoJSON.
 */
export const geographyPointTransformer: ValueTransformer = {
  to: (value: GeoPoint | null | undefined): GeoJsonPoint | null | undefined =>
    value == null ? value : value.toGeoJson(),
  from: (value: GeoJsonPoint | string | null): GeoPoint | null => {
    if (value == null) return null;
    const geo: GeoJsonPoint = typeof value === 'string' ? (JSON.parse(value) as GeoJsonPoint) : value;
    const [lng, lat] = geo.coordinates;
    return GeoPoint.of(lat, lng);
  },
};
