/**
 * Workflow Validation Schemas - Request validation using Joi
 */
import Joi from 'joi';
export declare const workflowValidationSchemas: {
    create: {
        body: Joi.ObjectSchema<any>;
    };
    update: {
        params: Joi.ObjectSchema<any>;
        body: Joi.ObjectSchema<any>;
    };
    execute: {
        body: Joi.ObjectSchema<any>;
    };
    validate: {
        body: Joi.ObjectSchema<any>;
    };
    fromTemplate: {
        body: Joi.ObjectSchema<any>;
    };
    list: {
        query: Joi.ObjectSchema<any>;
    };
    executionList: {
        query: Joi.ObjectSchema<any>;
    };
};
//# sourceMappingURL=workflow.schemas.d.ts.map