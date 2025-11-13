"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const example_1 = require("./example");
(0, vitest_1.describe)('exampleUtil', () => {
    (0, vitest_1.it)('should return the expected result', () => {
        const result = (0, example_1.exampleUtil)('test');
        (0, vitest_1.expect)(result).toBe('test-processed');
    });
    (0, vitest_1.it)('should handle empty input', () => {
        const result = (0, example_1.exampleUtil)('');
        (0, vitest_1.expect)(result).toBe('-processed');
    });
});
//# sourceMappingURL=example.test.js.map