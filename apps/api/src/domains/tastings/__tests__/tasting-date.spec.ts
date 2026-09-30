import { resolveTastingDate } from '../domain/tasting-date';

const now = new Date('2026-09-29T12:00:00Z');

describe('resolveTastingDate', () => {
  it('sin fecha usa ahora', () => {
    expect(resolveTastingDate(undefined, now)).toEqual({ date: now });
  });

  it.each`
    iso                            | ok
    ${'2026-09-28T16:40:00-05:00'} | ${true}
    ${'2026-09-29T12:04:00Z'}      | ${true}
    ${'2026-09-29T12:06:00Z'}      | ${false}
    ${'2019-12-31T23:59:59Z'}      | ${false}
    ${'no-es-fecha'}               | ${false}
  `('$iso → ok: $ok', ({ iso, ok }) => {
    expect('date' in resolveTastingDate(iso, now)).toBe(ok);
  });
});
