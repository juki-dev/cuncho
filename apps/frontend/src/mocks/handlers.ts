import { delay, http, HttpResponse } from 'msw'
import type { Catacion, Lugar, LugarCercano, NuevaCatacion } from '../lib/api/types'
import { haversineKm } from '../lib/haversine'
import { catacionesFixture, lugaresFixture, USUARIO_DEMO } from './fixtures'

/**
 * SUPUESTO: contrato propuesto por el frontend mientras no exista la API Nest.js.
 *   GET  /lugares?bbox=oeste,sur,este,norte      → Lugar[]
 *   GET  /lugares/cercanos?lat&lng&radio_km        → LugarCercano[]
 *   GET  /cataciones/mias                          → Catacion[]
 *   POST /cataciones   (NuevaCatacion)             → Catacion
 */
const API = (import.meta.env.VITE_API_URL ?? '/api').replace(/\/$/, '')

export function crearHandlers() {
  const lugares: Lugar[] = structuredClone(lugaresFixture)
  const cataciones: Catacion[] = structuredClone(catacionesFixture)
  let seq = 200

  return [
    http.get(`${API}/lugares`, async ({ request }) => {
      await delay(250)
      const bbox = new URL(request.url).searchParams.get('bbox')?.split(',').map(Number)
      if (!bbox || bbox.length !== 4 || bbox.some((n) => !Number.isFinite(n))) {
        return HttpResponse.json({ message: 'bbox inválido' }, { status: 400 })
      }
      const [oeste, sur, este, norte] = bbox as [number, number, number, number]
      return HttpResponse.json(lugares.filter((l) => l.lng >= oeste && l.lng <= este && l.lat >= sur && l.lat <= norte))
    }),

    http.get(`${API}/lugares/cercanos`, async ({ request }) => {
      await delay(250)
      const p = new URL(request.url).searchParams
      const centro = { lat: Number(p.get('lat')), lng: Number(p.get('lng')) }
      const radio = Number(p.get('radio_km') ?? 2.5)
      const out: LugarCercano[] = lugares
        .map((l) => ({ ...l, distancia_km: haversineKm(centro, l) }))
        .filter((l) => l.distancia_km <= radio)
        .sort((a, b) => a.distancia_km - b.distancia_km)
      return HttpResponse.json(out)
    }),

    http.get(`${API}/cataciones/mias`, async () => {
      await delay(250)
      return HttpResponse.json(cataciones.filter((c) => c.usuario_id === USUARIO_DEMO))
    }),

    http.post(`${API}/cataciones`, async ({ request }) => {
      await delay(400)
      const body = (await request.json()) as NuevaCatacion
      let lugarId = body.lugar.id
      if (!lugarId) {
        lugarId = `loc_${++seq}`
        lugares.push({
          id: lugarId,
          nombre: body.lugar.nombre,
          lat: body.lugar.lat,
          lng: body.lugar.lng,
          puntaje_promedio: null,
          total_cataciones: 0,
          descriptores: [],
          destacada: null,
        })
      }
      const catacion: Catacion = {
        ...body,
        id: `cat_${++seq}`,
        usuario_id: USUARIO_DEMO,
        lugar: { ...body.lugar, id: lugarId },
      }
      cataciones.push(catacion)

      // Recalcula el agregado del lugar (solo puntajes SCA cuentan para el promedio).
      const lugar = lugares.find((l) => l.id === lugarId)!
      const delLugar = cataciones.filter((c) => c.lugar.id === lugarId)
      const sca = delLugar.filter((c) => c.sensorial.escala === 'SCA').map((c) => c.sensorial.puntaje)
      lugar.total_cataciones = Math.max(lugar.total_cataciones + 1, delLugar.length)
      if (sca.length) lugar.puntaje_promedio = sca.reduce((a, b) => a + b, 0) / sca.length
      lugar.descriptores = [...new Set([...lugar.descriptores, ...body.sensorial.descriptores])]
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
