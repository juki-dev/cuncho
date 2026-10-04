import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useSesion } from '../../lib/auth/session'

export interface EstadoAcceso {
  desde?: string
}

/** Protege las rutas que necesitan cuenta (catación, bitácora, recomendación). */
export function RequireAuth() {
  const logueado = useSesion((s) => s.accessToken !== null)
  const location = useLocation()
  if (!logueado) {
    return <Navigate to="/acceso" replace state={{ desde: location.pathname + location.search } satisfies EstadoAcceso} />
  }
  return <Outlet />
}
