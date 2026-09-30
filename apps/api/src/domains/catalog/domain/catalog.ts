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

/** Cada nota de sabor mapea a exactamente un descriptor. */
export const NOTE_DESCRIPTOR: Readonly<Record<string, Descriptor>> = {
  'Jazmín': 'floral',
  'Hibisco': 'floral',
  'Bergamota': 'floral',
  'Cítricos': 'frutal',
  'Frutos Rojos': 'frutal',
  'Durazno': 'frutal',
  'Naranja': 'frutal',
  'Panela': 'dulce',
  'Caramelo': 'dulce',
  'Miel': 'dulce',
  'Chocolate Negro': 'chocolate',
  'Cacao': 'chocolate',
  'Nuez': 'chocolate',
  'Avellana': 'chocolate',
};

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

export class UnknownNotesError extends Error {
  constructor(readonly notes: string[]) {
    super(`Notas no reconocidas: ${notes.join(', ')}`);
  }
}

/** Descriptores únicos derivados de las notas, en orden de aparición. Falla si hay notas fuera del catálogo. */
export function descriptorsFromNotes(notes: readonly string[]): Descriptor[] {
  const unknown = notes.filter((n) => !(n in NOTE_DESCRIPTOR));
  if (unknown.length) throw new UnknownNotesError(unknown);
  const out: Descriptor[] = [];
  for (const n of notes) {
    const d = NOTE_DESCRIPTOR[n]!;
    if (!out.includes(d)) out.push(d);
  }
  return out;
}

export function isDescriptor(value: string): value is Descriptor {
  return (DESCRIPTORS as readonly string[]).includes(value);
}
