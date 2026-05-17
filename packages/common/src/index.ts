export * from './utils/example.js';

export const constants = {
  SERVICE_NAME: 'the-new-fuse',
  VERSION: '1.0.0',
} as const;

export const config = {
  environment: process.env.NODE_ENV ?? 'development',
  isProduction: process.env.NODE_ENV === 'production',
};

export const logger = {
  info: (...args: unknown[]) => console.info('[common]', ...args),
  warn: (...args: unknown[]) => console.warn('[common]', ...args),
  error: (...args: unknown[]) => console.error('[common]', ...args),
};

