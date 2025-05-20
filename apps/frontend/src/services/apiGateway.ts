import { createApiGateway } from '@the-new-fuse/core/api';

export const apiGateway = createApiGateway({
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
  },
  security: {
    cors: true,
    helmet: true,
    xssProtection: true
  },
  routing: {
    baseUrl: '/api/v1',
    services: {
      auth: '/auth',
      workspace: '/workspace',
      documents: '/documents'
    }
  }
});