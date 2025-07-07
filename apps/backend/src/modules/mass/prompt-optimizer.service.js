"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var PromptOptimizerService_1, LlmInteractionService_1, EvaluationHarnessService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.EvaluationHarnessService = exports.LlmInteractionService = exports.PromptOptimizerService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../lib/prisma/prisma.service");
let PromptOptimizerService = PromptOptimizerService_1 = class PromptOptimizerService {
    prisma;
    llmService;
    evaluationHarness;
    logger = new common_1.Logger(PromptOptimizerService_1.name);
    constructor(prisma, llmService, evaluationHarness) {
        this.prisma = prisma;
        this.llmService = llmService;
        this.evaluationHarness = evaluationHarness;
    }
    async optimizeAgentPrompt(agentId, config) {
        this.logger.log(`Starting Stage 1 optimization for agent ${agentId}`);
        try {
            // Get the agent and its current prompt
            const agent = await this.prisma.agent.findUnique({
                where: { id: agentId },
                include: { promptVersions: true }
            });
            if (!agent) {
                throw new Error(`Agent ${agentId} not found`);
            }
            // Get validation dataset
            const dataset = await this.prisma.validationDataset.findUnique({
                where: { id: config.validationDatasetId }
            });
            if (!dataset) {
                throw new Error(`Validation dataset ${config.validationDatasetId} not found`);
            }
            // Get current best prompt
            const currentPrompt = this.getCurrentPrompt(agent);
            // Generate candidate prompts using MIPRO-inspired optimization
            const candidatePrompts = await this.generateCandidatePrompts(currentPrompt, config, dataset.items[0] // Use first item as example for prompt generation
            );
            // Evaluate all candidates
            const evaluationResults = await Promise.all(candidatePrompts.map(async (candidate, index) => {
                const metrics = await this.evaluationHarness.evaluatePrompt(agentId, candidate, dataset.items, config);
                return {
                    candidate,
                    metrics,
                    candidateIndex: index
                };
            }));
            // Select best performing candidate
            const bestCandidate = this.selectBestCandidate(evaluationResults);
            // Create new prompt version
            const newVersion = await this.createPromptVersion(agentId, bestCandidate.candidate, bestCandidate.metrics, 'block_level');
            this.logger.log(`Stage 1 optimization completed for agent ${agentId}. ` +
                `Best accuracy: ${bestCandidate.metrics.accuracy}`);
            return newVersion;
        }
        catch (error) {
            this.logger.error(`Stage 1 optimization failed for agent ${agentId}:`, error);
            throw error;
        }
    }
    getCurrentPrompt(agent) {
        // Get the latest prompt version or use system prompt as base
        const latestVersion = agent.promptVersions?.sort((a, b) => b.versionNumber - a.versionNumber)[0];
        if (latestVersion) {
            return {
                instruction: {
                    roleDefinition: latestVersion.instruction,
                    taskGuidance: '',
                    outputFormat: ''
                },
                exemplars: latestVersion.exemplars || []
            };
        }
        return {
            instruction: {
                roleDefinition: agent.systemPrompt || 'You are a helpful AI assistant.',
                taskGuidance: 'Complete the given task to the best of your ability.',
                outputFormat: 'Provide a clear and accurate response.'
            },
            exemplars: []
        };
    }
    async generateCandidatePrompts(basePrompt, config, exampleInput) {
        const candidates = [basePrompt]; // Include original
        // Generate instruction variations
        const instructionVariations = await this.generateInstructionVariations(basePrompt.instruction, config, exampleInput);
        for (const instruction of instructionVariations) {
            candidates.push({
                instruction,
                exemplars: basePrompt.exemplars
            });
        }
        // Generate exemplar variations if we have few-shot examples
        if (basePrompt.exemplars.length > 0) {
            const exemplarVariations = await this.generateExemplarVariations(basePrompt.exemplars, config);
            for (const exemplars of exemplarVariations) {
                candidates.push({
                    instruction: basePrompt.instruction,
                    exemplars
                });
            }
        }
        return candidates.slice(0, 10); // Limit to 10 candidates for efficiency
    }
    async generateInstructionVariations(baseInstruction, config, exampleInput) {
        const variations = [];
        // Use LLM to generate instruction variations
        const variationPrompt = `
Given this base instruction:
"${baseInstruction.roleDefinition}"

And this example input:
${JSON.stringify(exampleInput, null, 2)}

Generate 5 improved variations of the instruction that would help an AI agent better handle this type of task. Focus on:
1. Clarity and specificity
2. Better task guidance
3. Improved output formatting instructions

Return as JSON array of strings.
`;
        try {
            const response = await this.llmService.generateText(variationPrompt, config.llmConfig);
            const generatedVariations = JSON.parse(response);
            for (const variation of generatedVariations) {
                variations.push({
                    roleDefinition: variation,
                    taskGuidance: baseInstruction.taskGuidance,
                    outputFormat: baseInstruction.outputFormat
                });
            }
        }
        catch (error) {
            this.logger.warn('Failed to generate instruction variations, using manual variations');
            // Fallback manual variations
            variations.push({
                roleDefinition: `${baseInstruction.roleDefinition} Be concise and accurate.`,
                taskGuidance: baseInstruction.taskGuidance,
                outputFormat: baseInstruction.outputFormat
            }, {
                roleDefinition: `${baseInstruction.roleDefinition} Think step by step.`,
                taskGuidance: baseInstruction.taskGuidance,
                outputFormat: baseInstruction.outputFormat
            });
        }
        return variations;
    }
    async generateExemplarVariations(baseExemplars, config) {
        const variations = [];
        // Create variations by:
        // 1. Reducing number of exemplars
        // 2. Reordering exemplars
        // 3. Enhancing exemplar explanations
        if (baseExemplars.length > 1) {
            // Reduce to top half
            variations.push(baseExemplars.slice(0, Math.ceil(baseExemplars.length / 2)));
            // Reverse order
            variations.push([...baseExemplars].reverse());
        }
        // Enhanced exemplars with explanations
        const enhancedExemplars = baseExemplars.map(exemplar => ({
            ...exemplar,
            explanation: 'This example demonstrates the correct approach and format.'
        }));
        variations.push(enhancedExemplars);
        return variations;
    }
    selectBestCandidate(evaluationResults) {
        // Select based on primary metric (accuracy) with tie-breaking
        const sorted = evaluationResults.sort((a, b) => {
            const aScore = a.metrics.accuracy || 0;
            const bScore = b.metrics.accuracy || 0;
            if (Math.abs(aScore - bScore) < 0.01) {
                // Tie-break by latency (lower is better)
                return (a.metrics.latency || 1000) - (b.metrics.latency || 1000);
            }
            return bScore - aScore;
        });
        return sorted[0];
    }
    async createPromptVersion(agentId, prompt, metrics, massStage) {
        // Get next version number
        const latestVersion = await this.prisma.agentPromptVersion.findFirst({
            where: { agentId },
            orderBy: { versionNumber: 'desc' }
        });
        const nextVersion = (latestVersion?.versionNumber || 0) + 1;
        return this.prisma.agentPromptVersion.create({
            data: {
                agentId,
                versionNumber: nextVersion,
                instruction: prompt.instruction.roleDefinition,
                exemplars: prompt.exemplars,
                performanceMetrics: metrics,
                massStage
            }
        });
    }
};
exports.PromptOptimizerService = PromptOptimizerService;
exports.PromptOptimizerService = PromptOptimizerService = PromptOptimizerService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        LlmInteractionService,
        EvaluationHarnessService])
], PromptOptimizerService);
let LlmInteractionService = LlmInteractionService_1 = class LlmInteractionService {
    logger = new common_1.Logger(LlmInteractionService_1.name);
    async generateText(prompt, config) {
        // This would integrate with your existing LLM service
        // Placeholder implementation
        try {
            // Simulate LLM call
            await new Promise(resolve => setTimeout(resolve, 100));
            // Return mock response based on prompt content
            if (prompt.includes('Generate 5 improved variations')) {
                return JSON.stringify([
                    'You are an expert assistant. Provide detailed, accurate responses.',
                    'You are a helpful AI that thinks carefully before responding.',
                    'You are a precise assistant that provides step-by-step solutions.',
                    'You are an analytical AI that breaks down complex problems.',
                    'You are a thorough assistant that considers all aspects of a question.'
                ]);
            }
            return `Generated response for: ${prompt.substring(0, 50)}...`;
        }
        catch (error) {
            this.logger.error('LLM generation failed:', error);
            throw error;
        }
    }
    async executeAgent(agentId, input, prompt) {
        // This would execute an agent with given prompt and input
        // Placeholder implementation
        try {
            await new Promise(resolve => setTimeout(resolve, 200));
            return {
                success: true,
                output: `Agent ${agentId} response to: ${JSON.stringify(input)}`,
                confidence: Math.random() * 0.4 + 0.6, // 0.6 to 1.0
                processingTime: Math.random() * 500 + 100, // 100-600ms
                metadata: {
                    agentId,
                    timestamp: new Date(),
                    promptUsed: prompt ? 'custom' : 'default'
                }
            };
        }
        catch (error) {
            this.logger.error(`Agent execution failed for ${agentId}:`, error);
            return {
                success: false,
                error: error.message,
                agentId
            };
        }
    }
};
exports.LlmInteractionService = LlmInteractionService;
exports.LlmInteractionService = LlmInteractionService = LlmInteractionService_1 = __decorate([
    (0, common_1.Injectable)()
], LlmInteractionService);
let EvaluationHarnessService = EvaluationHarnessService_1 = class EvaluationHarnessService {
    llmService;
    logger = new common_1.Logger(EvaluationHarnessService_1.name);
    constructor(llmService) {
        this.llmService = llmService;
    }
    async evaluatePrompt(agentId, prompt, validationItems, config) {
        const results = [];
        const startTime = Date.now();
        for (const item of validationItems) {
            try {
                const result = await this.llmService.executeAgent(agentId, item.input, prompt);
                const score = this.calculateScore(result.output, item.expectedOutput);
                results.push({
                    score,
                    processingTime: result.metadata?.processingTime || 0,
                    success: result.success
                });
            }
            catch (error) {
                results.push({
                    score: 0,
                    processingTime: 1000,
                    success: false
                });
            }
        }
        const totalTime = Date.now() - startTime;
        const successfulResults = results.filter(r => r.success);
        return {
            accuracy: successfulResults.length > 0 ?
                successfulResults.reduce((sum, r) => sum + r.score, 0) / successfulResults.length : 0,
            latency: results.reduce((sum, r) => sum + r.processingTime, 0) / results.length,
            tokenUsage: results.length * 150, // Estimated tokens per request
            cost: results.length * 0.001, // Estimated cost per request
            f1Score: this.calculateF1Score(results),
            precision: successfulResults.length / results.length,
            recall: successfulResults.length > 0 ?
                successfulResults.filter(r => r.score > 0.5).length / successfulResults.length : 0
        };
    }
    async evaluateTopology(topologyId, validationItems, config) {
        // This would evaluate an entire topology/workflow
        // Placeholder implementation
        const results = [];
        const startTime = Date.now();
        for (const item of validationItems) {
            try {
                // Execute the topology workflow
                const result = await this.executeTopology(topologyId, item.input);
                const score = this.calculateScore(result.output, item.expectedOutput);
                results.push({
                    score,
                    processingTime: result.processingTime || 0,
                    success: result.success
                });
            }
            catch (error) {
                results.push({
                    score: 0,
                    processingTime: 2000,
                    success: false
                });
            }
        }
        const successfulResults = results.filter(r => r.success);
        return {
            accuracy: successfulResults.length > 0 ?
                successfulResults.reduce((sum, r) => sum + r.score, 0) / successfulResults.length : 0,
            latency: results.reduce((sum, r) => sum + r.processingTime, 0) / results.length,
            tokenUsage: results.length * 300, // Higher for topology
            cost: results.length * 0.003,
            f1Score: this.calculateF1Score(results),
            precision: successfulResults.length / results.length,
            recall: successfulResults.length > 0 ?
                successfulResults.filter(r => r.score > 0.5).length / successfulResults.length : 0
        };
    }
    async executeTopology(topologyId, input) {
        // Placeholder for topology execution
        await new Promise(resolve => setTimeout(resolve, 500));
        return {
            success: true,
            output: `Topology ${topologyId} result for: ${JSON.stringify(input)}`,
            processingTime: Math.random() * 1000 + 200,
            metadata: {
                topologyId,
                timestamp: new Date()
            }
        };
    }
    calculateScore(output, expected) {
        // Simple scoring logic - in production, this would be more sophisticated
        try {
            if (typeof output === 'string' && typeof expected === 'string') {
                // Text similarity scoring
                const outputLower = output.toLowerCase();
                const expectedLower = expected.toLowerCase();
                if (outputLower === expectedLower)
                    return 1.0;
                if (outputLower.includes(expectedLower) || expectedLower.includes(outputLower))
                    return 0.8;
                // Simple word overlap scoring
                const outputWords = outputLower.split(/\s+/);
                const expectedWords = expectedLower.split(/\s+/);
                const overlap = outputWords.filter(word => expectedWords.includes(word)).length;
                return Math.min(overlap / expectedWords.length, 1.0);
            }
            if (typeof output === 'number' && typeof expected === 'number') {
                // Numeric scoring with tolerance
                const diff = Math.abs(output - expected);
                const tolerance = Math.abs(expected) * 0.1; // 10% tolerance
                return Math.max(0, 1 - (diff / (tolerance + 1)));
            }
            // Default exact match
            return output === expected ? 1.0 : 0.0;
        }
        catch (error) {
            this.logger.warn('Error calculating score:', error);
            return 0.0;
        }
    }
    calculateF1Score(results) {
        const truePositives = results.filter(r => r.success && r.score > 0.5).length;
        const falsePositives = results.filter(r => r.success && r.score <= 0.5).length;
        const falseNegatives = results.filter(r => !r.success).length;
        const precision = truePositives / (truePositives + falsePositives) || 0;
        const recall = truePositives / (truePositives + falseNegatives) || 0;
        return precision + recall > 0 ? (2 * precision * recall) / (precision + recall) : 0;
    }
};
exports.EvaluationHarnessService = EvaluationHarnessService;
exports.EvaluationHarnessService = EvaluationHarnessService = EvaluationHarnessService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [LlmInteractionService])
], EvaluationHarnessService);
