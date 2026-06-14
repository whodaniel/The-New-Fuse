"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toMatchAPIContract = void 0;
const utils_1 = require("./utils");
exports.toMatchAPIContract = (0, utils_1.createMatcher)((received, contract) => {
    // Check status code
    if (received.status !== contract.status) {
        return false;
    }
    // Check required headers if specified
    if (contract.headers) {
        for (const [key, value] of Object.entries(contract.headers)) {
            if (received.headers[key.toLowerCase()] !== value) {
                return false;
            }
        }
    }
    // Validate response body against schema
    const result = contract.schema.safeParse(received.data);
    return result.success;
}, (received, contract) => {
    if (received.status !== contract.status) {
        return `Expected status code ${contract.status}, but received ${received.status}`;
    }
    if (contract.headers) {
        for (const [key, value] of Object.entries(contract.headers)) {
            const actualValue = received.headers[key.toLowerCase()];
            if (actualValue !== value) {
                return `Expected header "${key}" to be "${value}", but got "${actualValue}"`;
            }
        }
    }
    const result = contract.schema.safeParse(received.data);
    if (!result.success) {
        return `Response body did not match schema:\n${result.error.message}`;
    }
    return 'Response matched API contract';
}, () => 'Expected response not to match API contract, but it did');
//# sourceMappingURL=toMatchAPIContract.js.map