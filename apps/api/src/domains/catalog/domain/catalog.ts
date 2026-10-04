/**
 * Listas cerradas del dominio. Los valores (en español) son parte del contrato
 * de la API; los nombres de tipos/constantes van en inglés.
 */

export const PROCESSES = ['Lavado', 'Natural', 'Honey', 'Anaeróbico'] as const;
export type Process = (typeof PROCESSES)[number];

export const BREW_METHODS = ['V60', 'Aeropress', 'Espresso', 'Chemex', 'Prensa Francesa'] as const;
export type BrewMethod = (typeof BREW_METHODS)[number];

export const ACIDITY_TYPES = ['Láctica', 'Málica', 'Cítrica', 'Tartárica', 'Fosfórica'] as const;
export type AcidityType = (typeof ACIDITY_TYPES)[number];

export const ACIDITY_LEVELS = [1, 2, 3, 4, 5] as const;
export type AcidityLevel = (typeof ACIDITY_LEVELS)[number];

/** Tipo de acidez que el diseño asocia a cada nivel del slider. */
export const ACIDITY_BY_LEVEL: Readonly<Record<AcidityLevel, { type: AcidityType; label: string }>> = {
  1: { type: 'Láctica', label: 'Láctica · suave' },
  2: { type: 'Málica', label: 'Málica' },
  3: { type: 'Cítrica', label: 'Cítrica' },
  4: { type: 'Tartárica', label: 'Tartárica' },
  5: { type: 'Fosfórica', label: 'Fosfórica · brillante' },
};

export const DESCRIPTORS = ['frutal', 'chocolate', 'floral', 'dulce'] as const;
export type Descriptor = (typeof DESCRIPTORS)[number];

export const DESCRIPTOR_INFO: readonly { id: Descriptor; label: string; hint: string }[] = [
  { id: 'frutal', label: 'Frutal / Cítrico', hint: 'Frutos rojos, naranja' },
  { id: 'chocolate', label: 'Chocolate / Nueces', hint: 'Cacao, avellana' },
  { id: 'floral', label: 'Floral', hint: 'Jazmín, hibisco' },
  { id: 'dulce', label: 'Dulce / Panela', hint: 'Caramelo, miel' },
];

export interface FlavorNote {
  nombre: string;
  /** Familia de la rueda de sabores del café (SCA). */
  familia: string;
  /** null = la nota existe en la rueda pero no encaja en ninguno de los 4 descriptores. */
  descriptor: Descriptor | null;
}

/**
 * Rueda de sabores del café (SCA Coffee Taster's Flavor Wheel) en español, más algunas notas
 * frecuentes en Colombia (panela, maracuyá, lulo…). Cada nota mapea a UN descriptor o a ninguno
 * (Especias, Tostado, Verde, Ácido/Fermentado y Otros no tienen descriptor: se guardan pero no
 * influyen en las recomendaciones). El frontend mantiene una copia en src/lib/notasCafe.ts.
 */
const f = (familia: string, descriptor: Descriptor | null, ...nombres: string[]): FlavorNote[] =>
  nombres.map((nombre) => ({ nombre, familia, descriptor }));

export const FLAVOR_NOTES: readonly FlavorNote[] = [
  ...f('Frutos rojos y bayas', 'frutal', 'Frutos Rojos', 'Mora', 'Frambuesa', 'Arándano', 'Fresa', 'Cereza'),
  ...f('Fruta seca', 'frutal', 'Pasa', 'Ciruela Pasa', 'Dátil', 'Higo'),
  ...f('Otras frutas', 'frutal', 'Durazno', 'Manzana', 'Pera', 'Uva', 'Piña', 'Granada', 'Coco', 'Sandía'),
  ...f('Frutas tropicales', 'frutal', 'Mango', 'Maracuyá', 'Guayaba', 'Lulo', 'Banano', 'Papaya', 'Lichi'),
  ...f('Cítricos', 'frutal', 'Cítricos', 'Naranja', 'Mandarina', 'Limón', 'Lima', 'Toronja'),
  ...f('Floral', 'floral', 'Jazmín', 'Hibisco', 'Bergamota', 'Rosa', 'Manzanilla', 'Té Negro', 'Lavanda', 'Azahar'),
  ...f('Dulce', 'dulce', 'Panela', 'Caramelo', 'Miel', 'Azúcar Morena', 'Melaza', 'Miel de Maple', 'Caramelizado', 'Vainilla', 'Vainillina', 'Dulce', 'Aromáticos Dulces', 'Malvavisco'),
  ...f('Chocolate y frutos secos', 'chocolate', 'Chocolate Negro', 'Cacao', 'Chocolate', 'Nuez', 'Avellana', 'Almendra', 'Maní'),
  ...f('Especias', null, 'Pimienta', 'Canela', 'Clavo', 'Anís', 'Nuez Moscada', 'Picante'),
  ...f('Tostado', null, 'Tostado', 'Cereal', 'Malta', 'Grano', 'Tabaco', 'Tabaco de Pipa', 'Ahumado', 'Quemado', 'Ceniza', 'Acre'),
  ...f('Verde y vegetal', null, 'Vegetal', 'Herbal', 'Heno', 'Fresco', 'Verde Oscuro', 'Inmaduro', 'Vaina de Arveja', 'Aceite de Oliva', 'Crudo', 'Frijol'),
  ...f('Ácido y fermentado', null, 'Ácido', 'Ácido Acético', 'Ácido Butírico', 'Ácido Isovalérico', 'Ácido Cítrico', 'Ácido Málico', 'Vinoso', 'Whiskey', 'Fermentado', 'Sobremaduro'),
  ...f('Otros', null, 'Madera', 'Papel', 'Cartón', 'Rancio', 'Húmedo', 'Polvo', 'Terroso', 'Animal', 'Caldo', 'Fenólico', 'Amargo', 'Salado', 'Medicinal', 'Petróleo', 'Caucho'),
];

