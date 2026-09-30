import { descriptorsFromNotes, NOTE_DESCRIPTOR, UnknownNotesError } from '../domain/catalog';

describe('descriptorsFromNotes', () => {
  it.each`
    notes                                      | expected
    ${['Frutos Rojos', 'Hibisco', 'Cítricos']} | ${['frutal', 'floral']}
    ${['Panela', 'Caramelo', 'Naranja']}       | ${['dulce', 'frutal']}
    ${['Chocolate Negro', 'Nuez']}             | ${['chocolate']}
    ${[]}                                      | ${[]}
  `('$notes → $expected', ({ notes, expected }) => {
    expect(descriptorsFromNotes(notes)).toEqual(expected);
  });

  it('rechaza notas fuera del catálogo', () => {
    expect(() => descriptorsFromNotes(['Hibisco', 'Mango', 'Tierra'])).toThrow(UnknownNotesError);
    try {
      descriptorsFromNotes(['Mango']);
    } catch (e) {
      expect((e as UnknownNotesError).notes).toEqual(['Mango']);
    }
  });

  it('incluye todas las notas que usa el frontend', () => {
    const frontend = ['Jazmín', 'Cítricos', 'Frutos Rojos', 'Panela', 'Chocolate Negro', 'Caramelo', 'Nuez', 'Hibisco', 'Bergamota', 'Durazno', 'Naranja'];
    for (const n of frontend) expect(NOTE_DESCRIPTOR[n]).toBeDefined();
  });
});
