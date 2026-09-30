import { useSyncExternalStore } from 'react'
import { create } from 'zustand'
import { createJSONStorage, persist, type StateStorage } from 'zustand/middleware'
import { del, get, set } from 'idb-keyval'
import type {
  Coordenadas,
  Escala,
  LugarRef,
  Metodo,
  NivelAcidez,
  NuevaCatacion,
  Proceso,
} from '../../lib/api/types'
import { descriptoresDeNotas, TIPOS_ACIDEZ } from '../../lib/catalogo'
import { isoLocal } from '../../lib/format'

/** Lugar registrado en el paso 1 que aún no existe en el servidor. */
export type LugarNuevo = Coordenadas & { id?: undefined; nombre: string }
export type LugarBorrador = LugarRef | LugarNuevo

export interface Borrador {
  lugar: LugarBorrador | null
  grano: {
    variedad: string
    finca: string
    region: string
    proceso: Proceso | null
    metodo: Metodo | null
  }
  sensorial: {
    acidez: NivelAcidez
    notas: string[]
    escala: Escala
    puntajeSca: number
    puntajePersonal: number
  }
}

export const BORRADOR_INICIAL: Borrador = {
  lugar: null,
  grano: { variedad: '', finca: '', region: '', proceso: null, metodo: null },
  sensorial: { acidez: 3, notas: [], escala: 'SCA', puntajeSca: 85, puntajePersonal: 7.5 },
}

interface Acciones {
  setLugar: (lugar: LugarBorrador) => void
  setGrano: (cambios: Partial<Borrador['grano']>) => void
  setSensorial: (cambios: Partial<Borrador['sensorial']>) => void
  alternarNota: (nota: string) => void
  reiniciar: () => void
}

const idbStorage: StateStorage = {
  getItem: async (k) => (await get<string>(k)) ?? null,
  setItem: (k, v) => set(k, v),
  removeItem: (k) => del(k),
}

/** Borrador de catación. Se guarda en IndexedDB en cada cambio. */
export const useCatacionDraft = create<Borrador & Acciones>()(
  persist(
    (setState) => ({
      ...BORRADOR_INICIAL,
      setLugar: (lugar) => setState({ lugar }),
      setGrano: (cambios) => setState((s) => ({ grano: { ...s.grano, ...cambios } })),
      setSensorial: (cambios) => setState((s) => ({ sensorial: { ...s.sensorial, ...cambios } })),
      alternarNota: (nota) =>
        setState((s) => {
          const notas = s.sensorial.notas.includes(nota)
            ? s.sensorial.notas.filter((n) => n !== nota)
            : [...s.sensorial.notas, nota]
          return { sensorial: { ...s.sensorial, notas } }
        }),
      reiniciar: () => setState(structuredClone(BORRADOR_INICIAL)),
    }),
    {
      name: 'borrador-catacion',
      version: 1,
      storage: createJSONStorage(() => idbStorage),
      partialize: ({ lugar, grano, sensorial }) => ({ lugar, grano, sensorial }),
    },
  ),
)

/** true cuando el borrador ya se leyó de IndexedDB (evita redirecciones prematuras). */
export function useBorradorHidratado() {
  return useSyncExternalStore(
    (avisar) => useCatacionDraft.persist.onFinishHydration(avisar),
    () => useCatacionDraft.persist.hasHydrated(),
  )
}

export type CampoFaltante = 'lugar' | 'variedad' | 'proceso' | 'metodo' | 'notas'

export function faltantesGrano(b: Borrador): CampoFaltante[] {
  const f: CampoFaltante[] = []
  if (!b.grano.variedad.trim()) f.push('variedad')
  if (!b.grano.proceso) f.push('proceso')
  if (!b.grano.metodo) f.push('metodo')
  return f
}

/** Convierte el borrador en el cuerpo de POST /cataciones, o null si está incompleto. */
export function aPayload(b: Borrador, ahora = new Date()): NuevaCatacion | null {
  const { lugar, grano, sensorial } = b
  if (!lugar || !grano.proceso || !grano.metodo || !grano.variedad.trim() || sensorial.notas.length === 0) {
    return null
  }
  const sca = sensorial.escala === 'SCA'
  return {
    creado_en: isoLocal(ahora),
    lugar,
    grano: {
      variedad: grano.variedad.trim(),
      finca: grano.finca.trim(),
      region: grano.region.trim(),
      proceso: grano.proceso,
      metodo: grano.metodo,
    },
    sensorial: {
      acidez: { nivel: sensorial.acidez, tipo: TIPOS_ACIDEZ[sensorial.acidez] },
      notas: sensorial.notas,
      descriptores: descriptoresDeNotas(sensorial.notas),
      puntaje: sca ? sensorial.puntajeSca : sensorial.puntajePersonal,
      escala: sensorial.escala,
    },
  }
}
