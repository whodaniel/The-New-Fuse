/**
 * Validation Middleware - Request validation using Joi
 */
export function validateRequest(schema) {
    return (req, res, next) => {
        const errors = [];
        // Validate body
        if (schema.body) {
            const { error } = schema.body.validate(req.body);
            if (error) {
                errors.push(`Body: ${error.details.map(d => d.message).join(', ')}`);
            }
        }
        // Validate params
        if (schema.params) {
            const { error } = schema.params.validate(req.params);
            if (error) {
                errors.push(`Params: ${error.details.map(d => d.message).join(', ')}`);
            }
        }
        // Validate query
        if (schema.query) {
            const { error, value } = schema.query.validate(req.query);
            if (error) {
                errors.push(`Query: ${error.details.map(d => d.message).join(', ')}`);
            }
            else {
                // Apply defaults from validation
                req.query = value;
            }
        }
        // Validate headers
        if (schema.headers) {
            const { error } = schema.headers.validate(req.headers);
            if (error) {
                errors.push(`Headers: ${error.details.map(d => d.message).join(', ')}`);
            }
        }
        if (errors.length > 0) {
            res.status(400).json({
                error: 'Validation failed',
                details: errors
            });
            return;
        }
        next();
    };
}
//# sourceMappingURL=validation.middleware.js.map