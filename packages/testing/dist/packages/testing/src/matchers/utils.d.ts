import { MatcherState } from '@jest/expect';
import { ZodSchema } from 'zod';
export interface CustomMatcherResult {
    pass: boolean;
    message: () => string;
}
export declare function createMatcher<T = any>(predicate: (received: T, ...args: any[]) => boolean | Promise<boolean>, failMessage: (received: T, ...args: any[]) => string, passMessage: (received: T, ...args: any[]) => string): (this: MatcherState, received: T, ...args: any[]) => Promise<CustomMatcherResult>;
export declare function validateSchema(value: unknown, schema: ZodSchema): any;
//# sourceMappingURL=utils.d.ts.map