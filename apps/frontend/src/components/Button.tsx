import type { ButtonHTMLAttributes } from 'react'
import { Link, type LinkProps } from 'react-router-dom'
import s from './Button.module.css'

type Variante = 'primary' | 'secondary' | 'dashed'
type Tamano = 'lg' | 'md'

interface Estilo {
  variant?: Variante
  size?: Tamano
  block?: boolean
  grow?: boolean
}

const clases = ({ variant = 'primary', size = 'lg', block, grow }: Estilo, extra?: string) =>
  [s.btn, s[variant], variant !== 'dashed' && s[size], block && s.block, grow && s.grow, extra]
    .filter(Boolean)
    .join(' ')

export function Button({
  variant,
  size,
  block,
  grow,
  className,
  type = 'button',
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & Estilo) {
  return <button type={type} className={clases({ variant, size, block, grow }, className)} {...rest} />
}

export function LinkButton({ variant, size, block, grow, className, ...rest }: LinkProps & Estilo) {
  return <Link className={clases({ variant, size, block, grow }, className)} {...rest} />
}
