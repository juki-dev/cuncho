/** Tolerancia para relojes de dispositivos adelantados. */
export const FUTURE_TOLERANCE_MS = 5 * 60 * 1000;
export const MIN_TASTING_DATE = new Date('2020-01-01T00:00:00Z');

/**
 * Fecha de la catación. El cliente offline envía `creado_en` (cuando se hizo la
 * catación, no cuando se sincronizó). Se rechazan fechas absurdas.
 */
export function resolveTastingDate(clientIso: string | undefined, now: Date): { date: Date } | { error: string } {
  if (!clientIso) return { date: now };
  const date = new Date(clientIso);
  if (Number.isNaN(date.getTime())) return { error: 'creado_en no es una fecha válida' };
  if (date.getTime() > now.getTime() + FUTURE_TOLERANCE_MS) return { error: 'creado_en no puede estar en el futuro' };
  if (date < MIN_TASTING_DATE) return { error: 'creado_en es demasiado antiguo' };
  return { date };
}
