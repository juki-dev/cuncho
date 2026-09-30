import { useEffect, type ReactNode } from 'react'
import type { Map as LMap } from 'leaflet'
import { AttributionControl, MapContainer, TileLayer, ZoomControl, useMap, useMapEvents } from 'react-leaflet'
import type { BBox, Coordenadas } from '../../lib/api/types'

import { useLatest } from '../../lib/useLatest'
import { ATRIBUCION, esTactil, TILE_URL } from './tiles'

/** Tiles CARTO Voyager. `{r}` ya sirve @2x en pantallas retina. */
export function CartoTiles() {
  return <TileLayer url={TILE_URL} subdomains="abcd" attribution={ATRIBUCION} maxZoom={20} />
}

/** Emite el bbox visible tras cada `moveend`, con debounce. */
function BboxWatcher({ onChange, delay = 300 }: { onChange: (b: BBox) => void; delay?: number }) {
  const map = useMap()
  const cb = useLatest(onChange)
  useEffect(() => {
    let t: number | undefined
    const emitir = () => {
      const b = map.getBounds()
      cb.current([b.getWest(), b.getSouth(), b.getEast(), b.getNorth()])
    }
    const programar = () => {
      window.clearTimeout(t)
      t = window.setTimeout(emitir, delay)
    }
    emitir()
    map.on('moveend', programar)
    return () => {
      window.clearTimeout(t)
      map.off('moveend', programar)
    }
  }, [map, delay, cb])
  return null
}

function ClickFondo({ onClick }: { onClick: () => void }) {
  useMapEvents({ click: onClick })
  return null
}

interface Props {
  centro: Coordenadas
  zoom?: number
  onBboxChange: (b: BBox) => void
  onMapClick: () => void
  mapRef: (m: LMap | null) => void
  className?: string
  children?: ReactNode
}

export function MapView({ centro, zoom = 15, onBboxChange, onMapClick, mapRef, className, children }: Props) {
  const tactil = esTactil()
  return (
    <MapContainer
      ref={mapRef}
      center={[centro.lat, centro.lng]}
      zoom={zoom}
      className={className}
      zoomControl={false}
      attributionControl={false}
      scrollWheelZoom={!tactil}
      dragging
      touchZoom
      doubleClickZoom
      keyboard
    >
      <CartoTiles />
      <AttributionControl position="bottomright" prefix={false} />
      {!tactil && <ZoomControl position="bottomright" zoomInTitle="Acercar" zoomOutTitle="Alejar" />}
      <BboxWatcher onChange={onBboxChange} />
      <ClickFondo onClick={onMapClick} />
      {children}
    </MapContainer>
  )
}
