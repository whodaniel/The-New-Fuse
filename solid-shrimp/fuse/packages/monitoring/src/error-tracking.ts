import * as Sentry from '@sentry/node';

export const initializeErrorTracking = (): any => {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV,
    tracesSampleRate: 1.0,
  });
};