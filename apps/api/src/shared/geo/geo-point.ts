/** Punto WGS84 (EPSG:4326). Inmutable y validado al construirse. */
export class GeoPoint {
  private constructor(
    readonly lat: number,
    readonly lng: number,
  ) {}

  static of(lat: number, lng: number): GeoPoint {
    if (!Number.isFinite(lat) || lat < -90 || lat > 90) throw new RangeError(`Latitud inválida: ${lat}`);
    if (!Number.isFinite(lng) || lng < -180 || lng > 180) throw new RangeError(`Longitud inválida: ${lng}`);
    return new GeoPoint(lat, lng);
  }

  /** Representación EWKT para PostGIS: `SRID=4326;POINT(lng lat)`. */
  toEwkt(): string {
    return `SRID=4326;POINT(${this.lng} ${this.lat})`;
  }

  toGeoJson(): { type: 'Point'; coordinates: [number, number] } {
    return { type: 'Point', coordinates: [this.lng, this.lat] };
  }
}
