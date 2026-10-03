import { QueryClient } from '@tanstack/react-query'
import { ApiError } from '../lib/api/client'

export function crearQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // 'offlineFirst': deja que el service worker responda desde caché sin conexión.
        networkMode: 'offlineFirst',
        retry: (n, e) => !(e instanceof ApiError && e.status < 500) && n < 2,
        refetchOnWindowFocus: false,
      },
    },
  })
}
