/**
 * Validation schema for creating an agent
 */
export const createAgentSchema = {
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
export const updateAgentSchema = {
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
export const agentIdSchema = {
    id: {
        type: 'string',
        required: true,
        pattern: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
        validate: (value) => {
            if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)) {
                return 'Invalid UUID format';
            }
            return true;
        },
    },
};
//# sourceMappingURL=agent.schema.js.map