import type { Scale } from '../../catalog';

export const SCORE_RULES: Readonly<Record<Scale, { min: number; max: number; step: number }>> = {
  SCA: { min: 0, max: 100, step: 0.25 },
  Personal: { min: 1, max: 10, step: 0.5 },
};

const isMultipleOf = (value: number, step: number) => Math.abs(value / step - Math.round(value / step)) < 1e-9;

/** Devuelve un mensaje de error o null si el puntaje es válido para su escala. */
export function validateScore(scale: Scale, value: number): string | null {
  const rule = SCORE_RULES[scale];
  if (!Number.isFinite(value)) return 'puntaje debe ser un número';
  if (value < rule.min || value > rule.max) {
    return `puntaje fuera de rango para la escala ${scale} (${rule.min}–${rule.max})`;
  }
  if (!isMultipleOf(value, rule.step)) return `puntaje en escala ${scale} debe ir en pasos de ${rule.step}`;
  return null;
}

/**
 * Lleva el puntaje a 0–100 para promedios y ranking.
 * SCA ya está en 0–100; la escala personal (1–10) se multiplica por 10.
 */
export function normalizeScore(scale: Scale, value: number): number {
  const n = scale === 'SCA' ? value : value * 10;
  return Math.round(n * 100) / 100;
}

/** Clasificación SCA de un puntaje normalizado. */
export function scaClassification(normalized: number): string {
  if (normalized >= 90) return 'Excepcional';
  if (normalized >= 85) return 'Excelente';
  if (normalized >= 80) return 'Muy bueno';
  return 'Por debajo de especialidad';
}
