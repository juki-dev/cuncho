import { jaccard } from '../jaccard';

describe('jaccard', () => {
  it.each`
    a                         | b                         | expected
    ${['frutal', 'floral']}   | ${['floral', 'frutal']}   | ${1}
    ${['frutal', 'floral']}   | ${['frutal', 'dulce']}    | ${1 / 3}
    ${['frutal']}             | ${['chocolate']}          | ${0}
    ${['frutal', 'floral']}   | ${['frutal', 'floral', 'dulce']} | ${2 / 3}
    ${[]}                     | ${[]}                     | ${0}
    ${['frutal']}             | ${[]}                     | ${0}
    ${['frutal', 'frutal']}   | ${['frutal']}             | ${1}
  `('J($a, $b) = $expected', ({ a, b, expected }) => {
    expect(jaccard(a, b)).toBeCloseTo(expected, 10);
  });
});
