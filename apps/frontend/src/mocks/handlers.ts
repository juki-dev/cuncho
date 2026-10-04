import { delay, http, HttpResponse } from 'msw'
import type { Catacion, Lugar, NuevaCatacion } from '../lib/api/types'
import { descriptoresDeNotas } from '../lib/catalogo'
import { haversineKm } from '../lib/haversine'
import { catacionesFixture, lugaresFixture, USUARIO_DEMO } from './fixtures'

/**
 * Imita el contrato real de la API Nest.js (apps/api):
 *   GET  /places?bbox=oeste,sur,este,norte          → Lugar[]            (público)
 *   GET  /places/nearby?lat&lng&radius(km)           → Lugar[] + distancia_m
 *   POST /places  {nombre,lat,lng}                   → Lugar
 *   GET  /tastings/me?limit&cursor                   → { items, siguiente_cursor }
 *   POST /tastings (lugar.id obligatorio)            → Catacion (200 si el id ya existía)
 *   POST /auth/login | /auth/register | /auth/refresh | /auth/logout
 * No valida el token: con mocks el frontend arranca con una sesión demo.
 */
const API = (import.meta.env.VITE_API_URL ?? '/api').replace(/\/$/, '')

export function crearHandlers() {
  const lugares: Lugar[] = structuredClone(lugaresFixture)
  const cataciones: Catacion[] = structuredClone(catacionesFixture)
  let seq = 200

  const dtoLugar = (l: Lugar) => ({ ...l, destacada: l.destacada && { ...l.destacada, puntaje: l.puntaje_promedio ?? 0 } })
  const sesion = (nombre = 'Demo', email = 'demo@cuncho.co') => ({
    access_token: 'demo',
    refresh_token: 'demo-refresh-token-0000',
    expires_in: 900,
    token_type: 'Bearer',
    usuario: { id: USUARIO_DEMO, email, nombre },
  })

  return [
    http.post(`${API}/auth/login`, async ({ request }) => {
      const { email } = (await request.json()) as { email: string }
      return HttpResponse.json(sesion('Demo', email))
    }),
    http.post(`${API}/auth/register`, async ({ request }) => {
      const { email, nombre } = (await request.json()) as { email: string; nombre: string }
      return HttpResponse.json(sesion(nombre, email), { status: 201 })
    }),
    http.post(`${API}/auth/refresh`, () => HttpResponse.json(sesion())),
    http.post(`${API}/auth/logout`, () => new HttpResponse(null, { status: 204 })),

    http.get(`${API}/places`, async ({ request }) => {
      await delay(250)
      const bbox = new URL(request.url).searchParams.get('bbox')?.split(',').map(Number)
      if (!bbox || bbox.length !== 4 || bbox.some((n) => !Number.isFinite(n))) {
        return HttpResponse.json({ statusCode: 400, error: 'Bad Request', message: 'bbox inválido' }, { status: 400 })
      }
      const [oeste, sur, este, norte] = bbox as [number, number, number, number]
      return HttpResponse.json(
        lugares.filter((l) => l.lng >= oeste && l.lng <= este && l.lat >= sur && l.lat <= norte).map(dtoLugar),
      )
    }),

    http.get(`${API}/places/nearby`, async ({ request }) => {
      await delay(250)
      const p = new URL(request.url).searchParams
      const centro = { lat: Number(p.get('lat')), lng: Number(p.get('lng')) }
      const radio = Number(p.get('radius') ?? 1)
      const out = lugares
        .map((l) => ({ ...dtoLugar(l), distancia_m: Math.round(haversineKm(centro, l) * 1000) }))
        .filter((l) => l.distancia_m <= radio * 1000)
        .sort((a, b) => a.distancia_m - b.distancia_m)
      return HttpResponse.json(out)
    }),

    http.post(`${API}/places`, async ({ request }) => {
      await delay(250)
      const body = (await request.json()) as { nombre: string; lat: number; lng: number }
      const lugar: Lugar = {
        id: `loc_${++seq}`,
        nombre: body.nombre,
        lat: body.lat,
        lng: body.lng,
        puntaje_promedio: null,
        total_cataciones: 0,
        descriptores: [],
        destacada: null,
      }
      lugares.push(lugar)
      return HttpResponse.json(dtoLugar(lugar), { status: 201 })
    }),

    http.get(`${API}/tastings/me`, async () => {
      await delay(250)
      return HttpResponse.json({
        items: cataciones.filter((c) => c.usuario_id === USUARIO_DEMO),
        siguiente_cursor: null,
      })
    }),

    http.post(`${API}/tastings`, async ({ request }) => {
      await delay(400)
      const body = (await request.json()) as Omit<NuevaCatacion, 'lugar'> & { lugar: { id: string } }
      const existente = body.id ? cataciones.find((c) => c.id === body.id) : undefined
      if (existente) return HttpResponse.json(existente, { status: 200 })

      const lugar = lugares.find((l) => l.id === body.lugar.id)
      if (!lugar) return HttpResponse.json({ statusCode: 404, error: 'Not Found', message: 'Lugar no encontrado' }, { status: 404 })

      // Como el servidor, deriva los descriptores de las notas.
      const descriptores = descriptoresDeNotas(body.sensorial.notas)
      const catacion: Catacion = {
        id: body.id ?? `cat_${++seq}`,
        usuario_id: USUARIO_DEMO,
        creado_en: body.creado_en,
        lugar: { id: lugar.id, nombre: lugar.nombre, lat: lugar.lat, lng: lugar.lng },
        grano: { ...body.grano, finca: body.grano.finca ?? '', region: body.grano.region ?? '' },
        sensorial: { ...body.sensorial, descriptores },
      }
      cataciones.push(catacion)

      // Recalcula el agregado del lugar (solo puntajes SCA cuentan para el promedio).
      const delLugar = cataciones.filter((c) => c.lugar.id === lugar.id)
      const sca = delLugar.filter((c) => c.sensorial.escala === 'SCA').map((c) => c.sensorial.puntaje)
      lugar.total_cataciones = Math.max(lugar.total_cataciones + 1, delLugar.length)
      if (sca.length) lugar.puntaje_promedio = sca.reduce((a, b) => a + b, 0) / sca.length
      lugar.descriptores = [...new Set([...lugar.descriptores, ...descriptores])]
      lugar.destacada ??= {
        variedad: body.grano.variedad,
        proceso: body.grano.proceso,
        metodo: body.grano.metodo,
        notas: body.sensorial.notas,
      }
      return HttpResponse.json(catacion, { status: 201 })
    }),
  ]
}
