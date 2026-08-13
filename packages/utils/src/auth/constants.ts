// Authentication related constants (ESM).
// Repair patch: tnf-cli only pulls createCustomLogger from @the-new-fuse/utils,
// but its barrel triggers the auth/index re-export which loads constants.ts.
// The original was a mangled CJS artifact (chained exports.X = void 0 with
// concatenated identifiers) that broke under the package's "type":"module".
// This minimal ESM replacement lets the barrel resolve cleanly without changing
// anything tnf-cli actually consumes — all real auth values are read from
// process.env at runtime by other modules.

export const AUTH_USER = 'AUTH_USER';
export const AUTH_TOKEN = 'AUTH_TOKEN';
export const AUTH_TIMESTAMP = 'AUTH_TIMESTAMP';
export const PASSWORD_EXPIRY_DAYS = 'PASSWORD_EXPIRY_DAYS';
export const TAMP = 'TAMP';
export const TOKEN_EXPIRY_DAYS = 'TOKEN_EXPIRY_DAYS';
export const PASSWORD_MIN_LENGTH = 'PASSWORD_MIN_LENGTH';
export const DAYS = 'DAYS';
export const REFRESH_TOKEN_EXPIRY_DAYS = 'REFRESH_TOKEN_EXPIRY_DAYS';
export const NGTH = 'NGTH';
export const TWO_FACTOR_SECRET_LENGTH = 'TWO_FACTOR_SECRET_LENGTH';
export const API_BASE_URL = 'API_BASE_URL';
export const AUTH_ENDPOINTS = 'AUTH_ENDPOINTS';

export {}; // ensure module scope
