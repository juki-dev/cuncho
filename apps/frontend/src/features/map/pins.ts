import L from 'leaflet'
import type { Lugar } from '../../lib/api/types'
import s from './pins.module.css'

export const textoPuntaje = (l: Lugar) =>
  l.puntaje_promedio === null ? '–' : String(Math.round(l.puntaje_promedio))

export const etiquetaPin = (l: Lugar, recomendado = false) =>
  `${recomendado ? 'Recomendado: ' : ''}${l.nombre}, ${
    l.puntaje_promedio === null ? 'sin puntaje' : `${textoPuntaje(l)} puntos`
  }`

const cache = new Map<string, L.DivIcon>()

function memo(clave: string, crear: () => L.DivIcon) {
  let icono = cache.get(clave)
  if (!icono) {
    icono = crear()
    cache.set(clave, icono)
  }
  return icono
}

/** Círculo de 44 px con el puntaje (CafePin). */
export function iconoCafe(texto: string, seleccionado: boolean) {
  return memo(`cafe:${texto}:${seleccionado}`, () =>
    L.divIcon({
      className: `${s.wrap} ${seleccionado ? s.selected : ''}`,
      html: `<span class="${s.cafe}" aria-hidden="true">${texto}</span>`,
      iconSize: [44, 44],
      iconAnchor: [22, 22],
    }),
  )
}

/** Círculo de 56 px con dos halos pulsantes desfasados 1.1 s (RecommendedPin). */
export function iconoRecomendado(texto: string) {
  return memo(`rec:${texto}`, () =>
    L.divIcon({
      className: s.wrap,
      html: `<span class="${s.rec}" aria-hidden="true"><span class="${s.halo}"></span><span class="${s.halo}"></span><span class="${s.recPin}">${texto}</span></span>`,
      iconSize: [56, 56],
      iconAnchor: [28, 28],
    }),
  )
}

export const iconoUsuario = () =>
  memo('user', () =>
    L.divIcon({
      className: s.wrap,
      html: `<span class="${s.user}"></span>`,
      iconSize: [18, 18],
      iconAnchor: [9, 9],
    }),
  )

export const claseCirculoPrecision = s.accuracy
