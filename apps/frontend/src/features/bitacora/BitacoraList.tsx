import { Link } from 'react-router-dom'
import type { NuevaCatacion } from '../../lib/api/types'
import { formatearFechaCorta } from '../../lib/format'
import { ScoreBadge } from '../../components/ScoreBadge'
import { IconNube } from '../../components/icons'
import s from './Bitacora.module.css'

export interface EntradaBitacora {
  id: string
  pendiente: boolean
  catacion: NuevaCatacion
}

export function BitacoraList({ entradas }: { entradas: readonly EntradaBitacora[] }) {
  return (
    <ul className={s.list}>
      {entradas.map(({ id, pendiente, catacion: c }) => {
        const { puntaje, escala } = c.sensorial
        return (
          <li key={id}>
            <Link to={`/bitacora/${encodeURIComponent(id)}`} className={s.link}>
              <article className={`${s.entry} ${pendiente ? s.pending : ''}`}>
                <ScoreBadge
                  puntaje={puntaje}
                  label={escala === 'SCA' ? `${puntaje} puntos SCA` : `${puntaje} de 10, escala personal`}
                />
                <div className={s.body}>
                  <div className={s.row}>
                    <h2 className={s.place}>{c.lugar.nombre}</h2>
                    <time className={s.date} dateTime={c.creado_en}>
                      {formatearFechaCorta(c.creado_en)}
                    </time>
                  </div>
                  <p className={s.grain}>{[c.grano.variedad, c.grano.proceso, c.grano.metodo].join(' · ')}</p>
                  <ul className={s.tags} aria-label="Notas">
                    {c.sensorial.notas.map((n) => (
                      <li key={n} className={s.tag}>
                        {n}
                      </li>
                    ))}
                  </ul>
                  {pendiente && (
                    <span className={s.sync}>
                      <IconNube size={14} />
                      Pendiente de sincronizar
                    </span>
                  )}
                </div>
              </article>
            </Link>
          </li>
        )
      })}
    </ul>
  )
}
