import { useEffect, useRef, useState } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { BottomBar } from '../components/BottomBar'
import { ActionsSheet } from './ActionsSheet'

const ACCIONES_ID = 'menu-acciones'

export interface EstadoAcciones {
  abrirAcciones?: boolean
}

/** Layout de las pestañas (Explorar, Bitácora): BottomBar + FAB + menú de acciones. */
export function TabsLayout() {
  const location = useLocation()
  const navigate = useNavigate()
  // "Volver" desde el paso 1 o la recomendación reabre el menú (design/Paso1 → Acciones).
  const pedido = (location.state as EstadoAcciones | null)?.abrirAcciones === true
  const [abierto, setAbierto] = useState(pedido)
  const contenido = useRef<HTMLDivElement>(null)

  // Consume el estado para que el menú no se reabra al recargar.
  useEffect(() => {
    if (pedido) navigate(location.pathname, { replace: true, state: null })
  }, [pedido, location.pathname, navigate])

  // Fondo inerte mientras el menú está abierto (la BottomBar queda activa para cerrarlo).
  useEffect(() => {
    const el = contenido.current
    if (!el) return
    if (abierto) el.setAttribute('inert', '')
    else el.removeAttribute('inert')
  }, [abierto])

  return (
    <>
      <div ref={contenido}>
        <Outlet />
      </div>
      <ActionsSheet id={ACCIONES_ID} open={abierto} onClose={() => setAbierto(false)} />
      <BottomBar accionesAbiertas={abierto} onToggleAcciones={() => setAbierto((v) => !v)} accionesId={ACCIONES_ID} />
    </>
  )
}
