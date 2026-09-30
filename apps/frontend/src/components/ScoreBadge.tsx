import { formatearPuntaje } from '../lib/format'
import s from './ScoreBadge.module.css'

interface Props {
  puntaje: number | null
  size?: 48 | 64
  sublabel?: string
  /** Texto para lectores de pantalla, p. ej. "92 puntos SCA". */
  label?: string
}

export function ScoreBadge({ puntaje, size = 48, sublabel, label }: Props) {
  const texto = puntaje === null ? '–' : formatearPuntaje(puntaje)
  return (
    <div className={`${s.badge} ${s[`s${size}`]}`} role={label ? 'img' : undefined} aria-label={label}>
      <span aria-hidden={label ? true : undefined}>{texto}</span>
      {sublabel && (
        <span className={s.sub} aria-hidden={label ? true : undefined}>
          {sublabel}
        </span>
      )}
    </div>
  )
}
