/**
 * Datos de ejemplo tomados de design/ (nombres y puntajes ficticios).
 * Solo se usan con VITE_API_MOCKS=true y en tests; nunca en producción.
 */
import type { Catacion, Lugar } from '../lib/api/types'

export const USUARIO_DEMO = 'usr_031'

export const lugaresFixture: Lugar[] = [
  {
    id: 'loc_origen',
    nombre: 'Origen Cafetería',
    lat: 5.0692,
    lng: -75.5171,
    puntaje_promedio: 92,
    total_cataciones: 7,
    descriptores: ['frutal', 'floral'],
    destacada: { variedad: 'Bourbon Rosado', proceso: 'Anaeróbico', metodo: 'Aeropress', notas: ['Frutos Rojos', 'Hibisco', 'Cítricos'] },
  },
  {
    id: 'loc_laureles',
    nombre: 'Café Laureles',
    lat: 5.0746,
    lng: -75.5196,
    puntaje_promedio: 89,
    total_cataciones: 12,
    descriptores: ['floral', 'frutal'],
    destacada: { variedad: 'Geisha', proceso: 'Lavado', metodo: 'V60', notas: ['Jazmín', 'Bergamota', 'Durazno'] },
  },
  {
    id: 'loc_mesa',
    nombre: 'La Mesa del Barista',
    lat: 5.0612,
    lng: -75.5212,
    puntaje_promedio: 84,
    total_cataciones: 5,
    descriptores: ['chocolate', 'dulce'],
    destacada: { variedad: 'Caturra', proceso: 'Natural', metodo: 'Espresso', notas: ['Chocolate Negro', 'Nuez', 'Panela'] },
  },
  {
    id: 'loc_cable',
    nombre: 'Tostadores del Cable',
    lat: 5.0605,
    lng: -75.5061,
    puntaje_promedio: 86,
    total_cataciones: 9,
    descriptores: ['dulce', 'frutal'],
    destacada: { variedad: 'Castillo', proceso: 'Honey', metodo: 'Chemex', notas: ['Panela', 'Caramelo', 'Naranja'] },
  },
]

const ref = (id: string) => {
  const l = lugaresFixture.find((x) => x.id === id)!
  return { id: l.id, nombre: l.nombre, lat: l.lat, lng: l.lng }
}

export const catacionesFixture: Catacion[] = [
  {
    id: 'cat_0192',
    usuario_id: USUARIO_DEMO,
    creado_en: '2026-09-28T16:40:00-05:00',
    lugar: ref('loc_origen'),
    grano: { variedad: 'Bourbon Rosado', finca: 'La Esperanza', region: 'Pitalito, Huila', proceso: 'Anaeróbico', metodo: 'Aeropress' },
    sensorial: { acidez: { nivel: 3, tipo: 'Cítrica' }, notas: ['Frutos Rojos', 'Hibisco', 'Cítricos'], descriptores: ['frutal', 'floral'], puntaje: 92, escala: 'SCA' },
  },
  {
    id: 'cat_0177',
    usuario_id: USUARIO_DEMO,
    creado_en: '2026-09-21T10:15:00-05:00',
    lugar: ref('loc_laureles'),
    grano: { variedad: 'Geisha', finca: 'El Paraíso', region: 'Piendamó, Cauca', proceso: 'Lavado', metodo: 'V60' },
    sensorial: { acidez: { nivel: 4, tipo: 'Tartárica' }, notas: ['Jazmín', 'Bergamota', 'Durazno'], descriptores: ['floral', 'frutal'], puntaje: 89, escala: 'SCA' },
  },
  {
    id: 'cat_0151',
    usuario_id: USUARIO_DEMO,
    creado_en: '2026-09-14T15:05:00-05:00',
    lugar: ref('loc_cable'),
    grano: { variedad: 'Castillo', finca: 'La Cristalina', region: 'Chinchiná, Caldas', proceso: 'Honey', metodo: 'Chemex' },
    sensorial: { acidez: { nivel: 2, tipo: 'Málica' }, notas: ['Panela', 'Caramelo', 'Naranja'], descriptores: ['dulce', 'frutal'], puntaje: 86, escala: 'SCA' },
  },
  {
    id: 'cat_0133',
    usuario_id: USUARIO_DEMO,
    creado_en: '2026-09-06T09:30:00-05:00',
    lugar: ref('loc_mesa'),
    grano: { variedad: 'Caturra', finca: 'Santa Mónica', region: 'Salento, Quindío', proceso: 'Natural', metodo: 'Espresso' },
    sensorial: { acidez: { nivel: 1, tipo: 'Láctica' }, notas: ['Chocolate Negro', 'Nuez'], descriptores: ['chocolate'], puntaje: 84, escala: 'SCA' },
  },
]
