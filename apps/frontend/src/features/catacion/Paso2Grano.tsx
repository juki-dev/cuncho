import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { METODOS, PROCESOS, VARIEDADES_SUGERIDAS } from '../../lib/catalogo'
import { Button } from '../../components/Button'
import { Chip } from '../../components/Chip'
import { ChipGroup } from '../../components/ChipGroup'
import { StepHeader } from '../../components/StepHeader'
import { StepLayout } from '../../components/StepLayout'
import { faltantesGrano, useBorradorHidratado, useCatacionDraft, type CampoFaltante } from './useCatacionDraft'
import c from './Catacion.module.css'

const NOMBRES: Record<CampoFaltante, string> = {
  lugar: 'el lugar',
  variedad: 'la variedad',
  proceso: 'el proceso',
  metodo: 'el método',
  notas: 'las notas',
}

const ids: Partial<Record<CampoFaltante, string>> = { variedad: 'variedad', proceso: 'proceso', metodo: 'metodo' }

export function Paso2Grano() {
  const navigate = useNavigate()
  const hidratado = useBorradorHidratado()
  const borrador = useCatacionDraft()
  const { grano, setGrano } = borrador
  // Tras el primer intento de continuar, los faltantes se recalculan en vivo.
  const [intentado, setIntentado] = useState(false)
  const faltan = intentado ? faltantesGrano(borrador) : []

  if (hidratado && !borrador.lugar) return <Navigate to="/catar/lugar" replace />

  const continuar = () => {
    const f = faltantesGrano(borrador)
    setIntentado(true)
    if (f.length === 0) {
      navigate('/catar/sensorial')
      return
    }
    // Lleva el foco al primer campo incompleto.
    const el = document.getElementById(ids[f[0]!] ?? '')
    const foco = el instanceof HTMLInputElement ? el : el?.querySelector<HTMLElement>('button')
    foco?.focus()
  }

  const variedadLower = grano.variedad.trim().toLowerCase()

  return (
    <StepLayout
      gap={18}
      header={
        <StepHeader
          eyebrow="Paso 2 de 3 · Ficha técnica"
          title="¿Qué grano es?"
          step={2}
          total={3}
          onBack={() => navigate('/catar/lugar')}
        />
      }
      error={faltan.length ? `Falta ${faltan.map((f) => NOMBRES[f]).join(', ')}.` : null}
      footer={
        <Button block onClick={continuar}>
          Continuar a la evaluación
        </Button>
      }
    >
      <div className={c.field}>
        <label htmlFor="variedad" className={c.label}>
          Nombre del café / Variedad
        </label>
        <input
          id="variedad"
          className={c.input}
          type="text"
          placeholder="Ej. Geisha, Bourbon Rosado"
          value={grano.variedad}
          aria-invalid={faltan.includes('variedad') || undefined}
          onChange={(e) => setGrano({ variedad: e.target.value })}
          autoComplete="off"
        />
        <div className={c.chips} role="group" aria-label="Variedades frecuentes">
          {VARIEDADES_SUGERIDAS.map((v) => (
            <Chip key={v} selected={variedadLower === v.toLowerCase()} onClick={() => setGrano({ variedad: v })}>
              {v}
            </Chip>
          ))}
        </div>
      </div>

      {/* El modelo separa finca y región; el diseño muestra un solo campo. */}
      <fieldset className={c.fieldset}>
        <legend className={c.legend}>Finca / Región</legend>
        <div className={c.grid2}>
          <div className={c.field}>
            <label htmlFor="finca" className={c.subLabel}>
              Finca
            </label>
            <input
              id="finca"
              className={c.input}
              type="text"
              placeholder="Ej. La Esperanza"
              value={grano.finca}
              onChange={(e) => setGrano({ finca: e.target.value })}
            />
          </div>
          <div className={c.field}>
            <label htmlFor="region" className={c.subLabel}>
              Región
            </label>
            <input
              id="region"
              className={c.input}
              type="text"
              placeholder="Ej. Pitalito, Huila"
              value={grano.region}
              onChange={(e) => setGrano({ region: e.target.value })}
            />
          </div>
        </div>
      </fieldset>

      <ChipGroup
        id="proceso"
        legend="Proceso"
        layout="grid2"
        options={PROCESOS}
        value={grano.proceso}
        onChange={(proceso) => setGrano({ proceso })}
      />

      <ChipGroup
        id="metodo"
        legend="Método de preparación"
        options={METODOS}
        value={grano.metodo}
        onChange={(metodo) => setGrano({ metodo })}
      />
    </StepLayout>
  )
}
