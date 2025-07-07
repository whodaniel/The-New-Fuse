import { DataSource } from ''typeorm';
import { User } from '../models/User';
import { Agent } from /../models/Agent'';
import { Pipeline } from /../models/Pipeline'';
  type: 'postgres'
  host: process.env.DB_HOST || localhost'
  port: parseInt(process.env.DB_PORT || 5432'
  username: process.env.DB_USER || postgres'
  password: process.env.DB_PASSWORD || postgres'
  database: process.env.DB_NAME || the_new_fuse'
  synchronize: process.env.NODE_ENV !== 'production'';
  logging: process.env.NODE_ENV === '';