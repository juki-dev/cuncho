import { sanitizeUrl } from '../logger.module';

describe('sanitizeUrl', () => {
  it('oculta coordenadas y cursores, conserva el resto', () => {
    const out = sanitizeUrl('/api/v1/recommendations?lat=5.0689&lng=-75.5174&descriptors=frutal&cursor=abc');
    expect(out).not.toContain('5.0689');
    expect(out).not.toContain('-75.5174');
    expect(out).not.toContain('abc');
    expect(out).toContain('descriptors=frutal');
  });

  it('deja intactas las URLs sin query', () => {
    expect(sanitizeUrl('/health')).toBe('/health');
  });
});
