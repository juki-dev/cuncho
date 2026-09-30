import { useState } from 'react'
import { IconCerrar } from '../components/icons'
import { debeMostrarPistaIOS } from '../lib/ios'
import s from './InstallHint.module.css'

const CLAVE = 'pista-instalacion-cerrada'

export function InstallHint() {
  const [visible, setVisible] = useState(() => {
    try {
      return debeMostrarPistaIOS() && localStorage.getItem(CLAVE) !== '1'
    } catch {
      return false
    }
  })
  if (!visible) return null
  const cerrar = () => {
    setVisible(false)
    try {
      localStorage.setItem(CLAVE, '1')
    } catch {
      /* modo privado */
    }
  }
  return (
    <aside className={s.hint} aria-label="Instalar la app">
      <p>
        <strong>Instala Cuncho:</strong> toca Compartir y luego «Agregar a pantalla de inicio».
      </p>
      <button type="button" className={s.close} aria-label="Cerrar sugerencia" onClick={cerrar}>
        <IconCerrar size={18} />
      </button>
    </aside>
  )
}
