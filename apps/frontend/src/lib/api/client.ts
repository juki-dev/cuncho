import type { BBox, Catacion, Coordenadas, Lugar, LugarCercano, NuevaCatacion } from './types'

const API_URL = (import.meta.env.VITE_API_URL ?? '/api').replace(/\/$/, '')

/** El servidor respondió con un código de error. */
export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

/** No hubo respuesta (sin conexión, DNS, CORS, timeout). */
export class NetworkError extends Error {
  constructor(cause?: unknown) {
    super('Sin conexión con el servidor', { cause })
    this.name = 'NetworkError'
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response
  try {
    res = await fetch(`${API_URL}${path}`, {
      ...init,
      headers: { Accept: 'application/json', ...(init?.body ? { 'Content-Type': 'application/json' } : {}), ...init?.headers },
    })
  } catch (e) {
    if (e instanceof DOMException && e.name === 'AbortError') throw e
    throw new NetworkError(e)
  }
  if (!res.ok) {
    const texto = await res.text().catch(() => '')
    throw new ApiError(res.status, texto || res.statusText)
  }
  return (await res.json()) as T
}

const qs = (params: Record<string, string | number>) =>
  new URLSearchParams(Object.entries(params).map(([k, v]) => [k, String(v)])).toString()

/*
 * SUPUESTO: endpoints propuestos por el frontend; el contrato real de Nest.js
 * aún no existe. Ver src/mocks/handlers.ts.
 */
export const api = {
  lugaresEnCaja: (bbox: BBox, signal?: AbortSignal) =>
    request<Lugar[]>(`/lugares?${qs({ bbox: bbox.join(',') })}`, { signal }),

  lugaresCercanos: (centro: Coordenadas, radioKm: number, signal?: AbortSignal) =>
    request<LugarCercano[]>(`/lugares/cercanos?${qs({ lat: centro.lat, lng: centro.lng, radio_km: radioKm })}`, {
      signal,
    }),

  misCataciones: (signal?: AbortSignal) => request<Catacion[]>('/cataciones/mias', { signal }),

  crearCatacion: (payload: NuevaCatacion) =>
    request<Catacion>('/cataciones', { method: 'POST', body: JSON.stringify(payload) }),
}
