import { resolveTastingId } from '../domain/idempotency';

const A = '0b7c0f6e-2f0e-4b8e-9d7c-1f5a8b2c3d4e';
const B = '1c8d1f7f-3f1f-4c9f-8e8d-2f6b9c3d4e5f';
const gen = () => 'generated';

describe('resolveTastingId', () => {
  it.each`
    body         | header       | expected
    ${A}         | ${undefined} | ${{ id: A, clientProvided: true }}
    ${undefined} | ${A}         | ${{ id: A, clientProvided: true }}
    ${A}         | ${A.toUpperCase()} | ${{ id: A, clientProvided: true }}
    ${undefined} | ${undefined} | ${{ id: 'generated', clientProvided: false }}
    ${undefined} | ${'  '}      | ${{ id: 'generated', clientProvided: false }}
    ${A}         | ${B}         | ${{ error: expect.stringContaining('no coinciden') }}
    ${undefined} | ${'abc'}     | ${{ error: expect.stringContaining('UUID') }}
  `('body=$body header=$header', ({ body, header, expected }) => {
    expect(resolveTastingId(body, header, gen)).toEqual(expected);
  });
});
