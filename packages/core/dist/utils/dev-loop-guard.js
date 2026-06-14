const DEFAULT_MAX_ITERATIONS = 5;
export class DevLoopException extends Error {
    constructor(scope, iteration, maxIterations) {
        super(`Development loop circuit breaker tripped for ${scope}: iteration ${iteration} exceeds max ${maxIterations}`);
        this.name = 'DevLoopException';
    }
}
export function isDevelopmentEnv() {
    return (process.env.ENV === 'development' ||
        process.env.NODE_ENV === 'development' ||
        process.env.TNF_RUNTIME === 'docker-compose');
}
export function getDevLoopMaxIterations() {
    const parsed = Number.parseInt(process.env.DEV_LOOP_MAX_ITERATIONS || '', 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_MAX_ITERATIONS;
}
export function getDevLoopIteration(input) {
    const candidates = [
        readNumeric(input, 'devLoopIteration'),
        readNumeric(input, 'iteration'),
        readNumeric(input, 'loopIteration'),
        readNestedNumeric(input, ['metadata', 'devLoopIteration']),
        readNestedNumeric(input, ['metadata', 'iteration']),
        readNestedNumeric(input, ['context', 'devLoopIteration']),
        readNestedNumeric(input, ['context', 'iteration']),
    ];
    const explicit = candidates.find((value) => value != null);
    return explicit == null ? 1 : explicit;
}
export function assertDevLoopBudget(scope, input) {
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