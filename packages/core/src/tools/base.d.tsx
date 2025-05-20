export interface ToolConfig {
    name: string;
    description: string;
    parameters: Record<string, unknown>;
}
export declare abstract class BaseTool {
    abstract readonly config: ToolConfig;
    abstract execute(params: Record<string, unknown>): Promise<unknown>;
    getName(): string;
    getDescription(): string;
    getParameters(): Record<string, unknown>;
}
