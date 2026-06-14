"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toCompleteWithinTime = void 0;
const utils_1 = require("./utils");
exports.toCompleteWithinTime = (0, utils_1.createMatcher)(async (received, timeLimit) => {
    const start = Date.now();
    try {
        await Promise.race([
            received,
            new Promise((_, reject) => {
                setTimeout(() => reject(new Error('Timeout')), timeLimit);
            }),
        ]);
        const duration = Date.now() - start;
        return duration <= timeLimit;
    }
    catch (error) {
        // Check if error is an instance of Error before accessing message
        if (error instanceof Error && error.message === 'Timeout') {
            return false;
        }
        throw error;
    }
}, (_, timeLimit) => `Expected promise to complete within ${timeLimit}ms, but it exceeded the time limit`, (_, timeLimit) => `Expected promise not to complete within ${timeLimit}ms, but it did`);
//# sourceMappingURL=toCompleteWithinTime.js.map