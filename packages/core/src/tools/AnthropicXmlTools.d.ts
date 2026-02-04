export interface ToolDefinition {
    name: string;
    description: string;
    parameters: Record<string, any>;
}
export declare class AnthropicXmlTools {
    private readonly logger;
    convertToolToXmlFormat(tool: ToolDefinition): string;
    convertToolsToXmlFormat(tools: ToolDefinition[]): string;
    parseXmlResponse(xml: string): any;
}
//# sourceMappingURL=AnthropicXmlTools.d.ts.map