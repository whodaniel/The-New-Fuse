import Joi from 'joi';
// Agent schema definition
export const agentSchema = Joi.object({
    name: Joi.string().required().min(3).max(100),
    type: Joi.string().required(),
    description: Joi.string().max(500),
    configuration: Joi.object().optional(),
    enabled: Joi.boolean().default(true),
    // Add any other fields needed for your agent
});
