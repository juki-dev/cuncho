export function formatearDistancia(km: number): string {
  return km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1)} km`
}

/** Minutos a pie aproximados (≈ 5 km/h), como en design/Recomendacion. */
export function minutosAPie(km: number): string {
  return `${Math.max(1, Math.round(km * 12))} min`
}

const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'] as const

/** "28 sep", como en design/Bitacora (Intl en es-CO produce "28 de sept."). */
export function formatearFechaCorta(iso: string): string {
  const d = new Date(iso)
  return `${d.getDate()} ${MESES[d.getMonth()]}`
}

export function formatearPuntaje(p: number): string {
  return String(Math.round(p * 100) / 100)
}

export function formatearCoordenadas(lat: number, lng: number): string {
  const ns = lat >= 0 ? 'N' : 'S'
  const eo = lng >= 0 ? 'E' : 'O'
  return `${Math.abs(lat).toFixed(4)}° ${ns}, ${Math.abs(lng).toFixed(4)}° ${eo}`
}

/** Fecha ISO 8601 con el desfase local, p. ej. 2026-09-28T16:40:00-05:00 */
export function isoLocal(d = new Date()): string {
  const pad = (n: number) => String(Math.abs(n)).padStart(2, '0')
  const off = -d.getTimezoneOffset()
  const sign = off >= 0 ? '+' : '-'
  return (
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` +
    `T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}` +
    `${sign}${pad(Math.trunc(off / 60))}:${pad(off % 60)}`
  )
}
