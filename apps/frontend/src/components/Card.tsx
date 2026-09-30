import type { HTMLAttributes } from 'react'
import s from './Card.module.css'

interface Props extends HTMLAttributes<HTMLElement> {
  as?: 'div' | 'section' | 'article'
  padded?: boolean
}

export function Card({ as: Tag = 'div', padded = true, className, ...rest }: Props) {
  return <Tag className={[s.card, padded && s.padded, className].filter(Boolean).join(' ')} {...rest} />
}
