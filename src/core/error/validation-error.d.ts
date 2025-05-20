import { BaseError } from './base-error.js';
export declare class ValidationError extends BaseError {
  readonly errors: unknown[];
  constructor(message: string, errors: unknown[]);
}
