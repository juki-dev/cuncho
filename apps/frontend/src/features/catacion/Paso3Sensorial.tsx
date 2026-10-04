import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { claves } from '../../lib/api/queries'
import type { NivelAcidez } from '../../lib/api/types'
import {
  clasificarSca,
  ESCALA_PERSONAL,
  ESCALA_SCA,
  ETIQUETA_ACIDEZ,
  TIPOS_ACIDEZ,
} from '../../lib/catalogo'
import { guardarCatacion } from '../../lib/offline-queue'
import { Button } from '../../components/Button'
import { Card } from '../../components/Card'
import { RangeField } from '../../components/RangeField'
import { StepHeader } from '../../components/StepHeader'
import { StepLayout } from '../../components/StepLayout'
import { IconCheck } from '../../components/icons'
import type { EstadoBitacora } from '../bitacora/BitacoraPage'
import { NotaPicker } from './NotaPicker'
import { aPayload, faltantesGrano, useBorradorHidratado, useCatacionDraft } from './useCatacionDraft'
import s from './Paso3Sensorial.module.css'

const TICKS = Object.values(TIPOS_ACIDEZ)

export function Paso3Sensorial() {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const hidratado = useBorradorHidratado()
  const borrador = useCatacionDraft()
  const { sensorial, setSensorial, alternarNota, reiniciar } = borrador
  const [error, setError] = useState<string | null>(null)
  const [guardando, setGuardando] = useState(false)

  if (hidratado && !guardando) {
    if (!borrador.lugar) return <Navigate to="/catar/lugar" replace />
    if (faltantesGrano(borrador).length > 0) return <Navigate to="/catar/grano" replace />
  }

  const sca = sensorial.escala === 'SCA'
  const escala = sca ? ESCALA_SCA : ESCALA_PERSONAL
  const puntaje = sca ? sensorial.puntajeSca : sensorial.puntajePersonal
  const puntajeTexto = sca ? puntaje.toFixed(2) : puntaje.toFixed(1)
  const puntajeEtiqueta = sca ? clasificarSca(puntaje) : 'de 10 · escala personal'

  const guardar = async () => {
    const payload = aPayload(borrador)
    if (!payload) {
      setError('Elige al menos una nota de sabor.')
      return
    }
    setError(null)
    setGuardando(true)
    try {
      const r = await guardarCatacion(payload)
      await Promise.all([
        qc.invalidateQueries({ queryKey: claves.misCataciones }),
        qc.invalidateQueries({ queryKey: claves.pendientes }),
        qc.invalidateQueries({ queryKey: ['lugares'] }),
      ])
      reiniciar()
      navigate('/bitacora', { replace: true, state: { guardada: r.estado } satisfies EstadoBitacora })
    } catch {
      setGuardando(false)
      setError('No pudimos guardar la catación. Revisa los datos e inténtalo de nuevo.')
    }
  }

  return (
    <StepLayout
      gap={14}
      header={
        <StepHeader
          eyebrow="Paso 3 de 3 · Sensorial"
          title="¿Cómo sabe?"
          step={3}
          total={3}
          onBack={() => navigate('/catar/grano')}
        />
      }
      error={error}
      footer={
        <Button block onClick={() => void guardar()} disabled={guardando} aria-busy={guardando}>
          <IconCheck />
          {guardando ? 'Guardando…' : 'Guardar en mi bitácora'}
        </Button>
      }
    >
      <Card as="section">
        <RangeField
          id="acidez"
          label="Acidez"
          min={1}
          max={5}
          step={1}
          value={sensorial.acidez}
          onChange={(v) => setSensorial({ acidez: v as NivelAcidez })}
          badge={ETIQUETA_ACIDEZ[sensorial.acidez]}
          valueText={`${sensorial.acidez} de 5, ${ETIQUETA_ACIDEZ[sensorial.acidez]}`}
          ticks={TICKS}
        />
      </Card>

      <Card as="section">
        <NotaPicker
          value={sensorial.notas}
          onToggle={(nota) => {
            alternarNota(nota)
            setError(null)
          }}
        />
      </Card>

      <Card as="section">
        <RangeField
          id="puntaje"
          label="Puntuación"
          min={escala.min}
          max={escala.max}
          step={escala.paso}
          value={puntaje}
          onChange={(v) => setSensorial(sca ? { puntajeSca: v } : { puntajePersonal: v })}
          valueText={`${puntajeTexto}, ${puntajeEtiqueta}`}
          trailing={
            <div className={s.seg} role="group" aria-label="Escala">
              <button
                type="button"
                className={s.segBtn}
                aria-pressed={sca}
                onClick={() => setSensorial({ escala: 'SCA' })}
              >
                SCA
              </button>
              <button
                type="button"
                className={s.segBtn}
                aria-pressed={!sca}
                onClick={() => setSensorial({ escala: 'Personal' })}
              >
                Personal
              </button>
            </div>
          }
        >
          <div className={s.score}>
            <span className={s.scoreNum}>{puntajeTexto}</span>
            <span className={s.scoreLabel}>{puntajeEtiqueta}</span>
          </div>
        </RangeField>
      </Card>
    </StepLayout>
  )
}
