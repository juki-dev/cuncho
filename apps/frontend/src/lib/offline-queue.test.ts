import { beforeEach, describe, expect, it, vi } from 'vitest'
import { clear } from 'idb-keyval'
import { ApiError, NetworkError } from './api/client'
import type { Catacion, NuevaCatacion } from './api/types'
import { encolar, guardarCatacion, listarPendientes, procesarCola } from './offline-queue'

const payload = (variedad: string): NuevaCatacion => ({
  creado_en: '2026-09-28T16:40:00-05:00',
  lugar: { id: 'loc_1', nombre: 'Origen', lat: 5, lng: -75 },
  grano: { variedad, finca: '', region: '', proceso: 'Lavado', metodo: 'V60' },
  sensorial: { acidez: { nivel: 3, tipo: 'Cítrica' }, notas: ['Cítricos'], descriptores: ['frutal'], puntaje: 88, escala: 'SCA' },
})

const setOnline = (v: boolean) => Object.defineProperty(navigator, 'onLine', { value: v, configurable: true })

beforeEach(async () => {
  await clear()
  setOnline(true)
})

describe('offline-queue', () => {
  it('encola y lista en orden', async () => {
    await encolar(payload('A'))
    await encolar(payload('B'))
    expect((await listarPendientes()).map((p) => p.payload.grano.variedad)).toEqual(['A', 'B'])
  })

  it('procesa la cola y la vacía', async () => {
    await encolar(payload('A'))
    await encolar(payload('B'))
    const enviar = vi.fn().mockResolvedValue({})
    expect(await procesarCola(enviar)).toEqual({ enviadas: 2, restantes: 0 })
    expect(enviar).toHaveBeenCalledTimes(2)
  })

  it('se detiene ante un error de red y conserva lo pendiente', async () => {
    await encolar(payload('A'))
    await encolar(payload('B'))
    const enviar = vi.fn().mockResolvedValueOnce({}).mockRejectedValueOnce(new NetworkError())
    expect(await procesarCola(enviar)).toEqual({ enviadas: 1, restantes: 1 })
    expect((await listarPendientes())[0]!.payload.grano.variedad).toBe('B')
  })

  it('marca rechazos del servidor y sigue con las demás', async () => {
    await encolar(payload('A'))
    await encolar(payload('B'))
    const enviar = vi.fn().mockRejectedValueOnce(new ApiError(422, 'inválida')).mockResolvedValueOnce({})
    expect(await procesarCola(enviar)).toEqual({ enviadas: 1, restantes: 1 })
    const [p] = await listarPendientes()
    expect(p!.intentos).toBe(1)
    expect(p!.ultimo_error).toBe('inválida')
  })

  it('comparte la ejecución entre llamadas concurrentes', async () => {
    await encolar(payload('A'))
    const enviar = vi.fn().mockResolvedValue({})
    await Promise.all([procesarCola(enviar), procesarCola(enviar)])
    expect(enviar).toHaveBeenCalledTimes(1)
  })
})

describe('guardarCatacion', () => {
  it('envía cuando hay conexión', async () => {
    const enviar = vi.fn().mockResolvedValue({ id: 'cat_1' } as Catacion)
    expect((await guardarCatacion(payload('A'), enviar)).estado).toBe('enviada')
    expect(await listarPendientes()).toHaveLength(0)
  })

  it('encola sin conexión sin intentar enviar', async () => {
    setOnline(false)
    const enviar = vi.fn()
    expect((await guardarCatacion(payload('A'), enviar)).estado).toBe('pendiente')
    expect(enviar).not.toHaveBeenCalled()
    expect(await listarPendientes()).toHaveLength(1)
  })

  it('encola si la red falla', async () => {
    const enviar = vi.fn().mockRejectedValue(new NetworkError())
    expect((await guardarCatacion(payload('A'), enviar)).estado).toBe('pendiente')
  })

  it('propaga errores del servidor', async () => {
    const enviar = vi.fn().mockRejectedValue(new ApiError(400, 'mal'))
    await expect(guardarCatacion(payload('A'), enviar)).rejects.toBeInstanceOf(ApiError)
  })
})
