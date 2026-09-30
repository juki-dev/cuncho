import { ValueTransformer } from 'typeorm';

/** pg devuelve `numeric` como string; lo convertimos a number (precisión suficiente para puntajes). */
export const numericTransformer: ValueTransformer = {
  to: (v: number | null | undefined) => v,
  from: (v: string | null) => (v == null ? null : Number(v)),
};
