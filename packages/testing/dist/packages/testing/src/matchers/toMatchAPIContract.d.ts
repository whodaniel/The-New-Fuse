import { z } from 'zod';
export type APIContract = {
    status: number;
    headers?: Record<string, string>;
    schema: z.ZodSchema;
};
interface APIResponse {
    status: number;
    headers: Record<string, string>;
    data: unknown;
}
export declare const toMatchAPIContract: (this: import("expect").MatcherState, received: APIResponse, ...args: any[]) => Promise<import("./utils").CustomMatcherResult>;
export {};
//# sourceMappingURL=toMatchAPIContract.d.ts.map