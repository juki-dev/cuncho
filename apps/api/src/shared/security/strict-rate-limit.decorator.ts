import { ExecutionContext, SetMetadata } from '@nestjs/common';

export const STRICT_RATE_LIMIT_KEY = 'strictRateLimit';
/** Nombre del throttler con límite estricto (definido en AppModule). */
export const STRICT_THROTTLER = 'strict';

/** Aplica además el throttler estricto (p. ej. /auth/*). */
export const StrictRateLimit = () => SetMetadata(STRICT_RATE_LIMIT_KEY, true);

/** `skipIf` del throttler estricto: se salta en rutas no marcadas. */
export const skipUnlessStrict = (ctx: ExecutionContext): boolean =>
  !(
    Reflect.getMetadata(STRICT_RATE_LIMIT_KEY, ctx.getHandler()) ||
    Reflect.getMetadata(STRICT_RATE_LIMIT_KEY, ctx.getClass())
  );
