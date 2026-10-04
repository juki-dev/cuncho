import { useId, useState, type FormEvent } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { Button } from '../../components/Button'
import { api, ApiError, NetworkError } from '../../lib/api/client'
import { googleDisponible, iniciarGoogle } from '../../lib/auth/google'
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

  const conGoogle = () => {
    setError(null)
    iniciarGoogle(desde).catch(() => setError('No pudimos iniciar sesión con Google.'))
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
      {googleDisponible && (
        <>
          <p className={s.separador}>o</p>
          <button type="button" className={s.google} onClick={conGoogle}>
            <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
              <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.8 2.4 30.3 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.9 6.1C12.4 13.6 17.7 9.5 24 9.5z" />
              <path fill="#4285F4" d="M46.1 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.4c-.5 2.9-2.2 5.3-4.6 6.9l7.5 5.8c4.4-4.1 6.8-10.1 6.8-17.2z" />
              <path fill="#FBBC05" d="M10.5 28.7c-.5-1.4-.8-2.9-.8-4.7s.3-3.3.8-4.7l-7.9-6.1C.9 16.4 0 20.1 0 24s.9 7.6 2.6 10.8l7.9-6.1z" />
              <path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.5-5.8c-2.1 1.4-4.8 2.3-8.4 2.3-6.3 0-11.6-4.1-13.5-9.8l-7.9 6.1C6.5 42.6 14.6 48 24 48z" />
            </svg>
            Continuar con Google
          </button>
        </>
      )}
      <a className={s.volver} href="/">
        Seguir explorando el mapa
      </a>
    </main>
  )
}
