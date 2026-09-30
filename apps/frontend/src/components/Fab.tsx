import { IconCerrar, IconMas } from './icons'
import s from './Fab.module.css'

interface Props {
  open: boolean
  onToggle: () => void
  controls: string
}

export function Fab({ open, onToggle, controls }: Props) {
  return (
    <button
      type="button"
      className={`${s.fab} ${open ? s.open : ''}`}
      aria-label={open ? 'Cerrar acciones' : 'Abrir acciones'}
      aria-expanded={open}
      aria-controls={controls}
      onClick={onToggle}
    >
      {open ? <IconCerrar /> : <IconMas />}
    </button>
  )
}
