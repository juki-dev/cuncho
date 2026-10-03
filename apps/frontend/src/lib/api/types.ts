/**
 * Tipos del dominio, derivados del esquema JSON de CLAUDE.md y del contrato real de
 * la API Nest.js (Swagger en /docs del entorno local). Las respuestas se adaptan en
 * lib/api/client.ts: la UI conserva sus nombres (p. ej. `distancia_km`).
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
 * Catación a registrar. Si `lugar.id` no viene, el cliente crea primero el lugar
 * (POST /places) y luego la catación (POST /tastings). `id` es un UUID generado en
 * el cliente: hace idempotentes los reintentos (cola sin conexión).
 */
export interface NuevaCatacion {
  id?: string
  creado_en: string
  lugar: LugarRef | (Coordenadas & { id?: undefined; nombre: string })
  grano: Grano
  sensorial: Sensorial
}

/** Lugar agregado que devuelve GET /places (pines del mapa). */
export interface Lugar extends LugarRef {
  /** Promedio normalizado 0–100 de sus cataciones; null si no tiene. */
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

/** GET /places/nearby agrega la distancia calculada en el servidor (el cliente la pasa a km). */
export interface LugarCercano extends Lugar {
  distancia_km: number
}

/** [oeste, sur, este, norte] en grados. */
export type BBox = [number, number, number, number]
