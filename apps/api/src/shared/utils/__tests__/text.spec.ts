import { levenshtein, normalizeText, textSimilarity } from '../text';

describe('text utils', () => {
  it('normaliza tildes, mayúsculas y signos', () => {
    expect(normalizeText('  Café  ORIGEN — Cafetería! ')).toBe('cafe origen cafeteria');
  });

  it.each`
    a           | b            | d
    ${'kitten'} | ${'sitting'} | ${3}
    ${''}       | ${'abc'}     | ${3}
    ${'abc'}    | ${'abc'}     | ${0}
  `('levenshtein($a, $b) = $d', ({ a, b, d }) => {
    expect(levenshtein(a, b)).toBe(d);
  });

  it('similitud 1 para textos equivalentes tras normalizar', () => {
    expect(textSimilarity('Café Laureles', 'cafe laureles')).toBe(1);
  });
});
