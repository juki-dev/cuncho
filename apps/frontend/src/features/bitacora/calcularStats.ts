import type { NuevaCatacion } from '../../lib/api/types'

/** Totales de la bitácora; el promedio solo considera puntajes en escala SCA. */
export function calcularStats(cataciones: readonly Pick<NuevaCatacion, 'lugar' | 'sensorial'>[]) {
  const sca = cataciones.filter((c) => c.sensorial.escala === 'SCA').map((c) => c.sensorial.puntaje)
  const promedio = sca.length ? sca.reduce((a, b) => a + b, 0) / sca.length : null
  const lugares = new Set(cataciones.map((c) => c.lugar.id ?? `nuevo:${c.lugar.nombre}`))
  return { total: cataciones.length, promedioSca: promedio, cafeterias: lugares.size }
}
