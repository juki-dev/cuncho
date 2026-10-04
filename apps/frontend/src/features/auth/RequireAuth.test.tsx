import { screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { Outlet } from 'react-router-dom'
import { useSesion } from '../../lib/auth/session'
import { renderRuta } from '../../test/utils'
import { RequireAuth } from './RequireAuth'

const rutas = [{ path: '/acceso', element: <p>pantalla de acceso</p> }]
const protegida = { path: '/bitacora', element: <RequireAuth />, children: [{ index: true, element: <p>contenido privado</p> }] }

describe('RequireAuth', () => {
  beforeEach(() => useSesion.setState({ accessToken: null, refreshToken: null, usuario: null }))

  it('sin sesión redirige a /acceso conservando la ruta de origen', async () => {
    const { router } = renderRuta(<Outlet />, '/', [protegida, ...rutas])
    // renderRuta monta primero su propia ruta; navegamos a la protegida.
    await router.navigate('/bitacora')
    expect(await screen.findByText('pantalla de acceso')).toBeInTheDocument()
    expect(router.state.location.state).toEqual({ desde: '/bitacora' })
  })

  it('con sesión deja pasar', async () => {
    useSesion.setState({ accessToken: 'a', refreshToken: 'r' })
    const { router } = renderRuta(<Outlet />, '/', [protegida, ...rutas])
    await router.navigate('/bitacora')
    expect(await screen.findByText('contenido privado')).toBeInTheDocument()
  })
})
