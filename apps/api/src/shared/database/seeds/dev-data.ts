/**
 * Datos de ejemplo de design/ (nombres y puntajes ficticios). Solo desarrollo.
 * Coordenadas en Manizales, a las distancias que muestran los diseños respecto a Origen.
 */
export const DEMO_USER = { email: 'demo@cuncho.co', password: 'cafe-de-origen', name: 'Catadora Demo' };

export const PLACES = [
  { key: 'origen', name: 'Origen Cafetería', lat: 5.0689, lng: -75.5174 },
  { key: 'laureles', name: 'Café Laureles', lat: 5.0769, lng: -75.5174 },
  { key: 'mesa', name: 'La Mesa del Barista', lat: 5.0619, lng: -75.5239 },
  { key: 'cable', name: 'Tostadores del Cable', lat: 5.0689, lng: -75.5029 },
] as const;

type PlaceKey = (typeof PLACES)[number]['key'];

export const TASTINGS: {
  place: PlaceKey;
  daysAgo: number;
  variety: string;
  farm: string | null;
  region: string;
  process: string;
  method: string;
  acidity: [number, string];
  notes: string[];
  descriptors: string[];
  score: number;
  scale: 'SCA' | 'Personal';
}[] = [
  { place: 'origen', daysAgo: 1, variety: 'Bourbon Rosado', farm: 'Finca El Paraíso', region: 'Pitalito, Huila', process: 'Anaeróbico', method: 'Aeropress', acidity: [3, 'Cítrica'], notes: ['Frutos Rojos', 'Hibisco', 'Cítricos'], descriptors: ['frutal', 'floral'], score: 92, scale: 'SCA' },
  { place: 'laureles', daysAgo: 8, variety: 'Geisha', farm: 'Finca La Esperanza', region: 'Trujillo, Valle', process: 'Lavado', method: 'V60', acidity: [4, 'Tartárica'], notes: ['Jazmín', 'Bergamota', 'Durazno'], descriptors: ['floral', 'frutal'], score: 89, scale: 'SCA' },
  { place: 'cable', daysAgo: 15, variety: 'Castillo', farm: null, region: 'Chinchiná, Caldas', process: 'Honey', method: 'Chemex', acidity: [2, 'Málica'], notes: ['Panela', 'Caramelo', 'Naranja'], descriptors: ['dulce', 'frutal'], score: 86, scale: 'SCA' },
  { place: 'mesa', daysAgo: 23, variety: 'Caturra', farm: null, region: 'Salento, Quindío', process: 'Natural', method: 'Espresso', acidity: [1, 'Láctica'], notes: ['Chocolate Negro', 'Nuez'], descriptors: ['chocolate'], score: 84, scale: 'SCA' },
  { place: 'origen', daysAgo: 30, variety: 'Tabi', farm: null, region: 'Planadas, Tolima', process: 'Lavado', method: 'V60', acidity: [3, 'Cítrica'], notes: ['Cítricos', 'Panela'], descriptors: ['frutal', 'dulce'], score: 9, scale: 'Personal' },
];
