"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.DataFlowMapper = void 0;
const fs = __importStar(require("fs/promises"));
const path = __importStar(require("path"));
const glob_1 = require("glob");
class DataFlowMapper {
    constructor(packages, rootPath) {
        this.packages = packages;
        this.rootPath = rootPath;
    }
    async mapDataFlow() {
        console.log('Mapping data flow across application layers...');
        // Step 1: Identify data flow nodes
        const nodes = await this.identifyDataFlowNodes();
        // Step 2: Trace data flow paths
        const paths = await this.traceDataFlowPaths(nodes);
        // Step 3: Identify inefficiencies
        const inefficiencies = this.identifyDataFlowInefficiencies(nodes, paths);
        // Step 4: Analyze validation patterns
        const validationPatterns = this.analyzeValidationPatterns(nodes);
        // Step 5: Analyze serialization patterns
        const serializationPatterns = this.analyzeSerializationPatterns(nodes);
        // Step 6: Generate summary
        const summary = this.generateSummary(nodes, paths, inefficiencies, validationPatterns, serializationPatterns);
        return {
            nodes,
            paths,
            inefficiencies,
            validationPatterns,
            serializationPatterns,
            summary
        };
    }
    async identifyDataFlowNodes() {
        const nodes = [];
        // Find all relevant source files
        const sourceFiles = await (0, glob_1.glob)('**/*.{ts,js,tsx,jsx}', {
            cwd: this.rootPath,
            ignore: ['**/node_modules/**', '**/dist/**', '**/build/**', '**/*.d.ts']
        });
        for (const sourceFile of sourceFiles) {
            const fullPath = path.join(this.rootPath, sourceFile);
            try {
                const content = await fs.readFile(fullPath, 'utf-8');
                const node = await this.analyzeFileForDataFlowNode(content, sourceFile, fullPath);
                if (node) {
                    nodes.push(node);
                }
            }
            catch (error) {
                console.warn(`Failed to analyze file ${sourceFile}:`, error);
            }
        }
        return nodes;
    }
    async analyzeFileForDataFlowNode(content, filePath, fullPath) {
        const nodeType = this.determineNodeType(filePath, content);
        if (!nodeType)
            return null;
        const layer = this.determineLayer(nodeType);
        const methods = this.extractMethods(content, nodeType);
        const dependencies = this.extractDependencies(content);
        return {
            id: this.generateNodeId(filePath),
            name: path.basename(filePath, path.extname(filePath)),
            type: nodeType,
            layer,
            filePath,
            methods,
            dependencies
        };
    }
    determineNodeType(filePath, content) {
        // Frontend components
        if (filePath.includes('components') || filePath.includes('pages') || filePath.includes('views')) {
            if (content.includes('React') || content.includes('useState') || content.includes('useEffect')) {
                return 'frontend';
            }
        }
        // API controllers
        if (filePath.includes('controller') || filePath.includes('route') || filePath.includes('api')) {
            if (content.includes('@Controller') || content.includes('router') || content.includes('app.get') || content.includes('app.post')) {
                return 'controller';
            }
        }
        // Services
        if (filePath.includes('service') || filePath.includes('business')) {
            if (content.includes('@Service') || content.includes('class') && content.includes('Service')) {
                return 'service';
            }
        }
        // Repositories
        if (filePath.includes('repository') || filePath.includes('dao') || filePath.includes('model')) {
            return 'repository';
        }
        // Check for database operations in any file
        if (content.includes('prisma') || content.includes('findMany') || content.includes('create') || content.includes('update')) {
            return 'repository';
        }
        // Middleware
        if (filePath.includes('middleware') || filePath.includes('guard')) {
            return 'middleware';
        }
        // Database models
        if (filePath.includes('prisma') || filePath.includes('schema')) {
            return 'database';
        }
        // API endpoints
        if (content.includes('express') || content.includes('fastify') || content.includes('@Get') || content.includes('@Post')) {
            return 'api';
        }
        return null;
    }
    determineLayer(nodeType) {
        switch (nodeType) {
            case 'frontend':
                return 'presentation';
            case 'api':
            case 'controller':
            case 'middleware':
                return 'api';
            case 'service':
                return 'business';
            case 'repository':
            case 'database':
                return 'data';
            default:
                return 'business';
        }
    }
    extractMethods(content, nodeType) {
        const methods = [];
        const lines = content.split('\n');
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            // Extract different types of methods based on node type
            if (nodeType === 'controller' || nodeType === 'api') {
                const apiMethod = this.extractApiMethod(line, lines, i);
                if (apiMethod)
                    methods.push(apiMethod);
            }
            else if (nodeType === 'service') {
                const serviceMethod = this.extractServiceMethod(line, lines, i);
                if (serviceMethod)
                    methods.push(serviceMethod);
            }
            else if (nodeType === 'repository') {
                const repositoryMethod = this.extractRepositoryMethod(line, lines, i);
                if (repositoryMethod)
                    methods.push(repositoryMethod);
            }
            else if (nodeType === 'frontend') {
                const componentMethod = this.extractComponentMethod(line, lines, i);
                if (componentMethod)
                    methods.push(componentMethod);
            }
        }
        return methods;
    }
    extractApiMethod(line, lines, index) {
        // Look for API endpoint definitions
        const routePatterns = [
            /@Get\(['"]([^'"]+)['"]\)/,
            /@Post\(['"]([^'"]+)['"]\)/,
            /@Put\(['"]([^'"]+)['"]\)/,
            /@Delete\(['"]([^'"]+)['"]\)/,
            /app\.(get|post|put|delete)\(['"]([^'"]+)['"]/,
            /router\.(get|post|put|delete)\(['"]([^'"]+)['"]/
        ];
        for (const pattern of routePatterns) {
            const match = line.match(pattern);
            if (match) {
                const methodName = this.extractMethodName(lines, index);
                return {
                    name: methodName || 'unknown',
                    type: 'endpoint',
                    parameters: this.extractParameters(lines, index),
                    dataTransformations: this.extractTransformations(lines, index),
                    databaseOperations: this.extractDatabaseOperations(lines, index),
                    apiCalls: []
                };
            }
        }
        return null;
    }
    extractServiceMethod(line, lines, index) {
        // Look for service method definitions
        const servicePatterns = [
            /async\s+(\w+)\s*\(/,
            /(\w+)\s*\([^)]*\)\s*{/,
            /public\s+async\s+(\w+)\s*\(/
        ];
        for (const pattern of servicePatterns) {
            const match = line.match(pattern);
            if (match) {
                return {
                    name: match[1],
                    type: 'service',
                    parameters: this.extractParameters(lines, index),
                    dataTransformations: this.extractTransformations(lines, index),
                    databaseOperations: this.extractDatabaseOperations(lines, index),
                    apiCalls: this.extractApiCalls(lines, index)
                };
            }
        }
        return null;
    }
    extractRepositoryMethod(line, lines, index) {
        // Look for repository/database methods
        const repoPatterns = [
            /(\w+)\.(findMany|findUnique|create|update|delete|upsert)/,
            /async\s+(\w+)\s*\(/
        ];
        for (const pattern of repoPatterns) {
            const match = line.match(pattern);
            if (match) {
                return {
                    name: match[1] || 'unknown',
                    type: 'repository',
                    parameters: this.extractParameters(lines, index),
                    dataTransformations: this.extractTransformations(lines, index),
                    databaseOperations: this.extractDatabaseOperations(lines, index),
                    apiCalls: []
                };
            }
        }
        return null;
    }
    extractComponentMethod(line, lines, index) {
        // Look for React component methods
        const componentPatterns = [
            /const\s+(\w+)\s*=.*=>/,
            /function\s+(\w+)\s*\(/,
            /const\s+(\w+)\s*:\s*React\.FC/
        ];
        for (const pattern of componentPatterns) {
            const match = line.match(pattern);
            if (match) {
                return {
                    name: match[1],
                    type: 'component',
                    parameters: this.extractParameters(lines, index),
                    dataTransformations: this.extractTransformations(lines, index),
                    databaseOperations: [],
                    apiCalls: this.extractApiCalls(lines, index)
                };
            }
        }
        return null;
    }
    extractMethodName(lines, startIndex) {
        // Look for method name in the next few lines
        for (let i = startIndex; i < Math.min(startIndex + 3, lines.length); i++) {
            const line = lines[i].trim();
            const match = line.match(/(?:async\s+)?(\w+)\s*\(/);
            if (match) {
                return match[1];
            }
        }
        return null;
    }
    extractParameters(lines, startIndex) {
        const parameters = [];
        // Look for parameter definitions in the method signature
        for (let i = startIndex; i < Math.min(startIndex + 5, lines.length); i++) {
            const line = lines[i];
            const paramMatches = line.matchAll(/(\w+):\s*(\w+)/g);
            for (const match of paramMatches) {
                parameters.push({
                    name: match[1],
                    type: match[2],
                    validation: this.extractValidationRules(lines, i),
                    serialization: this.extractSerializationRules(lines, i)
                });
            }
        }
        return parameters;
    }
    extractTransformations(lines, startIndex) {
        const transformations = [];
        // Look for data transformation patterns
        for (let i = startIndex; i < Math.min(startIndex + 20, lines.length); i++) {
            const line = lines[i].trim();
            // Map operations
            if (line.includes('.map(') || line.includes('Object.assign') || line.includes('...')) {
                transformations.push({
                    from: 'unknown',
                    to: 'unknown',
                    transformationType: 'mapping',
                    location: `line ${i + 1}`,
                    efficiency: 'moderate'
                });
            }
            // Validation
            if (line.includes('validate') || line.includes('schema') || line.includes('joi') || line.includes('yup')) {
                transformations.push({
                    from: 'raw',
                    to: 'validated',
                    transformationType: 'validation',
                    location: `line ${i + 1}`,
                    efficiency: 'efficient'
                });
            }
            // Serialization
            if (line.includes('JSON.stringify') || line.includes('JSON.parse') || line.includes('serialize')) {
                transformations.push({
                    from: 'object',
                    to: 'json',
                    transformationType: 'serialization',
                    location: `line ${i + 1}`,
                    efficiency: 'efficient'
                });
            }
        }
        return transformations;
    }
    extractDatabaseOperations(lines, startIndex) {
        const operations = [];
        for (let i = startIndex; i < Math.min(startIndex + 20, lines.length); i++) {
            const line = lines[i].trim();
            // Prisma operations
            const prismaPattern = /prisma\.(\w+)\.(create|findMany|findUnique|update|delete|upsert)/;
            const prismaMatch = line.match(prismaPattern);
            if (prismaMatch) {
                operations.push({
                    type: 'query',
                    model: prismaMatch[1], // This captures the model name (e.g., "user" from "prisma.user.findMany")
                    fields: this.extractFieldsFromQuery(line),
                    performance: this.assessQueryPerformance(line)
                });
            }
            // SQL operations
            const sqlPattern = /INSERT|UPDATE|DELETE|SELECT/i;
            if (sqlPattern.test(line)) {
                operations.push({
                    type: 'query',
                    model: 'unknown',
                    fields: [],
                    performance: 'moderate'
                });
            }
        }
        return operations;
    }
    extractApiCalls(lines, startIndex) {
        const apiCalls = [];
        for (let i = startIndex; i < Math.min(startIndex + 20, lines.length); i++) {
            const line = lines[i].trim();
            // HTTP client calls
            const httpPatterns = [
                /fetch\(['"]([^'"]+)['"]/,
                /axios\.(get|post|put|delete)\(['"]([^'"]+)['"]/,
                /http\.(get|post|put|delete)\(['"]([^'"]+)['"]/
            ];
            for (const pattern of httpPatterns) {
                const match = line.match(pattern);
                if (match) {
                    let method;
                    let endpoint;
                    if (pattern.source.includes('fetch')) {
                        // For fetch calls, first match is the endpoint
                        method = 'GET';
                        endpoint = match[1];
                    }
                    else {
                        // For axios/http calls, first match is method, second is endpoint
                        method = match[1];
                        endpoint = match[2];
                    }
                    apiCalls.push({
                        method: method.toUpperCase(),
                        endpoint,
                        parameters: [],
                        authentication: line.includes('Authorization') || line.includes('Bearer')
                    });
                }
            }
        }
        return apiCalls;
    }
    extractValidationRules(lines, startIndex) {
        const rules = [];
        for (let i = Math.max(0, startIndex - 5); i < Math.min(startIndex + 5, lines.length); i++) {
            const line = lines[i].trim();
            if (line.includes('@IsNotEmpty') || line.includes('required')) {
                rules.push({
                    type: 'required',
                    rule: 'required',
                    location: `line ${i + 1}`
                });
            }
            if (line.includes('@IsEmail') || line.includes('email')) {
                rules.push({
                    type: 'format',
                    rule: 'email',
                    location: `line ${i + 1}`
                });
            }
        }
        return rules;
    }
    extractSerializationRules(lines, startIndex) {
        const rules = [];
        for (let i = Math.max(0, startIndex - 5); i < Math.min(startIndex + 5, lines.length); i++) {
            const line = lines[i].trim();
            if (line.includes('JSON.stringify') || line.includes('JSON.parse')) {
                rules.push({
                    type: 'json',
                    location: `line ${i + 1}`
                });
            }
        }
        return rules;
    }
    extractFieldsFromQuery(line) {
        const fields = [];
        // Extract select fields
        const selectMatch = line.match(/select:\s*{([^}]+)}/);
        if (selectMatch) {
            const selectFields = selectMatch[1].split(',').map(f => f.trim().split(':')[0]);
            fields.push(...selectFields);
        }
        return fields;
    }
    assessQueryPerformance(line) {
        // Check for include first (moderate performance)
        if (line.includes('include') && line.includes('findMany')) {
            return 'moderate'; // Potential N+1
        }
        // Then check for pagination issues
        if (line.includes('findMany') && !line.includes('take') && !line.includes('skip')) {
            return 'inefficient'; // No pagination
        }
        return 'efficient';
    }
    extractDependencies(content) {
        const dependencies = [];
        const importMatches = content.matchAll(/import.*from\s+['"]([^'"]+)['"]/g);
        for (const match of importMatches) {
            dependencies.push(match[1]);
        }
        return dependencies;
    }
    generateNodeId(filePath) {
        return filePath.replace(/[^a-zA-Z0-9]/g, '_');
    }
    async traceDataFlowPaths(nodes) {
        const paths = [];
        // Group nodes by layer
        const nodesByLayer = nodes.reduce((acc, node) => {
            if (!acc[node.layer])
                acc[node.layer] = [];
            acc[node.layer].push(node);
            return acc;
        }, {});
        // Trace paths from presentation to data layer
        const presentationNodes = nodesByLayer.presentation || [];
        const apiNodes = nodesByLayer.api || [];
        const dataNodes = nodesByLayer.data || [];
        for (const frontendNode of presentationNodes) {
            for (const apiNode of apiNodes) {
                if (this.nodesAreConnected(frontendNode, apiNode)) {
                    for (const dataNode of dataNodes) {
                        if (this.nodesAreConnected(apiNode, dataNode)) {
                            const path = this.createDataFlowPath([frontendNode, apiNode, dataNode]);
                            paths.push(path);
                        }
                    }
                }
            }
        }
        return paths;
    }
    nodesAreConnected(nodeA, nodeB) {
        // Simple heuristic: check if nodeA has API calls that might connect to nodeB
        // or if they share similar method names/data types
        const nodeAApiCalls = nodeA.methods.flatMap(m => m.apiCalls);
        const nodeBMethods = nodeB.methods.map(m => m.name);
        // Check if any API calls from nodeA match methods in nodeB
        for (const apiCall of nodeAApiCalls) {
            for (const methodName of nodeBMethods) {
                if (apiCall.endpoint.includes(methodName.toLowerCase()) ||
                    methodName.toLowerCase().includes(apiCall.endpoint.split('/').pop()?.toLowerCase() || '')) {
                    return true;
                }
            }
        }
        // Check dependencies
        return nodeA.dependencies.some(dep => dep.includes(nodeB.name.toLowerCase()));
    }
    createDataFlowPath(nodes) {
        const allTransformations = nodes.flatMap(node => node.methods.flatMap(method => method.dataTransformations));
        const performance = this.assessPathPerformance(allTransformations);
        const bottlenecks = this.identifyBottlenecks(nodes);
        const recommendations = this.generatePathRecommendations(performance, bottlenecks);
        return {
            id: nodes.map(n => n.id).join('_to_'),
            name: nodes.map(n => n.name).join(' → '),
            nodes: nodes.map(n => n.id),
            dataType: 'mixed',
            transformations: allTransformations,
            performance,
            bottlenecks,
            recommendations
        };
    }
    assessPathPerformance(transformations) {
        const inefficientCount = transformations.filter(t => t.efficiency === 'inefficient').length;
        const totalCount = transformations.length;
        if (inefficientCount > totalCount * 0.5)
            return 'inefficient';
        if (inefficientCount > totalCount * 0.2)
            return 'moderate';
        return 'efficient';
    }
    identifyBottlenecks(nodes) {
        const bottlenecks = [];
        for (const node of nodes) {
            const inefficientOps = node.methods.flatMap(m => m.databaseOperations.filter(op => op.performance === 'inefficient'));
            if (inefficientOps.length > 0) {
                bottlenecks.push(`${node.name}: ${inefficientOps.length} inefficient database operations`);
            }
        }
        return bottlenecks;
    }
    generatePathRecommendations(performance, bottlenecks) {
        const recommendations = [];
        if (performance === 'inefficient') {
            recommendations.push('Optimize data transformations and reduce redundant operations');
        }
        if (bottlenecks.length > 0) {
            recommendations.push('Address database query performance issues');
            recommendations.push('Consider implementing caching for frequently accessed data');
        }
        return recommendations;
    }
    identifyDataFlowInefficiencies(nodes, paths) {
        const inefficiencies = [];
        // Check for redundant transformations
        const allTransformations = paths.flatMap(p => p.transformations);
        const transformationGroups = this.groupTransformationsByType(allTransformations);
        for (const [type, transformations] of Object.entries(transformationGroups)) {
            if (transformations.length > 3) {
                inefficiencies.push({
                    type: 'redundant_transformation',
                    location: 'multiple locations',
                    description: `${transformations.length} similar ${type} transformations found`,
                    impact: 'medium',
                    recommendation: `Consolidate ${type} transformations into reusable utilities`
                });
            }
        }
        // Check for missing validation
        for (const node of nodes) {
            if (node.type === 'api' || node.type === 'controller') {
                const hasValidation = node.methods.some(m => m.parameters.some(p => p.validation && p.validation.length > 0));
                if (!hasValidation) {
                    inefficiencies.push({
                        type: 'missing_validation',
                        location: node.filePath,
                        description: 'API endpoint lacks input validation',
                        impact: 'high',
                        recommendation: 'Add input validation to prevent invalid data processing'
                    });
                }
            }
        }
        // Check for N+1 queries
        for (const node of nodes) {
            const nPlusOneQueries = node.methods.flatMap(m => m.databaseOperations.filter(op => op.type === 'query' && op.performance === 'inefficient'));
            if (nPlusOneQueries.length > 0) {
                inefficiencies.push({
                    type: 'n_plus_one',
                    location: node.filePath,
                    description: 'Potential N+1 query pattern detected',
                    impact: 'high',
                    recommendation: 'Use eager loading or batch queries to reduce database calls'
                });
            }
        }
        return inefficiencies;
    }
    groupTransformationsByType(transformations) {
        return transformations.reduce((acc, transformation) => {
            if (!acc[transformation.transformationType]) {
                acc[transformation.transformationType] = [];
            }
            acc[transformation.transformationType].push(transformation);
            return acc;
        }, {});
    }
    analyzeValidationPatterns(nodes) {
        const frontend = [];
        const api = [];
        const database = [];
        const duplicates = [];
        for (const node of nodes) {
            const nodeValidations = node.methods.flatMap(m => m.parameters.flatMap(p => p.validation || []));
            if (node.layer === 'presentation') {
                frontend.push(...nodeValidations);
            }
            else if (node.layer === 'api') {
                api.push(...nodeValidations);
            }
            else if (node.layer === 'data') {
                database.push(...nodeValidations);
            }
        }
        // Find duplicate validation rules
        const allValidations = [...frontend, ...api, ...database];
        const validationMap = new Map();
        for (const validation of allValidations) {
            const key = `${validation.type}_${validation.rule}`;
            if (!validationMap.has(key)) {
                validationMap.set(key, []);
            }
            validationMap.get(key).push(validation);
        }
        for (const [key, validations] of validationMap) {
            if (validations.length > 1) {
                duplicates.push(...validations.slice(1)); // All but the first are duplicates
            }
        }
        return { frontend, api, database, duplicates };
    }
    analyzeSerializationPatterns(nodes) {
        const apiToFrontend = [];
        const databaseToApi = [];
        const inefficiencies = [];
        for (const node of nodes) {
            const nodeSerialization = node.methods.flatMap(m => m.parameters.flatMap(p => p.serialization || []));
            if (node.layer === 'api') {
                apiToFrontend.push(...nodeSerialization);
            }
            else if (node.layer === 'data') {
                databaseToApi.push(...nodeSerialization);
            }
            // Identify inefficient serialization patterns
            const inefficientSerialization = nodeSerialization.filter(s => s.location.includes('JSON.stringify') && s.location.includes('JSON.parse'));
            inefficiencies.push(...inefficientSerialization);
        }
        return { apiToFrontend, databaseToApi, inefficiencies };
    }
    generateSummary(nodes, paths, inefficiencies, validationPatterns, serializationPatterns) {
        const totalNodes = nodes.length;
        const totalPaths = paths.length;
        const totalTransformations = paths.reduce((sum, p) => sum + p.transformations.length, 0);
        const inefficiencyCount = inefficiencies.length;
        const totalValidations = validationPatterns.frontend.length + validationPatterns.api.length + validationPatterns.database.length;
        const validationCoverage = totalValidations > 0 ? Math.round((totalValidations - validationPatterns.duplicates.length) / totalValidations * 100) : 0;
        const totalSerializations = serializationPatterns.apiToFrontend.length + serializationPatterns.databaseToApi.length;
        const serializationEfficiency = totalSerializations > 0 ? Math.round((totalSerializations - serializationPatterns.inefficiencies.length) / totalSerializations * 100) : 100;
        const overallDataFlowScore = Math.round((validationCoverage + serializationEfficiency) / 2 - (inefficiencyCount * 5));
        return {
            totalNodes,
            totalPaths,
            totalTransformations,
            inefficiencyCount,
            validationCoverage,
            serializationEfficiency,
            overallDataFlowScore: Math.max(0, Math.min(100, overallDataFlowScore))
        };
    }
}
exports.DataFlowMapper = DataFlowMapper;
//# sourceMappingURL=DataFlowMapper.js.map