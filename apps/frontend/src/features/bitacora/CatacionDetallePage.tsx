import { useNavigate, useParams } from 'react-router-dom'
import { useCatacion, usePendientes } from '../../lib/api/queries'
import type { NuevaCatacion } from '../../lib/api/types'
import { clasificarSca, DESCRIPTORES } from '../../lib/catalogo'
import { formatearCoordenadas, formatearFechaLarga } from '../../lib/format'
import { Card } from '../../components/Card'
import { ScoreBadge } from '../../components/ScoreBadge'
import { StepHeader } from '../../components/StepHeader'
import { StepLayout } from '../../components/StepLayout'
import { IconNube } from '../../components/icons'
import s from './CatacionDetalle.module.css'

const ETIQUETA_DESCRIPTOR = Object.fromEntries(DESCRIPTORES.map((d) => [d.id, d.etiqueta]))

/** Detalle de una catación de la bitácora (enviada o pendiente de sincronizar). */
export function CatacionDetallePage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  // Las pendientes viven solo en la cola local (ids `pend_…`); las demás vienen de la API.
  const esPendiente = id.startsWith('pend_')
  const pendientes = usePendientes()
  const remota = useCatacion(id, !esPendiente)
  const catacion: NuevaCatacion | undefined = esPendiente
    ? pendientes.data?.find((p) => p.id === id)?.payload
    : remota.data
  const cargando = esPendiente ? pendientes.isPending : remota.isPending

  const volver = () => navigate('/bitacora')

  if (!catacion) {
    return (
      <StepLayout header={<StepHeader eyebrow="Bitácora" title="Catación" onBack={volver} backLabel="Volver a la bitácora" />}>
        <p className={s.empty}>{cargando ? 'Cargando la catación…' : 'No encontramos esta catación en tu bitácora.'}</p>
      </StepLayout>
    )
  }

  const { lugar, grano, sensorial } = catacion
  const sca = sensorial.escala === 'SCA'
  const camposGrano = [
    ['Variedad', grano.variedad],
    ['Finca', grano.finca],
    ['Región', grano.region],
    ['Proceso', grano.proceso],
    ['Método', grano.metodo],
  ].filter(([, v]) => v)

  return (
    <StepLayout
      gap={14}
      header={
        <StepHeader
          eyebrow={formatearFechaLarga(catacion.creado_en)}
          title={lugar.nombre}
          onBack={volver}
          backLabel="Volver a la bitácora"
        />
      }
    >
      {esPendiente && (
        <span className={s.sync}>
          <IconNube size={14} />
          Pendiente de sincronizar
        </span>
      )}

      <Card className={s.score}>
        <ScoreBadge
          puntaje={sensorial.puntaje}
          size={64}
          label={sca ? `${sensorial.puntaje} puntos SCA` : `${sensorial.puntaje} de 10, escala personal`}
        />
        <div>
          <p className={s.scoreTitle}>{sca ? clasificarSca(sensorial.puntaje) : 'Escala personal'}</p>
          <p className={s.muted}>{sca ? 'Puntaje SCA · de 100' : 'Puntaje de 10'}</p>
        </div>
      </Card>

      <Card as="section" aria-labelledby="det-grano">
        <h2 id="det-grano" className={s.section}>Grano</h2>
        <dl className={s.fields}>
          {camposGrano.map(([k, v]) => (
            <div key={k} className={s.field}>
              <dt>{k}</dt>
              <dd>{v}</dd>
            </div>
          ))}
        </dl>
      </Card>

      <Card as="section" aria-labelledby="det-sensorial">
        <h2 id="det-sensorial" className={s.section}>Perfil sensorial</h2>
        <div className={s.acidez}>
          <div className={s.acidezRow}>
            <span className={s.label}>Acidez</span>
            <span className={s.value}>
              {sensorial.acidez.tipo} · {sensorial.acidez.nivel}/5
            </span>
          </div>
          <div className={s.meter} aria-hidden="true">
            {[1, 2, 3, 4, 5].map((n) => (
              <span key={n} className={`${s.seg} ${n <= sensorial.acidez.nivel ? s.on : ''}`} />
            ))}
          </div>
        </div>

        <span className={s.label}>Notas de sabor</span>
        <ul className={s.tags} aria-label="Notas de sabor">
          {sensorial.notas.map((n) => (
            <li key={n} className={s.tag}>
              {n}
            </li>
          ))}
        </ul>

        {sensorial.descriptores.length > 0 && (
          <>
            <span className={s.label}>Familias</span>
            <ul className={s.tags} aria-label="Familias de sabor">
              {sensorial.descriptores.map((d) => (
                <li key={d} className={`${s.tag} ${s.descriptor}`}>
                  {ETIQUETA_DESCRIPTOR[d] ?? d}
                </li>
              ))}
            </ul>
          </>
        )}
      </Card>

      <Card as="section" aria-labelledby="det-lugar">
        <h2 id="det-lugar" className={s.section}>Lugar</h2>
        <p className={s.value}>{lugar.nombre}</p>
        <p className={s.muted}>{formatearCoordenadas(lugar.lat, lugar.lng)}</p>
      </Card>
    </StepLayout>
  )
}
