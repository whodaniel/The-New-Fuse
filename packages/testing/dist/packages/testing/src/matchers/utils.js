"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createMatcher = createMatcher;
exports.validateSchema = validateSchema;
function createMatcher(predicate, failMessage, passMessage) {
    return async function matcher(received, ...args) {
        const pass = await predicate(received, ...args);
        const message = () => (pass ? passMessage(received, ...args) : failMessage(received, ...args));
        return { pass, message };
    };
}
function validateSchema(value, schema) {
    const result = schema.safeParse(value);
    return {
        success: result.success,
        error: !result.success ? result.error.issues[0]?.message : undefined
    };
}
//# sourceMappingURL=utils.js.map