import { NavLink } from 'react-router-dom'
import { Fab } from './Fab'
import { IconBitacora, IconMapa } from './icons'
import s from './BottomBar.module.css'

interface Props {
  accionesAbiertas: boolean
  onToggleAcciones: () => void
  accionesId: string
}

export function BottomBar({ accionesAbiertas, onToggleAcciones, accionesId }: Props) {
  // Con el menú abierto ninguna pestaña se marca activa (design/Acciones).
  const clase = ({ isActive }: { isActive: boolean }) =>
    `${s.tab} ${isActive && !accionesAbiertas ? s.active : ''}`
  return (
    <nav aria-label="Navegación principal" className={s.bar}>
      <div className={s.inner}>
        <NavLink to="/" end className={clase}>
          <IconMapa />
          Explorar
        </NavLink>
        <div className={s.spacer} />
        <NavLink to="/bitacora" className={clase}>
          <IconBitacora />
          Bitácora
        </NavLink>
        <Fab open={accionesAbiertas} onToggle={onToggleAcciones} controls={accionesId} />
      </div>
    </nav>
  )
}
