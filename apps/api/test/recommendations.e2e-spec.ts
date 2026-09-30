import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { API, createPlace, createTestApp, registerUser, resetDb, tastingBody, TestUser } from './utils/test-app';

/** Escenario de design/Recomendacion.dc.html alrededor de Origen (Manizales). */
describe('Recommendations (e2e)', () => {
  let app: INestApplication<App>;
  let user: TestUser;
  const http = () => request(app.getHttpServer());
  const ORIGIN = { lat: 5.0689, lng: -75.5174 };

  const seed = async (nombre: string, lat: number, lng: number, notas: string[], puntaje: number) => {
    const id = await createPlace(app, user, { nombre, lat, lng });
    const base = tastingBody(id);
    await http()
      .post(`${API}/tastings`)
      .set('Authorization', `Bearer ${user.accessToken}`)
      .send({ ...base, sensorial: { ...base.sensorial, notas, puntaje } })
      .expect(201);
  };

  beforeAll(async () => {
    app = await createTestApp();
    await resetDb(app);
    user = await registerUser(app);
    await seed('Origen Cafetería', 5.0725, -75.5174, ['Frutos Rojos', 'Hibisco', 'Cítricos'], 92); // ~0.4 km
    await seed('Café Laureles', 5.0770, -75.5174, ['Jazmín', 'Bergamota', 'Durazno'], 89); // ~0.9 km
    await seed('Tostadores del Cable', 5.0689, -75.5030, ['Panela', 'Caramelo', 'Naranja'], 86); // ~1.6 km
    await seed('La Mesa del Barista', 5.0619, -75.5239, ['Chocolate Negro', 'Nuez', 'Panela'], 84); // ~1.1 km
    await seed('Muy Lejos', 5.1, -75.5174, ['Jazmín', 'Frutos Rojos'], 99); // ~3.5 km
  });
  afterAll(() => app.close());

  const recommend = (query: Record<string, string | number>) =>
    http()
      .get(`${API}/recommendations`)
      .set('Authorization', `Bearer ${user.accessToken}`)
      .query({ ...ORIGIN, ...query });

  it('ranking frutal+floral igual al del diseño, con los campos del contrato', async () => {
    const res = await recommend({ descriptors: 'frutal,floral' }).expect(200);
    expect(res.body.radio_km).toBe(2.5);
    const names = res.body.resultados.map((r: { lugar: { nombre: string } }) => r.lugar.nombre);
    expect(names).toEqual(['Origen Cafetería', 'Café Laureles', 'Tostadores del Cable']);

    const top = res.body.resultados[0];
    expect(top).toMatchObject({ coincidencia: 1, puntaje_promedio: 92, total_cataciones: 1 });
    expect(top.distancia_m).toBeGreaterThan(350);
    expect(top.distancia_m).toBeLessThan(450);
    expect(top.notas_coincidentes.sort()).toEqual(['Cítricos', 'Frutos Rojos', 'Hibisco']);
    const expected = 0.6 * 1 + 0.25 * (1 - top.distancia_m / 2500) + 0.15 * 0.92;
    expect(top.score).toBeCloseTo(expected, 3);

    const scores = res.body.resultados.map((r: { score: number }) => r.score);
    expect(scores).toEqual([...scores].sort((a, b) => b - a));
    // Cable solo coincide en "frutal": J = 1/3 y solo Naranja cuenta.
    expect(res.body.resultados[2]).toMatchObject({ coincidencia: 0.3333, notas_coincidentes: ['Naranja'] });
  });

  it('el radio amplía o reduce candidatos', async () => {
    const wide = await recommend({ descriptors: 'floral', radius: 5 }).expect(200);
    expect(wide.body.resultados.map((r: { lugar: { nombre: string } }) => r.lugar.nombre)).toContain('Muy Lejos');
    const narrow = await recommend({ descriptors: 'floral', radius: 0.5 }).expect(200);
    expect(narrow.body.resultados.map((r: { lugar: { nombre: string } }) => r.lugar.nombre)).toEqual(['Origen Cafetería']);
  });

  it('valida descriptores y radio máximo', async () => {
    await recommend({ descriptors: 'umami' }).expect(400);
    await recommend({ descriptors: '' }).expect(400);
    await recommend({ descriptors: 'frutal', radius: 100 }).expect(400);
    await http().get(`${API}/recommendations`).query({ ...ORIGIN, descriptors: 'frutal' }).expect(401);
  });

  it('GET /catalog es público y coherente con las reglas', async () => {
    const res = await http().get(`${API}/catalog`).expect(200);
    expect(res.body.procesos).toEqual(['Lavado', 'Natural', 'Honey', 'Anaeróbico']);
    expect(res.body.escalas).toEqual([
      { id: 'SCA', min: 0, max: 100, paso: 0.25 },
      { id: 'Personal', min: 1, max: 10, paso: 0.5 },
    ]);
    expect(res.body.notas).toContainEqual({ nombre: 'Hibisco', descriptor: 'floral' });
  });

  it('Swagger publica el OpenAPI', async () => {
    const res = await http().get('/docs/openapi.json').expect(200);
    expect(Object.keys(res.body.paths)).toEqual(expect.arrayContaining(['/api/v1/tastings', '/api/v1/recommendations']));
  });
});
