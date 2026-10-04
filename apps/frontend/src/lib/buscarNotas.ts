import { NOTAS_POPULARES, plegar } from './catalogo'
import { NOTAS_CAFE, type NotaCafe } from './notasCafe'

/** Cuántas coincidencias se muestran como máximo. */
export const MAX_RESULTADOS = 10

export interface ResultadoBusqueda {
  /** Las mejores coincidencias (hasta MAX_RESULTADOS), de más a menos relevante. */
  resultados: NotaCafe[]
  /** Total de coincidencias antes de recortar. */
  total: number
}

const POPULARES = NOTAS_POPULARES.flatMap((nombre) => NOTAS_CAFE.filter((n) => n.nombre === nombre))
const INDICE = NOTAS_CAFE.map((nota) => ({ nota, nombre: plegar(nota.nombre), familia: plegar(nota.familia) }))

/**
 * Relevancia de una nota para una consulta ya plegada (0 = no coincide):
 * nombre exacto > empieza por > una palabra empieza por > contiene > todas las palabras > familia.
 */
function puntaje(nombre: string, familia: string, q: string, palabras: string[]): number {
  if (nombre === q) return 100
  if (nombre.startsWith(q)) return 80
  if (nombre.split(' ').some((p) => p.startsWith(q))) return 60
  if (nombre.includes(q)) return 40
  if (palabras.length > 1 && palabras.every((p) => nombre.includes(p) || familia.includes(p))) return 30
  if (familia.includes(q)) return 15
  return 0
}

/**
 * Busca en la rueda de sabores sin distinguir tildes ni mayúsculas ("jazmin" encuentra "Jazmín").
 * Con la consulta vacía devuelve las sugerencias populares.
 */
export function buscarNotas(consulta: string, limite = MAX_RESULTADOS): ResultadoBusqueda {
  const q = plegar(consulta)
  if (!q) return { resultados: POPULARES.slice(0, limite), total: POPULARES.length }

  const palabras = q.split(' ')
  const coincidencias = INDICE.map((e) => ({ nota: e.nota, p: puntaje(e.nombre, e.familia, q, palabras), largo: e.nombre.length }))
    .filter((c) => c.p > 0)
    .sort((a, b) => b.p - a.p || a.largo - b.largo || a.nota.nombre.localeCompare(b.nota.nombre, 'es'))
  return { resultados: coincidencias.slice(0, limite).map((c) => c.nota), total: coincidencias.length }
}
