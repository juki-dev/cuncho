import { useLayoutEffect, useRef } from 'react'

/** Ref con el último valor, para callbacks en listeners sin re-suscribirse. */
export function useLatest<T>(valor: T) {
  const ref = useRef(valor)
  useLayoutEffect(() => {
    ref.current = valor
  })
  return ref
}
