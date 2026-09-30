import type { Descriptor } from '../../lib/api/types'
import { DESCRIPTORES } from '../../lib/catalogo'
import s from './Recomendacion.module.css'

interface Props {
  value: readonly Descriptor[]
  onToggle: (d: Descriptor) => void
}

export function DescriptorPicker({ value, onToggle }: Props) {
  return (
    <fieldset className={s.fieldset}>
      <legend className="sr-only">Familias de sabor</legend>
      <div className={s.grid}>
        {DESCRIPTORES.map((d) => (
          <button
            key={d.id}
            type="button"
            className={s.desc}
            aria-pressed={value.includes(d.id)}
            onClick={() => onToggle(d.id)}
          >
            <span className={s.descLabel}>{d.etiqueta}</span>
            <span className={s.descHint}>{d.pista}</span>
          </button>
        ))}
      </div>
    </fieldset>
  )
}
