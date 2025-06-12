import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../lib/prisma/prisma.service.js';
import { 
  MassOptimizationConfig, 
  WorkflowTopology, 
  PerformanceMetrics 
} from '@the-new-fuse/types';
import { EvaluationHarnessService } from './prompt-optimizer.service.js';

@Injectable()
export class WorkflowPromptOptimizerService {
  private readonly logger = new Logger(WorkflowPromptOptimizerService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly evaluationHarness: EvaluationHarnessService
  ) {}

  async optimizeWorkflowPrompts(
    topologyId: string,
    config: MassOptimizationConfig
  ): Promise<WorkflowTopology> {
    this.logger.log(`Starting Stage 3 workflow-level prompt optimization for topology ${topologyId}`);

    try {
      // Get the topology and its current configuration
      const topology = await this.getTopology(topologyId, config.userId);
      
      // Get validation dataset
      const dataset = await this.getValidationDataset(config.validationDatasetId);
      
      // Get baseline performance with current prompts
      const baselineMetrics = await this.evaluateTopology(topology, dataset, config);
      this.logger.log(`Baseline topology performance: ${baselineMetrics.accuracy}`);

      // Optimize prompts within the workflow context
      const optimizedTopology = await this.optimizePromptsInContext(topology, dataset, config);
      
      // Evaluate optimized workflow
      const optimizedMetrics = await this.evaluateTopology(optimizedTopology, dataset, config);
      
      const improvement = this.calculateImprovement(baselineMetrics, optimizedMetrics);
      this.logger.log(`Stage 3 optimization improvement: ${improvement}%`);

      // Save the optimized workflow
      const savedTopology = await this.saveOptimizedWorkflow(
        optimizedTopology, 
        optimizedMetrics, 
        baselineMetrics,
        config.userId
      );

      this.logger.log(`Stage 3 optimization completed for topology ${topologyId}`);
      return savedTopology;
    } catch (error) {
      this.logger.error(`Stage 3 optimization failed for topology ${topologyId}:`, error);
      throw error;
    }
  }

  private async getTopology(topologyId: string, userId: string): Promise<WorkflowTopology> {
    const topology = await this.prisma.workflowTopology.findFirst({
      where: {
        id: topologyId,
        userId
      },
      include: {
        agents: {
          include: {
            promptVersions: {
              orderBy: { versionNumber: 'desc' },
              take: 1
            }
          }
        }
      }
    });

    if (!topology) {
      throw new Error(`Topology ${topologyId} not found`);
    }

    return {
      id: topology.id,
      name: topology.name,
      description: topology.description || '',
      nodes: topology.nodes as any,
      edges: topology.edges as any,
      performanceMetrics: topology.performanceMetrics as any,
      massOptimized: topology.massOptimized || false,
      userId: topology.userId,
      createdAt: topology.createdAt,
      updatedAt: topology.updatedAt
    };
  }

  private async getValidationDataset(datasetId: string): Promise<any> {
    const dataset = await this.prisma.validationDataset.findUnique({
      where: { id: datasetId }
    });

    if (!dataset) {
      throw new Error(`Validation dataset ${datasetId} not found`);
    }

    return dataset;
  }

  private async optimizePromptsInContext(
    topology: WorkflowTopology,
    dataset: any,
    config: MassOptimizationConfig
  ): Promise<WorkflowTopology> {
    const optimizedTopology = { ...topology };
    const optimizedNodes = [...topology.nodes];

    // Iteratively optimize each node's prompt in the context of the workflow
    for (let round = 0; round < (config.optimizationRounds || 3); round++) {
      this.logger.log(`Stage 3 optimization round ${round + 1}`);

      for (let nodeIndex = 0; nodeIndex < optimizedNodes.length; nodeIndex++) {
        const node = optimizedNodes[nodeIndex];
        
        // Skip non-agent nodes
        if (!node.agentBlueprintId) continue;

        try {
          const optimizedNode = await this.optimizeNodePromptInWorkflow(
            node,
            optimizedNodes,
            topology.edges,
            dataset,
            config
          );

          if (optimizedNode) {
            optimizedNodes[nodeIndex] = optimizedNode;
            this.logger.log(`Optimized node ${node.id} in round ${round + 1}`);
          }
        } catch (error) {
          this.logger.warn(`Failed to optimize node ${node.id} in round ${round + 1}:`, error);
        }
      }
    }

    optimizedTopology.nodes = optimizedNodes;
    return optimizedTopology;
  }

