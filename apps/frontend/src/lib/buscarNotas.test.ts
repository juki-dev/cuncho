import { describe, expect, it } from 'vitest'
import { buscarNotas, MAX_RESULTADOS } from './buscarNotas'
import { descriptoresDeNotas, esNotaValida, normalizarNota, NOTA_DESCRIPTOR, NOTAS_POPULARES } from './catalogo'
import { NOTAS_CAFE } from './notasCafe'

const nombres = (q: string, limite?: number) => buscarNotas(q, limite).resultados.map((n) => n.nombre)

describe('catálogo de notas', () => {
  it('cubre la rueda del café: más de 100 notas, sin repetidas, y todas las populares existen', () => {
    expect(NOTAS_CAFE.length).toBeGreaterThanOrEqual(100)
    expect(new Set(NOTAS_CAFE.map((n) => n.nombre)).size).toBe(NOTAS_CAFE.length)
    for (const p of NOTAS_POPULARES) expect(NOTAS_CAFE.map((n) => n.nombre)).toContain(p)
  })

  it('cada nota tiene un descriptor o ninguno; las familias sin descriptor no influyen', () => {
    expect(NOTA_DESCRIPTOR['Jazmín']).toBe('floral')
    expect(NOTA_DESCRIPTOR['Canela']).toBeUndefined()
    expect(descriptoresDeNotas(['Canela', 'Tabaco'])).toEqual([])
  })
})

describe('buscarNotas', () => {
  it('sin consulta devuelve las sugerencias populares (10)', () => {
    const r = buscarNotas('')
    expect(r.resultados.map((n) => n.nombre)).toEqual([...NOTAS_POPULARES])
    expect(r.resultados).toHaveLength(10)
  })

  it('ignora tildes y mayúsculas', () => {
    expect(nombres('JAZMIN')).toEqual(['Jazmín'])
    expect(nombres('citricos')[0]).toBe('Cítricos')
    expect(nombres('anis')).toContain('Anís')
  })

  it('ordena por relevancia: exacta, empieza por, palabra que empieza, contiene', () => {
    const r = nombres('lim')
    expect(r.indexOf('Lima')).toBeLessThan(r.indexOf('Limón') + 1) // ambas empiezan por "lim"
    // "Ácido Málico" contiene "mal" dentro de la palabra; "Malta"/"Malvavisco"/"Melaza" empiezan por ella
    const m = nombres('mal')
    expect(m.indexOf('Malta')).toBeLessThan(m.indexOf('Ácido Málico'))
    expect(nombres('rosa')[0]).toBe('Rosa')
  })

  it('devuelve como máximo 10 resultados y dice cuántas coincidencias hay en total', () => {
    const r = buscarNotas('a')
    expect(r.resultados).toHaveLength(MAX_RESULTADOS)
    expect(r.total).toBeGreaterThan(MAX_RESULTADOS)
    expect(buscarNotas('a', 3).resultados).toHaveLength(3)
  })

  it('también encuentra por familia y por varias palabras', () => {
    expect(nombres('especias')).toEqual(expect.arrayContaining(['Canela', 'Clavo']))
    expect(nombres('acido malico')).toContain('Ácido Málico')
  })

  it('sin coincidencias devuelve una lista vacía', () => {
    expect(buscarNotas('zzzzqq')).toEqual({ resultados: [], total: 0 })
  })
})

describe('notas personalizadas', () => {
  it.each(['pan tostado', 'Fruta (verde)', "Pan d'agua", 'Café 1/2'])('%s es válida', (t) => expect(esNotaValida(t)).toBe(true))
  it.each(['a', '', '<b>x</b>', 'x'.repeat(41), 'con;punto', 'emoji 😀'])('%j no es válida', (t) => expect(esNotaValida(t)).toBe(false))
  it('normaliza espacios y primera letra', () => expect(normalizarNota('  sabor   a pan ')).toBe('Sabor a pan'))
})
