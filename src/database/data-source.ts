import 'reflect-metadata';
import { DataSource, DataSourceOptions } from 'typeorm';
import { databaseConfig } from '../config/database.config';

export default new DataSource({
 ...databaseConfig,
 type: 'postgres',
 migrations: ['src/database/migrations/*{.ts,.js}'],
} as DataSourceOptions);
