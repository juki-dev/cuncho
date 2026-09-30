import { normalizeScore, scaClassification, validateScore } from '../domain/score';

describe('puntaje', () => {
  it.each`
    scale         | value     | valid
    ${'SCA'}      | ${92}     | ${true}
    ${'SCA'}      | ${0}      | ${true}
    ${'SCA'}      | ${100}    | ${true}
    ${'SCA'}      | ${84.75}  | ${true}
    ${'SCA'}      | ${84.8}   | ${false}
    ${'SCA'}      | ${100.25} | ${false}
    ${'SCA'}      | ${-0.25}  | ${false}
    ${'Personal'} | ${1}      | ${true}
    ${'Personal'} | ${9.5}    | ${true}
    ${'Personal'} | ${10}     | ${true}
    ${'Personal'} | ${0.5}    | ${false}
    ${'Personal'} | ${7.25}   | ${false}
    ${'Personal'} | ${10.5}   | ${false}
    ${'SCA'}      | ${NaN}    | ${false}
  `('$scale $value → válido: $valid', ({ scale, value, valid }) => {
    expect(validateScore(scale, value) === null).toBe(valid);
  });

  it.each`
    scale         | value    | normalized
    ${'SCA'}      | ${92}    | ${92}
    ${'SCA'}      | ${84.75} | ${84.75}
    ${'Personal'} | ${9}     | ${90}
    ${'Personal'} | ${7.5}   | ${75}
    ${'Personal'} | ${1}     | ${10}
  `('normaliza $scale $value → $normalized', ({ scale, value, normalized }) => {
    expect(normalizeScore(scale, value)).toBe(normalized);
  });

  it.each`
    score    | label
    ${92}    | ${'Excepcional'}
    ${90}    | ${'Excepcional'}
    ${89.99} | ${'Excelente'}
    ${85}    | ${'Excelente'}
    ${80}    | ${'Muy bueno'}
    ${79.75} | ${'Por debajo de especialidad'}
  `('clasificación SCA $score → $label', ({ score, label }) => {
    expect(scaClassification(score)).toBe(label);
  });
});
