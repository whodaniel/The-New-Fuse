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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ToolUseBlock = exports.CustomBlock = exports.DebateBlock = exports.ReflectBlock = exports.AggregateBlock = exports.AgentExecutorService = void 0;
const common_1 = require("@nestjs/common");
let AgentExecutorService = class AgentExecutorService {
    async execute(agentId, input, prompt) {
        // This would integrate with your existing agent execution logic
        // For now, this is a placeholder that would call your LLM service
        try {
            // Simulated agent execution - replace with actual implementation
            return {
                success: true,
                output: `Agent ${agentId} processed: ${JSON.stringify(input)}`,
                metadata: {
                    agentId,
                    timestamp: new Date(),
                    processingTime: Math.random() * 1000
                }
            };
        }
        catch (error) {
            return {
                success: false,
                error: error.message,
                agentId
            };
        }
    }
};
exports.AgentExecutorService = AgentExecutorService;
exports.AgentExecutorService = AgentExecutorService = __decorate([
    (0, common_1.Injectable)()
], AgentExecutorService);
let AggregateBlock = class AggregateBlock {
    agentExecutor;
    type = 'aggregate';
    constructor(agentExecutor) {
        this.agentExecutor = agentExecutor;
    }
    async execute(input, config) {
        const { agentIds, aggregationStrategy, parallelExecution } = config.parameters;
        try {
            let results;
            if (parallelExecution) {
                // Execute agents in parallel
                results = await Promise.all(agentIds.map(agentId => this.agentExecutor.execute(agentId, input)));
            }
            else {
                // Execute agents sequentially
                results = [];
                for (const agentId of agentIds) {
                    const result = await this.agentExecutor.execute(agentId, input);
                    results.push(result);
                }
            }
            // Apply aggregation strategy
            return this.applyAggregation(results, aggregationStrategy);
        }
        catch (error) {
            throw new Error(`Aggregate block execution failed: ${error.message}`);
        }
    }
    applyAggregation(results, strategy) {
        const successfulResults = results.filter(r => r.success);
        if (successfulResults.length === 0) {
            throw new Error('No successful results to aggregate');
        }
        switch (strategy) {
            case 'majority_vote':
                return this.majorityVote(successfulResults);
            case 'average':
                return this.average(successfulResults);
            case 'weighted_average':
                return this.weightedAverage(successfulResults);
            case 'max_confidence':
                return this.maxConfidence(successfulResults);
            default:
                return successfulResults[0]; // Fallback to first result
        }
    }
    majorityVote(results) {
        const votes = {};
        results.forEach(result => {
            const output = JSON.stringify(result.output);
            votes[output] = (votes[output] || 0) + 1;
        });
        const winner = Object.keys(votes).reduce((a, b) => votes[a] > votes[b] ? a : b);
        return {
            output: JSON.parse(winner),
            aggregationMethod: 'majority_vote',
            voteCount: votes[winner],
            totalVotes: results.length
        };
    }
    average(results) {
        // Simple averaging for numeric results
        if (results.every(r => typeof r.output === 'number')) {
            const sum = results.reduce((acc, r) => acc + r.output, 0);
            return {
                output: sum / results.length,
                aggregationMethod: 'average',
                contributingResults: results.length
            };
        }
        // For non-numeric, return first result with metadata
        return {
            output: results[0].output,
            aggregationMethod: 'average',
            note: 'Non-numeric results, returned first result',
            contributingResults: results.length
        };
    }
    weightedAverage(results) {
        // Use processing time as inverse weight (faster = more weight)
        const weights = results.map(r => 1 / (r.metadata?.processingTime || 1));
        const totalWeight = weights.reduce((sum, w) => sum + w, 0);
        if (results.every(r => typeof r.output === 'number')) {
            const weightedSum = results.reduce((acc, r, i) => acc + (r.output * weights[i]), 0);
            return {
                output: weightedSum / totalWeight,
                aggregationMethod: 'weighted_average',
                weights: weights
            };
        }
        // For non-numeric, return highest weighted result
        const maxWeightIndex = weights.indexOf(Math.max(...weights));
        return {
            output: results[maxWeightIndex].output,
            aggregationMethod: 'weighted_average',
            selectedWeight: weights[maxWeightIndex]
        };
    }
    maxConfidence(results) {
        // If results have confidence scores, use highest confidence
        const withConfidence = results.filter(r => r.confidence !== undefined);
        if (withConfidence.length > 0) {
            const maxConfidenceResult = withConfidence.reduce((max, current) => current.confidence > max.confidence ? current : max);
            return {
                ...maxConfidenceResult,
                aggregationMethod: 'max_confidence'
            };
        }
        // Fallback to first result
        return {
            ...results[0],
            aggregationMethod: 'max_confidence',
            note: 'No confidence scores available, used first result'
        };
    }
};
exports.AggregateBlock = AggregateBlock;
exports.AggregateBlock = AggregateBlock = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [AgentExecutorService])
], AggregateBlock);
let ReflectBlock = class ReflectBlock {
    agentExecutor;
    type = 'reflect';
    constructor(agentExecutor) {
        this.agentExecutor = agentExecutor;
    }
    async execute(input, config) {
        const { predictorAgentId, reflectorAgentId, maxRounds, stopCondition } = config.parameters;
        try {
            let currentPrediction = await this.agentExecutor.execute(predictorAgentId, input);
            let iterationHistory = [currentPrediction];
            for (let round = 0; round < maxRounds; round++) {
                const reflectionInput = {
                    ...input,
                    previousPrediction: currentPrediction.output,
                    iterationNumber: round + 1,
                    history: iterationHistory
                };
                const reflection = await this.agentExecutor.execute(reflectorAgentId, reflectionInput);
                // Check if reflection suggests improvement is needed
                if (this.shouldStopReflection(reflection, stopCondition)) {
                    break;
                }
                if (reflection.output?.shouldRefine) {
                    const refinedInput = {
                        ...input,
                        feedback: reflection.output.feedback,
                        previousAttempt: currentPrediction.output,
                        iterationNumber: round + 1
                    };
                    currentPrediction = await this.agentExecutor.execute(predictorAgentId, refinedInput);
                    iterationHistory.push(currentPrediction);
                }
                else {
                    break;
                }
            }
            return {
                finalPrediction: currentPrediction,
                iterationHistory,
                totalIterations: iterationHistory.length,
                executionMethod: 'reflect'
            };
        }
        catch (error) {
            throw new Error(`Reflect block execution failed: ${error.message}`);
        }
    }
    shouldStopReflection(reflection, stopCondition) {
        if (!stopCondition) {
            return !reflection.output?.shouldRefine;
        }
        // Custom stop condition logic could be implemented here
        return reflection.output?.confidence > 0.9 || !reflection.output?.shouldRefine;
    }
};
exports.ReflectBlock = ReflectBlock;
exports.ReflectBlock = ReflectBlock = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [AgentExecutorService])
], ReflectBlock);
let DebateBlock = class DebateBlock {
    agentExecutor;
    type = 'debate';
    constructor(agentExecutor) {
        this.agentExecutor = agentExecutor;
    }
    async execute(input, config) {
        const { debaterAgentIds, debateRounds, moderatorAgentId, votingStrategy } = config.parameters;
        try {
            // Initial positions from each debater
            let debaterPositions = await Promise.all(debaterAgentIds.map(async (agentId, index) => ({
                agentId,
                position: await this.agentExecutor.execute(agentId, {
                    ...input,
                    role: `debater_${index + 1}`,
                    instruction: 'Provide your initial position on this topic'
                })
            })));
            let debateHistory = [{ round: 0, positions: [...debaterPositions] }];
            // Conduct debate rounds
            for (let round = 1; round <= debateRounds; round++) {
                const updatedPositions = await Promise.all(debaterPositions.map(async ({ agentId }, index) => {
                    const otherPositions = debaterPositions.filter((_, i) => i !== index);
                    const debateInput = {
                        ...input,
                        round,
                        yourPreviousPosition: debaterPositions[index].position.output,
                        opponentPositions: otherPositions.map(p => p.position.output),
                        debateHistory: debateHistory.slice(0, -1) // Exclude current round
                    };
                    return {
                        agentId,
                        position: await this.agentExecutor.execute(agentId, debateInput)
                    };
                }));
                debaterPositions = updatedPositions;
                debateHistory.push({ round, positions: [...debaterPositions] });
            }
            // Apply voting strategy to determine final result
            const finalResult = await this.applyVotingStrategy(debaterPositions, votingStrategy, moderatorAgentId, input);
            return {
                finalResult,
                debateHistory,
                totalRounds: debateRounds,
                executionMethod: 'debate'
            };
        }
        catch (error) {
            throw new Error(`Debate block execution failed: ${error.message}`);
        }
    }
    async applyVotingStrategy(debaterPositions, strategy, moderatorAgentId, originalInput) {
        switch (strategy) {
            case 'majority':
                return this.majorityVoting(debaterPositions);
            case 'weighted':
                return this.weightedVoting(debaterPositions);
            case 'consensus':
                return await this.consensusVoting(debaterPositions, moderatorAgentId, originalInput);
            default:
                return debaterPositions[0].position; // Fallback
        }
    }
    majorityVoting(debaterPositions) {
        const votes = {};
        debaterPositions.forEach(({ position }) => {
            const output = JSON.stringify(position.output);
            votes[output] = (votes[output] || 0) + 1;
        });
        const winner = Object.keys(votes).reduce((a, b) => votes[a] > votes[b] ? a : b);
        return {
            output: JSON.parse(winner),
            votingMethod: 'majority',
            voteDistribution: votes
        };
    }
    weightedVoting(debaterPositions) {
        // Weight by confidence or processing speed
        const weightedPositions = debaterPositions.map(({ position }) => ({
            position,
            weight: position.confidence || (1 / (position.metadata?.processingTime || 1))
        }));
        const totalWeight = weightedPositions.reduce((sum, wp) => sum + wp.weight, 0);
        const strongestPosition = weightedPositions.reduce((max, current) => current.weight > max.weight ? current : max);
        return {
            output: strongestPosition.position.output,
            votingMethod: 'weighted',
            winningWeight: strongestPosition.weight,
            totalWeight
        };
    }
    async consensusVoting(debaterPositions, moderatorAgentId, originalInput) {
        if (!moderatorAgentId) {
            // Without moderator, use majority voting as fallback
            return this.majorityVoting(debaterPositions);
        }
        // Moderator synthesizes the debate positions
        const moderatorInput = {
            ...originalInput,
            debatePositions: debaterPositions.map(dp => dp.position.output),
            instruction: 'Synthesize the debate positions into a consensus view'
        };
        const consensus = await this.agentExecutor.execute(moderatorAgentId, moderatorInput);
        return {
            output: consensus.output,
            votingMethod: 'consensus',
            moderatedBy: moderatorAgentId,
            inputPositions: debaterPositions.length
        };
    }
};
exports.DebateBlock = DebateBlock;
exports.DebateBlock = DebateBlock = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [AgentExecutorService])
], DebateBlock);
let CustomBlock = class CustomBlock {
    agentExecutor;
    type = 'custom';
    constructor(agentExecutor) {
        this.agentExecutor = agentExecutor;
    }
    async execute(input, config) {
        const { agentId, customLogic, inputSchema, outputSchema } = config.parameters;
        try {
            // Validate input against schema if provided
            if (inputSchema && !this.validateSchema(input, inputSchema)) {
                throw new Error('Input does not match required schema');
            }
            // Execute custom logic
            const customInput = {
                ...input,
                customLogic,
                executionType: 'custom'
            };
            const result = await this.agentExecutor.execute(agentId, customInput);
            // Validate output against schema if provided
            if (outputSchema && !this.validateSchema(result.output, outputSchema)) {
                throw new Error('Output does not match required schema');
            }
            return {
                ...result,
                executionMethod: 'custom',
                customLogicApplied: true
            };
        }
        catch (error) {
            throw new Error(`Custom block execution failed: ${error.message}`);
        }
    }
    validateSchema(data, schema) {
        // Simple schema validation - in production, use a proper schema validator
        if (!schema)
            return true;
        try {
            // Basic type checking
            if (schema.type && typeof data !== schema.type) {
                return false;
            }
            // Required fields check
            if (schema.required && Array.isArray(schema.required)) {
                for (const field of schema.required) {
                    if (!(field in data)) {
                        return false;
                    }
                }
            }
            return true;
        }
        catch {
            return false;
        }
    }
};
exports.CustomBlock = CustomBlock;
exports.CustomBlock = CustomBlock = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [AgentExecutorService])
], CustomBlock);
let ToolUseBlock = class ToolUseBlock {
    agentExecutor;
    type = 'tool-use';
    constructor(agentExecutor) {
        this.agentExecutor = agentExecutor;
    }
    async execute(input, config) {
        const { agentId, toolName, toolConfig, inputMapping, outputParsing } = config.parameters;
        try {
            // Map input to tool format if mapping provided
            const toolInput = inputMapping ? this.mapInput(input, inputMapping) : input;
            // Execute tool
            const toolResult = await this.executeTool(toolName, toolInput, toolConfig);
            // Let agent process tool result
            const agentInput = {
                ...input,
                toolResult,
                toolName,
                instruction: `Process the result from ${toolName} tool`
            };
            const agentResult = await this.agentExecutor.execute(agentId, agentInput);
            // Parse output if parsing logic provided
            const finalOutput = outputParsing ?
                this.parseOutput(agentResult.output, outputParsing) :
                agentResult.output;
            return {
                output: finalOutput,
                toolUsed: toolName,
                toolResult,
                agentProcessing: agentResult,
                executionMethod: 'tool-use'
            };
        }
        catch (error) {
            throw new Error(`Tool-use block execution failed: ${error.message}`);
        }
    }
    mapInput(input, mapping) {
        const mapped = {};
        for (const [toolField, inputField] of Object.entries(mapping)) {
            mapped[toolField] = input[inputField];
        }
        return mapped;
    }
    async executeTool(toolName, input, config) {
        // This would integrate with your existing tool system
        // Placeholder implementation
        switch (toolName) {
            case 'web_search':
                return this.executeWebSearch(input, config);
            case 'code_executor':
                return this.executeCode(input, config);
            case 'file_manager':
                return this.manageFile(input, config);
            default:
                return { success: false, error: `Unknown tool: ${toolName}` };
        }
    }
    async executeWebSearch(input, config) {
        // Placeholder for web search implementation
        return {
            success: true,
            results: [`Search result for: ${input.query}`],
            source: 'web_search',
            timestamp: new Date()
        };
    }
    async executeCode(input, config) {
        // Placeholder for code execution implementation
        return {
            success: true,
            output: `Code executed: ${input.code}`,
            language: input.language || 'javascript',
            timestamp: new Date()
        };
    }
    async manageFile(input, config) {
        // Placeholder for file management implementation
        return {
            success: true,
            operation: input.operation,
            file: input.filename,
            result: `File ${input.operation} completed`,
            timestamp: new Date()
        };
    }
    parseOutput(output, parsingLogic) {
        try {
            // Simple parsing logic - in production, this could be more sophisticated
            if (parsingLogic === 'extract_json') {
                const jsonMatch = output.match(/\{.*\}/);
                return jsonMatch ? JSON.parse(jsonMatch[0]) : output;
            }
            if (parsingLogic === 'extract_number') {
                const numberMatch = output.match(/\d+(\.\d+)?/);
                return numberMatch ? parseFloat(numberMatch[0]) : output;
            }
            return output;
        }
        catch {
            return output; // Return original if parsing fails
        }
    }
};
exports.ToolUseBlock = ToolUseBlock;
exports.ToolUseBlock = ToolUseBlock = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [AgentExecutorService])
], ToolUseBlock);
