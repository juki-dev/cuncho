import { BadRequestException } from '@nestjs/common';

/** Posición en un listado ordenado por (created_at DESC, id DESC). */
export interface Cursor {
  createdAt: string;
  id: string;
}

export function encodeCursor(c: Cursor): string {
  return Buffer.from(JSON.stringify([c.createdAt, c.id]), 'utf8').toString('base64url');
}

export function decodeCursor(raw: string): Cursor {
  try {
    const parsed: unknown = JSON.parse(Buffer.from(raw, 'base64url').toString('utf8'));
    if (
      Array.isArray(parsed) &&
      parsed.length === 2 &&
      typeof parsed[0] === 'string' &&
      typeof parsed[1] === 'string' &&
      !Number.isNaN(Date.parse(parsed[0]))
    ) {
      return { createdAt: parsed[0], id: parsed[1] };
    }
  } catch {
    // cae al error de abajo
  }
  throw new BadRequestException('cursor inválido');
}
