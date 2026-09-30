import type { ReactNode } from 'react'
import s from './RangeField.module.css'

interface Props {
  id: string
  label: ReactNode
  min: number
  max: number
  step: number
  value: number
  onChange: (v: number) => void
  /** Texto que leen los lectores de pantalla en lugar del número. */
  valueText?: string
  /** Etiqueta visible junto al label (p. ej. "Cítrica"). */
  badge?: ReactNode
  /** Contenido entre el encabezado y el slider. */
  children?: ReactNode
  ticks?: readonly string[]
  /** Controles extra a la derecha del label (p. ej. selector de escala). */
  trailing?: ReactNode
}

export function RangeField({ id, label, min, max, step, value, onChange, valueText, badge, children, ticks, trailing }: Props) {
  return (
    <>
      <div className={s.top}>
        <label htmlFor={id} className={s.label}>
          {label}
        </label>
        {badge !== undefined && (
          <span className={s.badge} aria-hidden="true">
            {badge}
          </span>
        )}
        {trailing}
      </div>
      {children}
      <input
        id={id}
        type="range"
        className={s.range}
        min={min}
        max={max}
        step={step}
        value={value}
        aria-valuetext={valueText}
        onChange={(e) => onChange(Number(e.target.value))}
      />
      {ticks && (
        <div className={s.ticks} aria-hidden="true">
          {ticks.map((t) => (
            <span key={t}>{t}</span>
          ))}
        </div>
      )}
    </>
  )
}
