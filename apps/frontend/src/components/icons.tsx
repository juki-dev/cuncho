import type { SVGProps } from 'react'

type P = SVGProps<SVGSVGElement> & { size?: number }

const base = (size: number, strokeWidth: number, rest: SVGProps<SVGSVGElement>) => ({
  width: size,
  height: size,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
  focusable: false,
  ...rest,
})

export const IconMapa = ({ size = 22, ...r }: P) => (
  <svg {...base(size, 2, r)}><path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2z" /><path d="M9 4v14M15 6v14" /></svg>
)
export const IconBitacora = ({ size = 22, ...r }: P) => (
  <svg {...base(size, 2, r)}><path d="M5 4h11a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3V4z" /><path d="M5 17a3 3 0 0 1 3-3h11" /></svg>
)
export const IconMas = ({ size = 28, ...r }: P) => (
  <svg {...base(size, 2.6, r)}><path d="M12 5v14M5 12h14" /></svg>
)
export const IconCerrar = ({ size = 26, ...r }: P) => (
  <svg {...base(size, 2.6, r)}><path d="M6 6l12 12M18 6 6 18" /></svg>
)
export const IconGps = ({ size = 22, ...r }: P) => (
  <svg {...base(size, 2, r)}>
    <circle cx="12" cy="12" r="7" />
    <circle cx="12" cy="12" r="2.5" fill="currentColor" />
    <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
  </svg>
)
export const IconRadio = ({ size = 16, ...r }: P) => (
  <svg {...base(size, 2, r)}><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="2.5" fill="currentColor" /></svg>
)
export const IconVolver = ({ size = 20, ...r }: P) => (
  <svg {...base(size, 2, r)}><path d="m15 6-6 6 6 6" /></svg>
)
export const IconSiguiente = ({ size = 20, ...r }: P) => (
  <svg {...base(size, 2, r)}><path d="m9 6 6 6-6 6" /></svg>
)
export const IconCheck = ({ size = 20, ...r }: P) => (
  <svg {...base(size, 2.4, r)}><path d="m5 12 5 5L20 7" /></svg>
)
export const IconTaza = ({ size = 26, ...r }: P) => (
  <svg {...base(size, 2, r)}>
    <path d="M4 9h13v5a6 6 0 0 1-6 6h-1a6 6 0 0 1-6-6V9z" />
    <path d="M17 11h1.5a2.5 2.5 0 0 1 0 5H17" />
    <path d="M8 3c0 1.5 1.5 1.5 1.5 3M12 3c0 1.5 1.5 1.5 1.5 3" />
  </svg>
)
export const IconPinEstrella = ({ size = 26, ...r }: P) => (
  <svg {...base(size, 2, r)}>
    <path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z" />
    <path d="m12 6.5 1 2.2 2.3.3-1.7 1.6.4 2.3-2-1.1-2 1.1.4-2.3-1.7-1.6 2.3-.3z" />
  </svg>
)
export const IconNube = ({ size = 16, ...r }: P) => (
  <svg {...base(size, 2, r)}>
    <path d="M7 18a4 4 0 0 1-.6-7.96A6 6 0 0 1 18 9a4.5 4.5 0 0 1 0 9H7z" />
    <path d="M12 11v5M9.5 13.5 12 11l2.5 2.5" />
  </svg>
)
