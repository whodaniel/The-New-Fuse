/**
 * API constants
 */

// API version
export const API_VERSION = 'v1';

// Common API routes
export const ROUTES = {
  AUTH: '/auth',
  USERS: '/users',
  AGENTS: '/agents',
  WORKFLOWS: '/workflows',
  SETTINGS: '/settings',
  HEALTH: '/health'
};

// Standard HTTP status codes
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503
};

// Response messages
export const MESSAGES = {
  SUCCESS: 'Success',
  ERROR: 'Error',
  UNAUTHORIZED: 'Unauthorized access',
  NOT_FOUND: 'Resource not found',
  INVALID_REQUEST: 'Invalid request',
  SERVER_ERROR: 'Internal server error'
};