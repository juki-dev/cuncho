import { useId, useMemo, useState, type KeyboardEvent } from 'react'
import { buscarNotas, MAX_RESULTADOS } from '../../lib/buscarNotas'
import { esNotaValida, MAX_NOTAS, normalizarNota, plegar } from '../../lib/catalogo'
import { NOTAS_CAFE } from '../../lib/notasCafe'
import { Chip } from '../../components/Chip'
import c from './Catacion.module.css'
import s from './NotaPicker.module.css'

interface Props {
  /** Notas elegidas (del catálogo o personalizadas). */
  value: readonly string[]
  /** Agrega la nota si no estaba y la quita si estaba. */
  onToggle: (nota: string) => void
}

/** Selector de notas de sabor: buscador sobre la rueda del café, con las 10 mejores coincidencias. */
export function NotaPicker({ value, onToggle }: Props) {
  const [consulta, setConsulta] = useState('')
  const inputId = useId()
  const ayudaId = useId()
  const { resultados, total } = useMemo(() => buscarNotas(consulta), [consulta])

  const elegidas = useMemo(() => new Set(value.map(plegar)), [value])
  const lleno = value.length >= MAX_NOTAS
  const q = plegar(consulta)
  // Se ofrece crear la nota si no existe ya (ni en el catálogo ni entre las elegidas).
  const hayExacta = resultados.some((r) => plegar(r.nombre) === q) || elegidas.has(q)
  const puedeCrear = q.length > 0 && !hayExacta
  const validaPersonalizada = puedeCrear && esNotaValida(consulta)

  const agregarPersonalizada = () => {
    if (!validaPersonalizada || lleno) return
    onToggle(normalizarNota(consulta))
    setConsulta('')
  }

  const alPulsar = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== 'Enter') return
    e.preventDefault()
    const primera = resultados[0]
    if (primera && !elegidas.has(plegar(primera.nombre)) && !lleno) onToggle(primera.nombre)
    else if (!primera) agregarPersonalizada()
  }

  let estado: string
  if (!q) estado = `Sugerencias. Busca entre las ${NOTAS_CAFE.length} notas de la rueda del café.`
  else if (total === 0) estado = 'Sin coincidencias en la rueda del café.'
  else if (total > MAX_RESULTADOS) estado = `Mostrando ${MAX_RESULTADOS} de ${total} coincidencias. Escribe más para afinar.`
  else estado = total === 1 ? '1 coincidencia.' : `${total} coincidencias.`

  return (
    <fieldset className={c.fieldset}>
      <legend className={`${c.legend} ${s.legend}`}>
        <span>Perfil de sabor</span>
        <span className={s.aside} aria-live="polite">
          {value.length === 1 ? '1 nota' : `${value.length} notas`}
        </span>
      </legend>

      {value.length > 0 && (
        <ul className={s.elegidas} aria-label="Notas elegidas">
          {value.map((n) => (
            <li key={n}>
              <Chip selected muted aria-label={`Quitar nota ${n}`} onClick={() => onToggle(n)}>
                {n} <span aria-hidden="true">×</span>
              </Chip>
            </li>
          ))}
        </ul>
      )}

      <label htmlFor={inputId} className={c.subLabel}>
        Buscar nota
      </label>
      <input
        id={inputId}
        type="search"
        className={c.input}
        value={consulta}
        onChange={(e) => setConsulta(e.target.value)}
        onKeyDown={alPulsar}
        placeholder="Durazno, canela, vainilla…"
        autoComplete="off"
        autoCapitalize="none"
        spellCheck={false}
        maxLength={40}
        aria-describedby={ayudaId}
      />
      <p id={ayudaId} className={c.help} role="status">
        {estado}
      </p>

      <div className={c.chips} role="group" aria-label="Resultados">
        {resultados.map((n) => (
          <Chip
            key={n.nombre}
            selected={elegidas.has(plegar(n.nombre))}
            muted
            title={n.familia}
            disabled={lleno && !elegidas.has(plegar(n.nombre))}
            onClick={() => onToggle(n.nombre)}
          >
            {n.nombre}
          </Chip>
        ))}
        {validaPersonalizada && (
          <Chip selected={false} muted className={s.crear} disabled={lleno} onClick={agregarPersonalizada}>
            Agregar «{normalizarNota(consulta)}»
          </Chip>
        )}
      </div>

      {puedeCrear && !validaPersonalizada && (
        <p className={c.help}>Una nota personalizada usa de 2 a 40 letras o números.</p>
      )}
      {lleno && <p className={c.help}>Llegaste al máximo de {MAX_NOTAS} notas. Quita alguna para agregar otra.</p>}
    </fieldset>
  )
}
