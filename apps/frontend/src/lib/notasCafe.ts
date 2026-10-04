import type { Descriptor } from './api/types'

/**
 * Rueda de sabores del café (SCA) en español. COPIA de FLAVOR_NOTES del backend
 * (apps/api/src/domains/catalog/domain/catalog.ts): si cambia allá, hay que regenerarla.
 * Cada nota mapea a UN descriptor o a ninguno (null: no influye en las recomendaciones).
 */
export interface NotaCafe {
  nombre: string
  familia: string
  descriptor: Descriptor | null
}

const f = (familia: string, descriptor: Descriptor | null, ...nombres: string[]): NotaCafe[] =>
  nombres.map((nombre) => ({ nombre, familia, descriptor }))

export const NOTAS_CAFE: readonly NotaCafe[] = [
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
]
