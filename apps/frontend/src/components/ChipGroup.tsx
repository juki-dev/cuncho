import type { ReactNode } from 'react'
import { Chip } from './Chip'
import s from './ChipGroup.module.css'

interface Base<T extends string> {
  legend: ReactNode
  options: readonly T[]
  /** Texto a la derecha de la leyenda (p. ej. "3 notas"). Se anuncia al cambiar. */
  aside?: ReactNode
  layout?: 'wrap' | 'grid2'
  muted?: boolean
  labelFor?: (o: T) => ReactNode
  id?: string
}

interface Unica<T extends string> extends Base<T> {
  multiple?: false
  value: T | null
  onChange: (v: T) => void
}

interface Multiple<T extends string> extends Base<T> {
  multiple: true
  value: readonly T[]
  onChange: (v: T) => void
}

/** Grupo de chips con fieldset/legend. `onChange` recibe la opción tocada. */
export function ChipGroup<T extends string>(props: Unica<T> | Multiple<T>) {
  const { legend, options, aside, layout = 'wrap', muted, labelFor, id } = props
  const activo = (o: T) => (props.multiple ? props.value.includes(o) : props.value === o)
  return (
    <fieldset className={s.fieldset} id={id}>
      <legend className={s.legend}>
        <span>{legend}</span>
        {aside !== undefined && (
          <span className={s.aside} aria-live="polite">
            {aside}
          </span>
        )}
      </legend>
      <div className={layout === 'grid2' ? s.grid2 : s.wrap}>
        {options.map((o) => (
          <Chip key={o} selected={activo(o)} muted={muted} full={layout === 'grid2'} onClick={() => props.onChange(o)}>
            {labelFor ? labelFor(o) : o}
          </Chip>
        ))}
      </div>
    </fieldset>
  )
}
