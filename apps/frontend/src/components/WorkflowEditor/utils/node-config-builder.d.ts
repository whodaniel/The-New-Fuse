export declare class NodeConfigBuilder {
    static createConfig(nodeTypeData: any): {
        type: any;
        name: any;
        inputs: any;
        outputs: any;
        parameters: any;
        credentials: any;
    };
    static mapParameters(properties: any): any;
    static getDefaultParameters(config: any): {};
    static validateParameters(config: any, parameters: any): any[];
    static processSpecialNodeTypes(nodeType: any, parameters: any): any;
    static processHttpRequestNode(parameters: any): any;
    static processIfNode(parameters: any): any;
    static processSwitchNode(parameters: any): any;
}
