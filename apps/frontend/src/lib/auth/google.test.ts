import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

const DOMINIO = 'cuncho-test.auth.us-east-1.amazoncognito.com'
const server = setupServer()
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterAll(() => server.close())

async function cargar() {
  vi.resetModules()
  vi.stubEnv('VITE_COGNITO_DOMAIN', DOMINIO)
  vi.stubEnv('VITE_COGNITO_CLIENT_ID', 'client-123')
  return import('./google')
}

let destino = ''
beforeEach(() => {
  sessionStorage.clear()
  destino = ''
  Object.defineProperty(window, 'location', {
    configurable: true,
    value: { origin: 'https://cuncho.jukidev.com', assign: (u: string) => (destino = u) },
  })
})
afterEach(() => {
  server.resetHandlers()
  vi.unstubAllEnvs()
})

describe('PKCE', () => {
  it('el desafío S256 coincide con el vector de la RFC 7636', async () => {
    const { desafioPkce } = await cargar()
    expect(await desafioPkce('dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk')).toBe('E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM')
  })
})

describe('iniciarGoogle', () => {
  it('redirige al Hosted UI con Google, PKCE y state, y guarda verifier/state/destino', async () => {
    const { iniciarGoogle } = await cargar()
    await iniciarGoogle('/bitacora')
    const u = new URL(destino)
    expect(u.origin).toBe(`https://${DOMINIO}`)
    expect(u.pathname).toBe('/oauth2/authorize')
    expect(Object.fromEntries(u.searchParams)).toMatchObject({
      response_type: 'code',
      client_id: 'client-123',
      redirect_uri: 'https://cuncho.jukidev.com/auth/callback',
      identity_provider: 'Google',
      code_challenge_method: 'S256',
    })
    expect(u.searchParams.get('state')).toBe(sessionStorage.getItem('cuncho-pkce-state'))
    expect(u.searchParams.get('code_challenge')).toBeTruthy()
    expect(sessionStorage.getItem('cuncho-pkce-desde')).toBe('/bitacora')
  })
})

describe('completarGoogle', () => {
  const preparar = async () => {
    const m = await cargar()
    await m.iniciarGoogle('/catar/lugar')
    return { m, state: sessionStorage.getItem('cuncho-pkce-state')!, verifier: sessionStorage.getItem('cuncho-pkce-verifier')! }
  }

  it('canjea el código con el verifier y entrega el ID token; devuelve la ruta de origen', async () => {
    const { m, state, verifier } = await preparar()
    let form: URLSearchParams | undefined
    server.use(
      http.post(`https://${DOMINIO}/oauth2/token`, async ({ request }) => {
        form = new URLSearchParams(await request.text())
        return HttpResponse.json({ id_token: 'id.token.value', access_token: 'a' })
      }),
    )
    const entregados: string[] = []
    const desde = await m.completarGoogle(`?code=abc&state=${state}`, async (t) => void entregados.push(t))
    expect(desde).toBe('/catar/lugar')
    expect(entregados).toEqual(['id.token.value'])
    expect(Object.fromEntries(form!)).toMatchObject({ grant_type: 'authorization_code', code: 'abc', code_verifier: verifier, client_id: 'client-123' })
    expect(sessionStorage.getItem('cuncho-pkce-verifier')).toBeNull() // un solo uso
  })

  it('rechaza un state que no coincide (CSRF) sin llamar a Cognito', async () => {
    const { m } = await preparar()
    await expect(m.completarGoogle('?code=abc&state=otro', async () => {})).rejects.toMatchObject({ name: 'GoogleAuthError' })
  })

  it('sin verifier guardado (p. ej. pestaña nueva) falla', async () => {
    const m = await cargar()
    await expect(m.completarGoogle('?code=abc&state=x', async () => {})).rejects.toMatchObject({ name: 'GoogleAuthError' })
  })

  it('distingue la cancelación del usuario en Google', async () => {
    const { m } = await preparar()
    await expect(m.completarGoogle('?error=access_denied', async () => {})).rejects.toMatchObject({ cancelado: true })
  })

  it('si Cognito rechaza el canje, falla con mensaje y no entrega nada', async () => {
    const { m, state } = await preparar()
    server.use(http.post(`https://${DOMINIO}/oauth2/token`, () => HttpResponse.json({ error: 'invalid_grant' }, { status: 400 })))
    const entregar = vi.fn()
    await expect(m.completarGoogle(`?code=abc&state=${state}`, entregar)).rejects.toMatchObject({ name: 'GoogleAuthError' })
    expect(entregar).not.toHaveBeenCalled()
  })
})

describe('sin configuración', () => {
  it('googleDisponible es false y iniciarGoogle falla', async () => {
    vi.resetModules()
    vi.stubEnv('VITE_COGNITO_DOMAIN', '')
    vi.stubEnv('VITE_COGNITO_CLIENT_ID', '')
    const m = await import('./google')
    expect(m.googleDisponible).toBe(false)
    await expect(m.iniciarGoogle('/')).rejects.toThrow()
  })
})
