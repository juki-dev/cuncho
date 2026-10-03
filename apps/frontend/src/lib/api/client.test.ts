import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'
import { api } from './client'
import type { NuevaCatacion } from './types'

const API = 'http://localhost/api'
const server = setupServer()
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

const place = { id: 'p1', nombre: 'Origen', lat: 5.07, lng: -75.51, puntaje_promedio: 90, total_cataciones: 1, descriptores: ['frutal'], destacada: null }

const nueva = (lugar: NuevaCatacion['lugar']): NuevaCatacion => ({
  id: '11111111-1111-4111-8111-111111111111',
  creado_en: '2026-10-01T10:00:00-05:00',
  lugar,
  grano: { variedad: 'Geisha', finca: '', region: 'Huila', proceso: 'Lavado', metodo: 'V60' },
  sensorial: { acidez: { nivel: 3, tipo: 'Cítrica' }, notas: ['Jazmín'], descriptores: ['floral'], puntaje: 90, escala: 'SCA' },
})

describe('api: lugares', () => {
  it('lugaresEnCaja pide /places?bbox', async () => {
    let url = ''
    server.use(http.get(`${API}/places`, ({ request }) => ((url = request.url), HttpResponse.json([place]))))
    const r = await api.lugaresEnCaja([-75.53, 5.06, -75.5, 5.08])
    expect(new URL(url).searchParams.get('bbox')).toBe('-75.53,5.06,-75.5,5.08')
    expect(r[0]).toMatchObject({ id: 'p1', nombre: 'Origen' })
  })

  it('lugaresCercanos usa radius y convierte distancia_m a distancia_km', async () => {
    let q: URLSearchParams | undefined
    server.use(
      http.get(`${API}/places/nearby`, ({ request }) => {
        q = new URL(request.url).searchParams
        return HttpResponse.json([{ ...place, distancia_m: 420 }])
      }),
    )
    const r = await api.lugaresCercanos({ lat: 5.07, lng: -75.51 }, 2.5)
    expect(q?.get('radius')).toBe('2.5')
    expect(q?.has('radio_km')).toBe(false)
    expect(r[0]?.distancia_km).toBeCloseTo(0.42)
  })
})

describe('api: bitácora', () => {
  it('recorre las páginas por cursor y normaliza finca/región nulas', async () => {
    const t = (id: string) => ({
      id,
      usuario_id: 'u1',
      creado_en: '2026-10-01T10:00:00.000Z',
      lugar: { id: 'p1', nombre: 'Origen', lat: 5.07, lng: -75.51 },
      grano: { variedad: 'Geisha', finca: null, region: null, proceso: 'Lavado', metodo: 'V60' },
      sensorial: { acidez: { nivel: 3, tipo: 'Cítrica' }, notas: ['Jazmín'], descriptores: ['floral'], puntaje: 90, escala: 'SCA', puntaje_normalizado: 90 },
    })
    server.use(
      http.get(`${API}/tastings/me`, ({ request }) =>
        new URL(request.url).searchParams.get('cursor') === 'c2'
          ? HttpResponse.json({ items: [t('b')], siguiente_cursor: null })
          : HttpResponse.json({ items: [t('a')], siguiente_cursor: 'c2' }),
      ),
    )
    const r = await api.misCataciones()
    expect(r.map((c) => c.id)).toEqual(['a', 'b'])
    expect(r[0]?.grano.finca).toBe('')
  })
})

describe('api: crearCatacion', () => {
  it('lugar existente: solo POST /tastings con lugar.id, sin descriptores, con el id idempotente', async () => {
    let body: Record<string, unknown> = {}
    server.use(
      http.post(`${API}/tastings`, async ({ request }) => {
        body = (await request.json()) as Record<string, unknown>
        return HttpResponse.json({ id: body.id, usuario_id: 'u1', creado_en: body.creado_en, lugar: { id: 'p1', nombre: 'Origen', lat: 1, lng: 2 }, grano: { ...(body.grano as object), finca: null }, sensorial: body.sensorial }, { status: 201 })
      }),
    )
    const c = await api.crearCatacion(nueva({ id: 'p1', nombre: 'Origen', lat: 5.07, lng: -75.51 }))
    expect(body.id).toBe('11111111-1111-4111-8111-111111111111')
    expect(body.lugar).toEqual({ id: 'p1' })
    expect(body.sensorial).not.toHaveProperty('descriptores')
    expect(body.grano).not.toHaveProperty('finca') // vacía: no se envía
    expect(c.id).toBe(body.id)
  })

  it('lugar nuevo: primero POST /places y luego POST /tastings con el id recibido', async () => {
    const orden: string[] = []
    let lugarEnviado: unknown
    server.use(
      http.post(`${API}/places`, async ({ request }) => {
        orden.push('places')
        lugarEnviado = ((await request.json()) as { lugar?: unknown })
        return HttpResponse.json({ ...place, id: 'nuevo' }, { status: 201 })
      }),
      http.post(`${API}/tastings`, async ({ request }) => {
        orden.push('tastings')
        const b = (await request.json()) as { lugar: { id: string } }
        expect(b.lugar.id).toBe('nuevo')
        return HttpResponse.json({ id: 'x', usuario_id: 'u1', creado_en: '', lugar: place, grano: { variedad: 'G', finca: null, region: null, proceso: 'Lavado', metodo: 'V60' }, sensorial: {} }, { status: 201 })
      }),
    )
    await api.crearCatacion(nueva({ nombre: 'Café nuevo', lat: 5.07, lng: -75.51 }))
    expect(orden).toEqual(['places', 'tastings'])
    expect(lugarEnviado).toMatchObject({ nombre: 'Café nuevo', lat: 5.07, lng: -75.51 })
  })

  it('lugar duplicado (409): usa el lugar existente que informa el servidor', async () => {
    server.use(
      http.post(`${API}/places`, () =>
        HttpResponse.json({ statusCode: 409, error: 'Conflict', message: 'Lugar duplicado', details: { lugar_existente: { id: 'ya-existe' } } }, { status: 409 }),
      ),
      http.post(`${API}/tastings`, async ({ request }) => {
        const b = (await request.json()) as { lugar: { id: string } }
        expect(b.lugar.id).toBe('ya-existe')
        return HttpResponse.json({ id: 'x', usuario_id: 'u1', creado_en: '', lugar: place, grano: { variedad: 'G', finca: null, region: null, proceso: 'Lavado', metodo: 'V60' }, sensorial: {} }, { status: 201 })
      }),
    )
    await expect(api.crearCatacion(nueva({ nombre: 'Origen', lat: 5.07, lng: -75.51 }))).resolves.toBeDefined()
  })
})
