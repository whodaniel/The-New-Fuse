import { HttpException } from '@nestjs/common';
export declare class DevLoopException extends HttpException {
    constructor(scope: string, iteration: number, maxIterations: number);
}
export declare function isDevelopmentEnv(): boolean;
export declare function getDevLoopMaxIterations(): number;
export declare function getDevLoopIteration(input: unknown): number;
export declare function assertDevLoopBudget(scope: string, input?: unknown): number;
export declare function withNextDevLoopIteration<T extends Record<string, any>>(input: T, iteration: number): T;
//# sourceMappingURL=dev-loop-guard.d.ts.map