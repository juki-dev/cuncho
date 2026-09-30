import { useEffect } from 'react'
import { create } from 'zustand'

export type EstadoPermiso = 'desconocido' | 'prompt' | 'granted' | 'denied' | 'unsupported'

export interface Posicion {
  lat: number
  lng: number
  /** Radio de precisión en metros. */
  accuracy: number
}

interface UbicacionState {
  posicion: Posicion | null
  permiso: EstadoPermiso
  error: string | null
}

/** Ubicación actual del usuario (estado local, no de servidor). */
export const useUbicacion = create<UbicacionState>(() => ({
  posicion: null,
  permiso: 'desconocido',
  error: null,
}))

let watchId: number | null = null

function detener() {
  if (watchId !== null) navigator.geolocation.clearWatch(watchId)
  watchId = null
}

/** Empieza a seguir la posición. Si el permiso está en "prompt", el navegador lo pide. */
export function iniciarSeguimiento() {
  if (watchId !== null) return
  if (typeof navigator === 'undefined' || !('geolocation' in navigator)) {
    useUbicacion.setState({ permiso: 'unsupported' })
    return
  }
  watchId = navigator.geolocation.watchPosition(
    (p) =>
      useUbicacion.setState({
        posicion: { lat: p.coords.latitude, lng: p.coords.longitude, accuracy: p.coords.accuracy },
        permiso: 'granted',
        error: null,
      }),
    (e) => {
      if (e.code === e.PERMISSION_DENIED) {
        detener()
        useUbicacion.setState({ permiso: 'denied', error: null })
      } else {
        useUbicacion.setState({
          error: e.code === e.TIMEOUT ? 'La señal de GPS está tardando.' : 'No pudimos obtener tu ubicación.',
        })
      }
    },
    { enableHighAccuracy: true, maximumAge: 10_000, timeout: 20_000 },
  )
}

/**
 * Sincroniza el estado de permiso y arranca `watchPosition`.
 * - `solicitar: false` (por defecto): solo sigue la posición si el permiso ya estaba concedido,
 *   para no pedirlo sin una acción del usuario.
 * - `solicitar: true`: en pantallas donde la ubicación es parte de la tarea (paso 1, recomendación).
 */
export function useGeolocation({ solicitar = false }: { solicitar?: boolean } = {}) {
  const estado = useUbicacion()

  useEffect(() => {
    if (typeof navigator === 'undefined' || !('geolocation' in navigator)) {
      useUbicacion.setState({ permiso: 'unsupported' })
      return
    }
    if (solicitar) iniciarSeguimiento()

    let status: PermissionStatus | null = null
    let cancelado = false
    const aplicar = () => {
      if (!status) return
      const permiso = status.state as EstadoPermiso
      useUbicacion.setState((s) => ({ permiso: s.posicion && permiso === 'prompt' ? s.permiso : permiso }))
      if (permiso === 'granted') iniciarSeguimiento()
      if (permiso === 'denied') detener()
    }
    navigator.permissions
      ?.query({ name: 'geolocation' })
      .then((s) => {
        if (cancelado) return
        status = s
        aplicar()
        s.addEventListener('change', aplicar)
      })
      .catch(() => {
        /* Safari antiguo: sin Permissions API; el estado llega por watchPosition. */
      })
    return () => {
      cancelado = true
      status?.removeEventListener('change', aplicar)
    }
  }, [solicitar])

  return { ...estado, solicitar: iniciarSeguimiento }
}
