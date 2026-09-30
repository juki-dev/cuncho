import type { calcularStats } from './calcularStats'
import { formatearPuntaje } from '../../lib/format'
import s from './Bitacora.module.css'

export function Stats(props: ReturnType<typeof calcularStats>) {
  return (
    <dl className={s.stats}>
      <div className={s.stat}>
        <dt>Cataciones</dt>
        <dd>{props.total}</dd>
      </div>
      <div className={s.stat}>
        <dt>Promedio SCA</dt>
        <dd>{props.promedioSca === null ? '–' : formatearPuntaje(Math.round(props.promedioSca * 100) / 100)}</dd>
      </div>
      <div className={s.stat}>
        <dt>Cafeterías</dt>
        <dd>{props.cafeterias}</dd>
      </div>
    </dl>
  )
}
