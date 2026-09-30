import type { Coordenadas } from './api/types'

export const RADIO_TIERRA_KM = 6371

const rad = (grados: number) => (grados * Math.PI) / 180

/** Distancia de círculo máximo entre dos puntos, en kilómetros. */
export function haversineKm(a: Coordenadas, b: Coordenadas): number {
  const dLat = rad(b.lat - a.lat)
  const dLng = rad(b.lng - a.lng)
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2
  return 2 * RADIO_TIERRA_KM * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h))
}

/**
 * Caja que contiene el círculo de radio `radioKm` alrededor de `centro`.
 * Sirve de pre-filtro barato antes de calcular Haversine.
 */
export function cajaAlrededor(centro: Coordenadas, radioKm: number) {
  const dLat = (radioKm / RADIO_TIERRA_KM) * (180 / Math.PI)
  const cosLat = Math.max(Math.cos(rad(centro.lat)), 1e-6)
  const dLng = dLat / cosLat
  return {
    sur: centro.lat - dLat,
    norte: centro.lat + dLat,
    oeste: centro.lng - dLng,
    este: centro.lng + dLng,
  }
}

export function dentroDeCaja(p: Coordenadas, caja: ReturnType<typeof cajaAlrededor>): boolean {
  return p.lat >= caja.sur && p.lat <= caja.norte && p.lng >= caja.oeste && p.lng <= caja.este
}
