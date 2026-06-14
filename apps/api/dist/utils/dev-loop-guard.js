"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DevLoopException = void 0;
exports.isDevelopmentEnv = isDevelopmentEnv;
exports.getDevLoopMaxIterations = getDevLoopMaxIterations;
exports.getDevLoopIteration = getDevLoopIteration;
exports.assertDevLoopBudget = assertDevLoopBudget;
exports.withNextDevLoopIteration = withNextDevLoopIteration;
const common_1 = require("@nestjs/common");
const DEFAULT_MAX_ITERATIONS = 5;
class DevLoopException extends common_1.HttpException {
    constructor(scope, iteration, maxIterations) {
        super({
            error: 'DevLoopException',
            message: `Development loop circuit breaker tripped for ${scope}: iteration ${iteration} exceeds max ${maxIterations}`,
            scope,
            iteration,
            maxIterations,
        }, common_1.HttpStatus.LOOP_DETECTED);
    }
}
exports.DevLoopException = DevLoopException;
function isDevelopmentEnv() {
    return (process.env.ENV === 'development' ||
        process.env.NODE_ENV === 'development' ||
        process.env.TNF_RUNTIME === 'docker-compose');
}
function getDevLoopMaxIterations() {
    const parsed = Number.parseInt(process.env.DEV_LOOP_MAX_ITERATIONS || '', 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_MAX_ITERATIONS;
}
function getDevLoopIteration(input) {
    const candidates = [
        readNumeric(input, 'devLoopIteration'),
        readNumeric(input, 'iteration'),
        readNumeric(input, 'loopIteration'),
        readNestedNumeric(input, ['metadata', 'devLoopIteration']),
        readNestedNumeric(input, ['metadata', 'iteration']),
        readNestedNumeric(input, ['context', 'devLoopIteration']),
        readNestedNumeric(input, ['context', 'iteration']),
        readNestedNumeric(input, ['input', 'devLoopIteration']),
        readNestedNumeric(input, ['input', 'iteration']),
    ];
    const explicit = candidates.find((value) => value != null);
    return explicit == null ? 1 : explicit;
}
function assertDevLoopBudget(scope, input) {
    if (!isDevelopmentEnv()) {
        return 1;
    }
    const iteration = Math.max(1, Math.floor(getDevLoopIteration(input)));
    const maxIterations = getDevLoopMaxIterations();
    if (iteration > maxIterations) {
        throw new DevLoopException(scope, iteration, maxIterations);
    }
    return iteration;
}
function withNextDevLoopIteration(input, iteration) {
    return {
        ...input,
        metadata: {
            ...(input?.metadata && typeof input.metadata === 'object' ? input.metadata : {}),
            devLoopIteration: iteration + 1,
        },
    };
}
function readNumeric(input, key) {
    if (!input || typeof input !== 'object')
        return null;
    const value = input[key];
    return normalizeNumber(value);
}
function readNestedNumeric(input, path) {
    let current = input;
    for (const key of path) {
        if (!current || typeof current !== 'object')
            return null;
        current = current[key];
    }
    return normalizeNumber(current);
}
function normalizeNumber(value) {
    if (typeof value === 'number' && Number.isFinite(value))
        return value;
    if (typeof value === 'string' && value.trim()) {
        const parsed = Number.parseInt(value, 10);
        return Number.isFinite(parsed) ? parsed : null;
    }
    return null;
}
//# sourceMappingURL=dev-loop-guard.js.map