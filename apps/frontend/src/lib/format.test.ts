import { describe, expect, it } from 'vitest'
import { formatearCoordenadas, formatearDistancia, formatearFechaCorta, formatearPuntaje, minutosAPie } from './format'

describe('format', () => {
  it('distancia en m o km', () => {
    expect(formatearDistancia(0.4)).toBe('400 m')
    expect(formatearDistancia(1.63)).toBe('1.6 km')
  })
  it('minutos a pie (mínimo 1)', () => {
    expect(minutosAPie(0.01)).toBe('1 min')
    expect(minutosAPie(0.9)).toBe('11 min')
  })
  it('fecha corta', () => {
    expect(formatearFechaCorta('2026-09-28T12:00:00')).toBe('28 sep')
  })
  it('puntaje sin ceros de sobra', () => {
    expect(formatearPuntaje(92)).toBe('92')
    expect(formatearPuntaje(88.5)).toBe('88.5')
    expect(formatearPuntaje(87.75)).toBe('87.75')
  })
  it('coordenadas con hemisferio', () => {
    expect(formatearCoordenadas(5.0689, -75.5174)).toBe('5.0689° N, 75.5174° O')
  })
})
