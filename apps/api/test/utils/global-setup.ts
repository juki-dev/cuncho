import 'reflect-metadata';
import { PostgreSqlContainer, StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import { DataSource } from 'typeorm';
import { buildTypeOrmOptions } from '../../src/shared/database/typeorm-options';

declare global {
  var __PG_CONTAINER__: StartedPostgreSqlContainer | undefined;
}

/** Levanta PostGIS real, aplica las migraciones y deja el entorno listo para la app. */
export default async function globalSetup(): Promise<void> {
  const container = await new PostgreSqlContainer('postgis/postgis:16-3.4')
    .withDatabase('cuncho_test')
    .withUsername('test')
    .withPassword('test')
    .start();
  globalThis.__PG_CONTAINER__ = container;

  Object.assign(process.env, {
    NODE_ENV: 'test',
    PORT: '3999',
    LOG_LEVEL: 'silent',
    SWAGGER_ENABLED: 'true',
    CORS_ORIGINS: 'http://localhost:5173',
    DB_HOST: container.getHost(),
    DB_PORT: String(container.getPort()),
    DB_USER: 'test',
    DB_PASSWORD: 'test',
    DB_NAME: 'cuncho_test',
    DB_SSL: 'false',
    JWT_ACCESS_SECRET: 'e2e-secret-e2e-secret-e2e-secret-e2e-secret',
    JWT_ACCESS_TTL_SECONDS: '900',
    JWT_REFRESH_TTL_SECONDS: '86400',
    THROTTLE_LIMIT: '10000',
    THROTTLE_AUTH_LIMIT: '10000',
    RECOMMENDATION_DEFAULT_RADIUS_KM: '2.5',
    RECOMMENDATION_MAX_RADIUS_KM: '25',
    RECOMMENDATION_WEIGHT_JACCARD: '0.60',
    RECOMMENDATION_WEIGHT_DISTANCE: '0.25',
    RECOMMENDATION_WEIGHT_SCORE: '0.15',
  });

  const ds = new DataSource(
    buildTypeOrmOptions({
      host: container.getHost(),
      port: container.getPort(),
      user: 'test',
      password: 'test',
      name: 'cuncho_test',
      ssl: false,
    }),
  );
  await ds.initialize();
  await ds.runMigrations();
  await ds.destroy();
}
