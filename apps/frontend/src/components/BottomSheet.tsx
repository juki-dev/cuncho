import { useEffect, useId, useRef, type ReactNode } from 'react'
import { useLatest } from '../lib/useLatest'
import { createPortal } from 'react-dom'
import s from './BottomSheet.module.css'

interface Props {
  open: boolean
  onClose: () => void
  title: string
  description?: string
  children: ReactNode
  /** La BottomBar sigue visible encima del sheet (menú de acciones). */
  withBottomBar?: boolean
  id?: string
}

/**
 * Hoja inferior modal. Cierra con Escape o tocando el fondo, mueve el foco
 * al primer control y lo devuelve al elemento que la abrió.
 * El resto de la página se marca `inert` desde el layout (ver AppLayout).
 */
export function BottomSheet({ open, onClose, title, description, children, withBottomBar, id }: Props) {
  const tituloId = useId()
  const descId = useId()
  const ref = useRef<HTMLElement>(null)
  const onCloseRef = useLatest(onClose)

  useEffect(() => {
    if (!open) return
    const previo = document.activeElement as HTMLElement | null
    const primero = ref.current?.querySelector<HTMLElement>('a[href], button, input, [tabindex]:not([tabindex="-1"])')
    ;(primero ?? ref.current)?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCloseRef.current()
    }
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('keydown', onKey)
      if (previo?.isConnected) previo.focus()
    }
  }, [open, onCloseRef])

  if (!open) return null
  return createPortal(
    <>
      <div className={s.scrim} onClick={onClose} aria-hidden="true" />
      <section
        ref={ref}
        id={id}
        role="dialog"
        aria-modal={withBottomBar ? undefined : true}
        aria-labelledby={tituloId}
        aria-describedby={description ? descId : undefined}
        tabIndex={-1}
        className={`${s.sheet} ${withBottomBar ? s.withBar : ''}`}
      >
        <div className={s.handle} aria-hidden="true" />
        <div className={s.head}>
          <h2 id={tituloId} className={s.title}>
            {title}
          </h2>
          {description && (
            <p id={descId} className={s.desc}>
              {description}
            </p>
          )}
        </div>
        {children}
      </section>
    </>,
    document.body,
  )
}
