export declare class DevLoopException extends Error {
    constructor(scope: string, iteration: number, maxIterations: number);
}
export declare function isDevelopmentEnv(): boolean;
export declare function getDevLoopMaxIterations(): number;
export declare function getDevLoopIteration(input: unknown): number;
export declare function assertDevLoopBudget(scope: string, input?: unknown): number;
//# sourceMappingURL=dev-loop-guard.d.ts.map