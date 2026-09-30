import { useEffect, useId, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { MapContainer, useMap, AttributionControl } from 'react-leaflet'
import { useLugaresCercanos } from '../../lib/api/queries'
import type { LugarCercano } from '../../lib/api/types'
import { RADIO_CERCANAS_KM, UMBRAL_DETECTADO_KM } from '../../lib/config'
import { formatearCoordenadas, formatearDistancia } from '../../lib/format'
import { Button } from '../../components/Button'
import { BottomSheet } from '../../components/BottomSheet'
import { Card } from '../../components/Card'
import { StepHeader } from '../../components/StepHeader'
import { StepLayout } from '../../components/StepLayout'
import { IconGps, IconMas } from '../../components/icons'
import { CartoTiles } from '../map/MapView'
import { UserLocation } from '../map/UserLocation'
import { useGeolocation, type Posicion } from '../map/useGeolocation'
import type { EstadoAcciones } from '../../app/TabsLayout'
import { useBorradorHidratado, useCatacionDraft } from './useCatacionDraft'
import c from './Catacion.module.css'
import s from './Paso1Lugar.module.css'

const plural = (n: number) => (n === 1 ? '1 catación' : `${n} cataciones`)

function Recentrar({ posicion }: { posicion: Posicion }) {
  const map = useMap()
  useEffect(() => {
    map.setView([posicion.lat, posicion.lng], map.getZoom(), { animate: false })
  }, [map, posicion.lat, posicion.lng])
  return null
}

/** Mapa pequeño y estático con el punto del usuario. */
function MiniMapa({ posicion }: { posicion: Posicion }) {
  return (
    <MapContainer
      center={[posicion.lat, posicion.lng]}
      zoom={16}
      className={s.miniMap}
      zoomControl={false}
      attributionControl={false}
      dragging={false}
      touchZoom={false}
      doubleClickZoom={false}
      scrollWheelZoom={false}
      boxZoom={false}
      keyboard={false}
      aria-hidden="true"
    >
      <CartoTiles />
      <AttributionControl position="bottomright" prefix={false} />
      <UserLocation posicion={posicion} />
      <Recentrar posicion={posicion} />
    </MapContainer>
  )
}

export function Paso1Lugar() {
  const navigate = useNavigate()
  const geo = useGeolocation({ solicitar: true })
  const hidratado = useBorradorHidratado()
  const lugar = useCatacionDraft((st) => st.lugar)
  const setLugar = useCatacionDraft((st) => st.setLugar)
  const cercanos = useLugaresCercanos(geo.posicion, RADIO_CERCANAS_KM)
  const [error, setError] = useState<string | null>(null)
  const [hojaNueva, setHojaNueva] = useState(false)
  const [nombreNuevo, setNombreNuevo] = useState('')
  const nombreId = useId()
  const tituloId = useId()

  const lista: LugarCercano[] = (cercanos.data ?? []).slice().sort((a, b) => a.distancia_km - b.distancia_km).slice(0, 6)
  const detectado = lista[0] && lista[0].distancia_km <= UMBRAL_DETECTADO_KM ? lista[0] : null

  // Preselecciona la cafetería donde está el usuario si el borrador no tiene lugar.
  useEffect(() => {
    if (hidratado && !lugar && detectado) {
      const { id, nombre, lat, lng } = detectado
      setLugar({ id, nombre, lat, lng })
    }
  }, [hidratado, lugar, detectado, setLugar])

  const continuar = () => {
    if (!lugar) {
      setError('Elige una cafetería o registra un lugar nuevo.')
      return
    }
    navigate('/catar/grano')
  }

  const crearLugar = (e: FormEvent) => {
    e.preventDefault()
    const nombre = nombreNuevo.trim()
    if (!nombre || !geo.posicion) return
    setLugar({ nombre, lat: geo.posicion.lat, lng: geo.posicion.lng })
    setHojaNueva(false)
    setNombreNuevo('')
    setError(null)
  }

  const lugarNuevo = lugar && !lugar.id ? lugar : null

  let estadoGps: string
  if (geo.posicion) {
    estadoGps = `${formatearCoordenadas(geo.posicion.lat, geo.posicion.lng)} · precisión ±${Math.round(geo.posicion.accuracy)} m`
  } else if (geo.permiso === 'denied') {
    estadoGps = 'Sin permiso de ubicación. Actívalo en los ajustes del navegador para ver cafeterías cercanas.'
  } else if (geo.permiso === 'unsupported') {
    estadoGps = 'Tu navegador no permite geolocalización.'
  } else {
    estadoGps = geo.error ?? 'Buscando tu ubicación…'
  }

  return (
    <StepLayout
      header={
        <StepHeader
          eyebrow="Paso 1 de 3 · Lugar"
          title="¿Dónde estás catando?"
          step={1}
          total={3}
          onBack={() => navigate('/', { state: { abrirAcciones: true } satisfies EstadoAcciones })}
        />
      }
      error={error}
      footer={
        <Button block onClick={continuar}>
          {lugar ? `Continuar con ${lugar.nombre}` : 'Continuar'}
        </Button>
      }
    >
      <Card padded={false} className={s.gpsCard}>
        {geo.posicion ? (
          <MiniMapa posicion={geo.posicion} />
        ) : (
          <div className={s.miniMap}>
            <p className={s.placeholder}>{geo.permiso === 'denied' ? 'Ubicación no disponible' : 'Buscando señal GPS…'}</p>
          </div>
        )}
        <div className={s.coords} role="status">
          <IconGps size={18} />
          <span>{estadoGps}</span>
        </div>
      </Card>

      <h2 id={tituloId} className={c.sectionTitle}>
        Cafeterías cercanas
      </h2>
      <div className={s.list} role="group" aria-labelledby={tituloId}>
        {lugarNuevo && (
          <button type="button" className={s.place} aria-pressed="true">
            <span className={s.placeText}>
              <span className={s.placeName}>{lugarNuevo.nombre}</span>
              <span className={s.placeMeta}>Lugar nuevo · en tu ubicación actual</span>
            </span>
            <span className={s.dot} aria-hidden="true" />
          </button>
        )}
        {lista.map((l) => {
          const activo = lugar?.id === l.id
          return (
            <button
              key={l.id}
              type="button"
              className={s.place}
              aria-pressed={activo}
              onClick={() => {
                setLugar({ id: l.id, nombre: l.nombre, lat: l.lat, lng: l.lng })
                setError(null)
              }}
            >
              <span className={s.placeText}>
                <span className={s.placeName}>{l.nombre}</span>
                <span className={s.placeMeta}>
                  {l === detectado ? `Detectada por GPS · ${plural(l.total_cataciones)}` : plural(l.total_cataciones)}
                </span>
              </span>
              <span className={s.placeDist}>
                <span className="sr-only">a </span>
                {formatearDistancia(l.distancia_km)}
              </span>
              <span className={s.dot} aria-hidden="true" />
            </button>
          )
        })}
        {/* Lugar elegido antes (borrador) que ya no aparece en la lista. */}
        {lugar?.id && !lista.some((l) => l.id === lugar.id) && (
          <button type="button" className={s.place} aria-pressed="true">
            <span className={s.placeText}>
              <span className={s.placeName}>{lugar.nombre}</span>
              <span className={s.placeMeta}>Elegido anteriormente</span>
            </span>
            <span className={s.dot} aria-hidden="true" />
          </button>
        )}
        {geo.posicion && cercanos.isPending && <p className={s.estado}>Buscando cafeterías cercanas…</p>}
        {cercanos.isError && <p className={s.estado}>No pudimos cargar las cafeterías cercanas.</p>}
        {cercanos.isSuccess && lista.length === 0 && (
          <p className={s.estado}>No hay cafeterías registradas a menos de {RADIO_CERCANAS_KM} km.</p>
        )}
      </div>

      <Button variant="dashed" onClick={() => setHojaNueva(true)} disabled={!geo.posicion}>
        <IconMas size={18} />
        Registrar un lugar nuevo
      </Button>
      {!geo.posicion && <p className={c.help}>Para registrar un lugar nuevo necesitamos tu ubicación.</p>}

      <BottomSheet
        open={hojaNueva}
        onClose={() => setHojaNueva(false)}
        title="Lugar nuevo"
        description={
          geo.posicion ? `Se registrará en tu ubicación actual (±${Math.round(geo.posicion.accuracy)} m).` : undefined
        }
      >
        <form className={s.form} onSubmit={crearLugar}>
          <div className={c.field}>
            <label htmlFor={nombreId} className={c.label}>
              Nombre del lugar
            </label>
            <input
              id={nombreId}
              className={c.input}
              value={nombreNuevo}
              onChange={(e) => setNombreNuevo(e.target.value)}
              placeholder="Ej. Tostadora del Parque"
              autoComplete="off"
              required
            />
          </div>
          <Button type="submit" block disabled={!nombreNuevo.trim()}>
            Usar este lugar
          </Button>
        </form>
      </BottomSheet>
    </StepLayout>
  )
}
