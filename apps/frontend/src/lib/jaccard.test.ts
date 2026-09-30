import { describe, expect, it } from 'vitest'
import { jaccard } from './jaccard'

describe('jaccard', () => {
  it('es 1 para conjuntos iguales', () => {
    expect(jaccard(['frutal', 'floral'], ['floral', 'frutal'])).toBe(1)
  })
  it('es 0 si no hay intersección', () => {
    expect(jaccard(['frutal'], ['chocolate'])).toBe(0)
  })
  it('es 0 si ambos están vacíos', () => {
    expect(jaccard([], [])).toBe(0)
  })
  it('calcula |A∩B| / |A∪B|', () => {
    expect(jaccard(['frutal', 'floral'], ['dulce', 'frutal'])).toBeCloseTo(1 / 3)
  })
  it('ignora duplicados', () => {
    expect(jaccard(['frutal', 'frutal'], ['frutal'])).toBe(1)
  })
})
