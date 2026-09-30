import { GeoPoint } from '../geo-point';
import { haversineKm } from '../haversine';

describe('haversineKm', () => {
  it.each`
    from                 | to                     | km       | tolerance
    ${[5.0689, -75.5174]} | ${[5.0689, -75.5174]} | ${0}     | ${1e-9}
    ${[5.0689, -75.5174]} | ${[5.0769, -75.5174]} | ${0.8896} | ${0.001}
    ${[4.711, -74.0721]}  | ${[6.2442, -75.5812]} | ${238.67} | ${0.01}
    ${[0, 0]}             | ${[0, 180]}           | ${20015.1} | ${0.5}
  `('$from → $to ≈ $km km', ({ from, to, km, tolerance }) => {
    const d = haversineKm(GeoPoint.of(from[0], from[1]), GeoPoint.of(to[0], to[1]));
    expect(Math.abs(d - km)).toBeLessThan(tolerance);
  });

  it('es simétrica', () => {
    const a = GeoPoint.of(5.07, -75.52);
    const b = GeoPoint.of(5.06, -75.5);
    expect(haversineKm(a, b)).toBeCloseTo(haversineKm(b, a), 12);
  });
});

describe('GeoPoint', () => {
  it.each([
    [91, 0],
    [-91, 0],
    [0, 181],
    [Number.NaN, 0],
  ])('rechaza (%p, %p)', (lat, lng) => {
    expect(() => GeoPoint.of(lat, lng)).toThrow(RangeError);
  });

  it('serializa a EWKT con orden lng lat', () => {
    expect(GeoPoint.of(5.1, -75.5).toEwkt()).toBe('SRID=4326;POINT(-75.5 5.1)');
  });
});
