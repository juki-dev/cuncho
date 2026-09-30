import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { setupServer } from 'msw/node'
import { crearHandlers } from '../../mocks/handlers'
import { mockGeolocalizacion, renderRuta } from '../../test/utils'
import { RecomendacionPage } from './RecomendacionPage'

const server = setupServer(...crearHandlers())
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())
beforeEach(() => mockGeolocalizacion(5.0689, -75.5174))

describe('RecomendacionPage', () => {
  it('pide elegir una familia de sabor al inicio', () => {
    renderRuta(<RecomendacionPage />, '/recomendar')
    expect(screen.getByText('Elige al menos una familia de sabor para buscar tu taza.')).toBeInTheDocument()
  })

  it('muestra la mejor opción y permite pasar a la siguiente', async () => {
    const user = userEvent.setup()
    renderRuta(<RecomendacionPage />, '/recomendar')
    const frutal = screen.getByRole('button', { name: /Frutal \/ Cítrico/ })
    await user.click(frutal)
    await user.click(screen.getByRole('button', { name: /^Floral/ }))
    expect(frutal).toHaveAttribute('aria-pressed', 'true')

    expect(await screen.findByRole('heading', { name: 'Origen Cafetería' })).toBeInTheDocument()
    expect(screen.getByText('Tu mejor opción cerca')).toBeInTheDocument()
    expect(screen.getByText('100 %')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Otra opción (2)' }))
    expect(screen.getByRole('heading', { name: 'Café Laureles' })).toBeInTheDocument()
  })

  it('deshabilita "Otra opción" cuando solo hay un resultado', async () => {
    const user = userEvent.setup()
    renderRuta(<RecomendacionPage />, '/recomendar')
    await user.click(screen.getByRole('button', { name: /Chocolate/ }))
    expect(await screen.findByRole('heading', { name: 'La Mesa del Barista' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Otra opción (0)' })).toBeDisabled()
  })
})
