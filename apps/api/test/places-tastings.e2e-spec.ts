import { INestApplication } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { App } from 'supertest/types';
import { API, createPlace, createTestApp, registerUser, resetDb, tastingBody, TestUser } from './utils/test-app';

describe('Places + Tastings (e2e)', () => {
  let app: INestApplication<App>;
  let ana: TestUser;
  let luis: TestUser;
  let origen: string;
  const http = () => request(app.getHttpServer());
  const auth = (u: TestUser) => ({ Authorization: `Bearer ${u.accessToken}` });

  beforeAll(async () => {
    app = await createTestApp();
    await resetDb(app);
    ana = await registerUser(app, 'Ana');
    luis = await registerUser(app, 'Luis');
    origen = await createPlace(app, ana, { nombre: 'Origen Cafetería', lat: 5.0689, lng: -75.5174 });
  });
  afterAll(() => app.close());

  describe('places', () => {
    it('detecta duplicado a menos de 30 m con nombre parecido', async () => {
      const res = await http()
        .post(`${API}/places`)
        .set(auth(luis))
        .send({ nombre: 'Cafetería Origen', lat: 5.06905, lng: -75.51745 })
        .expect(409);
      expect(res.body.details.lugar_existente).toMatchObject({ id: origen, nombre: 'Origen Cafetería' });
      expect(res.body.details.lugar_existente.distancia_m).toBeLessThan(30);
    });

    it('permite nombre parecido si está lejos, o distinto si está cerca', async () => {
      await createPlace(app, luis, { nombre: 'Origen Cafetería', lat: 5.0789, lng: -75.5174 });
      await createPlace(app, luis, { nombre: 'Azahar', lat: 5.06895, lng: -75.51742 });
    });

    it('GET /places?bbox es público y valida la caja', async () => {
      const res = await http().get(`${API}/places`).query({ bbox: '-75.53,5.06,-75.51,5.075' }).expect(200);
      expect(res.body.map((p: { nombre: string }) => p.nombre).sort()).toEqual(['Azahar', 'Origen Cafetería']);
      await http().get(`${API}/places`).query({ bbox: '1,2,3' }).expect(400);
    });

    it('GET /places/nearby ordena por distancia', async () => {
      const res = await http()
        .get(`${API}/places/nearby`)
        .set(auth(ana))
        .query({ lat: 5.0689, lng: -75.5174, radius: 2 })
        .expect(200);
      const d = res.body.map((p: { distancia_m: number }) => p.distancia_m);
      expect(d).toEqual([...d].sort((a, b) => a - b));
      expect(res.body[0].distancia_m).toBeLessThan(5);
    });
  });

  describe('tastings', () => {
    it('crea con 201, deriva descriptores y actualiza el agregado del lugar', async () => {
      const res = await http()
        .post(`${API}/tastings`)
        .set(auth(ana))
        .send(tastingBody(origen, { sensorial: { ...tastingBody(origen).sensorial, descriptores: ['chocolate'] } }))
        .expect(201);
      expect(res.body.sensorial.descriptores).toEqual(['floral', 'frutal']);
      expect(res.body.lugar).toMatchObject({ id: origen, nombre: 'Origen Cafetería', lat: 5.0689, lng: -75.5174 });

      const places = await http().get(`${API}/places`).query({ bbox: '-75.53,5.06,-75.51,5.075' }).expect(200);
      const p = places.body.find((x: { id: string }) => x.id === origen);
      expect(p).toMatchObject({ puntaje_promedio: 90, total_cataciones: 1, descriptores: ['floral', 'frutal'] });
      expect(p.destacada).toMatchObject({ variedad: 'Geisha', metodo: 'V60' });
    });

    it('idempotencia: mismo id → 200 con la existente, sin duplicar ni recontar', async () => {
      const id = randomUUID();
      const body = { ...tastingBody(origen), id, sensorial: { ...tastingBody(origen).sensorial, puntaje: 8, escala: 'Personal' } };
      const first = await http().post(`${API}/tastings`).set(auth(ana)).send(body).expect(201);
      const retry = await http().post(`${API}/tastings`).set(auth(ana)).send(body).expect(200);
      expect(retry.body).toEqual(first.body);

      // Header Idempotency-Key equivale al id del cuerpo.
      const { id: _omit, ...withoutId } = body;
      await http().post(`${API}/tastings`).set(auth(ana)).set('Idempotency-Key', id).send(withoutId).expect(200);

      // Otro usuario con el mismo id → 409.
      await http().post(`${API}/tastings`).set(auth(luis)).send(body).expect(409);

      const places = await http().get(`${API}/places`).query({ bbox: '-75.53,5.06,-75.51,5.075' });
      const p = places.body.find((x: { id: string }) => x.id === origen);
      expect(p.total_cataciones).toBe(2);
      expect(p.puntaje_promedio).toBe(85); // (90 + 80) / 2
    });

    it('reintentos concurrentes con el mismo id crean una sola catación', async () => {
      const body = { ...tastingBody(origen), id: randomUUID() };
      const results = await Promise.all(
        Array.from({ length: 5 }, () => http().post(`${API}/tastings`).set(auth(luis)).send(body)),
      );
      const codes = results.map((r) => r.status).sort();
      expect(codes.filter((c) => c === 201)).toHaveLength(1);
      expect(codes.filter((c) => c === 200)).toHaveLength(4);
    });

    it.each`
      desc                    | patch                                                         | field
      ${'paso SCA inválido'}  | ${{ sensorial: { puntaje: 90.1 } }}                           | ${'sensorial.puntaje'}
      ${'personal fuera'}     | ${{ sensorial: { puntaje: 11, escala: 'Personal' } }}         | ${'sensorial.puntaje'}
      ${'nota con HTML'}      | ${{ sensorial: { notas: ['<b>x</b>'] } }}                     | ${'sensorial.notas'}
      ${'proceso inválido'}   | ${{ grano: { proceso: 'Tostado' } }}                          | ${'grano.proceso'}
      ${'acidez fuera'}       | ${{ sensorial: { acidez: { nivel: 6, tipo: 'Cítrica' } } }}   | ${'sensorial.acidez.nivel'}
      ${'fecha futura'}       | ${{ creado_en: '2999-01-01T00:00:00Z' }}                      | ${'creado_en'}
    `('400 si $desc', async ({ patch, field }) => {
      const base = tastingBody(origen);
      const body = {
        ...base,
        ...patch,
        grano: { ...base.grano, ...(patch.grano ?? {}) },
        sensorial: { ...base.sensorial, ...(patch.sensorial ?? {}) },
      };
      const res = await http().post(`${API}/tastings`).set(auth(ana)).send(body).expect(400);
      expect(res.body.details.map((d: { field: string }) => d.field)).toContain(field);
    });

    it('acepta notas personalizadas y de toda la rueda; normaliza tildes y no inventa descriptores', async () => {
      const res = await http()
        .post(`${API}/tastings`)
        .set(auth(ana))
        .send(
          tastingBody(origen, {
            sensorial: { ...tastingBody(origen).sensorial, notas: ['canela', 'jazmin', 'sabor a pan tostado'], puntaje: 88 },
          }),
        )
        .expect(201);
      expect(res.body.sensorial.notas).toEqual(['Canela', 'Jazmín', 'Sabor a pan tostado']);
      expect(res.body.sensorial.descriptores).toEqual(['floral']); // Canela y la personalizada no aportan
    });

    it('lugar inexistente → 404', async () => {
      await http().post(`${API}/tastings`).set(auth(ana)).send(tastingBody(randomUUID())).expect(404);
    });

    it('bitácora paginada por cursor, más reciente primero, solo del usuario', async () => {
      const dates = ['2026-09-01T10:00:00Z', '2026-09-05T10:00:00Z', '2026-09-03T10:00:00Z'];
      const u = await registerUser(app, 'Bitácora');
      for (const creado_en of dates) {
        await http().post(`${API}/tastings`).set(auth(u)).send({ ...tastingBody(origen), creado_en }).expect(201);
      }
      const p1 = await http().get(`${API}/tastings/me`).set(auth(u)).query({ limit: 2 }).expect(200);
      expect(p1.body.items.map((t: { creado_en: string }) => t.creado_en)).toEqual([
        '2026-09-05T10:00:00.000Z',
        '2026-09-03T10:00:00.000Z',
      ]);
      expect(p1.body.siguiente_cursor).toEqual(expect.any(String));
      const p2 = await http()
        .get(`${API}/tastings/me`)
        .set(auth(u))
        .query({ limit: 2, cursor: p1.body.siguiente_cursor })
        .expect(200);
      expect(p2.body.items).toHaveLength(1);
      expect(p2.body.siguiente_cursor).toBeNull();

      await http().get(`${API}/tastings/me`).set(auth(u)).query({ cursor: 'roto' }).expect(400);

      const stats = await http().get(`${API}/tastings/me/stats`).set(auth(u)).expect(200);
      expect(stats.body).toMatchObject({ total_cataciones: 3, puntaje_promedio: 90, lugares_visitados: 1 });
      expect(stats.body.por_descriptor).toEqual([
        { clave: 'floral', total: 3 },
        { clave: 'frutal', total: 3 },
      ]);
    });

    it('no se puede ver la catación de otro usuario', async () => {
      const mine = await http().post(`${API}/tastings`).set(auth(ana)).send(tastingBody(origen)).expect(201);
      await http().get(`${API}/tastings/${mine.body.id}`).set(auth(ana)).expect(200);
      await http().get(`${API}/tastings/${mine.body.id}`).set(auth(luis)).expect(404);
    });
  });
});
