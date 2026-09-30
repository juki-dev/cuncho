const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const isUuid = (v: string): boolean => UUID_RE.test(v);

/**
 * Resuelve el id de la catación a partir del `id` del cuerpo y/o el header
 * `Idempotency-Key`. Si vienen ambos deben coincidir.
 */
export function resolveTastingId(
  bodyId: string | undefined,
  headerKey: string | undefined,
  generate: () => string,
): { id: string; clientProvided: boolean } | { error: string } {
  const header = headerKey?.trim() || undefined;
  if (header && !isUuid(header)) return { error: 'Idempotency-Key debe ser un UUID' };
  if (bodyId && header && bodyId.toLowerCase() !== header.toLowerCase()) {
    return { error: 'El id del cuerpo y el header Idempotency-Key no coinciden' };
  }
  const id = bodyId ?? header;
  return id ? { id: id.toLowerCase(), clientProvided: true } : { id: generate(), clientProvided: false };
}
