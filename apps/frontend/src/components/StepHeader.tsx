import { IconVolver } from './icons'
import s from './StepHeader.module.css'

interface Props {
  eyebrow: string
  title: string
  onBack: () => void
  backLabel?: string
  /** Paso actual (1-based) y total; sin esto no se dibuja la barra de progreso. */
  step?: number
  total?: number
}

export function StepHeader({ eyebrow, title, onBack, backLabel = 'Volver', step, total }: Props) {
  return (
    <header className={s.header}>
      <div className={s.row}>
        <button type="button" className={s.back} aria-label={backLabel} onClick={onBack}>
          <IconVolver />
        </button>
        <div className={s.titles}>
          <span className={s.eyebrow}>{eyebrow}</span>
          <h1 className={s.title}>{title}</h1>
        </div>
      </div>
      {step !== undefined && total !== undefined && (
        <div className={s.progress} aria-hidden="true">
          {Array.from({ length: total }, (_, i) => (
            <span key={i} className={`${s.seg} ${i < step ? s.done : ''}`} />
          ))}
        </div>
      )}
    </header>
  )
}
