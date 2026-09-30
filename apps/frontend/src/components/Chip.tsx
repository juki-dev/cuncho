import type { ButtonHTMLAttributes } from 'react'
import s from './Chip.module.css'

export interface ChipProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'aria-pressed'> {
  selected: boolean
  /** Fondo crema en lugar de superficie (tarjetas del paso sensorial). */
  muted?: boolean
  full?: boolean
}

export function Chip({ selected, muted, full, className, ...rest }: ChipProps) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      className={[s.chip, muted && s.muted, full && s.full, className].filter(Boolean).join(' ')}
      {...rest}
    />
  )
}
