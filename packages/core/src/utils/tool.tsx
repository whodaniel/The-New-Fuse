import { z } from 'zod';

type ToolDefinition<T extends z.ZodType> = {
  description: string;
  parameters: T;
  execute?: (params: z.infer<T>) => Promise<any>;
};

export function tool<T extends z.ZodType>(definition: ToolDefinition<T>) {
  return {
    ...definition,
    validate: (params: unknown) => definition.parameters.parse(params),
  };
}