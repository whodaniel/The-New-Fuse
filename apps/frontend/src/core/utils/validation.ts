export class Validator {
    constructor() {
        this.rules = new Map();
    }
    addRule(field, rule) {
        if (!this.rules.has(field)) {
            this.rules.set(field, []);
        }
        this.rules.get(field).push(rule);
    }
    validate(data) {
        const errors = [];
        for (const [field, rules] of this.rules.entries()) {
            const value = data[field];
            for (const rule of rules) {
                if (!rule.validate(value)) {
                    errors.push(`${field}: ${rule.message}`);
                }
            }
        }
        return {
            isValid: errors.length === 0,
            errors
        };
    }
}
export const ValidationRules = {
    required: (message = 'This field is required') => ({
        validate: (value) => value !== undefined && value !== null && value !== '',
        message
    }),
    minLength: (length, message = `Minimum length is ${length}`) => ({
        validate: (value) => value.length >= length,
        message
    }),
    maxLength: (length, message = `Maximum length is ${length}`) => ({
        validate: (value) => value.length <= length,
        message
    }),
    pattern: (regex, message) => ({
        validate: (value) => regex.test(value),
        message
    }),
    email: (message = 'Invalid email address') => ({
        validate: (value) => /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(value),
        message
    }),
    number: (message = 'Must be a number') => ({
        validate: (value) => !isNaN(value),
        message
    }),
    min: (min, message = `Minimum value is ${min}`) => ({
        validate: (value) => value >= min,
        message
    }),
    max: (max, message = `Maximum value is ${max}`) => ({
        validate: (value) => value <= max,
        message
    }),
    url: (message = 'Invalid URL') => ({
        validate: (value) => {
            try {
                new URL(value);
                return true;
            }
            catch (_a) {
                return false;
            }
        },
        message
    }),
    custom: (validateFn, message) => ({
        validate: validateFn,
        message
    })
};
//# sourceMappingURL=validation.js.map