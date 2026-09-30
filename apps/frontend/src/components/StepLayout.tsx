import type { ReactNode } from 'react'
import s from './StepLayout.module.css'

interface Props {
  header: ReactNode
  children: ReactNode
  footer?: ReactNode
  /** Mensaje de validación sobre el botón del footer. */
  error?: string | null
  gap?: number
}

/** Estructura de pantallas con encabezado, contenido desplazable y acción fija abajo. */
export function StepLayout({ header, children, footer, error, gap }: Props) {
  return (
    <div className={s.page}>
      {header}
      <main className={s.main} style={gap ? { gap } : undefined}>
        {children}
      </main>
      {footer && (
        <footer className={s.footer}>
          <p className={s.error} role="alert">
            {error ?? ''}
          </p>
          {footer}
        </footer>
      )}
    </div>
  )
}
