import { Circle, Marker } from 'react-leaflet'
import type { Posicion } from './useGeolocation'
import { claseCirculoPrecision, iconoUsuario } from './pins'

export function UserLocation({ posicion }: { posicion: Posicion }) {
  const centro: [number, number] = [posicion.lat, posicion.lng]
  return (
    <>
      <Circle center={centro} radius={posicion.accuracy} className={claseCirculoPrecision} interactive={false} />
      <Marker position={centro} icon={iconoUsuario()} interactive={false} keyboard={false} zIndexOffset={-100} title="Tu ubicación" />
    </>
  )
}
