import { UnauthorizedException } from '@nestjs/common';
import { createLocalJWKSet, exportJWK, generateKeyPair, SignJWT, type JWK } from 'jose';
import { TypedConfigService } from '../../../shared/config';
import { JoseCognitoVerifier } from '../infrastructure/cognito-verifier';

const POOL = 'us-east-1_TestPool1';
const ISSUER = `https://cognito-idp.us-east-1.amazonaws.com/${POOL}`;
const CLIENT = 'client-abc';

const configWith = (cognito: { issuer: string; clientId: string } | null) =>
  ({ get: () => cognito }) as unknown as TypedConfigService;

async function setup() {
  const { publicKey, privateKey } = await generateKeyPair('RS256');
  const jwk: JWK = { ...(await exportJWK(publicKey)), kid: 'k1', alg: 'RS256', use: 'sig' };
  const other = await generateKeyPair('RS256');
  const verifier = new JoseCognitoVerifier(configWith({ issuer: ISSUER, clientId: CLIENT })).useKeysForTesting(
    createLocalJWKSet({ keys: [jwk] }),
  );
  const sign = (claims: Record<string, unknown> = {}, opts: { key?: Awaited<ReturnType<typeof generateKeyPair>>['privateKey']; iss?: string; aud?: string; exp?: string } = {}) =>
    new SignJWT({ token_use: 'id', email: 'ana@example.com', email_verified: true, name: 'Ana', ...claims })
      .setProtectedHeader({ alg: 'RS256', kid: 'k1' })
      .setSubject('sub-123')
      .setIssuer(opts.iss ?? ISSUER)
      .setAudience(opts.aud ?? CLIENT)
      .setIssuedAt()
      .setExpirationTime(opts.exp ?? '5m')
      .sign(opts.key ?? privateKey);
  return { verifier, sign, otherKey: other.privateKey };
}

describe('JoseCognitoVerifier', () => {
  it('acepta un ID token válido y devuelve la identidad', async () => {
    const { verifier, sign } = await setup();
    await expect(verifier.verify(await sign())).resolves.toEqual({ sub: 'sub-123', email: 'ana@example.com', name: 'Ana' });
  });

  it('acepta email_verified como cadena "true" y nombre ausente', async () => {
    const { verifier, sign } = await setup();
    const id = await verifier.verify(await sign({ email_verified: 'true', name: undefined }));
    expect(id.name).toBe('');
  });

  it.each([
    ['firma de otra llave', { opts: 'otherKey' }],
    ['emisor distinto', { opts: { iss: 'https://cognito-idp.us-east-1.amazonaws.com/otro' } }],
    ['audiencia distinta (otro app client)', { opts: { aud: 'otro-client' } }],
    ['token expirado', { opts: { exp: '-1m' } }],
    ['access token en vez de ID token', { claims: { token_use: 'access' } }],
    ['correo sin verificar', { claims: { email_verified: false } }],
    ['sin correo', { claims: { email: undefined } }],
  ])('rechaza: %s', async (_nombre, caso: { claims?: Record<string, unknown>; opts?: unknown }) => {
    const { verifier, sign, otherKey } = await setup();
    const opts = caso.opts === 'otherKey' ? { key: otherKey } : (caso.opts as object | undefined);
    await expect(verifier.verify(await sign(caso.claims, opts))).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('rechaza un token mal formado', async () => {
    const { verifier } = await setup();
    await expect(verifier.verify('no-es-un-jwt')).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('desactivado (sin configuración) no valida nada', async () => {
    const v = new JoseCognitoVerifier(configWith(null));
    expect(v.enabled).toBe(false);
    await expect(v.verify('x')).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
