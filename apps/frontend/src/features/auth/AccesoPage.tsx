import { useId, useState, type FormEvent } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { Button } from '../../components/Button'
import { api, ApiError, NetworkError } from '../../lib/api/client'
import { useSesion } from '../../lib/auth/session'
import type { EstadoAcceso } from './RequireAuth'
import s from './Acceso.module.css'

type Modo = 'entrar' | 'crear'

function mensajeDeError(e: unknown, modo: Modo): string {
  if (e instanceof NetworkError) return 'Sin conexión con el servidor. Inténtalo de nuevo.'
  if (e instanceof ApiError) {
    if (e.status === 401) return 'Correo o contraseña incorrectos.'
    if (e.status === 409) return 'Ya existe una cuenta con ese correo.'
    if (e.status === 429) return 'Demasiados intentos. Espera un minuto e inténtalo de nuevo.'
    if (e.status === 400) return modo === 'crear' ? 'Revisa los datos: la contraseña debe tener al menos 8 caracteres.' : 'Revisa el correo y la contraseña.'
  }
  return 'No pudimos continuar. Inténtalo de nuevo.'
}

export function AccesoPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const desde = (location.state as EstadoAcceso | null)?.desde ?? '/'
  const logueado = useSesion((st) => st.accessToken !== null)
  const iniciar = useSesion((st) => st.iniciar)
  const [modo, setModo] = useState<Modo>('entrar')
  const [nombre, setNombre] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)
  const nombreId = useId()
  const emailId = useId()
  const passId = useId()

  if (logueado) return <Navigate to={desde} replace />

  const enviar = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setEnviando(true)
    try {
      const sesion =
        modo === 'crear'
          ? await api.registrar({ email: email.trim(), password, nombre: nombre.trim() })
          : await api.iniciarSesion({ email: email.trim(), password })
      iniciar({ accessToken: sesion.access_token, refreshToken: sesion.refresh_token, usuario: sesion.usuario })
      navigate(desde, { replace: true })
    } catch (err) {
      setError(mensajeDeError(err, modo))
    } finally {
      setEnviando(false)
    }
  }

  return (
    <main className={s.page}>
      <h1 className={s.title}>Cuncho</h1>
      <p className={s.tagline}>La huella del cuncho</p>

      <div className={s.tabs} role="group" aria-label="Acceso">
        <button type="button" className={s.tab} aria-pressed={modo === 'entrar'} onClick={() => setModo('entrar')}>
          Ingresar
        </button>
        <button type="button" className={s.tab} aria-pressed={modo === 'crear'} onClick={() => setModo('crear')}>
          Crear cuenta
        </button>
      </div>

      <form className={s.form} onSubmit={enviar}>
        {modo === 'crear' && (
          <div className={s.field}>
            <label htmlFor={nombreId}>Nombre</label>
            <input id={nombreId} value={nombre} onChange={(e) => setNombre(e.target.value)} autoComplete="name" required maxLength={80} />
          </div>
        )}
        <div className={s.field}>
          <label htmlFor={emailId}>Correo</label>
          <input id={emailId} type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required />
        </div>
        <div className={s.field}>
          <label htmlFor={passId}>Contraseña</label>
          <input
            id={passId}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete={modo === 'crear' ? 'new-password' : 'current-password'}
            required
            minLength={modo === 'crear' ? 8 : 1}
            maxLength={128}
          />
        </div>
        {error && (
          <p role="alert" className={s.error}>
            {error}
          </p>
        )}
        <Button type="submit" block disabled={enviando}>
          {enviando ? 'Un momento…' : modo === 'crear' ? 'Crear cuenta' : 'Ingresar'}
        </Button>
      </form>
      <a className={s.volver} href="/">
        Seguir explorando el mapa
      </a>
    </main>
  )
}