  private async optimizeNodePromptInWorkflow(
    targetNode: any,
    allNodes: any[],
    edges: any[],
    dataset: any,
    config: MassOptimizationConfig
  ): Promise<any | null> {
    // Find the upstream context for this node
    const upstreamContext = this.getUpstreamContext(targetNode, allNodes, edges);
    
    // Get the current agent and its prompt
    const agent = await this.prisma.agent.findUnique({
      where: { id: targetNode.agentBlueprintId },
      include: {
        promptVersions: {
          where: { massStage: 'block_level' },
          orderBy: { versionNumber: 'desc' },
          take: 1
        }
      }
    });

    if (!agent) {
      this.logger.warn(`Agent ${targetNode.agentBlueprintId} not found`);
      return null;
    }

    const currentPrompt = this.getLatestPrompt(agent);
    
    // Generate workflow-aware prompt candidates
    const candidates = await this.generateWorkflowAwarePromptCandidates(
      currentPrompt,
      upstreamContext,
      targetNode,
      config
    );

    // Evaluate each candidate in the full workflow context
    let bestCandidate = currentPrompt;
    let bestScore = -1;

    for (const candidate of candidates) {
      try {
        const score = await this.evaluateNodeInWorkflowContext(
          targetNode,
          candidate,
          allNodes,
          edges,
          dataset,
          config
        );

        if (score > bestScore) {
          bestScore = score;
          bestCandidate = candidate;
        }
      } catch (error) {
        this.logger.warn(`Failed to evaluate candidate for node ${targetNode.id}:`, error);
      }
    }

    // If we found a better prompt, create a new version
    if (bestCandidate !== currentPrompt && bestScore > 0) {
      const newVersion = await this.createWorkflowPromptVersion(
        agent.id,
        bestCandidate,
        { accuracy: bestScore },
        'workflow_level'
      );

      return {
        ...targetNode,
        promptVersionId: newVersion.id
      };
    }

    return null;
  }

  private getUpstreamContext(targetNode: any, allNodes: any[], edges: any[]): any {
    // Find all nodes that feed into the target node
    const upstreamNodeIds = edges
      .filter(edge => edge.targetNodeId === targetNode.id)
      .map(edge => edge.sourceNodeId);

    const upstreamNodes = allNodes.filter(node => 
      upstreamNodeIds.includes(node.id)
    );

    return {
      upstreamNodes,
      nodePosition: this.getNodePosition(targetNode, allNodes, edges),
      workflowContext: this.getWorkflowContext(allNodes, edges)
    };
  }

  private getNodePosition(node: any, allNodes: any[], edges: any[]): string {
    const upstreamCount = edges.filter(e => e.targetNodeId === node.id).length;
    const downstreamCount = edges.filter(e => e.sourceNodeId === node.id).length;

    if (upstreamCount === 0) return 'input';
    if (downstreamCount === 0) return 'output';
    return 'intermediate';
  }

  private getWorkflowContext(allNodes: any[], edges: any[]): any {
    return {
      totalNodes: allNodes.length,
      totalEdges: edges.length,
      nodeTypes: allNodes.map(n => n.type),
      isLinear: this.isLinearWorkflow(allNodes, edges),
      hasParallelBranches: this.hasParallelBranches(allNodes, edges)
    };
  }

  private isLinearWorkflow(allNodes: any[], edges: any[]): boolean {
    return edges.length === allNodes.length - 1;
  }

  private hasParallelBranches(allNodes: any[], edges: any[]): boolean {
    // Check if any node has multiple outgoing edges
    const nodeOutgoingCounts = new Map();
    edges.forEach(edge => {
      const count = nodeOutgoingCounts.get(edge.sourceNodeId) || 0;
      nodeOutgoingCounts.set(edge.sourceNodeId, count + 1);
    });

    return Array.from(nodeOutgoingCounts.values()).some(count => count > 1);
  }

  private async generateWorkflowAwarePromptCandidates(
    currentPrompt: any,
    upstreamContext: any,
    targetNode: any,
    config: MassOptimizationConfig
  ): Promise<any[]> {
    const candidates = [];
    const baseInstruction = currentPrompt.instruction?.roleDefinition || '';

    // Generate context-aware instruction variations
    const contextAwareInstructions = [
      this.addWorkflowContextToInstruction(baseInstruction, upstreamContext, 'collaborative'),
      this.addWorkflowContextToInstruction(baseInstruction, upstreamContext, 'sequential'),
      this.addWorkflowContextToInstruction(baseInstruction, upstreamContext, 'refinement')
    ];

    for (const instruction of contextAwareInstructions) {
      if (instruction && instruction !== baseInstruction) {
        candidates.push({
          instruction: {
            roleDefinition: instruction,
            taskGuidance: currentPrompt.instruction?.taskGuidance || '',
            outputFormat: currentPrompt.instruction?.outputFormat || ''
          },
          exemplars: currentPrompt.exemplars || []
        });
      }
    }

    // Add original as a candidate
    candidates.push(currentPrompt);

    return candidates.slice(0, config.maxCandidates || 5);
  }

