import { describe, expect, it } from 'vitest'
import { aPayload, BORRADOR_INICIAL, faltantesGrano, type Borrador } from './useCatacionDraft'

const completo: Borrador = {
  lugar: { id: 'loc_origen', nombre: 'Origen Cafetería', lat: 5.0689, lng: -75.5174 },
  grano: { variedad: ' Bourbon Rosado ', finca: 'La Esperanza', region: 'Pitalito, Huila', proceso: 'Anaeróbico', metodo: 'Aeropress' },
  sensorial: { acidez: 3, notas: ['Frutos Rojos', 'Hibisco', 'Cítricos'], escala: 'SCA', puntajeSca: 92, puntajePersonal: 8 },
}

describe('aPayload', () => {
  it('produce el esquema de CLAUDE.md', () => {
    const p = aPayload(completo, new Date('2026-09-28T21:40:00Z'))
    expect(p).toMatchObject({
      lugar: { id: 'loc_origen', nombre: 'Origen Cafetería' },
      grano: { variedad: 'Bourbon Rosado', proceso: 'Anaeróbico', metodo: 'Aeropress' },
      sensorial: {
        acidez: { nivel: 3, tipo: 'Cítrica' },
        notas: ['Frutos Rojos', 'Hibisco', 'Cítricos'],
        descriptores: ['frutal', 'floral'],
        puntaje: 92,
        escala: 'SCA',
      },
    })
    expect(p!.creado_en).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}[+-]\d{2}:\d{2}$/)
  })

  it('usa el puntaje de la escala elegida', () => {
    const p = aPayload({ ...completo, sensorial: { ...completo.sensorial, escala: 'Personal' } })
    expect(p!.sensorial).toMatchObject({ puntaje: 8, escala: 'Personal' })
  })

  it('devuelve null si falta información', () => {
    expect(aPayload(BORRADOR_INICIAL)).toBeNull()
    expect(aPayload({ ...completo, sensorial: { ...completo.sensorial, notas: [] } })).toBeNull()
  })
})

describe('faltantesGrano', () => {
  it('lista los campos obligatorios vacíos', () => {
    expect(faltantesGrano(BORRADOR_INICIAL)).toEqual(['variedad', 'proceso', 'metodo'])
    expect(faltantesGrano(completo)).toEqual([])
  })
})
