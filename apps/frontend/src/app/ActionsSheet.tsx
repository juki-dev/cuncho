import { Link } from 'react-router-dom'
import { BottomSheet } from '../components/BottomSheet'
import { IconPinEstrella, IconSiguiente, IconTaza } from '../components/icons'
import s from './ActionsSheet.module.css'

interface Props {
  id: string
  open: boolean
  onClose: () => void
}

/** Menú del FAB (design/Acciones): modal sobre la ruta actual. */
export function ActionsSheet({ id, open, onClose }: Props) {
  return (
    <BottomSheet
      id={id}
      open={open}
      onClose={onClose}
      withBottomBar
      title="¿Qué quieres hacer?"
      description="Registra lo que estás tomando o deja que el mapa te sugiera una taza."
    >
      <Link to="/catar/lugar" className={s.option} onClick={onClose}>
        <span className={`${s.icon} ${s.iconAccent}`}>
          <IconTaza />
        </span>
        <span className={s.texts}>
          <span className={s.label}>Registrar catación guiada</span>
          <span className={s.hint}>3 pasos · lugar, ficha del grano y evaluación sensorial</span>
        </span>
        <IconSiguiente className={s.chev} />
      </Link>
      <Link to="/recomendar" className={s.option} onClick={onClose}>
        <span className={`${s.icon} ${s.iconNeutral}`}>
          <IconPinEstrella />
        </span>
        <span className={s.texts}>
          <span className={s.label}>Pedir recomendación</span>
          <span className={s.hint}>Elige las notas que te provocan y te mostramos la mejor taza cerca</span>
        </span>
        <IconSiguiente className={s.chev} />
      </Link>
    </BottomSheet>
  )
}
