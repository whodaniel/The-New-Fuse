import { DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { config } from 'dotenv';
import { User } from '../entities/User.js';

config();

const configService = new ConfigService();

const databaseUrl = configService.get('DATABASE_URL', 'postgresql://postgres:postgres@postgres:5432/fuse');
const [, , credentials, hostPort, database] = databaseUrl.match(/^postgresql:\/\/(.*):(.*)@(.*?)\/(.*)$/);

const [host, port] = hostPort.split(':');

export const AppDataSource = new DataSource({
  type: 'postgres',
  host,
  port: parseInt(port, 10),
  username: 'postgres',
  password: 'postgres',
  database,
  entities: [User],
  migrations: ['src/migrations/*.ts'],
  synchronize: false,
  logging: configService.get('NODE_ENV') === 'development',
});
