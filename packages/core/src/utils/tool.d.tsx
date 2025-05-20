import { z } from 'zod';
type ToolDefinition<T extends z.ZodType> = {
    description: string;
    parameters: T;
    execute?: (params: z.infer<T>) => Promise<any>;
};
export declare function tool<T extends z.ZodType>(definition: ToolDefinition<T>): {
    validate: (params: unknown) => any;
    description: string;
    parameters: T;
    execute?: ((params: z.TypeOf<T>) => Promise<any>) | undefined;
};
export {};
