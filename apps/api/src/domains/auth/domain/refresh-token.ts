import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';

/**
 * Refresh token opaco con formato `<id>.<secreto>`. En base solo se guarda el
 * SHA-256 del secreto (alta entropía: no necesita argon2).
 */
export interface ParsedRefreshToken {
  id: string;
  secret: string;
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function generateRefreshSecret(): string {
  return randomBytes(32).toString('base64url');
}

export function hashRefreshSecret(secret: string): string {
  return createHash('sha256').update(secret).digest('hex');
}

export function formatRefreshToken(id: string, secret: string): string {
  return `${id}.${secret}`;
}

export function parseRefreshToken(token: string): ParsedRefreshToken | null {
  const dot = token.indexOf('.');
  if (dot <= 0) return null;
  const id = token.slice(0, dot);
  const secret = token.slice(dot + 1);
  if (!UUID_RE.test(id) || secret.length < 20) return null;
  return { id, secret };
}

export function secretMatches(secret: string, storedHash: string): boolean {
  const a = Buffer.from(hashRefreshSecret(secret), 'hex');
  const b = Buffer.from(storedHash, 'hex');
  return a.length === b.length && timingSafeEqual(a, b);
}
