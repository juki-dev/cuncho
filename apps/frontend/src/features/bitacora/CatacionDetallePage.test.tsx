import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'
import { act, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { setupServer } from 'msw/node'
import { crearHandlers } from '../../mocks/handlers'
import { renderRuta } from '../../test/utils'
import { BitacoraList } from './BitacoraList'
import { CatacionDetallePage } from './CatacionDetallePage'
import { catacionesFixture } from '../../mocks/fixtures'

const server = setupServer(...crearHandlers())
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

const detalle = { path: '/bitacora/:id', element: <CatacionDetallePage /> }

describe('CatacionDetallePage', () => {
  it('abre el detalle al tocar un item de la bitácora', async () => {
    const user = userEvent.setup()
    const entradas = catacionesFixture.slice(0, 2).map((c) => ({ id: c.id, pendiente: false, catacion: c }))
    const { router } = renderRuta(<BitacoraList entradas={entradas} />, '/bitacora', [detalle])

    await user.click(screen.getByRole('link', { name: /Café Laureles/ }))
    expect(router.state.location.pathname).toBe('/bitacora/cat_0177')
    expect(await screen.findByRole('heading', { level: 1, name: 'Café Laureles' })).toBeInTheDocument()
    expect(screen.getByText('El Paraíso')).toBeInTheDocument()
    expect(screen.getByText('Tartárica · 4/5')).toBeInTheDocument()
    expect(screen.getByText('Bergamota')).toBeInTheDocument()
    expect(screen.getByText('Excelente')).toBeInTheDocument()
  })

  it('avisa si la catación no existe', async () => {
    const { router } = renderRuta(<p>inicio</p>, '/', [detalle])
    await act(() => router.navigate('/bitacora/cat_inexistente'))
    expect(await screen.findByText('No encontramos esta catación en tu bitácora.')).toBeInTheDocument()
  })
})
