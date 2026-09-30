import { describe, expect, it } from 'vitest'
import type { Lugar } from '../../lib/api/types'
import { lugaresFixture } from '../../mocks/fixtures'
import { PESOS_POR_DEFECTO, rankear } from './ranking'

const origen = { lat: 5.0689, lng: -75.5174 }

describe('rankear', () => {
  it('ordena por S = 0.60·J + 0.25·(1 − d/R) + 0.15·(p/100)', () => {
    const r = rankear(lugaresFixture, origen, ['frutal', 'floral'])
    expect(r.map((x) => x.lugar.id)).toEqual(['loc_origen', 'loc_laureles', 'loc_cable'])
    const primero = r[0]!
    const esperado =
      0.6 * primero.similitud + 0.25 * (1 - primero.distanciaKm / 2.5) + 0.15 * (primero.lugar.puntaje_promedio! / 100)
    expect(primero.total).toBeCloseTo(esperado, 10)
  })

  it('solo incluye lugares con J > 0', () => {
    const r = rankear(lugaresFixture, origen, ['chocolate'])
    expect(r.map((x) => x.lugar.id)).toEqual(['loc_mesa'])
    expect(r.every((x) => x.similitud > 0)).toBe(true)
  })

  it('descarta lugares fuera del radio', () => {
    const lejos: Lugar = { ...lugaresFixture[0]!, id: 'lejos', lat: 6.2442, lng: -75.5812 }
    expect(rankear([lejos], origen, ['frutal'])).toEqual([])
    expect(rankear(lugaresFixture, origen, ['frutal'], { radioKm: 0.5 }).map((x) => x.lugar.id)).toEqual(['loc_origen'])
  })

  it('devuelve vacío sin descriptores', () => {
    expect(rankear(lugaresFixture, origen, [])).toEqual([])
  })

  it('acepta pesos configurables', () => {
    const soloPuntaje = { similitud: 0, distancia: 0, puntaje: 1 }
    const r = rankear(lugaresFixture, origen, ['frutal', 'dulce', 'chocolate', 'floral'], { pesos: soloPuntaje })
    expect(r.map((x) => x.lugar.puntaje_promedio)).toEqual([92, 89, 86, 84])
    expect(PESOS_POR_DEFECTO).toEqual({ similitud: 0.6, distancia: 0.25, puntaje: 0.15 })
  })

  it('trata puntaje nulo como 0', () => {
    const sinPuntaje: Lugar = { ...lugaresFixture[0]!, id: 'x', puntaje_promedio: null }
    expect(rankear([sinPuntaje], origen, ['frutal'])[0]!.total).toBeGreaterThan(0)
  })
})
