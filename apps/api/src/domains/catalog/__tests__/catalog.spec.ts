import { FLAVOR_NOTES, foldNote, InvalidNotesError, NOTE_DESCRIPTOR, resolveNotes } from '../domain/catalog';

describe('resolveNotes', () => {
  it.each`
    notes                                      | expected
    ${['Frutos Rojos', 'Hibisco', 'Cítricos']} | ${['frutal', 'floral']}
    ${['Panela', 'Caramelo', 'Naranja']}       | ${['dulce', 'frutal']}
    ${['Chocolate Negro', 'Nuez']}             | ${['chocolate']}
    ${[]}                                      | ${[]}
  `('$notes → descriptores $expected', ({ notes, expected }) => {
    expect(resolveNotes(notes).descriptors).toEqual(expected);
  });

  it('reconoce las notas del catálogo sin importar tildes ni mayúsculas y devuelve el nombre canónico', () => {
    const r = resolveNotes(['jazmin', '  CITRICOS ', 'chocolate   negro']);
    expect(r.notes).toEqual(['Jazmín', 'Cítricos', 'Chocolate Negro']);
    expect(r.descriptors).toEqual(['floral', 'frutal', 'chocolate']);
  });

  it('las notas de familias sin descriptor se guardan pero no aportan descriptor', () => {
    const r = resolveNotes(['Canela', 'Tabaco', 'Jazmín']);
    expect(r.notes).toEqual(['Canela', 'Tabaco', 'Jazmín']);
    expect(r.descriptors).toEqual(['floral']);
  });

  it('acepta notas personalizadas (con la primera letra en mayúscula) sin descriptor', () => {
    const r = resolveNotes(['sabor a pan tostado', 'Frutos Rojos']);
    expect(r.notes).toEqual(['Sabor a pan tostado', 'Frutos Rojos']);
    expect(r.descriptors).toEqual(['frutal']);
  });

  it('elimina duplicados, también los que solo difieren en tildes o mayúsculas', () => {
    expect(resolveNotes(['Jazmín', 'jazmin', 'JAZMÍN', 'Mi nota', 'mi  nota']).notes).toEqual(['Jazmín', 'Mi nota']);
  });

  it.each(['<script>alert(1)</script>', 'a', '', '   ', 'x'.repeat(41), 'emoji 😀', 'con;punto y coma', '=SUMA(1)'])(
    'rechaza la nota inválida %j',
    (nota) => {
      expect(() => resolveNotes(['Jazmín', nota])).toThrow(InvalidNotesError);
      try {
        resolveNotes([nota]);
      } catch (e) {
        expect((e as InvalidNotesError).notes).toEqual([nota]);
      }
    },
  );

  it('acepta signos básicos en notas personalizadas', () => {
    expect(resolveNotes(["Fruta de la pasión (verde)", "Pan d'agua", 'Café 1/2']).notes).toHaveLength(3);
  });
});

describe('catálogo de notas', () => {
  it('cubre las familias de la rueda y no tiene nombres repetidos (ni siquiera sin tildes)', () => {
    const folded = FLAVOR_NOTES.map((n) => foldNote(n.nombre));
    expect(new Set(folded).size).toBe(folded.length);
    expect(FLAVOR_NOTES.length).toBeGreaterThanOrEqual(100);
    const familias = new Set(FLAVOR_NOTES.map((n) => n.familia));
    for (const f of ['Floral', 'Dulce', 'Especias', 'Tostado', 'Verde y vegetal', 'Ácido y fermentado', 'Cítricos'])
      expect(familias).toContain(f);
  });

  it('todas las notas del catálogo cumplen las reglas de una nota válida', () => {
    for (const n of FLAVOR_NOTES) expect(() => resolveNotes([n.nombre])).not.toThrow();
  });

  it('conserva las notas que ya usaban el frontend y los datos existentes', () => {
    const previas = ['Jazmín', 'Cítricos', 'Frutos Rojos', 'Panela', 'Chocolate Negro', 'Caramelo', 'Nuez', 'Hibisco', 'Bergamota', 'Durazno', 'Naranja', 'Miel', 'Cacao', 'Avellana'];
    for (const n of previas) expect(NOTE_DESCRIPTOR[n]).toBeDefined();
  });
});
