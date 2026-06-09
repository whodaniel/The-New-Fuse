const DEFAULT_MAX_ITERATIONS = 5;

export class DevLoopException extends Error {
  constructor(scope: string, iteration: number, maxIterations: number) {
    super(
      `Development loop circuit breaker tripped for ${scope}: iteration ${iteration} exceeds max ${maxIterations}`
    );
    this.name = 'DevLoopException';
  }
}

export function isDevelopmentEnv(): boolean {
  return (
    process.env.ENV === 'development' ||
    process.env.NODE_ENV === 'development' ||
    process.env.TNF_RUNTIME === 'docker-compose'
  );
}

export function getDevLoopMaxIterations(): number {
  const parsed = Number.parseInt(process.env.DEV_LOOP_MAX_ITERATIONS || '', 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_MAX_ITERATIONS;
}

export function getDevLoopIteration(input: unknown): number {
  const candidates = [
    readNumeric(input, 'devLoopIteration'),
    readNumeric(input, 'iteration'),
    readNumeric(input, 'loopIteration'),
    readNestedNumeric(input, ['metadata', 'devLoopIteration']),
    readNestedNumeric(input, ['metadata', 'iteration']),
    readNestedNumeric(input, ['context', 'devLoopIteration']),
    readNestedNumeric(input, ['context', 'iteration']),
    readNestedNumeric(input, ['variables', 'devLoopIteration']),
    readNestedNumeric(input, ['variables', 'iteration']),
  ];

  const explicit = candidates.find((value) => value != null);
  return explicit == null ? 1 : explicit;
}

export function assertDevLoopBudget(scope: string, input?: unknown): number {
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

function readNumeric(input: unknown, key: string): number | null {
  if (!input || typeof input !== 'object') return null;
  const value = (input as Record<string, unknown>)[key];
  return normalizeNumber(value);
}

function readNestedNumeric(input: unknown, path: string[]): number | null {
  let current: unknown = input;
  for (const key of path) {
    if (!current || typeof current !== 'object') return null;
    current = (current as Record<string, unknown>)[key];
  }
  return normalizeNumber(current);
}

function normalizeNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number.parseInt(value, 10);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}
