export interface N8nNodeMetadata {
    id: string;
    name: string;
    displayName: string;
    type: string;
    category: string;
    description: string;
    parameters: N8nParameter[];
    credentials?: string[];
    inputs: number[];
    outputs: number[];
    icon?: string;
}
export interface N8nParameter {
    name: string;
    displayName: string;
    type: 'string' | 'number' | 'boolean' | 'collection' | 'options' | 'credentials';
    required?: boolean;
    default?: any;
    options?: Array<{
        name: string;
        value: any;
    }>;
    description?: string;
}
declare class N8nMetadataService {
    private nodeMetadata;
    constructor();
    private initializeBuiltInNodes;
    getNodeMetadata(nodeType: string): N8nNodeMetadata | undefined;
    getAllNodeMetadata(): N8nNodeMetadata[];
    getNodesByCategory(category: string): N8nNodeMetadata[];
    getCategories(): string[];
    validateNodeConfiguration(nodeType: string, parameters: any): {
        isValid: boolean;
        errors: string[];
    };
    getDefaultParameterValues(nodeType: string): any;
    addCustomNode(metadata: N8nNodeMetadata): void;
    removeNode(nodeType: string): boolean;
}
declare const n8nMetadataService: N8nMetadataService;
export default n8nMetadataService;
