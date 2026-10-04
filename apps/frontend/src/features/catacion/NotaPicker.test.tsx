import { useState } from 'react'
import { describe, expect, it } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { NotaPicker } from './NotaPicker'

function Harness({ inicial = [] as string[] }) {
  const [notas, setNotas] = useState<string[]>(inicial)
  return <NotaPicker value={notas} onToggle={(n) => setNotas((v) => (v.includes(n) ? v.filter((x) => x !== n) : [...v, n]))} />
}

const resultados = () => within(screen.getByRole('group', { name: 'Resultados' })).getAllByRole('button')

describe('NotaPicker', () => {
  it('muestra 10 sugerencias sin búsqueda', () => {
    render(<Harness />)
    expect(resultados()).toHaveLength(10)
    expect(screen.getByRole('status')).toHaveTextContent(/Busca entre las \d+ notas de la rueda/)
  })

  it('busca sin tildes, muestra como máximo 10 y avisa del total', async () => {
    const user = userEvent.setup()
    render(<Harness />)
    await user.type(screen.getByLabelText('Buscar nota'), 'a')
    expect(resultados().length).toBeLessThanOrEqual(10)
    expect(screen.getByRole('status')).toHaveTextContent(/Mostrando 10 de \d+ coincidencias/)

    await user.clear(screen.getByLabelText('Buscar nota'))
    await user.type(screen.getByLabelText('Buscar nota'), 'jazmin')
    expect(resultados().map((b) => b.textContent)).toEqual(['Jazmín'])
  })

  it('elige y quita notas; el contador y las notas elegidas se actualizan', async () => {
    const user = userEvent.setup()
    render(<Harness />)
    await user.click(screen.getByRole('button', { name: 'Jazmín' }))
    await user.click(screen.getByRole('button', { name: 'Cítricos' }))
    expect(screen.getByText('2 notas')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Jazmín' })).toHaveAttribute('aria-pressed', 'true')
    expect(within(screen.getByRole('list', { name: 'Notas elegidas' })).getAllByRole('listitem')).toHaveLength(2)

    await user.click(screen.getByRole('button', { name: 'Quitar nota Jazmín' }))
    expect(screen.getByText('1 nota')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Jazmín' })).toHaveAttribute('aria-pressed', 'false')
  })

  it('una nota elegida sigue visible aunque no esté en los resultados', async () => {
    const user = userEvent.setup()
    render(<Harness />)
    await user.type(screen.getByLabelText('Buscar nota'), 'canela')
    await user.click(screen.getByRole('button', { name: 'Canela' }))
    await user.clear(screen.getByLabelText('Buscar nota'))
    await user.type(screen.getByLabelText('Buscar nota'), 'durazno')
    expect(screen.getByRole('button', { name: 'Quitar nota Canela' })).toBeInTheDocument()
  })

  it('permite agregar una nota personalizada cuando no existe en la rueda', async () => {
    const user = userEvent.setup()
    render(<Harness />)
    await user.type(screen.getByLabelText('Buscar nota'), 'pan tostado casero')
    expect(screen.getByRole('status')).toHaveTextContent('Sin coincidencias')
    await user.click(screen.getByRole('button', { name: 'Agregar «Pan tostado casero»' }))
    expect(screen.getByRole('button', { name: 'Quitar nota Pan tostado casero' })).toBeInTheDocument()
    expect(screen.getByLabelText('Buscar nota')).toHaveValue('')
  })

  it('no ofrece crear una nota que ya existe (aunque se escriba sin tilde) ni una inválida', async () => {
    const user = userEvent.setup()
    render(<Harness />)
    await user.type(screen.getByLabelText('Buscar nota'), 'jazmin')
    expect(screen.queryByRole('button', { name: /Agregar/ })).not.toBeInTheDocument()

    await user.clear(screen.getByLabelText('Buscar nota'))
    await user.type(screen.getByLabelText('Buscar nota'), 'x;y')
    expect(screen.queryByRole('button', { name: /Agregar/ })).not.toBeInTheDocument()
    expect(screen.getByText(/De 2 a 40 letras|de 2 a 40 letras/)).toBeInTheDocument()
  })

  it('Enter elige la mejor coincidencia', async () => {
    const user = userEvent.setup()
    render(<Harness />)
    await user.type(screen.getByLabelText('Buscar nota'), 'vainilla{Enter}')
    expect(screen.getByRole('button', { name: 'Quitar nota Vainilla' })).toBeInTheDocument()
  })

  it('con 12 notas no deja agregar más', async () => {
    const doce = ['Jazmín', 'Hibisco', 'Rosa', 'Panela', 'Miel', 'Cacao', 'Nuez', 'Canela', 'Clavo', 'Mora', 'Fresa', 'Lulo']
    render(<Harness inicial={doce} />)
    expect(screen.getByText(/máximo de 12 notas/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Cítricos' })).toBeDisabled()
  })
})
