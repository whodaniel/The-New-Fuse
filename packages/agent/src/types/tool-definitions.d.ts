interface ToolDefinition {
    id: string;
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: Record<string, any>;
        required?: string[];
    };
    outputSchema: {
        type: string;
        properties: Record<string, any>;
    };
}
export declare const ImageGenerationTool: ToolDefinition;
export {};
//# sourceMappingURL=tool-definitions.d.ts.map