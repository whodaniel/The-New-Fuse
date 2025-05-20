import { BaseError } from './base-error.js';

export class ValidationError extends BaseError {
  constructor(
    message: string,
    public readonly errors: unknown[],
  ) {
    super(message, "VALIDATION_ERROR", 400);
    this.errors = errors;
  }
}
