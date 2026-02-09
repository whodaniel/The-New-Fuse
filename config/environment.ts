import { z } from 'zod';
import * as dotenv from 'dotenv';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3000),
  
  // Database
  DATABASE_URL: z.string().url(),
  DB_POOL_SIZE: z.coerce.number().default(10),
  
  // Redis
  REDIS_URL: z.string().url(),
  REDIS_TTL: z.coerce.number().default(3600),
  
  // JWT
  JWT_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.string().default('1h'),
  
  // Monitoring
  SENTRY_DSN: z.string().url().optional(),
  METRICS_ENABLED: z.preprocess(
    (val) => val === 'true' || val === true,
    z.boolean()
  ).default(true),
  
  // Rate Limiting
  RATE_LIMIT_WINDOW: z.coerce.number().default(900000),
  RATE_LIMIT_MAX: z.coerce.number().default(100),
  
  // Email Configuration
  SMTP_HOST: z.string(),
  SMTP_PORT: z.coerce.number(),
  SMTP_USER: z.string(),
  SMTP_PASS: z.string(),
  EMAIL_FROM_NAME: z.string(),
  EMAIL_FROM_ADDRESS: z.string().email(),
  
  // Application
  FRONTEND_URL: z.string().url(),
  APP_NAME: z.string(),
});

dotenv.config({
  path: `.env.${process.env.NODE_ENV || 'development'}`
});

export const env = envSchema.parse(process.env);
