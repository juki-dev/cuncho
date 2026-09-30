import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { api } from './client'
import type { BBox, Coordenadas } from './types'
import { listarPendientes } from '../offline-queue'

export const claves = {
  lugares: (bbox: BBox | null) => ['lugares', bbox] as const,
  cercanos: (c: Coordenadas | null, radioKm: number) => ['lugares', 'cercanos', c, radioKm] as const,
  misCataciones: ['cataciones', 'mias'] as const,
  pendientes: ['cataciones', 'pendientes'] as const,
}

/** Redondea para que movimientos mínimos del mapa reutilicen la caché. */
const redondear = (n: number) => Math.round(n * 1000) / 1000

export function useLugaresEnCaja(bbox: BBox | null) {
  const key = bbox ? (bbox.map(redondear) as BBox) : null
  return useQuery({
    queryKey: claves.lugares(key),
    queryFn: ({ signal }) => api.lugaresEnCaja(key!, signal),
    enabled: key !== null,
    placeholderData: keepPreviousData,
    staleTime: 60_000,
  })
}

export function useLugaresCercanos(centro: Coordenadas | null, radioKm: number) {
  const key = centro ? { lat: redondear(centro.lat), lng: redondear(centro.lng) } : null
  return useQuery({
    queryKey: claves.cercanos(key, radioKm),
    queryFn: ({ signal }) => api.lugaresCercanos(key!, radioKm, signal),
    enabled: key !== null,
    placeholderData: keepPreviousData,
    staleTime: 60_000,
  })
}

export function useMisCataciones() {
  return useQuery({ queryKey: claves.misCataciones, queryFn: ({ signal }) => api.misCataciones(signal) })
}

export function usePendientes() {
  return useQuery({ queryKey: claves.pendientes, queryFn: listarPendientes, networkMode: 'always' })
}
