import { useCallback, useEffect, useRef, useState } from 'react'
import type { Map as LMap } from 'leaflet'
import { useLocation } from 'react-router-dom'
import { useLugaresEnCaja } from '../../lib/api/queries'
import type { BBox, Lugar } from '../../lib/api/types'
import { CENTRO_POR_DEFECTO } from '../../lib/config'
import { IconGps } from '../../components/icons'
import { InstallHint } from '../../app/InstallHint'
import { MapView } from './MapView'
import { CafePin, RecommendedPin } from './CafePin'
import { CafePopup } from './CafePopup'
import { UserLocation } from './UserLocation'
import { useGeolocation } from './useGeolocation'
import s from './ExplorarPage.module.css'

export interface EstadoExplorar {
  recomendado?: Lugar
}

const ZOOM_GPS = 16

export function ExplorarPage() {
  const recomendado = (useLocation().state as EstadoExplorar | null)?.recomendado ?? null
  const geo = useGeolocation()
  const [map, setMap] = useState<LMap | null>(null)
  const [bbox, setBbox] = useState<BBox | null>(null)
  const [seleccionado, setSeleccionado] = useState<Lugar | null>(recomendado)
  const [avisoGps, setAvisoGps] = useState(false)
  const lugares = useLugaresEnCaja(bbox)

  // Centro inicial: recomendación > GPS ya conocido > centro por defecto.
  const [centroInicial] = useState(() => recomendado ?? geo.posicion ?? CENTRO_POR_DEFECTO)
  const centrado = useRef(recomendado !== null || geo.posicion !== null)
  const volarAlLlegar = useRef(false)

  // Primera posición GPS (o la pedida con el botón): centrar el mapa.
  useEffect(() => {
    if (!map || !geo.posicion) return
    if (!centrado.current || volarAlLlegar.current) {
      map.flyTo([geo.posicion.lat, geo.posicion.lng], Math.max(map.getZoom(), ZOOM_GPS))
      centrado.current = true
      volarAlLlegar.current = false
    }
  }, [map, geo.posicion])

  useEffect(() => {
    if (geo.permiso === 'denied' && volarAlLlegar.current) setAvisoGps(true)
  }, [geo.permiso])

  const centrarEnMi = () => {
    if (geo.posicion && map) {
      map.flyTo([geo.posicion.lat, geo.posicion.lng], Math.max(map.getZoom(), ZOOM_GPS))
      return
    }
    if (geo.permiso === 'denied' || geo.permiso === 'unsupported') {
      setAvisoGps(true)
      return
    }
    volarAlLlegar.current = true
    geo.solicitar()
  }

  const cerrarPopup = useCallback(() => setSeleccionado(null), [])
  const lista = (lugares.data ?? []).filter((l) => l.id !== recomendado?.id)

  return (
    <div className={s.page}>
      <MapView
        className={s.map}
        centro={centroInicial}
        mapRef={setMap}
        onBboxChange={setBbox}
        onMapClick={cerrarPopup}
      >
        {geo.posicion && <UserLocation posicion={geo.posicion} />}
        {lista.map((l) => (
          <CafePin key={l.id} lugar={l} seleccionado={seleccionado?.id === l.id} onSelect={setSeleccionado} />
        ))}
        {recomendado && (
          <RecommendedPin
            lugar={recomendado}
            seleccionado={seleccionado?.id === recomendado.id}
            onSelect={setSeleccionado}
          />
        )}
        {seleccionado && (
          <CafePopup
            key={seleccionado.id}
            lugar={seleccionado}
            recomendado={seleccionado.id === recomendado?.id}
            onClose={cerrarPopup}
          />
        )}
      </MapView>

      <div className={s.top}>
        <header className={s.header}>
          <div className={s.brand}>
            <h1 className={s.title}>Cuncho</h1>
            <span className={s.subtitle}>Colombia · Bitácora Artesanal</span>
          </div>
          <button
            type="button"
            className={s.gps}
            aria-label="Centrar el mapa en mi ubicación"
            data-activo={geo.posicion !== null}
            onClick={centrarEnMi}
          >
            <IconGps />
          </button>
        </header>

        {avisoGps && (
          <div className={s.aviso} role="status">
            <p>
              <strong>No tenemos acceso a tu ubicación.</strong>{' '}
              {geo.permiso === 'unsupported'
                ? 'Tu navegador no permite geolocalización.'
                : 'Actívala en los ajustes del navegador para ver cafeterías cerca de ti.'}{' '}
              Mientras tanto puedes mover el mapa libremente.
            </p>
            <button type="button" className={s.avisoBtn} onClick={() => setAvisoGps(false)}>
              Entendido
            </button>
          </div>
        )}

        {lugares.isError && (
          <div className={s.aviso} role="alert">
            <p>No pudimos cargar las cafeterías de esta zona.</p>
            <button type="button" className={s.avisoBtn} onClick={() => void lugares.refetch()}>
              Reintentar
            </button>
          </div>
        )}
      </div>

      <InstallHint />
    </div>
  )
}
