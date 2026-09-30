import { beforeEach, describe, expect, it } from 'vitest'
import { fireEvent, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderRuta } from '../../test/utils'
import { Paso3Sensorial } from './Paso3Sensorial'
import { BORRADOR_INICIAL, useCatacionDraft } from './useCatacionDraft'

beforeEach(async () => {
  await useCatacionDraft.persist.rehydrate()
  useCatacionDraft.setState({
    ...structuredClone(BORRADOR_INICIAL),
    lugar: { id: 'loc_origen', nombre: 'Origen Cafetería', lat: 5.0689, lng: -75.5174 },
    grano: { variedad: 'Geisha', finca: '', region: '', proceso: 'Lavado', metodo: 'V60' },
  })
})

describe('Paso3Sensorial', () => {
  it('muestra la etiqueta dinámica de acidez', () => {
    renderRuta(<Paso3Sensorial />, '/catar/sensorial')
    const slider = screen.getByLabelText('Acidez')
    expect(screen.getByText('Cítrica', { selector: 'span[aria-hidden]' })).toBeInTheDocument()
    fireEvent.change(slider, { target: { value: '5' } })
    expect(screen.getByText('Fosfórica · brillante')).toBeInTheDocument()
    expect(slider).toHaveAttribute('aria-valuetext', '5 de 5, Fosfórica · brillante')
  })

  it('alterna notas con aria-pressed y cuenta las elegidas', async () => {
    const user = userEvent.setup()
    renderRuta(<Paso3Sensorial />, '/catar/sensorial')
    const jazmin = screen.getByRole('button', { name: 'Jazmín' })
    expect(jazmin).toHaveAttribute('aria-pressed', 'false')
    expect(screen.getByText('0 notas')).toBeInTheDocument()
    await user.click(jazmin)
    expect(jazmin).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByText('1 nota')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Hibisco' }))
    expect(screen.getByText('2 notas')).toBeInTheDocument()
    expect(useCatacionDraft.getState().sensorial.notas).toEqual(['Jazmín', 'Hibisco'])
  })

  it('cambia entre escala SCA y personal', async () => {
    const user = userEvent.setup()
    renderRuta(<Paso3Sensorial />, '/catar/sensorial')
    expect(screen.getByText('85.00')).toBeInTheDocument()
    expect(screen.getByText('Excelente')).toBeInTheDocument()
    fireEvent.change(screen.getByLabelText('Puntuación'), { target: { value: '90.5' } })
    expect(screen.getByText('Excepcional')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Personal' }))
    expect(screen.getByText('7.5')).toBeInTheDocument()
    expect(screen.getByText('de 10 · escala personal')).toBeInTheDocument()
    expect(screen.getByLabelText('Puntuación')).toHaveAttribute('max', '10')
  })

  it('no guarda sin notas y avisa', async () => {
    const user = userEvent.setup()
    renderRuta(<Paso3Sensorial />, '/catar/sensorial')
    await user.click(screen.getByRole('button', { name: /guardar en mi bitácora/i }))
    expect(screen.getByRole('alert')).toHaveTextContent('Elige al menos una nota de sabor.')
  })
})
