import { distinctiveName, findDuplicate, namesLookAlike } from '../domain/duplicate-detection';

describe('detección de duplicados', () => {
  it.each`
    a                         | b                          | same
    ${'Origen Cafetería'}     | ${'Cafetería Origen'}      | ${true}
    ${'Origen Cafetería'}     | ${'origen'}                | ${true}
    ${'Café Laureles'}        | ${'Cafe Laureles '}        | ${true}
    ${'Tostadores del Cable'} | ${'Tostadores de Cable'}   | ${true}
    ${'Café Laureles'}        | ${'La Mesa del Barista'}   | ${false}
    ${'Café'}                 | ${'Café Azahar'}           | ${false}
    ${'Azahar'}               | ${'Amor Perfecto'}         | ${false}
  `('"$a" vs "$b" → $same', ({ a, b, same }) => {
    expect(namesLookAlike(a, b)).toBe(same);
  });

  it('quita palabras genéricas', () => {
    expect(distinctiveName('La Cafetería del Cable')).toBe('cable');
  });

  it('elige el candidato parecido más cercano dentro de 30 m', () => {
    const candidates = [
      { name: 'Origen', distanceM: 25 },
      { name: 'Origen Cafetería', distanceM: 10 },
      { name: 'Otra Cosa', distanceM: 1 },
      { name: 'Origen', distanceM: 45 },
    ];
    expect(findDuplicate('Origen Cafetería', candidates)).toEqual({ name: 'Origen Cafetería', distanceM: 10 });
    expect(findDuplicate('Nuevo Lugar', candidates)).toBeNull();
    expect(findDuplicate('Origen', [{ name: 'Origen', distanceM: 31 }])).toBeNull();
  });
});
