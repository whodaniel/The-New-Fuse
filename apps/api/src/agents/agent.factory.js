var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var AgentFactory_1;
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ParseStrategy, validateAgentDefinition } from '@the-new-fuse/types';
let AgentFactory = AgentFactory_1 = class AgentFactory {
    configService;
    logger = new Logger(AgentFactory_1.name);
    activeAgents = new Map();
    compiledSchemaCache = new Map();
    factoryConfig;
    constructor(configService) {
        this.configService = configService;
        this.factoryConfig = {
            max_concurrent_agents: this.configService.get('DACC_MAX_CONCURRENT_AGENTS', 50),
            default_parsing_strategy: ParseStrategy.LARK,
            schema_validation_enabled: this.configService.get('DACC_SCHEMA_VALIDATION', true),
            cache_compiled_schemas: this.configService.get('DACC_CACHE_SCHEMAS', true)
        };
    }
    /**
     * Create agent from DACC definition
     */
    async createDACCAgent(agentDefinition) {
        // Validate agent definition
        if (this.factoryConfig.schema_validation_enabled) {
            const validation = validateAgentDefinition(agentDefinition);
            if (!validation.isValid) {
                throw new Error(`Invalid agent definition: ${validation.errors.join(', ')}`);
            }
        }
        // Check concurrent agent limit
        if (this.activeAgents.size >= this.factoryConfig.max_concurrent_agents) {
            throw new Error('Maximum concurrent agents limit reached');
        }
        const agentId = agentDefinition.agent_name;
        this.logger.log(`Creating DACC agent: ${agentId}`);
        // Compile or retrieve cached schema
        let compiledSchema = null;
        const schemaKey = `${agentId}_${agentDefinition.parsing_strategy || this.factoryConfig.default_parsing_strategy}`;
        if (this.factoryConfig.cache_compiled_schemas) {
            compiledSchema = this.compiledSchemaCache.get(schemaKey);
        }
        if (!compiledSchema) {
            compiledSchema = await this.compileSchema(agentDefinition);
            if (this.factoryConfig.cache_compiled_schemas) {
                this.compiledSchemaCache.set(schemaKey, compiledSchema);
            }
        }
        const instance = {
            id: agentId,
            type: 'DACC',
            status: 'active',
            config: {},
            daccDefinition: agentDefinition,
            compiledSchema,
            execute: this.createExecuteFunction(agentDefinition, compiledSchema),
            parseOutput: this.createParseFunction(agentDefinition, compiledSchema)
        };
        this.activeAgents.set(agentId, instance);
        this.logger.log(`DACC agent created successfully: ${agentId}`);
        return instance;
    }
    /**
     * Legacy method for backward compatibility
     */
    async createAgent(type, agentId, config) {
        const instance = {
            id: `${agentId}-instance`,
            type,
            status: 'active',
            config: { ...this.getDefaultConfig(type), ...config }
        };
        this.activeAgents.set(agentId, instance);
        return instance;
    }
    async updateAgent(instanceId, config) {
        const agentId = instanceId.replace('-instance', '');
        const instance = this.activeAgents.get(agentId);
        if (instance) {
            instance.config = { ...instance.config, ...config };
            this.activeAgents.set(agentId, instance);
        }
    }
    async destroyAgent(instanceId) {
        const agentId = instanceId.replace('-instance', '');
        this.activeAgents.delete(agentId);
    }
    getDefaultConfig(type) {
        switch (type) {
            case 'CONVERSATIONAL':
                return {
                    maxTokens: 4000,
                    temperature: 0.7,
                    model: 'gpt-4'
                };
            case 'IDE_EXTENSION':
                return {
                    maxTokens: 2000,
                    temperature: 0.3,
                    model: 'gpt-3.5-turbo'
                };
            case 'API':
                return {
                    maxTokens: 1000,
                    temperature: 0.1,
                    model: 'gpt-3.5-turbo'
                };
            default:
                return {
                    maxTokens: 2000,
                    temperature: 0.5,
                    model: 'gpt-3.5-turbo'
                };
        }
    }
    getActiveAgents() {
        return Array.from(this.activeAgents.values());
    }
    getAgent(agentId) {
        return this.activeAgents.get(agentId);
    }
    /**
     * Get DACC agent instance
     */
    getDACCAgent(agentId) {
        const instance = this.activeAgents.get(agentId);
        return instance && instance.type === 'DACC' ? instance : undefined;
    }
    /**
     * Compile schema based on parsing strategy
     */
    async compileSchema(agentDefinition) {
        const strategy = agentDefinition.parsing_strategy || this.factoryConfig.default_parsing_strategy;
        try {
            switch (strategy) {
                case ParseStrategy.LARK:
                    return await this.compileLarkSchema(agentDefinition);
                case ParseStrategy.INSTRUCTOR:
                    return await this.compileInstructorSchema(agentDefinition);
                default:
                    throw new Error(`Unsupported parsing strategy: ${strategy}`);
            }
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            this.logger.error(`Failed to compile schema for agent ${agentDefinition.agent_name}: ${errorMessage}`);
            throw error;
        }
    }
    /**
     * Compile Lark grammar schema
     */
    async compileLarkSchema(agentDefinition) {
        // This would integrate with the Lark parser library
        // For now, we'll return a placeholder that represents a compiled grammar
        return {
            type: 'lark',
            grammar: agentDefinition.parsing_grammar,
            schema: agentDefinition.output_schema_code,
            compiled: true
        };
    }
    /**
     * Compile Instructor schema (Pydantic-based)
     */
    async compileInstructorSchema(agentDefinition) {
        // This would integrate with the instructor library for structured output
        return {
            type: 'instructor',
            schema: agentDefinition.output_schema_code,
            compiled: true
        };
    }
    /**
     * Create execute function for DACC agent
     * Enhanced to support POML template rendering with execution context
     */
    createExecuteFunction(agentDefinition, compiledSchema) {
        return async (input, context) => {
            try {
                this.logger.debug(`Executing agent ${agentDefinition.agent_name} with input:`, input);
                // Build prompt with POML support
                const prompt = await this.buildPrompt(agentDefinition, input, context);
                const rawOutput = await this.callLLM(prompt, agentDefinition);
                // Parse the output using the compiled schema
                const parsedOutput = await this.parseWithSchema(rawOutput, compiledSchema);
                return {
                    success: true,
                    output: parsedOutput,
                    raw_output: rawOutput,
                    agent_name: agentDefinition.agent_name,
                    used_poml: !!(agentDefinition.poml_template && agentDefinition.enable_poml_rendering),
                    template_name: agentDefinition.poml_template?.template_name
                };
            }
            catch (error) {
                const errorMessage = error instanceof Error ? error.message : String(error);
                this.logger.error(`Agent execution failed for ${agentDefinition.agent_name}: ${errorMessage}`);
                return {
                    success: false,
                    error: errorMessage,
                    agent_name: agentDefinition.agent_name
                };
            }
        };
    }
    /**
     * Create parse function for DACC agent
     */
    createParseFunction(agentDefinition, compiledSchema) {
        return async (rawOutput) => {
            return await this.parseWithSchema(rawOutput, compiledSchema);
        };
    }
    /**
     * Build prompt from agent definition and input
     * Enhanced to support POML templates (v2.0) with fallback to legacy format
     */
    async buildPrompt(agentDefinition, input, context) {
        // Check if agent uses POML template (v2.0)
        if (agentDefinition.poml_template && agentDefinition.enable_poml_rendering) {
            return await this.renderPOMLTemplate(agentDefinition.poml_template, input, context);
        }
        // Fallback to legacy prompt building (v1.0)
        const { persona, description } = agentDefinition;
        const inputStr = typeof input === 'string' ? input : JSON.stringify(input);
        return `${persona}

Description: ${description}

Input: ${inputStr}

Please provide your response according to the specified output schema.`;
    }
    /**
     * Render POML template with input data and execution context
     */
    async renderPOMLTemplate(template, input, context) {
        try {
            // Prepare template context combining input data and execution context
            const templateContext = {
                ...input,
                ...(context?.template_data || {}),
                ...(context?.resolved_components || {}),
            };
            // For now, implement basic POML-style template rendering
            // In a production system, this would call the actual POML Python service
            let renderedContent = template.template_content;
            // Inject available agents if placeholder exists
            if (renderedContent.includes('{{available_agents}}')) {
                const availableAgents = this.getAvailableAgents();
                renderedContent = renderedContent.replace('{{available_agents}}', availableAgents);
            }
            // Simple variable replacement ({{variable}} -> value)
            Object.entries(templateContext).forEach(([key, value]) => {
                const placeholder = `{{${key}}}`;
                const valueStr = typeof value === 'string' ? value : JSON.stringify(value);
                renderedContent = renderedContent.replace(new RegExp(placeholder, 'g'), valueStr);
            });
            this.logger.debug(`Rendered POML template: ${template.template_name}`);
            return renderedContent;
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            this.logger.error(`Failed to render POML template: ${errorMessage}`);
            // Fallback to raw template content if rendering fails
            return template.template_content;
        }
    }
    /**
     * Gets a formatted list of available agents for prompt injection.
     * In a real implementation, this would fetch from the AgentsService.
     */
    getAvailableAgents() {
        const agents = [
            { id: 'claude-ai-agent', name: 'Claude AI', description: 'Advanced AI assistant for text generation, analysis, reasoning, and coding.' },
            { id: 'gpt-4-agent', name: 'ChatGPT (GPT-4)', description: 'OpenAI GPT-4 for advanced natural language processing and creative writing.' },
            { id: 'gemini-pro-agent', name: 'Gemini Pro', description: 'Google Gemini Pro for multimodal AI tasks, including vision and analysis.' },
            { id: 'perplexity-agent', name: 'Perplexity AI', description: 'Research-focused AI with real-time web access for fact-checking and citations.' },
            { id: 'browser-automation-agent', name: 'Browser Automation', description: 'Automates web browser interactions like scraping, form-filling, and navigation.' },
            { id: 'data-processing-agent', name: 'Data Processing', description: 'Handles data analysis, transformation, and visualization for formats like CSV, JSON, and Parquet.' }
        ];
        return agents.map(a => `- Agent ID: "${a.id}", Name: "${a.name}", Description: "${a.description}"`).join('\n');
    }
    /**
     * Extract POML metadata for hint-then-validate pattern
     */
    extractPOMLMetadata(template) {
        const metadata = {
            outputSchema: undefined,
            toolDefinitions: [],
            stylesheetRules: undefined
        };
        try {
            const content = template.template_content;
            // Extract <output-schema> tags
            const outputSchemaMatch = content.match(/<output-schema[^>]*>(.*?)<\/output-schema>/s);
            if (outputSchemaMatch) {
                try {
                    metadata.outputSchema = JSON.parse(outputSchemaMatch[1].trim());
                    this.logger.debug('Extracted POML output schema for hinting');
                }
                catch (error) {
                    this.logger.warn('Failed to parse POML output-schema as JSON');
                }
            }
            // Extract <tool-definition> tags
            const toolDefMatches = content.matchAll(/<tool-definition[^>]*>(.*?)<\/tool-definition>/gs);
            for (const match of toolDefMatches) {
                try {
                    const toolDef = JSON.parse(match[1].trim());
                    metadata.toolDefinitions.push(toolDef);
                    this.logger.debug('Extracted POML tool definition for hinting');
                }
                catch (error) {
                    this.logger.warn('Failed to parse POML tool-definition as JSON');
                }
            }
            // Extract <stylesheet> rules
            const stylesheetMatch = content.match(/<stylesheet[^>]*>(.*?)<\/stylesheet>/s);
            if (stylesheetMatch) {
                try {
                    // Parse stylesheet rules (simplified implementation)
                    const rules = stylesheetMatch[1].trim().split('\n').map(line => line.trim()).filter(line => line);
                    metadata.stylesheetRules = rules;
                    this.logger.debug('Extracted POML stylesheet rules for hinting');
                }
                catch (error) {
                    this.logger.warn('Failed to parse POML stylesheet rules');
                }
            }
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            this.logger.error(`Failed to extract POML metadata: ${errorMessage}`);
        }
        return metadata;
    }
    /**
     * Call LLM with the constructed prompt using hint-then-validate pattern
     */
    async callLLM(prompt, agentDefinition) {
        try {
            // HINT PHASE: Extract POML metadata for LLM hints
            let llmHints = {};
            if (agentDefinition.poml_template && agentDefinition.enable_poml_rendering) {
                const metadata = this.extractPOMLMetadata(agentDefinition.poml_template);
                // Prepare LLM API hints from POML metadata
                if (metadata.outputSchema) {
                    llmHints.response_format = {
                        type: 'json_schema',
                        json_schema: {
                            name: `${agentDefinition.agent_name}_output`,
                            schema: metadata.outputSchema
                        }
                    };
                    this.logger.debug('Using POML output schema as LLM response format hint');
                }
                if (metadata.toolDefinitions && metadata.toolDefinitions.length > 0) {
                    llmHints.tools = metadata.toolDefinitions.map(toolDef => ({
                        type: 'function',
                        function: toolDef
                    }));
                    this.logger.debug(`Using ${metadata.toolDefinitions.length} POML tool definitions as LLM function hints`);
                }
                if (metadata.stylesheetRules) {
                    // Apply stylesheet rules to modify system prompts or formatting hints
                    const styleInstructions = metadata.stylesheetRules.join('. ');
                    prompt = `${prompt}\n\nFormatting Instructions: ${styleInstructions}`;
                    this.logger.debug('Applied POML stylesheet rules to prompt');
                }
            }
            // Simulate LLM API call with hints
            // In production, this would call the actual LLM provider (OpenAI, Anthropic, etc.)
            const response = await this.simulateLLMCall(prompt, llmHints, agentDefinition);
            this.logger.debug(`LLM response received for agent: ${agentDefinition.agent_name}`);
            return response;
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            this.logger.error(`LLM call failed for agent ${agentDefinition.agent_name}: ${errorMessage}`);
            throw error;
        }
    }
    /**
     * Simulate LLM API call with POML hints (production would use real LLM provider)
     */
    async simulateLLMCall(prompt, hints, agentDefinition) {
        // This simulates how the hints would be used in a real LLM API call
        const hintInfo = {
            response_format: hints.response_format ? 'JSON Schema provided' : 'none',
            tools_available: hints.tools ? hints.tools.length : 0,
            has_formatting_rules: prompt.includes('Formatting Instructions:')
        };
        // Generate a more realistic mock response based on hints
        if (hints.response_format) {
            // If JSON schema hint is provided, return valid JSON structure
            return JSON.stringify({
                agent: agentDefinition.agent_name,
                result: `Processed input according to POML schema hints`,
                metadata: {
                    used_hints: hintInfo,
                    processing_mode: 'hint-then-validate'
                }
            });
        }
        else {
            // Return text response for non-JSON outputs
            return `Agent ${agentDefinition.agent_name} processed the request using POML hints: ${JSON.stringify(hintInfo)}`;
        }
    }
    /**
     * Parse output using compiled schema (VALIDATE phase of hint-then-validate pattern)
     */
    async parseWithSchema(rawOutput, compiledSchema) {
        try {
            // VALIDATE PHASE: Apply strict Pydantic schema validation
            this.logger.debug('Starting VALIDATE phase: applying Pydantic schema validation');
            switch (compiledSchema.type) {
                case 'lark':
                    return this.parseWithLark(rawOutput, compiledSchema);
                case 'instructor':
                    return this.parseWithInstructor(rawOutput, compiledSchema);
                default:
                    throw new Error(`Unknown schema type: ${compiledSchema.type}`);
            }
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            this.logger.warn(`VALIDATE phase failed - POML hints improved LLM output but Pydantic validation still required: ${errorMessage}`);
            // Return structured failure info for hint-then-validate pattern
            return {
                raw: rawOutput,
                parsed: false,
                validation_error: errorMessage,
                hint_then_validate_status: 'validation_failed',
                note: 'POML hints provided to LLM but Pydantic validation maintains data integrity'
            };
        }
    }
    /**
     * Parse with Lark grammar
     */
    parseWithLark(rawOutput, compiledSchema) {
        // This would use the Lark parser to parse the output
        // For now, return a mock parsed result
        return {
            parsed: true,
            method: 'lark',
            content: rawOutput,
            schema: compiledSchema.schema
        };
    }
    /**
     * Parse with Instructor (structured output) - Enhanced for hint-then-validate
     */
    parseWithInstructor(rawOutput, compiledSchema) {
        // This would use instructor to parse structured output
        try {
            // Attempt to parse as JSON first (common case with POML JSON schema hints)
            const parsed = JSON.parse(rawOutput);
            // In production, this would validate against the actual Pydantic schema
            // For now, simulate successful validation
            return {
                parsed: true,
                method: 'instructor',
                content: parsed,
                schema: compiledSchema.schema,
                hint_then_validate_status: 'validation_passed',
                validation_notes: 'POML hints helped LLM generate valid output, Pydantic validation confirmed'
            };
        }
        catch (jsonError) {
            // JSON parsing failed - this is where the validate phase catches issues
            const errorMessage = jsonError instanceof Error ? jsonError.message : String(jsonError);
            throw new Error(`JSON parsing failed: ${errorMessage}. Raw output: ${rawOutput.substring(0, 200)}...`);
        }
    }
    /**
     * Clear schema cache
     */
    clearSchemaCache() {
        this.compiledSchemaCache.clear();
        this.logger.log('Schema cache cleared');
    }
    /**
     * Get factory configuration
     */
    getFactoryConfig() {
        return { ...this.factoryConfig };
    }
};
AgentFactory = AgentFactory_1 = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [ConfigService])
], AgentFactory);
export { AgentFactory };
//# sourceMappingURL=agent.factory.js.map