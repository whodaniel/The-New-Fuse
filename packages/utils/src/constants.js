// Application constants

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500,
};

export const LOG_LEVELS = {
  ERROR: "error",
  WARN: "warn",
  INFO: "info",
  DEBUG: "debug",
};

export const API_ENDPOINTS = {
  HEALTH: "/health",
  STATUS: "/status",
  VERSION: "/version",
};

export const DEFAULT_TIMEOUTS = {
  REQUEST: 30000,
  CONNECTION: 5000,
  SOCKET: 60000,
};

export const SUPPORTED_PROVIDERS = [
  "openai",
  "anthropic",
  "huggingface",
  "azure",
  "google",
];
