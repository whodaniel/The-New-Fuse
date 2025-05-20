interface NodeTypeData {
    name: string;
    displayName: string;
    description: string;
    version: number;
    properties: {
        inputs?: any[];
        outputs?: any[];
        properties: any[];
        credentials?: any[];
    };
}
interface NodeConfig {
    type: string;
    name: string;
    inputs: any[];
    outputs: any[];
    parameters: Record<string, any>;
    credentials: any[];
}
export declare class NodeConfigBuilder {
    static createConfig(nodeTypeData: NodeTypeData): NodeConfig;
    private static mapParameters;
    static getDefaultParameters(config: NodeConfig): Record<string, any>;
    static validateParameters(config: NodeConfig, parameters: Record<string, any>): string[];
    static processSpecialNodeTypes(nodeType: string, parameters: Record<string, any>): Record<string, any>;
    private static processHttpRequestNode;
    private static processIfNode;
    private static processSwitchNode;
}
export {};
