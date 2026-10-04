import { useSesion } from '../auth/session'
import type { BBox, Catacion, Coordenadas, Descriptor, Lugar, LugarCercano, Metodo, NuevaCatacion, Proceso, Sesion } from './types'

const API_URL = (import.meta.env.VITE_API_URL ?? '/api').replace(/\/$/, '')

/** El servidor respondió con un código de error. */
export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
    readonly details?: unknown,
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

interface Opciones extends RequestInit {
  /** false = no envía el token ni intenta renovarlo (login, registro, refresh). */
  auth?: boolean
}

async function enviar(path: string, init: Opciones, token: string | null): Promise<Response> {
  const resto: RequestInit = { ...init }
  delete (resto as Opciones).auth
  try {
    return await fetch(`${API_URL}${path}`, {
      ...resto,
      headers: {
        Accept: 'application/json',
        ...(resto.body ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...resto.headers,
      },
    })
  } catch (e) {
    if (e instanceof DOMException && e.name === 'AbortError') throw e
    throw new NetworkError(e)
  }
}

/** Una sola renovación a la vez: las peticiones que reciben 401 a la vez comparten el resultado. */
let renovando: Promise<string | null> | null = null

function renovarToken(): Promise<string | null> {
  renovando ??= (async () => {
    const { refreshToken, iniciar, limpiar } = useSesion.getState()
    if (!refreshToken) return null
    try {
      const res = await enviar('/auth/refresh', { method: 'POST', body: JSON.stringify({ refresh_token: refreshToken }) }, null)
      if (!res.ok) {
        // El refresh token es de un solo uso: si el servidor lo rechaza, la sesión terminó.
        if (res.status === 401 || res.status === 400) limpiar()
        return null
      }
      const s = (await res.json()) as Sesion
      iniciar({ accessToken: s.access_token, refreshToken: s.refresh_token, usuario: s.usuario })
      return s.access_token
    } catch {
      return null // sin red: no se cierra la sesión
    } finally {
      renovando = null
    }
  })()
  return renovando
}

async function errorDe(res: Response): Promise<ApiError> {
  const texto = await res.text().catch(() => '')
  try {
    const j = JSON.parse(texto) as { message?: string; details?: unknown }
    return new ApiError(res.status, j.message ?? (res.statusText || texto), j.details)
  } catch {
    return new ApiError(res.status, texto || res.statusText)
  }
}

async function request<T>(path: string, init: Opciones = {}): Promise<T> {
  const conAuth = init.auth !== false
  let res = await enviar(path, init, conAuth ? useSesion.getState().accessToken : null)
  if (res.status === 401 && conAuth && useSesion.getState().refreshToken) {
    const nuevo = await renovarToken()
    if (nuevo) res = await enviar(path, init, nuevo)
  }
  if (!res.ok) throw await errorDe(res)
  return res.status === 204 ? (undefined as T) : ((await res.json()) as T)
}

const qs = (params: Record<string, string | number>) =>
  new URLSearchParams(Object.entries(params).map(([k, v]) => [k, String(v)])).toString()

// ---- Contrato real de la API (ver los *.dto.ts de apps/api/src/domains) ----

interface PlaceDto {
  id: string
  nombre: string
  lat: number
  lng: number
  puntaje_promedio: number | null
  total_cataciones: number
  descriptores: string[]
  destacada: { variedad: string; proceso: string; metodo: string; notas: string[] } | null
}
interface NearbyPlaceDto extends PlaceDto {
  distancia_m: number
}
interface TastingDto {
  id: string
  usuario_id: string
  creado_en: string
  lugar: { id: string; nombre: string; lat: number; lng: number }
  grano: { variedad: string; finca: string | null; region: string | null; proceso: string; metodo: string }
  sensorial: Catacion['sensorial'] & { puntaje_normalizado?: number }
}
interface TastingPageDto {
  items: TastingDto[]
  siguiente_cursor: string | null
}

const aLugar = (p: PlaceDto): Lugar => ({
  id: p.id,
  nombre: p.nombre,
  lat: p.lat,
  lng: p.lng,
  puntaje_promedio: p.puntaje_promedio,
  total_cataciones: p.total_cataciones,
  descriptores: p.descriptores as Descriptor[],
  destacada: p.destacada && {
    variedad: p.destacada.variedad,
    proceso: p.destacada.proceso as Proceso,
    metodo: p.destacada.metodo as Metodo,
    notas: p.destacada.notas,
  },
})

const aCatacion = (t: TastingDto): Catacion => ({
  id: t.id,
  usuario_id: t.usuario_id,
  creado_en: t.creado_en,
  lugar: t.lugar,
  grano: { ...t.grano, finca: t.grano.finca ?? '', region: t.grano.region ?? '', proceso: t.grano.proceso as Proceso, metodo: t.grano.metodo as Metodo },
  sensorial: t.sensorial,
})

/** Máximo de páginas de la bitácora que se piden de una vez (50 cataciones por página). */
const MAX_PAGINAS_BITACORA = 10

/** Crea el lugar; si el servidor detecta un duplicado cercano (409) usa el existente. */
async function crearLugar(l: { nombre: string; lat: number; lng: number }): Promise<string> {
  try {
    return (await request<PlaceDto>('/places', { method: 'POST', body: JSON.stringify(l) })).id
  } catch (e) {
    const existente = e instanceof ApiError && e.status === 409 ? (e.details as { lugar_existente?: { id?: string } } | undefined)?.lugar_existente?.id : undefined
    if (existente) return existente
    throw e
  }
}

export const api = {
  lugaresEnCaja: async (bbox: BBox, signal?: AbortSignal): Promise<Lugar[]> =>
    (await request<PlaceDto[]>(`/places?${qs({ bbox: bbox.join(',') })}`, { signal })).map(aLugar),

  lugaresCercanos: async (centro: Coordenadas, radioKm: number, signal?: AbortSignal): Promise<LugarCercano[]> => {
    const lista = await request<NearbyPlaceDto[]>(`/places/nearby?${qs({ lat: centro.lat, lng: centro.lng, radius: radioKm })}`, { signal })
    return lista.map((p) => ({ ...aLugar(p), distancia_km: p.distancia_m / 1000 }))
  },

  misCataciones: async (signal?: AbortSignal): Promise<Catacion[]> => {
    const out: Catacion[] = []
    let cursor: string | null = null
    for (let i = 0; i < MAX_PAGINAS_BITACORA; i++) {
      const pagina: TastingPageDto = await request<TastingPageDto>(`/tastings/me?${qs({ limit: 50, ...(cursor ? { cursor } : {}) })}`, { signal })
      out.push(...pagina.items.map(aCatacion))
      cursor = pagina.siguiente_cursor
      if (!cursor) break
    }
    return out
  },

  catacion: async (id: string, signal?: AbortSignal): Promise<Catacion> =>
    aCatacion(await request<TastingDto>(`/tastings/${encodeURIComponent(id)}`, { signal })),

  crearCatacion: async (payload: NuevaCatacion): Promise<Catacion> => {
    const lugarId = payload.lugar.id ?? (await crearLugar(payload.lugar))
    const { finca, region, ...grano } = payload.grano
    // El servidor deriva los descriptores de las notas: no se envían.
    const { acidez, notas, puntaje, escala } = payload.sensorial
    const t = await request<TastingDto>('/tastings', {
      method: 'POST',
      body: JSON.stringify({
        id: payload.id,
        creado_en: payload.creado_en,
        lugar: { id: lugarId },
        grano: { ...grano, ...(finca ? { finca } : {}), ...(region ? { region } : {}) },
        sensorial: { acidez, notas, puntaje, escala },
      }),
    })
    return aCatacion(t)
  },

  registrar: (datos: { email: string; password: string; nombre: string }) =>
    request<Sesion>('/auth/register', { method: 'POST', body: JSON.stringify(datos), auth: false }),

  iniciarSesion: (datos: { email: string; password: string }) =>
    request<Sesion>('/auth/login', { method: 'POST', body: JSON.stringify(datos), auth: false }),

  /** Canjea el ID token de Cognito (Google) por los tokens de la API. */
  iniciarConGoogle: (idToken: string) =>
    request<Sesion>('/auth/cognito', { method: 'POST', body: JSON.stringify({ id_token: idToken }), auth: false }),

  cerrarSesion: (refreshToken: string) =>
    request<void>('/auth/logout', { method: 'POST', body: JSON.stringify({ refresh_token: refreshToken }), auth: false }),
}
