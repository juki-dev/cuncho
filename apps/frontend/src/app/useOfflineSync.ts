import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { claves } from '../lib/api/queries'
import { procesarCola } from '../lib/offline-queue'

/** Reintenta la cola de cataciones al abrir la app y al recuperar conexión. */
export function useOfflineSync() {
  const qc = useQueryClient()
  useEffect(() => {
    const sincronizar = async () => {
      if (!navigator.onLine) return
      const { enviadas } = await procesarCola()
      await qc.invalidateQueries({ queryKey: claves.pendientes })
      if (enviadas > 0) {
        await qc.invalidateQueries({ queryKey: claves.misCataciones })
        await qc.invalidateQueries({ queryKey: ['lugares'] })
      }
    }
    void sincronizar()
    window.addEventListener('online', sincronizar)
    return () => window.removeEventListener('online', sincronizar)
  }, [qc])
}
