// Create simple validation error
class ValidationError extends Error {
    constructor(message, details) {
        super(message);
        this.statusCode = 400;
        this.details = details;
    }
}
export const validateRequest = (schema) => {
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
