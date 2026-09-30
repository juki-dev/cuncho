/**
 * Tipos del dominio, derivados del esquema JSON de CLAUDE.md.
 *
 * SUPUESTO: todavía no existe contrato de la API Nest.js. Los tipos marcados
 * con "SUPUESTO" (Lugar, LugarCercano, NuevaCatacion) son propuestas del
 * frontend y deben validarse con quien lleve el backend.
 */

export type Proceso = 'Lavado' | 'Natural' | 'Honey' | 'Anaeróbico'
export type Metodo = 'V60' | 'Aeropress' | 'Espresso' | 'Chemex' | 'Prensa Francesa'
export type TipoAcidez = 'Láctica' | 'Málica' | 'Cítrica' | 'Tartárica' | 'Fosfórica'
export type NivelAcidez = 1 | 2 | 3 | 4 | 5
export type Descriptor = 'frutal' | 'chocolate' | 'floral' | 'dulce'
export type Escala = 'SCA' | 'Personal'

export interface Coordenadas {
  lat: number
  lng: number
}

export interface LugarRef extends Coordenadas {
  id: string
  nombre: string
}

export interface Grano {
  variedad: string
  finca: string
  region: string
  proceso: Proceso
  metodo: Metodo
}

export interface Sensorial {
  acidez: { nivel: NivelAcidez; tipo: TipoAcidez }
  notas: string[]
  descriptores: Descriptor[]
  puntaje: number
  escala: Escala
}

export interface Catacion {
  id: string
  usuario_id: string
  creado_en: string
  lugar: LugarRef
  grano: Grano
  sensorial: Sensorial
}

/**
 * SUPUESTO: cuerpo de POST /cataciones. Si `lugar.id` no viene, el backend
 * crea el lugar nuevo con nombre y coordenadas.
 */
export interface NuevaCatacion {
  creado_en: string
  lugar: LugarRef | (Coordenadas & { id?: undefined; nombre: string })
  grano: Grano
  sensorial: Sensorial
}

/** SUPUESTO: lugar agregado que devuelve GET /lugares. */
export interface Lugar extends LugarRef {
  /** Promedio SCA de las cataciones del lugar; null si no tiene. */
  puntaje_promedio: number | null
  total_cataciones: number
  /** Descriptores agregados de todas sus cataciones (B en Jaccard). */
  descriptores: Descriptor[]
  /** Catación más representativa, para el popup y la tarjeta de resultado. */
  destacada: {
    variedad: string
    proceso: Proceso
    metodo: Metodo
    notas: string[]
  } | null
}

/** SUPUESTO: GET /lugares/cercanos agrega la distancia calculada en el servidor. */
export interface LugarCercano extends Lugar {
  distancia_km: number
}

/** [oeste, sur, este, norte] en grados. */
export type BBox = [number, number, number, number]
