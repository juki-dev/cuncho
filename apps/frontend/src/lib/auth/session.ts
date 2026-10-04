import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import type { Usuario } from '../api/types'

interface SesionState {
  accessToken: string | null
  refreshToken: string | null
  usuario: Usuario | null
  iniciar: (s: { accessToken: string; refreshToken: string; usuario?: Usuario }) => void
  limpiar: () => void
}

/**
 * Sesión en localStorage (no hay cookies: la API usa Bearer). La CSP del sitio solo
 * permite scripts propios, lo que limita el riesgo de robo de tokens por XSS.
 * Con mocks (VITE_API_MOCKS=true) arranca con una sesión demo para no pedir login.
 */
const demo =
  import.meta.env.VITE_API_MOCKS === 'true'
    ? { accessToken: 'demo', refreshToken: 'demo', usuario: { id: 'usr_031' /* = USUARIO_DEMO de mocks/fixtures */, email: 'demo@cuncho.co', nombre: 'Demo' } }
    : null

export const useSesion = create<SesionState>()(
  persist(
    (set) => ({
      accessToken: demo?.accessToken ?? null,
      refreshToken: demo?.refreshToken ?? null,
      usuario: demo?.usuario ?? null,
      iniciar: ({ accessToken, refreshToken, usuario }) =>
        set((st) => ({ accessToken, refreshToken, usuario: usuario ?? st.usuario })),
      limpiar: () => set({ accessToken: null, refreshToken: null, usuario: null }),
    }),
    {
      name: 'cuncho-sesion',
      storage: createJSONStorage(() => localStorage),
      partialize: (st) => ({ accessToken: st.accessToken, refreshToken: st.refreshToken, usuario: st.usuario }),
      // Con mocks no se persiste ni se lee: siempre arranca con la sesión demo.
      skipHydration: demo !== null,
    },
  ),
)
