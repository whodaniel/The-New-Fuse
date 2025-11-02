import type { PackageInfo } from '../scanner/FileSystemScanner';
export interface DataFlowNode {
    id: string;
    name: string;
    type: 'frontend' | 'api' | 'database' | 'service' | 'middleware' | 'controller' | 'repository';
    layer: 'presentation' | 'api' | 'business' | 'data';
    filePath: string;
    methods: DataFlowMethod[];
    dependencies: string[];
}
export interface DataFlowMethod {
    name: string;
    type: 'endpoint' | 'service' | 'repository' | 'query' | 'mutation' | 'component';
    parameters: DataFlowParameter[];
    returnType?: string;
    dataTransformations: DataTransformation[];
    databaseOperations: DatabaseOperation[];
    apiCalls: ApiCall[];
}
export interface DataFlowParameter {
    name: string;
    type: string;
    validation?: ValidationRule[];
    serialization?: SerializationRule[];
}
export interface DataTransformation {
    from: string;
    to: string;
    transformationType: 'mapping' | 'validation' | 'serialization' | 'filtering' | 'aggregation';
    location: string;
    efficiency: 'efficient' | 'moderate' | 'inefficient';
}
export interface DatabaseOperation {
    type: 'create' | 'read' | 'update' | 'delete' | 'query';
    model: string;
    fields: string[];
    conditions?: string[];
    joins?: string[];
    performance: 'efficient' | 'moderate' | 'inefficient';
}
export interface ApiCall {
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
    endpoint: string;
    parameters: string[];
    responseType?: string;
    authentication?: boolean;
}
export interface ValidationRule {
    type: 'required' | 'type' | 'format' | 'range' | 'custom';
    rule: string;
    location: string;
}
export interface SerializationRule {
    type: 'json' | 'xml' | 'form' | 'custom';
    schema?: string;
    location: string;
}
export interface DataFlowPath {
    id: string;
    name: string;
    nodes: string[];
    dataType: string;
    transformations: DataTransformation[];
    performance: 'efficient' | 'moderate' | 'inefficient';
    bottlenecks: string[];
    recommendations: string[];
}
export interface DataFlowInefficiency {
    type: 'redundant_transformation' | 'missing_validation' | 'inefficient_serialization' | 'n_plus_one' | 'over_fetching' | 'under_fetching';
    location: string;
    description: string;
    impact: 'low' | 'medium' | 'high';
    recommendation: string;
}
export interface DataFlowReport {
    nodes: DataFlowNode[];
    paths: DataFlowPath[];
    inefficiencies: DataFlowInefficiency[];
    validationPatterns: {
        frontend: ValidationRule[];
        api: ValidationRule[];
        database: ValidationRule[];
        duplicates: ValidationRule[];
    };
    serializationPatterns: {
        apiToFrontend: SerializationRule[];
        databaseToApi: SerializationRule[];
        inefficiencies: SerializationRule[];
    };
    summary: {
        totalNodes: number;
        totalPaths: number;
        totalTransformations: number;
        inefficiencyCount: number;
        validationCoverage: number;
        serializationEfficiency: number;
        overallDataFlowScore: number;
    };
}
export declare class DataFlowMapper {
    private packages;
    private rootPath;
    constructor(packages: PackageInfo[], rootPath: string);
    mapDataFlow(): Promise<DataFlowReport>;
    private identifyDataFlowNodes;
    private analyzeFileForDataFlowNode;
    private determineNodeType;
    private determineLayer;
    private extractMethods;
    private extractApiMethod;
    private extractServiceMethod;
    private extractRepositoryMethod;
    private extractComponentMethod;
    private extractMethodName;
    private extractParameters;
    private extractTransformations;
    private extractDatabaseOperations;
    private extractApiCalls;
    private extractValidationRules;
    private extractSerializationRules;
    private extractFieldsFromQuery;
    private assessQueryPerformance;
    private extractDependencies;
    private generateNodeId;
    private traceDataFlowPaths;
    private nodesAreConnected;
    private createDataFlowPath;
    private assessPathPerformance;
    private identifyBottlenecks;
    private generatePathRecommendations;
    private identifyDataFlowInefficiencies;
    private groupTransformationsByType;
    private analyzeValidationPatterns;
    private analyzeSerializationPatterns;
    private generateSummary;
}
//# sourceMappingURL=DataFlowMapper.d.ts.map