  private addWorkflowContextToInstruction(
    baseInstruction: string,
    upstreamContext: any,
    style: 'collaborative' | 'sequential' | 'refinement'
  ): string {
    const position = upstreamContext.nodePosition;
    const hasUpstream = upstreamContext.upstreamNodes.length > 0;

    let contextPrompt = baseInstruction;

    switch (style) {
      case 'collaborative':
        if (hasUpstream) {
          contextPrompt += `\n\nYou are working as part of a collaborative multi-agent system. ` +
            `Your analysis will build upon insights from ${upstreamContext.upstreamNodes.length} upstream agent(s). ` +
            `Focus on adding unique value while maintaining consistency with the overall workflow objectives.`;
        }
        break;

      case 'sequential':
        if (position === 'intermediate') {
          contextPrompt += `\n\nYou are processing information in a sequential workflow. ` +
            `Carefully review the input from previous agents and enhance or refine it for the next stage. ` +
            `Maintain logical flow and ensure your output enables effective downstream processing.`;
        }
        break;

      case 'refinement':
        if (hasUpstream) {
          contextPrompt += `\n\nYour role is to refine and improve upon the work of previous agents. ` +
            `Identify areas for enhancement, correct any issues, and provide additional insights ` +
            `while preserving valuable contributions from upstream processing.`;
        }
        break;
    }

    return contextPrompt;
  }

  private async evaluateNodeInWorkflowContext(
    targetNode: any,
    candidatePrompt: any,
    allNodes: any[],
    edges: any[],
    dataset: any,
    config: MassOptimizationConfig
  ): Promise<number> {
    // Create a temporary workflow with the candidate prompt
    const tempNodes = allNodes.map(node => 
      node.id === targetNode.id 
        ? { ...node, tempPrompt: candidatePrompt }
        : node
    );

    // Evaluate a subset of the dataset (for efficiency)
    const sampleSize = Math.min(dataset.items.length, config.evaluationSampleSize || 10);
    const sampleItems = dataset.items.slice(0, sampleSize);

    let totalScore = 0;
    let validEvaluations = 0;

    for (const item of sampleItems) {
      try {
        const result = await this.evaluationHarness.evaluateWorkflowWithNodes(
          tempNodes,
          edges,
          item,
          config
        );

        if (result && typeof result.accuracy === 'number') {
          totalScore += result.accuracy;
          validEvaluations++;
        }
      } catch (error) {
        this.logger.warn(`Failed to evaluate workflow item:`, error);
      }
    }

    return validEvaluations > 0 ? totalScore / validEvaluations : 0;
  }

  private async createWorkflowPromptVersion(
    agentId: string,
    prompt: any,
    metrics: any,
    massStage: string
  ): Promise<any> {
    const latestVersion = await this.prisma.agentPromptVersion.findFirst({
      where: { agentId },
      orderBy: { versionNumber: 'desc' }
    });

    const versionNumber = (latestVersion?.versionNumber || 0) + 1;

    return this.prisma.agentPromptVersion.create({
      data: {
        agentId,
        versionNumber,
        instruction: prompt.instruction?.roleDefinition || '',
        exemplars: prompt.exemplars || [],
        performanceMetrics: metrics as any,
        massStage,
        status: 'optimized'
      }
    });
  }

  private getLatestPrompt(agent: any): any {
    const latestVersion = agent.promptVersions?.[0];
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
        taskGuidance: '',
        outputFormat: ''
      },
      exemplars: []
    };
  }

  private async evaluateTopology(
    topology: WorkflowTopology,
    dataset: any,
    config: MassOptimizationConfig
  ): Promise<PerformanceMetrics> {
    return this.evaluationHarness.evaluateTopology(
      topology.id || 'temp_topology',
      dataset.items,
      config
    );
  }

  private calculateImprovement(baseline: PerformanceMetrics, optimized: PerformanceMetrics): number {
    if (baseline.accuracy && optimized.accuracy) {
      return ((optimized.accuracy - baseline.accuracy) / baseline.accuracy) * 100;
    }
    return 0;
  }

  private async saveOptimizedWorkflow(
    topology: WorkflowTopology,
    optimizedMetrics: PerformanceMetrics,
    baselineMetrics: PerformanceMetrics,
    userId: string
  ): Promise<WorkflowTopology> {
    const improvement = this.calculateImprovement(baselineMetrics, optimizedMetrics);
    
    const updated = await this.prisma.workflowTopology.update({
      where: { id: topology.id },
      data: {
        nodes: topology.nodes as any,
        edges: topology.edges as any,
        performanceMetrics: {
          ...optimizedMetrics,
          baselineMetrics,
          improvementPercentage: improvement
        } as any,
        massOptimized: true,
        updatedAt: new Date()
      }
    });

    return {
      ...topology,
      performanceMetrics: updated.performanceMetrics as any,
      updatedAt: updated.updatedAt
    };
  }
}
