import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { DataSource } from 'typeorm';
import { AppModule } from '../../src/app.module';
import { configureApp } from '../../src/app.setup';

export const API = '/api/v1';

export async function createTestApp(): Promise<INestApplication<App>> {
  const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
  const app = moduleRef.createNestApplication<INestApplication<App>>({ bufferLogs: true });
  configureApp(app);
  await app.init();
  return app;
}

/** Vacía las tablas de negocio (mantiene el esquema y la tabla de migraciones). */
export async function resetDb(app: INestApplication): Promise<void> {
  await app.get(DataSource).query('TRUNCATE tastings, places, refresh_tokens, users RESTART IDENTITY CASCADE');
}

let counter = 0;

export interface TestUser {
  id: string;
  accessToken: string;
  refreshToken: string;
}

export async function registerUser(app: INestApplication<App>, name = 'Catador'): Promise<TestUser> {
  counter += 1;
  const res = await request(app.getHttpServer())
    .post(`${API}/auth/register`)
    .send({ email: `user${counter}-${Date.now()}@test.co`, password: 'clave-segura-123', nombre: name })
    .expect(201);
  return { id: res.body.usuario.id, accessToken: res.body.access_token, refreshToken: res.body.refresh_token };
}

export async function createPlace(
  app: INestApplication<App>,
  user: TestUser,
  body: { nombre: string; lat: number; lng: number },
): Promise<string> {
  const res = await request(app.getHttpServer())
    .post(`${API}/places`)
    .set('Authorization', `Bearer ${user.accessToken}`)
    .send(body)
    .expect(201);
  return res.body.id as string;
}

export function tastingBody(placeId: string, over: Record<string, unknown> = {}) {
  return {
    lugar: { id: placeId },
    grano: { variedad: 'Geisha', finca: 'La Esperanza', region: 'Huila', proceso: 'Lavado', metodo: 'V60' },
    sensorial: {
      acidez: { nivel: 3, tipo: 'Cítrica' },
      notas: ['Jazmín', 'Durazno'],
      puntaje: 90,
      escala: 'SCA',
    },
    ...over,
  };
}
