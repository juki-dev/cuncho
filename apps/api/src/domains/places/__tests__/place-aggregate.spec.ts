import { PlaceAggregate, TastingContribution } from '../domain/place';
import { applyTasting } from '../domain/place-aggregate';

const empty: PlaceAggregate = { avgScore: null, tastingsCount: 0, descriptors: [], notes: [], featured: null };

const t = (over: Partial<TastingContribution>): TastingContribution => ({
  tastingId: 't1',
  normalizedScore: 90,
  descriptors: ['frutal'],
  notes: ['Cítricos'],
  variety: 'Geisha',
  process: 'Lavado',
  method: 'V60',
  ...over,
});

describe('applyTasting', () => {
  it('primera catación inicializa el agregado', () => {
    const agg = applyTasting(empty, t({}));
    expect(agg).toMatchObject({ avgScore: 90, tastingsCount: 1, descriptors: ['frutal'], notes: ['Cítricos'] });
    expect(agg.featured?.tastingId).toBe('t1');
  });

  it('promedio incremental, unión de descriptores y notas', () => {
    const a1 = applyTasting(empty, t({ normalizedScore: 92, descriptors: ['frutal', 'floral'], notes: ['Hibisco'] }));
    const a2 = applyTasting(a1, t({ tastingId: 't2', normalizedScore: 85, descriptors: ['dulce', 'frutal'], notes: ['Panela'] }));
    expect(a2.avgScore).toBe(88.5);
    expect(a2.tastingsCount).toBe(2);
    expect(a2.descriptors).toEqual(['dulce', 'floral', 'frutal']);
    expect(a2.notes).toEqual(['Hibisco', 'Panela']);
  });

  it.each`
    newScore | featured
    ${80}    | ${'t1'}
    ${90}    | ${'t2'}
    ${95}    | ${'t2'}
  `('destacada con puntaje nuevo $newScore → $featured', ({ newScore, featured }) => {
    const a1 = applyTasting(empty, t({ normalizedScore: 90 }));
    const a2 = applyTasting(a1, t({ tastingId: 't2', normalizedScore: newScore }));
    expect(a2.featured?.tastingId).toBe(featured);
  });

  it('redondea el promedio a 2 decimales', () => {
    let agg = empty;
    for (const s of [90, 85.25, 88]) agg = applyTasting(agg, t({ normalizedScore: s }));
    expect(agg.avgScore).toBe(87.75);
  });
});
