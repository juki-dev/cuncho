import type { Descriptor, Metodo, NivelAcidez, Proceso, TipoAcidez } from './api/types'

export const PROCESOS: readonly Proceso[] = ['Lavado', 'Natural', 'Honey', 'Anaeróbico']
export const METODOS: readonly Metodo[] = ['V60', 'Aeropress', 'Espresso', 'Chemex', 'Prensa Francesa']
export const VARIEDADES_SUGERIDAS: readonly string[] = ['Geisha', 'Bourbon Rosado', 'Castillo', 'Caturra']

export const TIPOS_ACIDEZ: Record<NivelAcidez, TipoAcidez> = {
  1: 'Láctica',
  2: 'Málica',
  3: 'Cítrica',
  4: 'Tartárica',
  5: 'Fosfórica',
}

/** Etiqueta dinámica que se muestra junto al slider de acidez. */
export const ETIQUETA_ACIDEZ: Record<NivelAcidez, string> = {
  1: 'Láctica · suave',
  2: 'Málica',
  3: 'Cítrica',
  4: 'Tartárica',
  5: 'Fosfórica · brillante',
}

/** Cada nota de sabor mapea a un descriptor (CLAUDE.md). */
export const NOTA_DESCRIPTOR: Readonly<Record<string, Descriptor>> = {
  'Jazmín': 'floral',
  'Hibisco': 'floral',
  'Bergamota': 'floral',
  'Cítricos': 'frutal',
  'Frutos Rojos': 'frutal',
  'Durazno': 'frutal',
  'Naranja': 'frutal',
  'Panela': 'dulce',
  'Caramelo': 'dulce',
  'Chocolate Negro': 'chocolate',
  'Nuez': 'chocolate',
}

/** Notas que se ofrecen en el paso sensorial, en el orden del diseño. */
export const NOTAS_SENSORIAL: readonly string[] = [
  'Jazmín', 'Cítricos', 'Frutos Rojos', 'Panela', 'Chocolate Negro', 'Caramelo', 'Nuez', 'Hibisco',
]

export const DESCRIPTORES: readonly { id: Descriptor; etiqueta: string; pista: string }[] = [
  { id: 'frutal', etiqueta: 'Frutal / Cítrico', pista: 'Frutos rojos, naranja' },
  { id: 'chocolate', etiqueta: 'Chocolate / Nueces', pista: 'Cacao, avellana' },
  { id: 'floral', etiqueta: 'Floral', pista: 'Jazmín, hibisco' },
  { id: 'dulce', etiqueta: 'Dulce / Panela', pista: 'Caramelo, miel' },
]

/** Descriptores únicos a partir de las notas elegidas, en orden de aparición. */
export function descriptoresDeNotas(notas: readonly string[]): Descriptor[] {
  const out: Descriptor[] = []
  for (const n of notas) {
    const d = NOTA_DESCRIPTOR[n]
    if (d && !out.includes(d)) out.push(d)
  }
  return out
}

export const ESCALA_SCA = { min: 70, max: 100, paso: 0.25 } as const
export const ESCALA_PERSONAL = { min: 1, max: 10, paso: 0.5 } as const

export function clasificarSca(puntaje: number): string {
  if (puntaje >= 90) return 'Excepcional'
  if (puntaje >= 85) return 'Excelente'
  if (puntaje >= 80) return 'Muy bueno'
  return 'Por debajo de especialidad'
}
