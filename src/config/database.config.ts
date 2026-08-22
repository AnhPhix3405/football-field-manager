import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { DATABASE_ENTITIES } from '../database/entities';

export const databaseConfig: TypeOrmModuleOptions = {
 type: 'postgres',
 host: process.env.DB_HOST ?? 'YOUR_POSTGRES_HOST',
 port: Number(process.env.DB_PORT ?? 5432),
 username: process.env.DB_USERNAME ?? 'YOUR_POSTGRES_USERNAME',
 password: process.env.DB_PASSWORD ?? 'YOUR_POSTGRES_PASSWORD',
 database: process.env.DB_DATABASE ?? 'YOUR_POSTGRES_DATABASE',
 entities: DATABASE_ENTITIES,
 synchronize: false,
 logging: process.env.DB_LOGGING === 'true',
 ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
};
