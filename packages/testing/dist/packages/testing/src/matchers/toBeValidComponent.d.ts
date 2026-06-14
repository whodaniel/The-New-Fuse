import { z } from 'zod';
export interface ComponentValidator {
    props?: Record<string, (value: unknown) => boolean>;
    requiredProps?: string[];
    displayName?: string;
    childrenAllowed?: boolean;
}
export type ComponentValidatorInput = ComponentValidator | z.ZodTypeAny;
export declare const toBeValidComponent: (this: import("expect").MatcherState, received: any, ...args: any[]) => Promise<import("./utils").CustomMatcherResult>;
//# sourceMappingURL=toBeValidComponent.d.ts.map