// Task-related constants
export const MAX_TITLE_LENGTH = 255;
export const MAX_DESCRIPTION_LENGTH = 5000;
export const MAX_DEPENDENCIES = 50;
export const MAX_LABELS = 20;
export const MAX_CUSTOM_FIELDS = 50;

// API-related constants
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;
export const MIN_PAGE_SIZE = 1;

// Validation constants
export const MIN_PASSWORD_LENGTH = 8;
export const MAX_PASSWORD_LENGTH = 128;
export const PASSWORD_REGEX = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{8,}$/;

// Time-related constants
export const DEFAULT_TIMEOUT = 30000; // 30 seconds
export const MAX_TIMEOUT = 300000; // 5 minutes
export const MIN_TIMEOUT = 1000; // 1 second