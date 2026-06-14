import { z } from 'zod';
export interface CodeEvalCase {
    id: string;
    name: string;
    description: string;
    inputSchema: z.ZodType;
    validate: (output: unknown) => CodeEvalResult;
}
export interface CodeEvalResult {
    passed: boolean;
    score: number;
    details: string;
    category: 'deterministic' | 'heuristic' | 'structural';
}
export declare class CodeEvalSuite {
    private cases;
    register(evalCase: CodeEvalCase): void;
    run(evalId: string, output: unknown): Promise<CodeEvalResult>;
    runAll(output: unknown): Promise<CodeEvalResult[]>;
    listCases(): Array<{
        id: string;
        name: string;
        description: string;
    }>;
}
export declare const builtInEvalCases: CodeEvalCase[];
//# sourceMappingURL=codeEvals.d.ts.map