import { get, update } from 'idb-keyval'
import { api, NetworkError } from './api/client'
import type { Catacion, NuevaCatacion } from './api/types'

const CLAVE = 'cola-cataciones'

export interface Pendiente {
  id: string
  payload: NuevaCatacion
  encolado_en: string
  intentos: number
  ultimo_error?: string
}

type Enviar = (payload: NuevaCatacion) => Promise<unknown>

export async function listarPendientes(): Promise<Pendiente[]> {
  return (await get<Pendiente[]>(CLAVE)) ?? []
}

export async function encolar(payload: NuevaCatacion): Promise<Pendiente> {
  const item: Pendiente = {
    id: `pend_${crypto.randomUUID()}`,
    // El UUID de la catación viaja con ella: si el envío se repite, el servidor no la duplica.
    payload: { ...payload, id: payload.id ?? crypto.randomUUID() },
    encolado_en: new Date().toISOString(),
    intentos: 0,
  }
  await update<Pendiente[]>(CLAVE, (cola = []) => [...cola, item])
  return item
}

async function quitar(id: string) {
  await update<Pendiente[]>(CLAVE, (cola = []) => cola.filter((p) => p.id !== id))
}

async function marcarFallo(id: string, error: string) {
  await update<Pendiente[]>(CLAVE, (cola = []) =>
    cola.map((p) => (p.id === id ? { ...p, intentos: p.intentos + 1, ultimo_error: error } : p)),
  )
}

let enCurso: Promise<{ enviadas: number; restantes: number }> | null = null

/**
 * Envía la cola en orden. Si falla la red se detiene (se reintenta luego);
 * si el servidor rechaza una catación, queda marcada y se sigue con las demás.
 * Llamadas concurrentes comparten la misma ejecución.
 */
export function procesarCola(enviar: Enviar = api.crearCatacion) {
  enCurso ??= (async () => {
    let enviadas = 0
    try {
      for (const item of await listarPendientes()) {
        try {
          await enviar(item.payload)
          await quitar(item.id)
          enviadas++
        } catch (e) {
          if (e instanceof NetworkError) break
          await marcarFallo(item.id, e instanceof Error ? e.message : String(e))
        }
      }
      return { enviadas, restantes: (await listarPendientes()).length }
    } finally {
      enCurso = null
    }
  })()
  return enCurso
}

export type ResultadoGuardado =
  | { estado: 'enviada'; catacion: Catacion }
  | { estado: 'pendiente'; pendiente: Pendiente }

/** Intenta enviar; sin conexión (o si la red falla) la catación queda en cola. */
export async function guardarCatacion(
  payload: NuevaCatacion,
  enviar: (p: NuevaCatacion) => Promise<Catacion> = api.crearCatacion,
): Promise<ResultadoGuardado> {
  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    return { estado: 'pendiente', pendiente: await encolar(payload) }
  }
  const conId = { ...payload, id: payload.id ?? crypto.randomUUID() }
  try {
    return { estado: 'enviada', catacion: await enviar(conId) }
  } catch (e) {
    if (e instanceof NetworkError) return { estado: 'pendiente', pendiente: await encolar(conId) }
    throw e
  }
}
