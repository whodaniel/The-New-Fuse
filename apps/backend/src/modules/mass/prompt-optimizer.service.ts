import { Injectable, Logger, forwardRef, Inject } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  MassOptimizationConfig,
  ValidationDataset,
  PerformanceMetrics,
  PromptDefinition,
  AgentPromptVersion
} from '@the-new-fuse/types';

// Move LlmInteractionService ABOVE PromptOptimizerService to avoid TDZ issues
@Injectable()
export class LlmInteractionService {
  private readonly logger = new Logger(LlmInteractionService.name);

  async generateText(prompt: string, config: any): Promise<string> {
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
    } catch (error) {
      this.logger.error('LLM generation failed:', error);
      throw error;
    }
  }

  async executeAgent(agentId: string, input: any, prompt?: PromptDefinition): Promise<any> {
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
    } catch (error) {
      this.logger.error(`Agent execution failed for ${agentId}:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        agentId
      };
    }
  }
}

@Injectable()
export class PromptOptimizerService {
  private readonly logger = new Logger(PromptOptimizerService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject(forwardRef(() => LlmInteractionService))
    private readonly llmService: LlmInteractionService,
    private readonly evaluationHarness: EvaluationHarnessService
  ) {}

  async optimizeAgentPrompt(
    agentId: string,
    config: MassOptimizationConfig
  ): Promise<AgentPromptVersion> {
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
      const candidatePrompts = await this.generateCandidatePrompts(
        currentPrompt,
        config,
        dataset.items[0] // Use first item as example for prompt generation
      );

      // Evaluate all candidates
      const evaluationResults = await Promise.all(
        candidatePrompts.map(async (candidate, index) => {
          const metrics = await this.evaluationHarness.evaluatePrompt(
            agentId,
            candidate,
            dataset.items as any[],
            config
          );
          
          return {
            candidate,
            metrics,
            candidateIndex: index
          };
        })
      );

      // Select best performing candidate
      const bestCandidate = this.selectBestCandidate(evaluationResults);
      
      // Create new prompt version
      const newVersion = await this.createPromptVersion(
        agentId,
        bestCandidate.candidate,
        bestCandidate.metrics,
        'block_level'
      );

      this.logger.log(
        `Stage 1 optimization completed for agent ${agentId}. ` +
        `Best accuracy: ${bestCandidate.metrics.accuracy}`
      );

      return newVersion;
    } catch (error) {
      this.logger.error(`Stage 1 optimization failed for agent ${agentId}:`, error);
      throw error;
    }
  }

  private getCurrentPrompt(agent: any): PromptDefinition {
    // Get the latest prompt version or use system prompt as base
    const latestVersion = agent.promptVersions?.sort((a, b) => 
      b.versionNumber - a.versionNumber
    )[0];

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

  private async generateCandidatePrompts(
    basePrompt: PromptDefinition,
    config: MassOptimizationConfig,
    exampleInput: any
  ): Promise<PromptDefinition[]> {
    const candidates: PromptDefinition[] = [basePrompt]; // Include original

    // Generate instruction variations
    const instructionVariations = await this.generateInstructionVariations(
      basePrompt.instruction,
      config,
      exampleInput
    );

    for (const instruction of instructionVariations) {
      candidates.push({
        instruction,
        exemplars: basePrompt.exemplars
      });
    }

    // Generate exemplar variations if we have few-shot examples
    if (basePrompt.exemplars.length > 0) {
      const exemplarVariations = await this.generateExemplarVariations(
        basePrompt.exemplars,
        config
      );

      for (const exemplars of exemplarVariations) {
        candidates.push({
          instruction: basePrompt.instruction,
          exemplars
        });
      }
    }

    return candidates.slice(0, 10); // Limit to 10 candidates for efficiency
  }

  private async generateInstructionVariations(
    baseInstruction: any,
    config: MassOptimizationConfig,
    exampleInput: any
  ): Promise<any[]> {
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
    } catch (error) {
      this.logger.warn('Failed to generate instruction variations, using manual variations');
      
      // Fallback manual variations
      variations.push(
        {
          roleDefinition: `${baseInstruction.roleDefinition} Be concise and accurate.`,
          taskGuidance: baseInstruction.taskGuidance,
          outputFormat: baseInstruction.outputFormat
        },
        {
          roleDefinition: `${baseInstruction.roleDefinition} Think step by step.`,
          taskGuidance: baseInstruction.taskGuidance,
          outputFormat: baseInstruction.outputFormat
        }
      );
    }

    return variations;
  }

  private async generateExemplarVariations(
    baseExemplars: any[],
    config: MassOptimizationConfig
  ): Promise<any[][]> {
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

  private selectBestCandidate(evaluationResults: any[]): any {
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

  private async createPromptVersion(
    agentId: string,
    prompt: PromptDefinition,
    metrics: PerformanceMetrics,
    massStage: string
  ): Promise<AgentPromptVersion> {
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
        performanceMetrics: metrics as any,
        massStage
      }
    });
  }
}

@Injectable()
export class EvaluationHarnessService {
  private readonly logger = new Logger(EvaluationHarnessService.name);

  constructor(private readonly llmService: LlmInteractionService) {}

  async evaluatePrompt(
    agentId: string,
    prompt: PromptDefinition,
    validationItems: any[],
    config: MassOptimizationConfig
  ): Promise<PerformanceMetrics> {
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
      } catch (error) {
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

  async evaluateTopology(
    topologyId: string,
    validationItems: any[],
    config: MassOptimizationConfig
  ): Promise<PerformanceMetrics> {
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
      } catch (error) {
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

  private async executeTopology(topologyId: string, input: any): Promise<any> {
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

  private calculateScore(output: any, expected: any): number {
    // Simple scoring logic - in production, this would be more sophisticated
    try {
      if (typeof output === 'string' && typeof expected === 'string') {
        // Text similarity scoring
        const outputLower = output.toLowerCase();
        const expectedLower = expected.toLowerCase();
        
        if (outputLower === expectedLower) return 1.0;
        if (outputLower.includes(expectedLower) || expectedLower.includes(outputLower)) return 0.8;
        
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
    } catch (error) {
      this.logger.warn('Error calculating score:', error);
      return 0.0;
    }
  }

  private calculateF1Score(results: any[]): number {
    const truePositives = results.filter(r => r.success && r.score > 0.5).length;
    const falsePositives = results.filter(r => r.success && r.score <= 0.5).length;
    const falseNegatives = results.filter(r => !r.success).length;
    
    const precision = truePositives / (truePositives + falsePositives) || 0;
    const recall = truePositives / (truePositives + falseNegatives) || 0;
    
    return precision + recall > 0 ? (2 * precision * recall) / (precision + recall) : 0;
  }
}
