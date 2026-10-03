import { buildConfig } from '../app-config';
import { EnvironmentVariables, validateEnv } from '../env.validation';

const baseEnv = {
  NODE_ENV: 'test',
  PORT: '3000',
  CORS_ORIGINS: 'http://localhost:5173, https://d123.cloudfront.net',
  DB_HOST: 'localhost',
  DB_PORT: '5433',
  DB_USER: 'u',
  DB_PASSWORD: 'p',
  DB_NAME: 'n',
  JWT_ACCESS_SECRET: 'x'.repeat(32),
  JWT_ACCESS_TTL_SECONDS: '900',
  JWT_REFRESH_TTL_SECONDS: '86400',
  RECOMMENDATION_DEFAULT_RADIUS_KM: '2.5',
  RECOMMENDATION_MAX_RADIUS_KM: '25',
  RECOMMENDATION_WEIGHT_JACCARD: '0.6',
  RECOMMENDATION_WEIGHT_DISTANCE: '0.25',
  RECOMMENDATION_WEIGHT_SCORE: '0.15',
};

describe('configuración', () => {
  it('convierte tipos y aplica valores por defecto', () => {
    const cfg = buildConfig(validateEnv<EnvironmentVariables>(baseEnv));
    expect(cfg.db.port).toBe(5433);
    expect(cfg.db.ssl).toBe(false);
    expect(cfg.cors.origins).toEqual(['http://localhost:5173', 'https://d123.cloudfront.net']);
    expect(cfg.recommendation.weights).toEqual({ jaccard: 0.6, distance: 0.25, score: 0.15 });
    expect(cfg.throttle.authLimit).toBe(10);
  });

  it('TRUST_PROXY es 0 por defecto y acepta saltos de proxy', () => {
    expect(buildConfig(validateEnv<EnvironmentVariables>(baseEnv)).app.trustProxy).toBe(0);
    expect(buildConfig(validateEnv<EnvironmentVariables>({ ...baseEnv, TRUST_PROXY: '1' })).app.trustProxy).toBe(1);
    expect(() => validateEnv({ ...baseEnv, TRUST_PROXY: '-1' })).toThrow(/TRUST_PROXY/);
  });

  it.each(['DB_HOST', 'JWT_ACCESS_SECRET', 'CORS_ORIGINS', 'RECOMMENDATION_WEIGHT_JACCARD'])(
    'falla si falta %s',
    (key) => {
      const env: Record<string, string> = { ...baseEnv };
      delete env[key];
      expect(() => validateEnv(env)).toThrow(new RegExp(key));
    },
  );

  it('falla con un secreto JWT corto', () => {
    expect(() => validateEnv({ ...baseEnv, JWT_ACCESS_SECRET: 'corto' })).toThrow(/JWT_ACCESS_SECRET/);
  });

  it('falla si los pesos no suman 1', () => {
    const env = validateEnv<EnvironmentVariables>({ ...baseEnv, RECOMMENDATION_WEIGHT_SCORE: '0.3' });
    expect(() => buildConfig(env)).toThrow(/sumar 1/);
  });
});
