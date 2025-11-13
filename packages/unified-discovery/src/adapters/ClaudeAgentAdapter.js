"use strict";
/**
 * Claude Agent Discovery Adapter
 *
 * Discovers and parses Claude agents from markdown files with
 * sophisticated prompt analysis and capability extraction.
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
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var ClaudeAgentAdapter_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClaudeAgentAdapter = void 0;
const common_1 = require("@nestjs/common");
const BunOptimizedFileSystem_1 = require("../infrastructure/BunOptimizedFileSystem");
const path = __importStar(require("path"));
const UnifiedEntity_1 = require("../domain/UnifiedEntity");
let ClaudeAgentAdapter = ClaudeAgentAdapter_1 = class ClaudeAgentAdapter {
    fileSystem;
    logger = new common_1.Logger(ClaudeAgentAdapter_1.name);
    constructor(fileSystem) {
        this.fileSystem = fileSystem;
    }
    // Capability detection patterns
    capabilityPatterns = new Map([
        [UnifiedEntity_1.CapabilityType.CODE_GENERATION, [
                /code\s+generation/i,
                /generate\s+code/i,
                /write\s+code/i,
                /programming/i,
                /coding/i
            ]],
        [UnifiedEntity_1.CapabilityType.CODE_ANALYSIS, [
                /code\s+analysis/i,
                /analyze\s+code/i,
                /review\s+code/i,
                /debug/i,
                /refactor/i
            ]],
        [UnifiedEntity_1.CapabilityType.CONTENT_CREATION, [
                /content\s+creation/i,
                /write\s+content/i,
                /copywriting/i,
                /marketing/i,
                /blog/i
            ]],
        [UnifiedEntity_1.CapabilityType.DATA_ANALYSIS, [
                /data\s+analysis/i,
                /analyze\s+data/i,
                /statistics/i,
                /metrics/i,
                /analytics/i
            ]],
        [UnifiedEntity_1.CapabilityType.PLANNING, [
                /planning/i,
                /strategy/i,
                /roadmap/i,
                /organize/i,
                /schedule/i
            ]],
        [UnifiedEntity_1.CapabilityType.REASONING, [
                /reasoning/i,
                /logic/i,
                /think/i,
                /analyze/i,
                /problem.solving/i
            ]],
        [UnifiedEntity_1.CapabilityType.WORKFLOW_ORCHESTRATION, [
                /workflow/i,
                /orchestration/i,
                /coordination/i,
                /manage/i,
                /organize/i
            ]]
    ]);
    async discoverEntities(criteria) {
        this.logger.log('🔍 Discovering Claude agents from markdown files...');
        const entities = [];
        for (const basePath of criteria.paths) {
            try {
                const agentFiles = await this.findClaudeAgentFiles(basePath, criteria);
                for (const filePath of agentFiles) {
                    try {
                        const entity = await this.parseClaudeAgent(filePath);
                        if (entity) {
                            entities.push(entity);
                        }
                    }
                    catch (error) {
                        this.logger.warn(`Failed to parse Claude agent from ${filePath}:, error);
          }
        }
      } catch (error) {`, this.logger.error(`Failed to discover Claude agents in ${basePath}`, error));
                    }
                }
                this.logger.log(Discovered, $, { entities, : .length }, Claude, agents);
                return entities;
            }
            finally {
            }
        }
    }
    async findClaudeAgentFiles(basePath, criteria) {
        const patterns = criteria.includePatterns.length > 0
            ? criteria.includePatterns
            : ['**/*.md', '**/*.claude'];
        // Use Node.js optimized file finding - process patterns sequentially
        const allFilesSet = new Set();
        for (const pattern of patterns) {
            const files = await this.fileSystem.findFiles(pattern, basePath);
            files.forEach(file => allFilesSet.add(file));
        }
        const allFiles = Array.from(allFilesSet);
        // Filter for Claude agent files using parallel processing
        const claudeFiles = [];
        const checkPromises = allFiles.map(async (file) => {
            if (await this.isClaudeAgentFile(file)) {
                return file;
            }
            return null;
        });
        const results = await Promise.all(checkPromises);
        claudeFiles.push(...results.filter(file => file !== null));
        return claudeFiles;
    }
    async isClaudeAgentFile(filePath) {
        try {
            const content = await this.fileSystem.readFile(filePath, true);
            // Check for Claude agent indicators
            const indicators = [
                /# .+ Agent/i,
                /## Role/i,
                /## System Prompt/i,
                /## Capabilities/i,
                /You are a/i,
                /Your role is/i
            ];
            return indicators.some(pattern => pattern.test(content));
        }
        catch {
            return false;
        }
    }
    async parseClaudeAgent(filePath) {
        try {
            const content = await this.fileSystem.readFile(filePath, true);
            const definition = this.parseMarkdownContent(content, filePath);
            if (!definition) {
                return null;
            }
            return this.createEntityFromDefinition(definition);
        }
        catch (error) {
            `
      this.logger.error(Error parsing Claude agent from ${filePath}`;
            error;
            ;
            return null;
        }
    }
    parseMarkdownContent(content, filePath) {
        const lines = content.split('\n');
        let currentSection = '';
        let name = '';
        let role = '';
        let description = '';
        let systemPrompt = '';
        const capabilities = [];
        const examples = [];
        const constraints = [];
        // Extract name from filename or first heading
        name = this.extractNameFromPath(filePath);
        const firstHeading = lines.find(line => line.startsWith('# '));
        if (firstHeading) {
            name = firstHeading.replace('# ', '').replace(' Agent', '').trim();
        }
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            // Detect sections
            if (line.startsWith('## ')) {
                currentSection = line.replace('## ', '').toLowerCase();
                continue;
            }
            // Parse content based on section
            switch (currentSection) {
                case 'role':
                case 'description':
                    if (line && !line.startsWith('#')) {
                        if (currentSection === 'role') {
                            role += line + ' ';
                        }
                        else {
                            description += line + ' ';
                        }
                    }
                    break;
                case 'system prompt':
                case 'prompt':
                    if (line && !line.startsWith('#')) {
                        systemPrompt += line + '\n';
                    }
                    break;
                case 'capabilities':
                case 'skills':
                    if (line.startsWith('- ') || line.startsWith('* ')) {
                        capabilities.push(line.replace(/^[*-]\s*/, ''));
                    }
                    break;
                case 'examples':
                    if (line.startsWith('- ') || line.startsWith('* ')) {
                        examples.push(line.replace(/^[*-]\s*/, ''));
                    }
                    break;
                case 'constraints':
                case 'limitations':
                    if (line.startsWith('- ') || line.startsWith('* ')) {
                        constraints.push(line.replace(/^[*-]\s*/, ''));
                    }
                    break;
            }
        }
        // If no explicit sections, try to extract from content
        if (!role && !description && !systemPrompt) {
            const extracted = this.extractFromUnstructuredContent(content);
            role = extracted.role;
            description = extracted.description;
            systemPrompt = extracted.systemPrompt;
            capabilities.push(...extracted.capabilities);
        }
        if (!name || (!role && !description && !systemPrompt)) {
            return null;
        }
        return {
            name: name.trim(),
            role: role.trim(),
            description: description.trim() || role.trim(),
            systemPrompt: systemPrompt.trim(),
            capabilities,
            examples,
            constraints,
            filePath
        };
    }
    extractNameFromPath(filePath) {
        const basename = path.basename(filePath, path.extname(filePath));
        return basename
            .replace(/[-_]/g, ' ')
            .replace(/\b\w/g, l => l.toUpperCase())
            .replace(' Agent', '')
            .trim();
    }
    extractFromUnstructuredContent(content) {
        const lines = content.split('\n').map(l => l.trim()).filter(l => l);
        let role = '';
        let description = '';
        let systemPrompt = '';
        const capabilities = [];
        // Look for "You are" patterns
        const youArePattern = /You are (.*?)(?:\.|$)/i;
        const youAreMatch = content.match(youArePattern);
        if (youAreMatch) {
            role = youAreMatch[1];
        }
        // Look for role descriptions
        const rolePattern = /Your role is (.*?)(?:\.|$)/i;
        const roleMatch = content.match(rolePattern);
        if (roleMatch) {
            role = roleMatch[1];
        }
        // Use first paragraph as description if no role found
        if (!role && lines.length > 0) {
            description = lines[0];
        }
        // Extract capabilities from bullet points
        const bulletPoints = lines.filter(line => line.startsWith('- ') || line.startsWith('* '));
        capabilities.push(...bulletPoints.map(bp => bp.replace(/^[*-]\s*/, '')));
        // Use entire content as system prompt if it looks like one
        if (content.includes('You are') || content.includes('Your role')) {
            systemPrompt = content;
        }
        return { role, description, systemPrompt, capabilities };
    }
    createEntityFromDefinition(definition) {
        // Create identity
        const identity = new UnifiedEntity_1.EntityIdentity(definition.name, definition.name, definition.description || definition.role, '1.0.0', 'claude');
        // Determine archetype
        const archetype = this.determineArchetype(definition);
        // Extract capabilities
        const capabilities = this.extractCapabilities(definition);
        // Create metadata
        const metadata = new UnifiedEntity_1.EntityMetadata(UnifiedEntity_1.DiscoverySource.CLAUDE_MARKDOWN, new Date(), new Date(), definition.filePath, undefined, // No source code for markdown
        {
            role: definition.role,
            systemPrompt: definition.systemPrompt,
            examples: definition.examples,
            constraints: definition.constraints
        }, ['claude', 'agent', 'markdown']);
        return UnifiedEntity_1.UnifiedEntity.create(identity, archetype, capabilities, metadata);
    }
    determineArchetype(definition) {
        const content = $, { definition, role }, $, { definition, description }, $, { definition, systemPrompt };
        `.toLowerCase();
    
    // Check for specific archetypes
    if (content.includes('plan') || content.includes('strategy') || content.includes('organize')) {
      return EntityArchetype.PLANNING_AGENT;
    }
    
    if (content.includes('code') || content.includes('programming') || content.includes('development')) {
      return EntityArchetype.EXECUTION_AGENT;
    }
    
    if (content.includes('creative') || content.includes('content') || content.includes('writing')) {
      return EntityArchetype.CREATIVE_AGENT;
    }
    
    if (content.includes('analyze') || content.includes('data') || content.includes('research')) {
      return EntityArchetype.REASONING_AGENT;
    }
    
    if (content.includes('coordinate') || content.includes('manage') || content.includes('orchestrate')) {
      return EntityArchetype.COORDINATION_AGENT;
    }
    
    // Default to reasoning agent for Claude agents
    return EntityArchetype.REASONING_AGENT;
  }

  private extractCapabilities(definition: ClaudeAgentDefinition): CapabilitySet {
    const capabilities: Capability[] = [];
    const allText = ${definition.role} ${definition.description} ${definition.systemPrompt} ${definition.capabilities.join(' ')}`;
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
                confidence = Math.min(0.9, 0.3 + (matchCount * 0.2));
                // Determine capability level based on content depth
                let level = 'intermediate';
                if (definition.systemPrompt.length > 500) {
                    level = 'advanced';
                }
                else if (definition.systemPrompt.length > 200) {
                    level = 'intermediate';
                }
                else {
                    level = 'basic';
                }
                capabilities.push(new UnifiedEntity_1.Capability(capabilityType, level, confidence, {
                    extractedFrom: 'claude_markdown',
                    matchCount,
                    patterns: patterns.map(p => p.source)
                }));
            }
        }
        // Add natural language capability for all Claude agents
        capabilities.push(new UnifiedEntity_1.Capability(UnifiedEntity_1.CapabilityType.NATURAL_LANGUAGE, 'expert', 0.95, { extractedFrom: 'claude_default' }));
        // Add reasoning capability if system prompt is substantial
        if (definition.systemPrompt.length > 100) {
            capabilities.push(new UnifiedEntity_1.Capability(UnifiedEntity_1.CapabilityType.REASONING, 'advanced', 0.8, { extractedFrom: 'claude_system_prompt' }));
        }
        return new UnifiedEntity_1.CapabilitySet(capabilities);
    }
};
exports.ClaudeAgentAdapter = ClaudeAgentAdapter;
exports.ClaudeAgentAdapter = ClaudeAgentAdapter = ClaudeAgentAdapter_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [BunOptimizedFileSystem_1.BunOptimizedFileSystem])
], ClaudeAgentAdapter);
//# sourceMappingURL=ClaudeAgentAdapter.js.map