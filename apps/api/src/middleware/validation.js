"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateRequest = void 0;
// Create simple validation error
class ValidationError extends Error {
    statusCode;
    details;
    constructor(message, details) {
        super(message);
        this.statusCode = 400;
        this.details = details;
    }
}
const validateRequest = (schema) => {
    return (req, _res, next) => {
        const { error } = schema.validate(req.body, {
            abortEarly: false,
            stripUnknown: true
        });
        if (error) {
            throw new ValidationError('Validation error', error.details.map(err => ({
                field: err.path.join('.'),
                message: err.message
            })));
        }
        next();
    };
};
exports.validateRequest = validateRequest;
