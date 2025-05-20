import { ValidationSchema } from '../middleware/validation.middleware.js';

// Schema for validating export conversation requests
export const exportSchema: ValidationSchema = {
  conversation: { type: 'string', required: true, minLength: 1 },
  format: { type: 'string', required: true, enum: ['pdf', 'md', 'txt'] },
};
