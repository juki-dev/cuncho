import { NOTAS_CAFE } from './notasCafe'
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

/** Minúsculas y sin tildes: para comparar lo que escribe el usuario con el catálogo. */
export const plegar = (texto: string): string =>
  texto
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()

/** Nota del catálogo → descriptor, solo las que tienen uno (las demás no influyen en recomendaciones). */
export const NOTA_DESCRIPTOR: Readonly<Record<string, Descriptor>> = Object.fromEntries(
  NOTAS_CAFE.flatMap((n) => (n.descriptor ? [[n.nombre, n.descriptor] as const] : [])),
)

const DESCRIPTOR_POR_NOTA_PLEGADA = new Map(NOTAS_CAFE.map((n) => [plegar(n.nombre), n.descriptor]))

/** Sugerencias cuando el buscador está vacío (las del diseño original + dos frecuentes). */
export const NOTAS_POPULARES: readonly string[] = [
  'Jazmín', 'Cítricos', 'Frutos Rojos', 'Panela', 'Chocolate Negro', 'Caramelo', 'Nuez', 'Hibisco', 'Miel', 'Cacao',
]

/** Máximo de notas por catación (igual que la API). */
export const MAX_NOTAS = 12

/** Misma regla que la API para una nota personalizada: 2–40 caracteres, letras/números y signos básicos. */
const NOTA_PERSONALIZADA = /^[\p{L}\p{N}][\p{L}\p{N} '’().,/-]{1,39}$/u
export const esNotaValida = (texto: string) => NOTA_PERSONALIZADA.test(texto.trim().replace(/\s+/g, ' '))

/** Primera letra en mayúscula y espacios normalizados (como hace la API con las notas personalizadas). */
export const normalizarNota = (texto: string): string => {
  const t = texto.trim().replace(/\s+/g, ' ')
  return t.charAt(0).toLocaleUpperCase('es') + t.slice(1)
}

export const DESCRIPTORES: readonly { id: Descriptor; etiqueta: string; pista: string }[] = [
  { id: 'frutal', etiqueta: 'Frutal / Cítrico', pista: 'Frutos rojos, naranja' },
  { id: 'chocolate', etiqueta: 'Chocolate / Nueces', pista: 'Cacao, avellana' },
  { id: 'floral', etiqueta: 'Floral', pista: 'Jazmín, hibisco' },
  { id: 'dulce', etiqueta: 'Dulce / Panela', pista: 'Caramelo, miel' },
]

/** Descriptores únicos a partir de las notas elegidas, en orden de aparición. Las personalizadas no aportan. */
export function descriptoresDeNotas(notas: readonly string[]): Descriptor[] {
  const out: Descriptor[] = []
  for (const n of notas) {
    const d = DESCRIPTOR_POR_NOTA_PLEGADA.get(plegar(n))
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
