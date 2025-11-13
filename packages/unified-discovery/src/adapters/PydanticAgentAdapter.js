"use strict";
/**
 * Pydantic Agent Discovery Adapter
 *
 * Discovers and parses Pydantic agents from Python files with
 * AST analysis and sophisticated capability extraction.
 */
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
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
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
var PydanticAgentAdapter_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PydanticAgentAdapter = void 0;
const common_1 = require("@nestjs/common");
const glob_1 = require("glob");
const fs = __importStar(require("fs/promises"));
const path = __importStar(require("path"));
const UnifiedEntity_1 = require("../domain/UnifiedEntity");
let PydanticAgentAdapter = PydanticAgentAdapter_1 = class PydanticAgentAdapter {
    logger = new common_1.Logger(PydanticAgentAdapter_1.name);
    // Capability detection patterns for Python code
    capabilityPatterns = new Map([
        [UnifiedEntity_1.CapabilityType.CODE_GENERATION, [
                /generate.*code/i,
                /create.*code/i,
                /write.*code/i,
                /code.*generation/i,
                /ast\./i,
                /compile/i
            ]],
        [UnifiedEntity_1.CapabilityType.CODE_ANALYSIS, [
                /analyze.*code/i,
                /parse.*code/i,
                /ast\./i,
                /inspect/i,
                /static.*analysis/i,
                /lint/i
            ]],
        [UnifiedEntity_1.CapabilityType.DATA_ANALYSIS, [
                /pandas/i,
                /numpy/i,
                /analyze.*data/i,
                /process.*data/i,
                /statistics/i,
                /dataframe/i
            ]],
        [UnifiedEntity_1.CapabilityType.API_INTEGRATION, [
                /requests/i,
                /httpx/i,
                /api.*client/i,
                /rest.*api/i,
                /graphql/i,
                /webhook/i
            ]],
        [UnifiedEntity_1.CapabilityType.FILE_OPERATIONS, [
                /file.*operations/i,
                /read.*file/i,
                /write.*file/i,
                /pathlib/i,
                /os\.path/i,
                /shutil/i
            ]],
        [UnifiedEntity_1.CapabilityType.DATABASE_OPERATIONS, [
                /sqlalchemy/i,
                /database/i,
                /sql/i,
                /orm/i,
                /query/i,
                /crud/i
            ]],
        [UnifiedEntity_1.CapabilityType.WORKFLOW_ORCHESTRATION, [
                /workflow/i,
                /orchestrate/i,
                /pipeline/i,
                /celery/i,
                /task.*queue/i,
                /schedule/i
            ]],
        [UnifiedEntity_1.CapabilityType.MONITORING, [
                /monitor/i,
                /logging/i,
                /metrics/i,
                /prometheus/i,
                /health.*check/i,
                /observability/i
            ]]
    ]);
    async discoverEntities(criteria) {
        this.logger.log('🔍 Discovering Pydantic agents from Python files...');
        const entities = [];
        for (const basePath of criteria.paths) {
            try {
                const pythonFiles = await this.findPydanticAgentFiles(basePath, criteria);
                for (const filePath of pythonFiles) {
                    try {
                        const agentDefinitions = await this.parsePydanticAgents(filePath);
                        for (const definition of agentDefinitions) {
                            const entity = this.createEntityFromDefinition(definition);
                            if (entity) {
                                entities.push(entity);
                            }
                        }
                    }
                    catch (error) {
                        this.logger.warn(`Failed to parse Pydantic agents from ${filePath}:, error);
          }
        }
      } catch (error) {`, this.logger.error(`Failed to discover Pydantic agents in ${basePath}`, error));
                    }
                }
                this.logger.log(Discovered, $, { entities, : .length }, Pydantic, agents);
                return entities;
            }
            finally {
            }
        }
    }
    async findPydanticAgentFiles(basePath, criteria) {
        const patterns = criteria.includePatterns?.length > 0
            ? criteria.includePatterns
            : ['**/*.py'];
        const allFiles = [];
        for (const pattern of patterns) {
            const fullPattern = path.join(basePath, pattern);
            const files = await (0, glob_1.glob)(fullPattern, {
                ignore: criteria.excludePatterns || ['**/node_modules/**', '**/__pycache__/**'],
                maxDepth: criteria.maxDepth || 10
            });
            allFiles.push(...files);
        }
        // Filter for Pydantic agent files
        const pydanticFiles = [];
        for (const file of allFiles) {
            if (await this.isPydanticAgentFile(file)) {
                pydanticFiles.push(file);
            }
        }
        return pydanticFiles;
    }
    async isPydanticAgentFile(filePath) {
        try {
            const content = await fs.readFile(filePath, 'utf-8');
            // Check for Pydantic agent indicators
            const indicators = [
                /from pydantic import/i,
                /import pydantic/i,
                /BaseModel/i,
                /class.*Agent.*\(/i,
                /class.*Agent.*BaseModel/i,
                /@agent/i,
                /Agent.*=/i
            ];
            return indicators.some(pattern => pattern.test(content));
        }
        catch {
            return false;
        }
    }
    async parsePydanticAgents(filePath) {
        try {
            const content = await fs.readFile(filePath, 'utf-8');
            return this.parseSourceCode(content, filePath);
        }
        catch (error) {
            `
      this.logger.error(Error parsing Pydantic agents from ${filePath}`;
            error;
            ;
            return [];
        }
    }
    parseSourceCode(sourceCode, filePath) {
        const definitions = [];
        const lines = sourceCode.split('\n');
        // Extract imports
        const imports = this.extractImports(lines);
        // Find class definitions
        const classDefinitions = this.extractClassDefinitions(lines, sourceCode);
        for (const classDef of classDefinitions) {
            if (this.isPydanticAgentClass(classDef, imports)) {
                const definition = {
                    name: this.extractAgentName(classDef.name),
                    className: classDef.name,
                    description: classDef.docstring || Pydantic, agent: $
                }, { classDef, name }, fields, extractFields;
                (classDef.body),
                    methods;
                this.extractMethods(classDef.body),
                    baseClasses;
                classDef.baseClasses,
                    imports,
                    filePath,
                    sourceCode;
                classDef.fullCode;
            }
            ;
            definitions.push(definition);
        }
    }
};
exports.PydanticAgentAdapter = PydanticAgentAdapter;
exports.PydanticAgentAdapter = PydanticAgentAdapter = PydanticAgentAdapter_1 = __decorate([
    (0, common_1.Injectable)()
], PydanticAgentAdapter);
return definitions;
extractImports(lines, string[]);
string[];
{
    const imports = [];
    for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith('import ') || trimmed.startsWith('from ')) {
            imports.push(trimmed);
        }
    }
    return imports;
}
extractClassDefinitions(lines, string[], sourceCode, string);
any[];
{
    const classes = [];
    let currentClass = null;
    let indentLevel = 0;
    let inClass = false;
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const trimmed = line.trim();
        // Detect class definition
        const classMatch = trimmed.match(/^class\s+(\w+)(?:\((.*?)\))?:/);
        if (classMatch) {
            // Save previous class if exists
            if (currentClass) {
                classes.push(currentClass);
            }
            // Start new class
            currentClass = {
                name: classMatch[1],
                baseClasses: classMatch[2] ? classMatch[2].split(',').map(s => s.trim()) : [],
                startLine: i,
                body: [],
                docstring: '',
                fullCode: ''
            };
            indentLevel = line.length - line.trimStart().length;
            inClass = true;
            // Look for docstring
            if (i + 1 < lines.length) {
                const nextLine = lines[i + 1].trim();
                if (nextLine.startsWith('"""') || nextLine.startsWith("'''")) {
                    let docstringEnd = i + 1;
                    const quote = nextLine.startsWith('"""') ? '"""' : "'''";
                    // Find end of docstring
                    if (!nextLine.endsWith(quote) || nextLine === quote) {
                        for (let j = i + 2; j < lines.length; j++) {
                            if (lines[j].trim().endsWith(quote)) {
                                docstringEnd = j;
                                break;
                            }
                        }
                    }
                    // Extract docstring
                    const docstringLines = lines.slice(i + 1, docstringEnd + 1);
                    currentClass.docstring = docstringLines
                        .map(l => l.trim())
                        .join(' ')
                        .replace(/"""|'''/g, '')
                        .trim();
                }
            }
            continue;
        }
        // Add lines to current class body
        if (inClass && currentClass) {
            const lineIndent = line.length - line.trimStart().length;
            // Check if we're still in the class
            if (trimmed && lineIndent <= indentLevel && !trimmed.startsWith('#')) {
                // End of class
                currentClass.endLine = i - 1;
                currentClass.fullCode = lines.slice(currentClass.startLine, i).join('\n');
                classes.push(currentClass);
                currentClass = null;
                inClass = false;
            }
            else if (trimmed) {
                currentClass.body.push(line);
            }
        }
    }
    // Add last class if exists
    if (currentClass) {
        currentClass.endLine = lines.length - 1;
        currentClass.fullCode = lines.slice(currentClass.startLine).join('\n');
        classes.push(currentClass);
    }
    return classes;
}
isPydanticAgentClass(classDef, any, imports, string[]);
boolean;
{
    // Check if it inherits from BaseModel or has Pydantic imports
    const hasPydanticImport = imports.some(imp => imp.includes('pydantic') || imp.includes('BaseModel'));
    const inheritsFromBaseModel = classDef.baseClasses.some((base) => base.includes('BaseModel') || base.includes('Agent'));
    const hasAgentInName = classDef.name.toLowerCase().includes('agent');
    return hasPydanticImport && (inheritsFromBaseModel || hasAgentInName);
}
extractAgentName(className, string);
string;
{
    return className
        .replace(/Agent$/, '')
        .replace(/([A-Z])/g, ' $1')
        .trim()
        .toLowerCase()
        .replace(/\b\w/g, l => l.toUpperCase());
}
extractFields(classBody, string[]);
PydanticField[];
{
    const fields = [];
    for (const line of classBody) {
        const trimmed = line.trim();
        // Look for field definitions
        const fieldMatch = trimmed.match(/^(\w+):\s*(.+?)(?:\s*=\s*(.+))?$/);
        if (fieldMatch && !trimmed.startsWith('def ')) {
            const [, name, type, defaultValue] = fieldMatch;
            fields.push({
                name,
                type: type.trim(),
                default: defaultValue?.trim(),
                required: !defaultValue,
                description: this.extractFieldDescription(classBody, name)
            });
        }
    }
    return fields;
}
extractMethods(classBody, string[]);
PydanticMethod[];
{
    const methods = [];
    for (let i = 0; i < classBody.length; i++) {
        const line = classBody[i].trim();
        // Look for method definitions
        const methodMatch = line.match(/^(async\s+)?def\s+(\w+)\s*\((.*?)\)(?:\s*->\s*(.+?))?:/);
        if (methodMatch) {
            const [, asyncKeyword, name, params, returnType] = methodMatch;
            // Skip private methods and special methods (except __init__)
            if (name.startsWith('_') && name !== '__init__') {
                continue;
            }
            methods.push({
                name,
                parameters: params.split(',').map(p => p.trim()).filter(p => p),
                returnType: returnType?.trim(),
                isAsync: !!asyncKeyword,
                description: this.extractMethodDescription(classBody, i)
            });
        }
    }
    return methods;
}
extractFieldDescription(classBody, string[], fieldName, string);
string | undefined;
{
    // Look for comments or docstrings near the field
    for (let i = 0; i < classBody.length; i++) {
        const line = classBody[i].trim();
        if (line.includes(fieldName + ':')) {
            // Check next line for comment
            if (i + 1 < classBody.length) {
                const nextLine = classBody[i + 1].trim();
                if (nextLine.startsWith('#')) {
                    return nextLine.replace('#', '').trim();
                }
            }
            break;
        }
    }
    return undefined;
}
extractMethodDescription(classBody, string[], methodIndex, number);
string | undefined;
{
    // Look for docstring after method definition
    if (methodIndex + 1 < classBody.length) {
        const nextLine = classBody[methodIndex + 1].trim();
        if (nextLine.startsWith('"""') || nextLine.startsWith("'''")) {
            return nextLine.replace(/"""|'''/g, '').trim();
        }
    }
    return undefined;
}
createEntityFromDefinition(definition, PydanticAgentDefinition);
UnifiedEntity_1.UnifiedEntity | null;
{
    try {
        // Create identity
        const identity = new UnifiedEntity_1.EntityIdentity(definition.name, definition.name, definition.description, '1.0.0', 'pydantic');
        // Determine archetype
        const archetype = this.determineArchetype(definition);
        // Extract capabilities
        const capabilities = this.extractCapabilities(definition);
        // Create metadata
        const metadata = new UnifiedEntity_1.EntityMetadata(UnifiedEntity_1.DiscoverySource.PYDANTIC_PYTHON, new Date(), new Date(), definition.filePath, definition.sourceCode, {
            className: definition.className,
            baseClasses: definition.baseClasses,
            fields: definition.fields,
            methods: definition.methods,
            imports: definition.imports
        }, ['pydantic', 'agent', 'python']);
        `
      return UnifiedEntity.create(identity, archetype, capabilities, metadata);`;
    }
    catch (error) {
        this.logger.error(Error, creating, entity, from, Pydantic, definition, error);
        return null;
    }
}
determineArchetype(definition, PydanticAgentDefinition);
UnifiedEntity_1.EntityArchetype;
{
    const content = `${definition.name} ${definition.description} ${definition.sourceCode}.toLowerCase();
    
    // Check method names and imports for archetype hints
    const methodNames = definition.methods.map(m => m.name.toLowerCase()).join(' ');
    const imports = definition.imports.join(' ').toLowerCase();
    
    if (content.includes('execute') || methodNames.includes('execute') || methodNames.includes('run')) {
      return EntityArchetype.EXECUTION_AGENT;
    }
    
    if (content.includes('plan') || methodNames.includes('plan') || methodNames.includes('schedule')) {
      return EntityArchetype.PLANNING_AGENT;
    }
    
    if (content.includes('coordinate') || methodNames.includes('coordinate') || imports.includes('celery')) {
      return EntityArchetype.COORDINATION_AGENT;
    }
    
    if (content.includes('monitor') || methodNames.includes('monitor') || imports.includes('prometheus')) {
      return EntityArchetype.MONITORING_AGENT;
    }
    
    if (imports.includes('requests') || imports.includes('httpx') || methodNames.includes('api')) {
      return EntityArchetype.CAPABILITY_PROVIDER;
    }
    
    // Default based on Pydantic nature
    return EntityArchetype.PYDANTIC_AGENT;`;
}
`

  private extractCapabilities(definition: PydanticAgentDefinition): CapabilitySet {
    const capabilities: Capability[] = [];`;
const allText = $, { definition, sourceCode }, $, { definition, imports, join };
(' ');
``;
// Check each capability pattern
for (const [capabilityType, patterns] of this.capabilityPatterns) {
    let confidence = 0;
    let matchCount = 0;
    for (const pattern of patterns) {
        if (pattern.test(allText)) {
            matchCount++;
        }
    }
    if (matchCount > 0) {
        confidence = Math.min(0.9, 0.4 + (matchCount * 0.15));
        // Determine level based on method complexity
        let level = 'intermediate';
        if (definition.methods.length > 10) {
            level = 'expert';
        }
        else if (definition.methods.length > 5) {
            level = 'advanced';
        }
        else if (definition.methods.length > 2) {
            level = 'intermediate';
        }
        else {
            level = 'basic';
        }
        capabilities.push(new UnifiedEntity_1.Capability(capabilityType, level, confidence, {
            extractedFrom: 'pydantic_analysis',
            matchCount,
            methodCount: definition.methods.length,
            fieldCount: definition.fields.length
        }));
    }
}
// Add Python programming capability for all Pydantic agents
capabilities.push(new UnifiedEntity_1.Capability(UnifiedEntity_1.CapabilityType.CODE_GENERATION, 'advanced', 0.8, { extractedFrom: 'pydantic_default', language: 'python' }));
return new UnifiedEntity_1.CapabilitySet(capabilities);
//# sourceMappingURL=PydanticAgentAdapter.js.map