import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { API, createTestApp, registerUser, resetDb } from './utils/test-app';

describe('Auth (e2e)', () => {
  let app: INestApplication<App>;
  const http = () => request(app.getHttpServer());

  beforeAll(async () => {
    app = await createTestApp();
    await resetDb(app);
  });
  afterAll(() => app.close());

  it('GET /health responde sin prefijo ni token', async () => {
    const res = await http().get('/health').expect(200);
    expect(res.body.info.database.status).toBe('up');
  });

  it('registro, login y /users/me', async () => {
    await http()
      .post(`${API}/auth/register`)
      .send({ email: 'Ana@Test.co', password: 'clave-segura-123', nombre: 'Ana' })
      .expect(201);

    const login = await http()
      .post(`${API}/auth/login`)
      .send({ email: 'ana@test.co', password: 'clave-segura-123' })
      .expect(200);
    expect(login.body).toMatchObject({ token_type: 'Bearer', usuario: { email: 'ana@test.co', nombre: 'Ana' } });

    const me = await http().get(`${API}/users/me`).set('Authorization', `Bearer ${login.body.access_token}`).expect(200);
    expect(me.body).toMatchObject({ email: 'ana@test.co', nombre: 'Ana' });
    expect(me.body.password_hash).toBeUndefined();
  });

  it('correo duplicado → 409; credenciales malas → 401 con formato de error', async () => {
    await http()
      .post(`${API}/auth/register`)
      .send({ email: 'ana@test.co', password: 'otra-clave-123', nombre: 'Otra' })
      .expect(409);
    const res = await http().post(`${API}/auth/login`).send({ email: 'ana@test.co', password: 'mala' }).expect(401);
    expect(res.body).toEqual({ statusCode: 401, error: 'Unauthorized', message: 'Correo o contraseña incorrectos' });
  });

  it('valida el cuerpo y rechaza campos extra', async () => {
    const res = await http()
      .post(`${API}/auth/register`)
      .send({ email: 'no-es-correo', password: '123', nombre: 'X', admin: true })
      .expect(400);
    expect(res.body.statusCode).toBe(400);
    const fields = (res.body.details as { field: string }[]).map((d) => d.field);
    expect(fields).toEqual(expect.arrayContaining(['email', 'password', 'admin']));
  });

  it('endpoints privados exigen token', async () => {
    await http().get(`${API}/users/me`).expect(401);
    await http().get(`${API}/users/me`).set('Authorization', 'Bearer basura').expect(401);
  });

  it('refresh rota el token y la reutilización revoca la familia', async () => {
    const user = await registerUser(app);
    const r1 = await http().post(`${API}/auth/refresh`).send({ refresh_token: user.refreshToken }).expect(200);
    expect(r1.body.refresh_token).not.toBe(user.refreshToken);

    // Reutilizar el token viejo: 401 y la familia queda revocada (el nuevo tampoco sirve).
    await http().post(`${API}/auth/refresh`).send({ refresh_token: user.refreshToken }).expect(401);
    await http().post(`${API}/auth/refresh`).send({ refresh_token: r1.body.refresh_token }).expect(401);
  });

  it('logout invalida el refresh token', async () => {
    const user = await registerUser(app);
    await http().post(`${API}/auth/logout`).send({ refresh_token: user.refreshToken }).expect(204);
    await http().post(`${API}/auth/refresh`).send({ refresh_token: user.refreshToken }).expect(401);
  });
});