/** Minúsculas y sin tildes: para comparar lo que escribe el usuario con el catálogo. */
export const foldNote = (s: string): string =>
  s
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();

const NOTES_BY_FOLD: ReadonlyMap<string, FlavorNote> = new Map(FLAVOR_NOTES.map((n) => [foldNote(n.nombre), n]));

/** Nota → descriptor, solo para las notas del catálogo que tienen uno. */
export const NOTE_DESCRIPTOR: Readonly<Record<string, Descriptor>> = Object.fromEntries(
  FLAVOR_NOTES.flatMap((n) => (n.descriptor ? [[n.nombre, n.descriptor] as const] : [])),
);

export const SUGGESTED_VARIETIES = [
  'Geisha',
  'Bourbon Rosado',
  'Castillo',
  'Caturra',
  'Colombia',
  'Típica',
  'Tabi',
  'Borbón',
] as const;

export const SCALES = ['SCA', 'Personal'] as const;
export type Scale = (typeof SCALES)[number];

export const SCALE_RULES: Readonly<Record<Scale, { min: number; max: number; step: number }>> = {
  SCA: { min: 0, max: 100, step: 0.25 },
  Personal: { min: 1, max: 10, step: 0.5 },
};

/** Nota personalizada válida: 2–40 caracteres, letras/números y signos básicos (sin HTML ni símbolos raros). */
export const CUSTOM_NOTE_PATTERN = /^[\p{L}\p{N}][\p{L}\p{N} '’().,/-]{1,39}$/u;

export class InvalidNotesError extends Error {
  constructor(readonly notes: string[]) {
    super(`Notas no válidas: ${notes.join(', ')}`);
  }
}

export interface ResolvedNotes {
  /** Notas a guardar: las del catálogo con su nombre canónico, las demás tal como se escribieron. */
  notes: string[];
  /** Descriptores únicos derivados de las notas del catálogo, en orden de aparición. */
  descriptors: Descriptor[];
}

/**
 * Resuelve las notas de una catación. Una nota del catálogo se reconoce sin importar tildes ni
 * mayúsculas ("jazmin" → "Jazmín") y aporta su descriptor. Cualquier otra se acepta como nota
 * personalizada (sin descriptor) si cumple CUSTOM_NOTE_PATTERN. Se eliminan duplicados.
 */
export function resolveNotes(raw: readonly string[]): ResolvedNotes {
  const invalid: string[] = [];
  const notes: string[] = [];
  const seen = new Set<string>();
  const descriptors: Descriptor[] = [];

  for (const input of raw) {
    const clean = input.trim().replace(/\s+/g, ' ');
    const known = NOTES_BY_FOLD.get(foldNote(clean));
    if (!known && !CUSTOM_NOTE_PATTERN.test(clean)) {
      invalid.push(input);
      continue;
    }
    const name = known?.nombre ?? clean.charAt(0).toLocaleUpperCase('es') + clean.slice(1);
    const key = foldNote(name);
    if (seen.has(key)) continue;
    seen.add(key);
    notes.push(name);
    if (known?.descriptor && !descriptors.includes(known.descriptor)) descriptors.push(known.descriptor);
  }
  if (invalid.length) throw new InvalidNotesError(invalid);
  return { notes, descriptors };
}

export function isDescriptor(value: string): value is Descriptor {
  return (DESCRIPTORS as readonly string[]).includes(value);
}
