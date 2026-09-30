import { join } from 'node:path';
import { DataSourceOptions } from 'typeorm';

export interface DbConnectionConfig {
  host: string;
  port: number;
  user: string;
  password: string;
  name: string;
  ssl: boolean;
}

/**
 * Opciones compartidas por la app, la CLI de migraciones, los seeds y los
 * tests. `synchronize` siempre en false: el esquema solo cambia con migraciones.
 * Las rutas usan glob sobre __dirname para funcionar igual con ts-node y con dist/.
 */
export function buildTypeOrmOptions(db: DbConnectionConfig): DataSourceOptions {
  const srcRoot = join(__dirname, '..', '..');
  return {
    type: 'postgres',
    host: db.host,
    port: db.port,
    username: db.user,
    password: db.password,
    database: db.name,
    ssl: db.ssl ? { rejectUnauthorized: true } : false,
    synchronize: false,
    migrationsRun: false,
    entities: [join(srcRoot, 'domains', '*', 'infrastructure', '*.entity.{ts,js}')],
    migrations: [join(__dirname, 'migrations', '*.{ts,js}')],
    migrationsTableName: 'typeorm_migrations',
    // gen_random_uuid() es nativo en PostgreSQL 13+; evita depender de uuid-ossp.
    uuidExtension: 'pgcrypto',
    // Las extensiones se crean en migraciones, no al conectar.
    installExtensions: false,
  };
}
