import {
  formatRefreshToken,
  generateRefreshSecret,
  hashRefreshSecret,
  parseRefreshToken,
  secretMatches,
} from '../domain/refresh-token';

const ID = '0b7c0f6e-2f0e-4b8e-9d7c-1f5a8b2c3d4e';

describe('refresh token', () => {
  it('formatea y parsea', () => {
    const secret = generateRefreshSecret();
    expect(parseRefreshToken(formatRefreshToken(ID, secret))).toEqual({ id: ID, secret });
  });

  it.each(['', 'sin-punto', `no-uuid.${'x'.repeat(30)}`, `${ID}.corto`, `.${'x'.repeat(30)}`])('rechaza %p', (raw) => {
    expect(parseRefreshToken(raw)).toBeNull();
  });

  it('compara contra el hash guardado', () => {
    const secret = generateRefreshSecret();
    const hash = hashRefreshSecret(secret);
    expect(hash).toHaveLength(64);
    expect(secretMatches(secret, hash)).toBe(true);
    expect(secretMatches(generateRefreshSecret(), hash)).toBe(false);
  });
});
