/**
 * Inicio de sesión con Google vía Cognito Hosted UI: código de autorización + PKCE.
 * El navegador nunca ve secretos (el app client es público). Cognito devuelve un ID token
 * que la API valida y canjea por sus propios tokens (POST /auth/cognito).
 */

const DOMINIO = import.meta.env.VITE_COGNITO_DOMAIN
const CLIENT_ID = import.meta.env.VITE_COGNITO_CLIENT_ID

const CLAVE_VERIFIER = 'cuncho-pkce-verifier'
const CLAVE_STATE = 'cuncho-pkce-state'
const CLAVE_DESDE = 'cuncho-pkce-desde'

export const googleDisponible = Boolean(DOMINIO && CLIENT_ID)

export const urlRetorno = () => `${window.location.origin}/auth/callback`

const base64Url = (bytes: Uint8Array) =>
  btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')

const aleatorio = (n: number) => base64Url(crypto.getRandomValues(new Uint8Array(n)))

export async function desafioPkce(verifier: string): Promise<string> {
  return base64Url(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier))))
}

/** Redirige al login de Google. `desde` es la ruta a la que volver tras autenticarse. */
export async function iniciarGoogle(desde: string): Promise<void> {
  if (!googleDisponible) throw new Error('Inicio de sesión con Google no configurado')
  const verifier = aleatorio(48)
  const state = aleatorio(24)
  sessionStorage.setItem(CLAVE_VERIFIER, verifier)
  sessionStorage.setItem(CLAVE_STATE, state)
  sessionStorage.setItem(CLAVE_DESDE, desde)
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: CLIENT_ID!,
    redirect_uri: urlRetorno(),
    scope: 'openid email profile',
    identity_provider: 'Google',
    state,
    code_challenge: await desafioPkce(verifier),
    code_challenge_method: 'S256',
  })
  window.location.assign(`https://${DOMINIO}/oauth2/authorize?${params}`)
}

export class GoogleAuthError extends Error {
  constructor(
    message: string,
    /** true = el usuario canceló en Google (no es un fallo). */
    readonly cancelado = false,
  ) {
    super(message)
    this.name = 'GoogleAuthError'
  }
}

/**
 * Procesa /auth/callback: valida `state`, canjea el código por el ID token y devuelve la
 * ruta a la que volver. Los valores de PKCE se consumen aunque falle (un solo uso).
 */
export async function completarGoogle(
  search: string,
  entregarIdToken: (idToken: string) => Promise<void>,
): Promise<string> {
  const q = new URLSearchParams(search)
  const verifier = sessionStorage.getItem(CLAVE_VERIFIER)
  const state = sessionStorage.getItem(CLAVE_STATE)
  const desde = sessionStorage.getItem(CLAVE_DESDE) ?? '/'
  sessionStorage.removeItem(CLAVE_VERIFIER)
  sessionStorage.removeItem(CLAVE_STATE)
  sessionStorage.removeItem(CLAVE_DESDE)

  if (q.get('error')) {
    const cancelado = q.get('error_description')?.toLowerCase().includes('access_denied') || q.get('error') === 'access_denied'
    throw new GoogleAuthError('Google no autorizó el acceso.', Boolean(cancelado))
  }
  const code = q.get('code')
  if (!code || !verifier || !state || q.get('state') !== state) {
    throw new GoogleAuthError('La sesión de inicio expiró. Inténtalo de nuevo.')
  }

  let res: Response
  try {
    res = await fetch(`https://${DOMINIO}/oauth2/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: CLIENT_ID!,
        code,
        redirect_uri: urlRetorno(),
        code_verifier: verifier,
      }),
    })
  } catch {
    throw new GoogleAuthError('Sin conexión con el servicio de inicio de sesión.')
  }
  const json = (await res.json().catch(() => null)) as { id_token?: string } | null
  if (!res.ok || !json?.id_token) throw new GoogleAuthError('No pudimos completar el inicio de sesión con Google.')
  await entregarIdToken(json.id_token)
  return desde
}
