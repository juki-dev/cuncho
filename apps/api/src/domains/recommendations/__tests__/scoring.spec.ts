import { Candidate, rankCandidates, scoreCandidate, ScoringWeights } from '../domain/scoring';

const W: ScoringWeights = { jaccard: 0.6, distance: 0.25, score: 0.15 };
const R = 2500;

describe('scoreCandidate', () => {
  it.each`
    j      | d       | avg     | expected
    ${1}   | ${0}    | ${100}  | ${1}
    ${1}   | ${400}  | ${92}   | ${0.6 + 0.25 * (1 - 400 / 2500) + 0.15 * 0.92}
    ${0.5} | ${1250} | ${80}   | ${0.3 + 0.125 + 0.12}
    ${1}   | ${2500} | ${0}    | ${0.6}
    ${1}   | ${3000} | ${null} | ${0.6}
    ${0}   | ${0}    | ${100}  | ${0.4}
  `('J=$j d=$d avg=$avg → $expected', ({ j, d, avg, expected }) => {
    expect(scoreCandidate({ jaccard: j, distanceM: d, radiusM: R, avgScore: avg }, W)).toBeCloseTo(expected, 10);
  });

  it('respeta pesos configurables', () => {
    const onlyDistance = { jaccard: 0, distance: 1, score: 0 };
    expect(scoreCandidate({ jaccard: 1, distanceM: 1000, radiusM: 2000, avgScore: 90 }, onlyDistance)).toBeCloseTo(0.5);
  });
});

describe('rankCandidates', () => {
  // Escenario de design/Recomendacion.dc.html con descriptores [frutal, floral].
  const cafes: Candidate[] = [
    { id: 'origen', distanceM: 400, avgScore: 92, descriptors: ['frutal', 'floral'] },
    { id: 'laureles', distanceM: 900, avgScore: 89, descriptors: ['floral', 'frutal'] },
    { id: 'cable', distanceM: 1600, avgScore: 86, descriptors: ['dulce', 'frutal'] },
    { id: 'mesa', distanceM: 1100, avgScore: 84, descriptors: ['chocolate', 'dulce'] },
    { id: 'lejos', distanceM: 2600, avgScore: 99, descriptors: ['frutal', 'floral'] },
  ];

  it('reproduce el orden del diseño y descarta J = 0 y fuera de radio', () => {
    const ranked = rankCandidates(['frutal', 'floral'], cafes, R, W);
    expect(ranked.map((r) => r.candidate.id)).toEqual(['origen', 'laureles', 'cable']);
    expect(ranked[0]!.jaccard).toBe(1);
    expect(ranked[2]!.jaccard).toBeCloseTo(1 / 3);
    expect(ranked[0]!.score).toBeCloseTo(0.6 + 0.25 * 0.84 + 0.15 * 0.92, 10);
  });

  it('solo chocolate → solo La Mesa', () => {
    expect(rankCandidates(['chocolate'], cafes, R, W).map((r) => r.candidate.id)).toEqual(['mesa']);
  });

  it('sin coincidencias → vacío', () => {
    expect(rankCandidates(['floral'], [cafes[3]!], R, W)).toEqual([]);
  });

  it('desempata por distancia', () => {
    const tie: Candidate[] = [
      { id: 'b', distanceM: 0, avgScore: 90, descriptors: ['dulce'] },
      { id: 'a', distanceM: 0, avgScore: 90, descriptors: ['dulce'] },
    ];
    expect(rankCandidates(['dulce'], tie, R, W).map((r) => r.candidate.id)).toEqual(['a', 'b']);
  });
});
