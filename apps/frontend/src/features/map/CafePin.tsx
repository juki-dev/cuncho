import { Marker } from 'react-leaflet'
import type { LeafletEvent, Marker as LMarker } from 'leaflet'
import type { Lugar } from '../../lib/api/types'
import { etiquetaPin, iconoCafe, iconoRecomendado, textoPuntaje } from './pins'

interface Props {
  lugar: Lugar
  seleccionado: boolean
  onSelect: (l: Lugar) => void
}

/** Leaflet 1.9 ya pone role="button" y tabindex en el ícono; aquí le damos nombre accesible. */
const etiquetar = (label: string, pressed: boolean) => (e: LeafletEvent) => {
  const el = (e.target as LMarker).getElement()
  el?.setAttribute('aria-label', label)
  el?.setAttribute('aria-pressed', String(pressed))
}

export function CafePin({ lugar, seleccionado, onSelect }: Props) {
  const label = etiquetaPin(lugar)
  return (
    <Marker
      position={[lugar.lat, lugar.lng]}
      icon={iconoCafe(textoPuntaje(lugar), seleccionado)}
      keyboard
      riseOnHover
      zIndexOffset={seleccionado ? 500 : 0}
      eventHandlers={{ add: etiquetar(label, seleccionado), click: () => onSelect(lugar) }}
      // Re-etiqueta al cambiar el ícono (react-leaflet reemplaza el elemento).
      key={`${lugar.id}:${seleccionado}`}
    />
  )
}

export function RecommendedPin({ lugar, seleccionado, onSelect }: Props) {
  return (
    <Marker
      position={[lugar.lat, lugar.lng]}
      icon={iconoRecomendado(textoPuntaje(lugar))}
      keyboard
      zIndexOffset={1000}
      eventHandlers={{ add: etiquetar(etiquetaPin(lugar, true), seleccionado), click: () => onSelect(lugar) }}
      key={`${lugar.id}:${seleccionado}`}
    />
  )
}
