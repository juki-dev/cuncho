import { QueryClient } from '@tanstack/react-query'
import { ApiError } from '../lib/api/client'
import { useSesion } from '../lib/auth/session'

export function crearQueryClient() {
  const qc = new QueryClient({
    defaultOptions: {
      queries: {
        // 'offlineFirst': deja que el service worker responda desde caché sin conexión.
        networkMode: 'offlineFirst',
        retry: (n, e) => !(e instanceof ApiError && e.status < 500) && n < 2,
        refetchOnWindowFocus: false,
      },
    },
  })
  // Sesión terminada (logout o refresh rechazado): no dejar datos del usuario anterior en caché.
  useSesion.subscribe((st, prev) => {
    if (prev.accessToken !== null && st.accessToken === null) qc.clear()
  })
  return qc
}
