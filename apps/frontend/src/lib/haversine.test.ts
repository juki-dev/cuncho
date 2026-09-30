import { describe, expect, it } from 'vitest'
import { cajaAlrededor, dentroDeCaja, haversineKm } from './haversine'

describe('haversineKm', () => {
  it('es 0 para el mismo punto', () => {
    expect(haversineKm({ lat: 5.0689, lng: -75.5174 }, { lat: 5.0689, lng: -75.5174 })).toBe(0)
  })

  it('calcula Bogotá–Medellín ≈ 240 km', () => {
    const d = haversineKm({ lat: 4.711, lng: -74.0721 }, { lat: 6.2442, lng: -75.5812 })
    expect(d).toBeGreaterThan(235)
    expect(d).toBeLessThan(245)
  })

  it('un grado de latitud ≈ 111.19 km (R = 6371)', () => {
    expect(haversineKm({ lat: 0, lng: 0 }, { lat: 1, lng: 0 })).toBeCloseTo(111.195, 2)
  })

  it('es simétrica', () => {
    const a = { lat: 5.07, lng: -75.52 }
    const b = { lat: 5.06, lng: -75.5 }
    expect(haversineKm(a, b)).toBeCloseTo(haversineKm(b, a), 10)
  })
})

describe('cajaAlrededor', () => {
  it('contiene todos los puntos dentro del radio', () => {
    const centro = { lat: 5.0689, lng: -75.5174 }
    const caja = cajaAlrededor(centro, 2.5)
    for (let ang = 0; ang < 360; ang += 15) {
      const r = (ang * Math.PI) / 180
      const p = { lat: centro.lat + 0.0224 * Math.cos(r), lng: centro.lng + 0.0224 * Math.sin(r) }
      if (haversineKm(centro, p) <= 2.5) expect(dentroDeCaja(p, caja)).toBe(true)
    }
  })

  it('excluye puntos lejanos', () => {
    expect(dentroDeCaja({ lat: 6.2, lng: -75.5 }, cajaAlrededor({ lat: 5.0689, lng: -75.5174 }, 2.5))).toBe(false)
  })
})
