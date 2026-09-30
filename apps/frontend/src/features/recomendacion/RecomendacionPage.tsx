import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLugaresCercanos } from '../../lib/api/queries'
import type { Descriptor } from '../../lib/api/types'
import { CENTRO_POR_DEFECTO, RADIO_RECOMENDACION_KM } from '../../lib/config'
import { Button } from '../../components/Button'
import { StepHeader } from '../../components/StepHeader'
import { StepLayout } from '../../components/StepLayout'
import { IconRadio } from '../../components/icons'
import type { EstadoAcciones } from '../../app/TabsLayout'
import type { EstadoExplorar } from '../map/ExplorarPage'
import { useGeolocation } from '../map/useGeolocation'
import { DescriptorPicker } from './DescriptorPicker'
import { ResultCard } from './ResultCard'
import { rankear } from './ranking'
import s from './Recomendacion.module.css'

export function RecomendacionPage() {
  const navigate = useNavigate()
  const geo = useGeolocation({ solicitar: true })
  const [pedidos, setPedidos] = useState<Descriptor[]>([])
  const [rank, setRank] = useState(0)

  const sinGps = geo.permiso === 'denied' || geo.permiso === 'unsupported'
  const origen = geo.posicion ?? (sinGps ? CENTRO_POR_DEFECTO : null)
  const cercanos = useLugaresCercanos(origen, RADIO_RECOMENDACION_KM)

  // SUPUESTO: no hay endpoint de recomendación; se rankea en el cliente.
  const ranking = useMemo(
    () => (origen && cercanos.data ? rankear(cercanos.data, origen, pedidos, { radioKm: RADIO_RECOMENDACION_KM }) : []),
    [cercanos.data, origen, pedidos],
  )

  const alternar = (d: Descriptor) => {
    setRank(0)
    setPedidos((p) => (p.includes(d) ? p.filter((x) => x !== d) : [...p, d]))
  }

  const actual = ranking.length ? ranking[rank % ranking.length] : undefined
  const alternativas = Math.max(0, ranking.length - 1)

  let vacio: string | null = null
  if (pedidos.length === 0) vacio = 'Elige al menos una familia de sabor para buscar tu taza.'
  else if (!origen) vacio = 'Esperando tu ubicación…'
  else if (cercanos.isPending) vacio = 'Buscando cataciones cerca…'
  else if (cercanos.isError) vacio = 'No pudimos consultar las cataciones cercanas. Revisa tu conexión.'
  else if (!actual) vacio = `No encontramos cataciones con esas notas a menos de ${RADIO_RECOMENDACION_KM} km. Prueba con otra familia.`

  return (
    <StepLayout
      gap={14}
      header={
        <StepHeader
          eyebrow="Recomendación"
          title="¿Qué te provoca hoy?"
          onBack={() => navigate('/', { state: { abrirAcciones: true } satisfies EstadoAcciones })}
        />
      }
    >
      <DescriptorPicker value={pedidos} onToggle={alternar} />

      <p className={s.radio}>
        <IconRadio />
        {sinGps
          ? `Sin GPS: buscando en ${RADIO_RECOMENDACION_KM} km alrededor del centro del mapa`
          : `Buscando cataciones en un radio de ${RADIO_RECOMENDACION_KM} km`}
      </p>

      <div aria-live="polite">
        {actual ? (
          <ResultCard resultado={actual} pedidos={pedidos} posicion={rank % ranking.length} />
        ) : (
          <p className={s.empty}>{vacio}</p>
        )}
      </div>

      {actual && (
        <div className={s.actions}>
          <Button
            size="md"
            grow
            onClick={() => navigate('/', { state: { recomendado: actual.lugar } satisfies EstadoExplorar })}
          >
            Ver en el mapa
          </Button>
          <Button size="md" variant="secondary" grow disabled={alternativas === 0} onClick={() => setRank((r) => r + 1)}>
            Otra opción ({alternativas})
          </Button>
        </div>
      )}
    </StepLayout>
  )
}
