import type { Descriptor } from '../../lib/api/types'
import { NOTA_DESCRIPTOR } from '../../lib/catalogo'
import { formatearDistancia, minutosAPie } from '../../lib/format'
import { Card } from '../../components/Card'
import { ScoreBadge } from '../../components/ScoreBadge'
import type { ResultadoRanking } from './ranking'
import s from './Recomendacion.module.css'

interface Props {
  resultado: ResultadoRanking
  pedidos: readonly Descriptor[]
  /** Posición en el ranking (0 = mejor). */
  posicion: number
}

export function ResultCard({ resultado, pedidos, posicion }: Props) {
  const { lugar, distanciaKm, similitud } = resultado
  const pct = Math.round(similitud * 100)
  const d = lugar.destacada
  return (
    <Card as="article" padded={false} className={s.card} aria-labelledby="resultado-nombre">
      <div className={s.cardHead}>
        <div className={s.cardTitles}>
          <span className={s.eyebrow}>{posicion === 0 ? 'Tu mejor opción cerca' : `Opción ${posicion + 1}`}</span>
          <h2 id="resultado-nombre" className={s.name}>
            {lugar.nombre}
          </h2>
          <span className={s.dist}>
            {formatearDistancia(distanciaKm)} · a pie {minutosAPie(distanciaKm)}
          </span>
        </div>
        <ScoreBadge
          puntaje={lugar.puntaje_promedio === null ? null : Math.round(lugar.puntaje_promedio)}
          size={64}
          sublabel="promedio"
          label={lugar.puntaje_promedio === null ? 'Sin puntaje' : `Promedio ${Math.round(lugar.puntaje_promedio)} puntos`}
        />
      </div>
      {d && (
        <dl className={s.facts}>
          <div className={s.fact}>
            <dt>Variedad</dt>
            <dd>{d.variedad}</dd>
          </div>
          <div className={s.fact}>
            <dt>Método</dt>
            <dd>{d.metodo}</dd>
          </div>
        </dl>
      )}
      <div className={s.match}>
        <div className={s.matchRow}>
          <span id="coincidencia">Coincidencia de notas</span>
          <span>{pct} %</span>
        </div>
        <div
          className={s.bar}
          role="meter"
          aria-labelledby="coincidencia"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={pct}
        >
          <div className={s.barFill} style={{ width: `${pct}%` }} />
        </div>
        {d && (
          <ul className={s.tags} aria-label="Notas">
            {d.notas.map((n) => {
              const desc = NOTA_DESCRIPTOR[n]
              const hit = desc !== undefined && pedidos.includes(desc)
              return (
                <li key={n} className={`${s.tag} ${hit ? s.hit : ''}`}>
                  {n}
                  {hit && <span className="sr-only"> (coincide)</span>}
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </Card>
  )
}
