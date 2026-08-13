import { ValidationSchema } from '../middleware/validation.middleware.js';

/**
 * Validation schema for creating an agent
 */
export const createAgentSchema: ValidationSchema = {
  name: {
    type: 'string',
    required: true,
    minLength: 2,
    maxLength: 100,
  },
  type: {
    type: 'string',
    required: true,
    minLength: 2,
    maxLength: 50,
  },
  metadata: {
    type: 'object',
    required: false,
  },
};

/**
 * Validation schema for updating an agent
 */
export const updateAgentSchema: ValidationSchema = {
  name: {
    type: 'string',
    required: false,
    minLength: 2,
    maxLength: 100,
  },
  type: {
    type: 'string',
    required: false,
    minLength: 2,
    maxLength: 50,
  },
  metadata: {
    type: 'object',
    required: false,
  },
};

/**
 * Validation schema for agent ID parameter
 */
export const agentIdSchema: ValidationSchema = {
  id: {
    type: 'string',
    required: true,
    pattern: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    validate: (value: string) => {
      if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)) {
        return 'Invalid UUID format';
      }
      return true;
    },
  },
};
