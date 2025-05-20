import { DataSource } from 'typeorm';
import { User } from '../models/User.js';
import { Agent } from '../models/Agent.js';
import { Pipeline } from '../models/Pipeline.js';

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'the_new_fuse',
  entities: [User, Agent, Pipeline],
  synchronize: process.env.NODE_ENV !== 'production',
  logging: process.env.NODE_ENV === 'development',
  migrations: [],
  subscribers: [],
});
