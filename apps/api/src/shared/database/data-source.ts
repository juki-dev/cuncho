import 'dotenv/config';
import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { DatabaseEnv, validateEnv } from '../config/env.validation';
import { buildTypeOrmOptions } from './typeorm-options';

/** DataSource para la CLI de TypeORM (migraciones) y los seeds. */
const env = validateEnv(process.env, DatabaseEnv);

const AppDataSource = new DataSource(
  buildTypeOrmOptions({
    host: env.DB_HOST,
    port: env.DB_PORT,
    user: env.DB_USER,
    password: env.DB_PASSWORD,
    name: env.DB_NAME,
    ssl: env.DB_SSL,
  }),
);

export default AppDataSource;
