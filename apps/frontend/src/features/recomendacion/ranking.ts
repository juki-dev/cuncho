import type { Coordenadas, Descriptor, Lugar } from '../../lib/api/types'
import { cajaAlrededor, dentroDeCaja, haversineKm } from '../../lib/haversine'
import { jaccard } from '../../lib/jaccard'

export interface PesosRanking {
  similitud: number
  distancia: number
  puntaje: number
}

/** S = 0.60·J + 0.25·(1 − d/R) + 0.15·(puntaje/100) */
export const PESOS_POR_DEFECTO: Readonly<PesosRanking> = { similitud: 0.6, distancia: 0.25, puntaje: 0.15 }

export interface OpcionesRanking {
  radioKm?: number
  pesos?: PesosRanking
}

export interface ResultadoRanking {
  lugar: Lugar
  distanciaKm: number
  similitud: number
  total: number
}

/**
 * Ranking local de lugares (modo offline y pruebas). Si el backend expone un
 * endpoint de recomendación, ese manda y esta función no se usa.
 */
export function rankear(
  lugares: readonly Lugar[],
  origen: Coordenadas,
  descriptores: readonly Descriptor[],
  { radioKm = 2.5, pesos = PESOS_POR_DEFECTO }: OpcionesRanking = {},
): ResultadoRanking[] {
  if (descriptores.length === 0) return []
  const caja = cajaAlrededor(origen, radioKm)
  const out: ResultadoRanking[] = []
  for (const lugar of lugares) {
    if (!dentroDeCaja(lugar, caja)) continue
    const distanciaKm = haversineKm(origen, lugar)
    if (distanciaKm > radioKm) continue
    const similitud = jaccard(descriptores, lugar.descriptores)
    if (similitud <= 0) continue
    const total =
      pesos.similitud * similitud +
      pesos.distancia * (1 - distanciaKm / radioKm) +
      pesos.puntaje * ((lugar.puntaje_promedio ?? 0) / 100)
    out.push({ lugar, distanciaKm, similitud, total })
  }
  return out.sort((a, b) => b.total - a.total || a.distanciaKm - b.distanciaKm)
}
