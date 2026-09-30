import type { Coordenadas } from './api/types'

function parseCentro(valor: string | undefined): Coordenadas {
  const [lat, lng] = (valor ?? '').split(',').map(Number)
  if (lat !== undefined && lng !== undefined && Number.isFinite(lat) && Number.isFinite(lng)) return { lat, lng }
  return { lat: 4.6097, lng: -74.0817 } // Bogotá
}

/** Centro del mapa cuando no hay GPS. */
export const CENTRO_POR_DEFECTO = parseCentro(import.meta.env.VITE_MAP_DEFAULT_CENTER)

/** Radio de búsqueda de recomendaciones (km). */
export const RADIO_RECOMENDACION_KM = 2.5
/** Radio para listar cafeterías cercanas en el paso 1 (km). */
export const RADIO_CERCANAS_KM = 2.5
/** A menos de esta distancia se considera que el usuario está en el lugar. */
export const UMBRAL_DETECTADO_KM = 0.1
