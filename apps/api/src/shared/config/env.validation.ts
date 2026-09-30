import { plainToInstance, Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
  MinLength,
  validateSync,
} from 'class-validator';

export enum NodeEnv {
  Development = 'development',
  Test = 'test',
  Production = 'production',
}

const toBool = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? ['1', 'true', 'yes'].includes(value.toLowerCase()) : value;

/** Variables mínimas para conectarse a la base (las usa también la CLI de TypeORM). */
export class DatabaseEnv {
  @IsString() @IsNotEmpty() DB_HOST!: string;
  @Type(() => Number) @IsInt() @Min(1) @Max(65535) DB_PORT!: number;
  @IsString() @IsNotEmpty() DB_USER!: string;
  @IsString() @IsNotEmpty() DB_PASSWORD!: string;
  @IsString() @IsNotEmpty() DB_NAME!: string;
  @IsOptional() @Transform(toBool) @IsBoolean() DB_SSL: boolean = false;
}

export class EnvironmentVariables extends DatabaseEnv {
  @IsEnum(NodeEnv) NODE_ENV!: NodeEnv;
  @Type(() => Number) @IsInt() @Min(1) @Max(65535) PORT!: number;
  @IsOptional() @IsIn(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']) LOG_LEVEL: string = 'info';
  @IsOptional() @Transform(toBool) @IsBoolean() SWAGGER_ENABLED: boolean = true;

  /** Lista separada por comas. */
  @IsString() @IsNotEmpty() CORS_ORIGINS!: string;

  @IsString() @MinLength(32) JWT_ACCESS_SECRET!: string;
  @Type(() => Number) @IsInt() @Min(60) JWT_ACCESS_TTL_SECONDS!: number;
  @Type(() => Number) @IsInt() @Min(3600) JWT_REFRESH_TTL_SECONDS!: number;

  @IsOptional() @Type(() => Number) @IsInt() @Min(1000) THROTTLE_TTL_MS: number = 60_000;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) THROTTLE_LIMIT: number = 120;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) THROTTLE_AUTH_LIMIT: number = 10;

  @Type(() => Number) @IsNumber() @Min(0.1) RECOMMENDATION_DEFAULT_RADIUS_KM!: number;
  @Type(() => Number) @IsNumber() @Min(0.1) RECOMMENDATION_MAX_RADIUS_KM!: number;
  @Type(() => Number) @IsNumber() @Min(0) @Max(1) RECOMMENDATION_WEIGHT_JACCARD!: number;
  @Type(() => Number) @IsNumber() @Min(0) @Max(1) RECOMMENDATION_WEIGHT_DISTANCE!: number;
  @Type(() => Number) @IsNumber() @Min(0) @Max(1) RECOMMENDATION_WEIGHT_SCORE!: number;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100) RECOMMENDATION_MAX_RESULTS: number = 20;
}

/**
 * Valida y convierte las variables de entorno. Lanza un error con todas las
 * variables inválidas o faltantes: la app no arranca si algo falla.
 */
export function validateEnv<T extends object>(
  raw: Record<string, unknown>,
  cls: new () => T = EnvironmentVariables as unknown as new () => T,
): T {
  const instance = plainToInstance(cls, raw, { enableImplicitConversion: false, exposeDefaultValues: true });
  const errors = validateSync(instance, { skipMissingProperties: false, whitelist: false });
  if (errors.length > 0) {
    const detail = errors
      .map((e) => `  - ${e.property}: ${Object.values(e.constraints ?? {}).join(', ')}`)
      .join('\n');
    throw new Error(`Configuración inválida:\n${detail}`);
  }
  return instance;
}
