import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useMisCataciones, usePendientes } from '../../lib/api/queries'
import { IconCerrar } from '../../components/icons'
import { BitacoraList, type EntradaBitacora } from './BitacoraList'
import { Stats } from './Stats'
import { calcularStats } from './calcularStats'
import s from './Bitacora.module.css'
import t from '../../app/Toast.module.css'

export interface EstadoBitacora {
  guardada?: 'enviada' | 'pendiente'
}

const MENSAJES = {
  enviada: 'Catación guardada en tu bitácora.',
  pendiente: 'Guardada sin conexión. Se sincronizará cuando vuelvas a tener internet.',
} as const

export function BitacoraPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const cataciones = useMisCataciones()
  const pendientes = usePendientes()
  const [aviso, setAviso] = useState<EstadoBitacora['guardada']>(
    () => (location.state as EstadoBitacora | null)?.guardada,
  )

  // Consume el estado de navegación para no repetir el aviso al recargar.
  useEffect(() => {
    if ((location.state as EstadoBitacora | null)?.guardada) navigate('.', { replace: true, state: null })
  }, [location.state, navigate])

  useEffect(() => {
    if (!aviso) return
    const id = window.setTimeout(() => setAviso(undefined), 6000)
    return () => window.clearTimeout(id)
  }, [aviso])

  const entradas: EntradaBitacora[] = [
    ...(pendientes.data ?? []).map((p) => ({ id: p.id, pendiente: true, catacion: p.payload })),
    ...(cataciones.data ?? [])
      .slice()
      .sort((a, b) => b.creado_en.localeCompare(a.creado_en))
      .map((c) => ({ id: c.id, pendiente: false, catacion: c })),
  ]
  const stats = calcularStats(entradas.map((e) => e.catacion))

  return (
    <div className={s.page}>
      <header className={s.header}>
        <div className={s.titles}>
          <span className={s.eyebrow}>Historial personal</span>
          <h1 className={s.title}>Mi bitácora</h1>
        </div>
        <Stats {...stats} />
      </header>

      <main>
        {entradas.length > 0 ? (
          <BitacoraList entradas={entradas} />
        ) : cataciones.isPending ? (
          <p className={s.empty}>Cargando tus cataciones…</p>
        ) : cataciones.isError ? (
          <p className={s.empty}>No pudimos cargar tu bitácora. Revisa tu conexión.</p>
        ) : (
          <p className={s.empty}>Aún no tienes cataciones. Toca + para registrar la primera.</p>
        )}
      </main>

      {aviso && (
        <div className={t.toast} role="status">
          <p>{MENSAJES[aviso]}</p>
          <button type="button" className={t.close} aria-label="Cerrar aviso" onClick={() => setAviso(undefined)}>
            <IconCerrar size={18} />
          </button>
        </div>
      )}
    </div>
  )
}
