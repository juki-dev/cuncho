import { EnvironmentVariables, NodeEnv, validateEnv } from './env.validation';

export interface AppConfig {
  app: {
    env: NodeEnv;
    port: number;
    logLevel: string;
    swaggerEnabled: boolean;
    trustProxy: number;
    globalPrefix: string;
  };
  db: {
    host: string;
    port: number;
    user: string;
    password: string;
    name: string;
    ssl: boolean;
  };
  jwt: {
    accessSecret: string;
    accessTtlSeconds: number;
    refreshTtlSeconds: number;
  };
  /** null = inicio de sesión con Cognito desactivado. */
  cognito: { issuer: string; clientId: string } | null;
  cors: { origins: string[] };
  throttle: { ttlMs: number; limit: number; authLimit: number };
  recommendation: {
    defaultRadiusKm: number;
    maxRadiusKm: number;
    weights: { jaccard: number; distance: number; score: number };
    maxResults: number;
  };
}

function cognitoConfig(env: EnvironmentVariables): AppConfig['cognito'] {
  const poolId = env.COGNITO_USER_POOL_ID;
  const clientId = env.COGNITO_APP_CLIENT_ID;
  if (!poolId && !clientId) return null;
  if (!poolId || !clientId) {
    throw new Error('Configuración inválida: COGNITO_USER_POOL_ID y COGNITO_APP_CLIENT_ID deben definirse juntas');
  }
  // El id del pool lleva la región: us-east-1_AbCdEf → us-east-1.
  const region = poolId.split('_')[0];
  return { issuer: `https://cognito-idp.${region}.amazonaws.com/${poolId}`, clientId };
}

export function buildConfig(env: EnvironmentVariables): AppConfig {
  const weights = {
    jaccard: env.RECOMMENDATION_WEIGHT_JACCARD,
    distance: env.RECOMMENDATION_WEIGHT_DISTANCE,
    score: env.RECOMMENDATION_WEIGHT_SCORE,
  };
  const sum = weights.jaccard + weights.distance + weights.score;
  if (Math.abs(sum - 1) > 1e-6) {
    throw new Error(`Configuración inválida: los pesos RECOMMENDATION_WEIGHT_* deben sumar 1 (suman ${sum})`);
  }
  if (env.RECOMMENDATION_DEFAULT_RADIUS_KM > env.RECOMMENDATION_MAX_RADIUS_KM) {
    throw new Error('Configuración inválida: RECOMMENDATION_DEFAULT_RADIUS_KM > RECOMMENDATION_MAX_RADIUS_KM');
  }
  return {
    app: {
      env: env.NODE_ENV,
      port: env.PORT,
      logLevel: env.LOG_LEVEL,
      swaggerEnabled: env.SWAGGER_ENABLED,
      trustProxy: env.TRUST_PROXY,
      globalPrefix: 'api/v1',
    },
    db: {
      host: env.DB_HOST,
      port: env.DB_PORT,
      user: env.DB_USER,
      password: env.DB_PASSWORD,
      name: env.DB_NAME,
      ssl: env.DB_SSL,
    },
    jwt: {
      accessSecret: env.JWT_ACCESS_SECRET,
      accessTtlSeconds: env.JWT_ACCESS_TTL_SECONDS,
      refreshTtlSeconds: env.JWT_REFRESH_TTL_SECONDS,
    },
    cognito: cognitoConfig(env),
    cors: {
      origins: env.CORS_ORIGINS.split(',')
        .map((o) => o.trim())
        .filter(Boolean),
    },
    throttle: { ttlMs: env.THROTTLE_TTL_MS, limit: env.THROTTLE_LIMIT, authLimit: env.THROTTLE_AUTH_LIMIT },
    recommendation: {
      defaultRadiusKm: env.RECOMMENDATION_DEFAULT_RADIUS_KM,
      maxRadiusKm: env.RECOMMENDATION_MAX_RADIUS_KM,
      weights,
      maxResults: env.RECOMMENDATION_MAX_RESULTS,
    },
  };
}

/** Factory para ConfigModule: valida process.env y arma la config tipada. */
export const loadAppConfig = (): AppConfig => buildConfig(validateEnv(process.env));
