import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import L from 'leaflet'
import { useMap } from 'react-leaflet'
import type { Lugar } from '../../lib/api/types'
import { formatearPuntaje } from '../../lib/format'
import { useLatest } from '../../lib/useLatest'
import s from './CafePopup.module.css'

interface Props {
  lugar: Lugar
  recomendado: boolean
  onClose: () => void
}

const ANCHO = 250
const MARGEN = 16

/**
 * Popup propio posicionado sobre el mapa (design/Main): se abre debajo del pin
 * si el pin está en la parte superior de la pantalla y encima en otro caso.
 */
export function CafePopup({ lugar, recomendado, onClose }: Props) {
  const map = useMap()
  const ref = useRef<HTMLElement>(null)
  const [punto, setPunto] = useState(() => map.latLngToContainerPoint([lugar.lat, lugar.lng]))
  const [alto, setAlto] = useState(150)
  const onCloseRef = useLatest(onClose)

  useEffect(() => {
    const actualizar = () => setPunto(map.latLngToContainerPoint([lugar.lat, lugar.lng]))
    actualizar()
    map.on('move zoom viewreset resize', actualizar)
    return () => {
      map.off('move zoom viewreset resize', actualizar)
    }
  }, [map, lugar.lat, lugar.lng])

  useLayoutEffect(() => {
    if (ref.current) setAlto(ref.current.offsetHeight)
  }, [lugar])

  useEffect(() => {
    const el = ref.current
    if (!el) return
    L.DomEvent.disableClickPropagation(el)
    L.DomEvent.disableScrollPropagation(el)
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onCloseRef.current()
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onCloseRef])

  const tam = map.getSize()
  const ancho = Math.min(ANCHO, tam.x - MARGEN * 2)
  const left = Math.max(MARGEN, Math.min(tam.x - ancho - MARGEN, punto.x - ancho / 2))
  const top = punto.y < tam.y * 0.43 ? punto.y + 34 : punto.y - alto - 40

  const d = lugar.destacada
  return createPortal(
    <section
      ref={ref}
      className={s.popup}
      style={{ left, top, width: ancho }}
      aria-label={`Detalle de ${lugar.nombre}`}
      aria-live="polite"
    >
      <div className={s.head}>
        <div className={s.titles}>
          {recomendado && <span className={s.eyebrow}>Recomendado para ti</span>}
          <h2 className={s.name}>{lugar.nombre}</h2>
        </div>
        <div className={s.score}>
          <span className={s.scoreNum}>
            {lugar.puntaje_promedio === null ? '–' : formatearPuntaje(Math.round(lugar.puntaje_promedio))}
          </span>
          <span className={s.scoreUnit}>pts</span>
        </div>
      </div>
      {d ? (
        <>
          <p className={s.method}>{[d.metodo, d.variedad, d.proceso].join(' · ')}</p>
          <ul className={s.tags} aria-label="Notas">
            {d.notas.map((n) => (
              <li key={n} className={s.tag}>
                {n}
              </li>
            ))}
          </ul>
        </>
      ) : (
        <p className={s.meta}>Aún no tiene cataciones. ¡Sé el primero en registrar una!</p>
      )}
    </section>,
    map.getContainer(),
  )
}
