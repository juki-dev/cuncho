import { INestApplication, UnauthorizedException } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { COGNITO_VERIFIER, CognitoIdentity, CognitoVerifier } from '../src/domains/auth';
import { API, createTestApp, resetDb } from './utils/test-app';

/** Verificador falso: el token es `ok:<sub>:<email>:<nombre>`; cualquier otro se rechaza como inválido. */
class FakeVerifier implements CognitoVerifier {
  enabled = true;
  verify(token: string): Promise<CognitoIdentity> {
    const [ok, sub, email, name] = token.split(':');
    if (ok !== 'ok' || !sub || !email) return Promise.reject(new UnauthorizedException('Token de Google inválido o expirado'));
    return Promise.resolve({ sub, email, name: name ?? '' });
  }
}

const pad = (t: string) => t.padEnd(30, '.'); // el DTO exige longitud mínima

describe('POST /auth/cognito (e2e)', () => {
  let app: INestApplication<App>;
  const http = () => request(app.getHttpServer());
  const loginG = (token: string) => http().post(`${API}/auth/cognito`).send({ id_token: pad(token) });

  beforeAll(async () => {
    app = await createTestApp((b) => b.overrideProvider(COGNITO_VERIFIER).useValue(new FakeVerifier()));
    await resetDb(app);
  });
  afterAll(() => app.close());

  it('crea la cuenta en el primer inicio de sesión y devuelve los tokens de la API', async () => {
    const res = await loginG('ok:sub-1:nueva@gmail.com:Nueva Persona').expect(200);
    expect(res.body).toMatchObject({ token_type: 'Bearer', usuario: { email: 'nueva@gmail.com', nombre: 'Nueva Persona' } });
    const me = await http().get(`${API}/users/me`).set('Authorization', `Bearer ${res.body.access_token}`).expect(200);
    expect(me.body.email).toBe('nueva@gmail.com');
    // El refresh token funciona como el de cualquier otra cuenta.
    await http().post(`${API}/auth/refresh`).send({ refresh_token: res.body.refresh_token }).expect(200);
  });

  it('es idempotente: el segundo inicio de sesión usa la misma cuenta', async () => {
    const a = await loginG('ok:sub-2:dos@gmail.com:Dos').expect(200);
    const b = await loginG('ok:sub-2:dos@gmail.com:Dos').expect(200);
    expect(b.body.usuario.id).toBe(a.body.usuario.id);
  });

  it('inicios de sesión simultáneos del mismo usuario no duplican la cuenta', async () => {
    const res = await Promise.all(Array.from({ length: 5 }, () => loginG('ok:sub-3:carrera@gmail.com:Carrera')));
    expect(res.map((r) => r.status)).toEqual([200, 200, 200, 200, 200]);
    expect(new Set(res.map((r) => r.body.usuario.id)).size).toBe(1);
  });

  it('vincula con la cuenta de correo y contraseña existente (mismo correo verificado)', async () => {
    const reg = await http()
      .post(`${API}/auth/register`)
      .send({ email: 'mixta@gmail.com', password: 'clave-segura-123', nombre: 'Mixta' })
      .expect(201);
    const g = await loginG('ok:sub-4:mixta@gmail.com:Mixta G').expect(200);
    expect(g.body.usuario.id).toBe(reg.body.usuario.id);
    // La contraseña original sigue funcionando.
    await http().post(`${API}/auth/login`).send({ email: 'mixta@gmail.com', password: 'clave-segura-123' }).expect(200);
  });

  it('una cuenta de Google no puede entrar por contraseña (no tiene)', async () => {
    await loginG('ok:sub-5:soloG@gmail.com:Solo G').expect(200);
    await http().post(`${API}/auth/login`).send({ email: 'sologg@gmail.com', password: 'cualquier-cosa-123' }).expect(401);
  });

  it('un correo ya vinculado a otro sub de Google → 409', async () => {
    await loginG('ok:sub-6:vinc@gmail.com:Vinc').expect(200);
    await loginG('ok:sub-OTRO:vinc@gmail.com:Intruso').expect(409);
  });

  it('token inválido → 401; cuerpo inválido → 400', async () => {
    await loginG('malo').expect(401);
    await http().post(`${API}/auth/cognito`).send({ id_token: 'corto' }).expect(400);
  });
});

describe('POST /auth/cognito sin configurar (e2e)', () => {
  let app: INestApplication<App>;
  beforeAll(async () => {
    app = await createTestApp(); // verificador real, sin COGNITO_* → desactivado
  });
  afterAll(() => app.close());

  it('responde 404', async () => {
    await request(app.getHttpServer()).post(`${API}/auth/cognito`).send({ id_token: 'x'.repeat(30) }).expect(404);
  });
});
