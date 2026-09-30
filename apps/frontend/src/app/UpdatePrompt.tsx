import { useRegisterSW } from 'virtual:pwa-register/react'
import { IconCerrar } from '../components/icons'
import s from './Toast.module.css'

/**
 * registerType: 'prompt' → nunca recargamos sin avisar (p. ej. en medio de una
 * catación). El usuario decide cuándo actualizar; el borrador está en IndexedDB.
 */
export function UpdatePrompt() {
  const {
    needRefresh: [hayVersion, setHayVersion],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_url, reg) {
      // Revisa si hay versión nueva cada hora mientras la app está abierta.
      if (reg) setInterval(() => void reg.update(), 60 * 60 * 1000)
    },
  })

  if (!hayVersion) return null
  return (
    <div className={`${s.toast} ${s.top}`} role="status">
      <p>Nueva versión disponible</p>
      <button type="button" className={s.action} onClick={() => void updateServiceWorker(true)}>
        Actualizar
      </button>
      <button type="button" className={s.close} aria-label="Más tarde" onClick={() => setHayVersion(false)}>
        <IconCerrar size={18} />
      </button>
    </div>
  )
}
