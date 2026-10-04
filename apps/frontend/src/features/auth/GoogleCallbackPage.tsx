import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api, ApiError } from '../../lib/api/client'
import { completarGoogle, GoogleAuthError } from '../../lib/auth/google'
import { useSesion } from '../../lib/auth/session'
import s from './Acceso.module.css'

/** Destino del redirect de Cognito (/auth/callback): canjea el código y abre la sesión. */
export function GoogleCallbackPage() {
  const navigate = useNavigate()
  const iniciar = useSesion((st) => st.iniciar)
  const [error, setError] = useState<string | null>(null)
  // StrictMode ejecuta los efectos dos veces en desarrollo; el código solo sirve una vez.
  const ejecutado = useRef(false)

  useEffect(() => {
    if (ejecutado.current) return
    ejecutado.current = true
    completarGoogle(window.location.search, async (idToken) => {
      const sesion = await api.iniciarConGoogle(idToken)
      iniciar({ accessToken: sesion.access_token, refreshToken: sesion.refresh_token, usuario: sesion.usuario })
    })
      .then((desde) => navigate(desde, { replace: true }))
      .catch((e: unknown) => {
        if (e instanceof GoogleAuthError) setError(e.cancelado ? 'Cancelaste el inicio de sesión con Google.' : e.message)
        else if (e instanceof ApiError && e.status === 409) setError('Ese correo ya está vinculado a otra cuenta de Google.')
        else if (e instanceof ApiError && e.status === 404) setError('El inicio de sesión con Google no está disponible.')
        else setError('No pudimos iniciar sesión con Google. Inténtalo de nuevo.')
      })
  }, [iniciar, navigate])

  return (
    <main className={s.page}>
      <h1 className={s.title}>Cuncho</h1>
      {error ? (
        <>
          <p role="alert" className={s.error}>
            {error}
          </p>
          <Link className={s.volver} to="/acceso">
            Volver a ingresar
          </Link>
        </>
      ) : (
        <p role="status">Iniciando sesión con Google…</p>
      )}
    </main>
  )
}
