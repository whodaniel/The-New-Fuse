/**
 * BMAD Orchestration Service
 *
 * Implements the BMAD (Breakthrough Method for Agile AI-Driven Development) framework.
 * This service orchestrates the four layers in proper chronological order:
 *
 * 1. SKILLS COMPOSITION - Load and compose Claude Skills
 * 2. TOOL CREATION - Create tools from skills for agent use
 * 3. CONTEXT ENGINEERING - Build optimal context for LLM prompts
 * 4. PROMPT ENGINEERING - Template and execute prompts
 *
 * CONNECTS TO (no duplication, reuses existing services):
 * - ClaudeSkillsManager: For skill loading and execution
 * - PromptTemplateService: For prompt management
 * - DirectorService: For autonomous loop integration
 * - AgentSwarmOrchestrationService: For agent coordination
 * - CascadeBridge: For workflow execution
 */

import { EventEmitter } from 'events';

// ============================================================
// LAYER 1: SKILLS COMPOSITION
// ============================================================

export interface SkillComposition {
  id: string;
  name: string;
  description: string;
  baseSkills: string[]; // IDs of skills to compose
  compositionType: 'sequential' | 'parallel' | 'conditional' | 'fallback';
  conditions?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

export interface ComposedSkill {
  compositionId: string;
  skills: Array<{
    skillId: string;
    order: number;
    required: boolean;
  }>;
  inputs: Record<string, unknown>;
  outputs: Record<string, unknown>;
}

// ============================================================
// LAYER 2: TOOL CREATION
// ============================================================

export interface AgentTool {
  id: string;
  name: string;
  description: string;
  skillId?: string; // Underlying skill ID
  compositionId?: string; // Or composition ID
  inputSchema: Record<string, unknown>;
  outputSchema: Record<string, unknown>;
  permissions?: string[];
  rateLimit?: {
    maxCalls: number;
    windowMs: number;
  };
}

export interface ToolExecutionResult {
  toolId: string;
  success: boolean;
  output?: unknown;
  error?: string;
  durationMs: number;
  tokensUsed?: number;
}

// ============================================================
// LAYER 3: CONTEXT ENGINEERING
// ============================================================

export interface ContextSource {
  id: string;
  type: 'document' | 'code' | 'conversation' | 'memory' | 'tool_output' | 'handoff';
  priority: number; // Higher = more important, loaded first
  content: string;
  tokenEstimate?: number;
  metadata?: {
    path?: string;
    language?: string;
    timestamp?: Date;
    relevanceScore?: number;
  };
}

export interface EngineeredContext {
  id: string;
  sources: ContextSource[];
  totalTokens: number;
  maxTokens: number;
  windowUtilization: number; // 0-1, how full the context window is
  compiledContext: string; // Final assembled context
  metadata: {
    createdAt: Date;
    expiresAt?: Date;
    purpose: string;
    agentId?: string;
  };
}

// ============================================================
// LAYER 4: PROMPT ENGINEERING
// ============================================================

export interface PromptTemplate {
  id: string;
  name: string;
  template: string;
  variables: string[];
  contextRequirements?: string[]; // Required context source types
  toolRequirements?: string[]; // Required tools
  version: string;
  metadata?: Record<string, unknown>;
}

export interface PromptExecution {
  templateId: string;
  context: EngineeredContext;
  variables: Record<string, unknown>;
  result?: string;
  tokensInput?: number;
  tokensOutput?: number;
  durationMs?: number;
}

// ============================================================
// BMAD ORCHESTRATION SERVICE
// ============================================================

export interface BMADConfig {
  maxContextTokens: number;
  contextBufferPercent: number; // Reserve for output
  defaultSkillTimeout: number;
  enableCaching: boolean;
  cacheExpiryMs: number;
}

const DEFAULT_CONFIG: BMADConfig = {
  maxContextTokens: 128000,
  contextBufferPercent: 0.25, // Reserve 25% for output
  defaultSkillTimeout: 30000,
  enableCaching: true,
  cacheExpiryMs: 300000, // 5 minutes
};

export class BMADOrchestrationService extends EventEmitter {
  private config: BMADConfig;

  // Layer 1: Skills
  private skills: Map<string, unknown> = new Map();
  private compositions: Map<string, SkillComposition> = new Map();

  // Layer 2: Tools
  private tools: Map<string, AgentTool> = new Map();

  // Layer 3: Context
  private contextSources: Map<string, ContextSource> = new Map();
  private activeContext: EngineeredContext | null = null;

  // Layer 4: Prompts
  private templates: Map<string, PromptTemplate> = new Map();
  private executionHistory: PromptExecution[] = [];

  constructor(config: Partial<BMADConfig> = {}) {
    super();
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.initializeDefaultTemplates();
  }

  // ============================================================
  // LAYER 1: SKILLS COMPOSITION
  // ============================================================

  /**
   * Register a skill from ClaudeSkillsManager
   */
  registerSkill(skillId: string, skill: unknown): void {
    this.skills.set(skillId, skill);
    this.emit('skill:registered', { skillId });
  }

  /**
   * Create a composition of multiple skills
   */
  createComposition(composition: Omit<SkillComposition, 'id'>): SkillComposition {
    const id = `comp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const fullComposition: SkillComposition = { ...composition, id };
    this.compositions.set(id, fullComposition);
    this.emit('composition:created', fullComposition);
    return fullComposition;
  }

  /**
   * Get composed skill ready for execution
   */
  async composeSkills(
    compositionId: string,
    inputs: Record<string, unknown>,
  ): Promise<ComposedSkill> {
    const composition = this.compositions.get(compositionId);
    if (!composition) {
      throw new Error(`Composition not found: ${compositionId}`);
    }

    const composedSkill: ComposedSkill = {
      compositionId,
      skills: composition.baseSkills.map((skillId, index) => ({
        skillId,
        order: index,
        required: true,
      })),
      inputs,
      outputs: {},
    };

    this.emit('skills:composed', composedSkill);
    return composedSkill;
  }

  // ============================================================
  // LAYER 2: TOOL CREATION
  // ============================================================

  /**
   * Create a tool from a skill or composition
   */
  createTool(tool: Omit<AgentTool, 'id'>): AgentTool {
    const id = `tool-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const fullTool: AgentTool = { ...tool, id };
    this.tools.set(id, fullTool);
    this.emit('tool:created', fullTool);
    return fullTool;
  }

  /**
   * Create tools from all registered skills
   */
  createToolsFromSkills(): AgentTool[] {
    const createdTools: AgentTool[] = [];

    for (const [skillId, skill] of this.skills) {
      const skillData = skill as { name?: string; description?: string };
      const tool = this.createTool({
        name: skillData.name || skillId,
        description: skillData.description || `Tool for skill ${skillId}`,
        skillId,
        inputSchema: {},
        outputSchema: {},
      });
      createdTools.push(tool);
    }

    return createdTools;
  }

  /**
   * Execute a tool
   */
  async executeTool(toolId: string, inputs: Record<string, unknown>): Promise<ToolExecutionResult> {
    const startTime = Date.now();
    const tool = this.tools.get(toolId);

    if (!tool) {
      return {
        toolId,
        success: false,
        error: `Tool not found: ${toolId}`,
        durationMs: Date.now() - startTime,
      };
    }

    this.emit('tool:executing', { toolId, inputs });

    try {
      // Get underlying skill
      const skill = tool.skillId ? this.skills.get(tool.skillId) : null;

      if (!skill) {
        throw new Error(`Skill not found for tool: ${toolId}`);
      }

      // Execute skill (would connect to ClaudeSkillsManager)
      const output = await this.executeSkill(tool.skillId!, inputs);

      const result: ToolExecutionResult = {
        toolId,
        success: true,
        output,
        durationMs: Date.now() - startTime,
      };

      this.emit('tool:executed', result);
      return result;
    } catch (error) {
      const result: ToolExecutionResult = {
        toolId,
        success: false,
        error: error instanceof Error ? error.message : String(error),
        durationMs: Date.now() - startTime,
      };

      this.emit('tool:failed', result);
      return result;
    }
  }

  private async executeSkill(skillId: string, inputs: Record<string, unknown>): Promise<unknown> {
    // Placeholder - would connect to ClaudeSkillsManager.executeSkill
    return { skillId, inputs, executed: true };
  }

  /**
   * Get available tools
   */
  getTools(): AgentTool[] {
    return Array.from(this.tools.values());
  }

  // ============================================================
  // LAYER 3: CONTEXT ENGINEERING
  // ============================================================

  /**
   * Add a context source
   */
  addContextSource(source: Omit<ContextSource, 'id'>): ContextSource {
    const id = `ctx-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const fullSource: ContextSource = {
      ...source,
      id,
      tokenEstimate: source.tokenEstimate || this.estimateTokens(source.content),
    };
    this.contextSources.set(id, fullSource);
    this.emit('context:added', fullSource);
    return fullSource;
  }

  /**
   * Engineer context for a specific purpose
   */
  engineerContext(
    purpose: string,
    requirements?: {
      requiredTypes?: ContextSource['type'][];
      maxTokens?: number;
      agentId?: string;
    },
  ): EngineeredContext {
    const maxTokens =
      requirements?.maxTokens ||
      this.config.maxContextTokens * (1 - this.config.contextBufferPercent);

    // Get sources sorted by priority
    let sources = Array.from(this.contextSources.values()).sort((a, b) => b.priority - a.priority);

    // Filter by required types if specified
    if (requirements?.requiredTypes) {
      sources = sources.filter((s) => requirements.requiredTypes!.includes(s.type));
    }

    // Select sources within token budget
    const selectedSources: ContextSource[] = [];
    let totalTokens = 0;

    for (const source of sources) {
      const tokens = source.tokenEstimate || this.estimateTokens(source.content);
      if (totalTokens + tokens <= maxTokens) {
        selectedSources.push(source);
        totalTokens += tokens;
      }
    }

    // Compile context
    const compiledContext = this.compileContext(selectedSources);

    const engineeredContext: EngineeredContext = {
      id: `eng-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      sources: selectedSources,
      totalTokens,
      maxTokens,
      windowUtilization: totalTokens / maxTokens,
      compiledContext,
      metadata: {
        createdAt: new Date(),
        purpose,
        agentId: requirements?.agentId,
      },
    };

    this.activeContext = engineeredContext;
    this.emit('context:engineered', engineeredContext);
    return engineeredContext;
  }

  /**
   * Compile context sources into a single string
   */
  private compileContext(sources: ContextSource[]): string {
    const sections: string[] = [];

    // Group by type
    const byType = new Map<ContextSource['type'], ContextSource[]>();
    for (const source of sources) {
      if (!byType.has(source.type)) {
        byType.set(source.type, []);
      }
      byType.get(source.type)!.push(source);
    }

    // Order: handoff → document → code → memory → tool_output → conversation
    const typeOrder: ContextSource['type'][] = [
      'handoff',
      'document',
      'code',
      'memory',
      'tool_output',
      'conversation',
    ];

    for (const type of typeOrder) {
      const typeSources = byType.get(type);
      if (typeSources && typeSources.length > 0) {
        sections.push(`## ${type.toUpperCase()} CONTEXT\n`);
        for (const source of typeSources) {
          if (source.metadata?.path) {
            sections.push(`### ${source.metadata.path}\n`);
          }
          sections.push(source.content);
          sections.push('\n');
        }
      }
    }

    return sections.join('\n');
  }

  /**
   * Estimate token count for text
   */
  private estimateTokens(text: string): number {
    // Rough estimate: ~4 characters per token
    return Math.ceil(text.length / 4);
  }

  /**
   * Clear context sources
   */
  clearContext(): void {
    this.contextSources.clear();
    this.activeContext = null;
    this.emit('context:cleared');
  }

  // ============================================================
  // LAYER 4: PROMPT ENGINEERING
  // ============================================================

  /**
   * Register a prompt template
   */
  registerTemplate(template: Omit<PromptTemplate, 'id'>): PromptTemplate {
    const id = `tpl-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const fullTemplate: PromptTemplate = { ...template, id };
    this.templates.set(id, fullTemplate);
    this.emit('template:registered', fullTemplate);
    return fullTemplate;
  }

  /**
   * Compile a prompt with context and variables
   */
  compilePrompt(templateId: string, variables: Record<string, unknown>): string {
    const template = this.templates.get(templateId);
    if (!template) {
      throw new Error(`Template not found: ${templateId}`);
    }

    let prompt = template.template;

    // Replace variables
    for (const [key, value] of Object.entries(variables)) {
      const placeholder = `{{${key}}}`;
      prompt = prompt.replace(new RegExp(placeholder, 'g'), String(value));
    }

    // Inject context if available
    if (this.activeContext) {
      prompt = prompt.replace('{{CONTEXT}}', this.activeContext.compiledContext);
    }

    // Inject available tools
    const toolList = Array.from(this.tools.values())
      .map((t) => `- ${t.name}: ${t.description}`)
      .join('\n');
    prompt = prompt.replace('{{TOOLS}}', toolList);

    return prompt;
  }

  /**
   * Execute a full prompt cycle
   */
  async executePrompt(
    templateId: string,
    variables: Record<string, unknown>,
    context?: EngineeredContext,
  ): Promise<PromptExecution> {
    const startTime = Date.now();

    // Use provided context or active context
    const executionContext = context || this.activeContext;
    if (!executionContext) {
      throw new Error('No context available. Call engineerContext first.');
    }

    const compiledPrompt = this.compilePrompt(templateId, variables);

    const execution: PromptExecution = {
      templateId,
      context: executionContext,
      variables,
      tokensInput: this.estimateTokens(compiledPrompt),
      durationMs: Date.now() - startTime,
    };

    this.executionHistory.push(execution);
    this.emit('prompt:executed', execution);

    return execution;
  }

  /**
   * Initialize default prompt templates
   */
  private initializeDefaultTemplates(): void {
    // Agent task template
    this.registerTemplate({
      name: 'agent-task',
      template: `You are an autonomous agent working on The New Fuse platform.

## YOUR CONTEXT
{{CONTEXT}}

## AVAILABLE TOOLS
{{TOOLS}}

## CURRENT TASK
{{task}}

## INSTRUCTIONS
{{instructions}}

Complete the task using the available context and tools. Report your progress and any issues encountered.`,
      variables: ['task', 'instructions'],
      version: '1.0.0',
    });

    // Self-improvement template
    this.registerTemplate({
      name: 'self-improve',
      template: `You are performing a self-improvement cycle on The New Fuse codebase.

## CONTEXT
{{CONTEXT}}

## IMPROVEMENT SCOPE
{{scope}}

## ANALYSIS RESULTS
{{analysis}}

## INSTRUCTIONS
1. Review the analysis results
2. Identify the top 3 improvements to implement
3. For each improvement, provide:
   - What to change
   - Why it's important
   - How to implement it
4. Prioritize by impact and feasibility`,
      variables: ['scope', 'analysis'],
      version: '1.0.0',
    });

    // Handoff template
    this.registerTemplate({
      name: 'handoff',
      template: `Generate a handoff document for session continuity.

## PREVIOUS CONTEXT
{{CONTEXT}}

## SESSION SUMMARY
{{summary}}

## COMPLETED TASKS
{{completed}}

## PENDING WORK
{{pending}}

Create a concise handoff document that the next agent can use to continue the work.`,
      variables: ['summary', 'completed', 'pending'],
      version: '1.0.0',
    });
  }

  // ============================================================
  // FULL BMAD CYCLE
  // ============================================================

  /**
   * Execute a complete BMAD cycle
   * This is the main orchestration method that follows the proper order
   */
  async executeBMADCycle(config: {
    skillIds?: string[];
    contextPurpose: string;
    templateId: string;
    variables: Record<string, unknown>;
    agentId?: string;
  }): Promise<{
    skills: string[];
    tools: AgentTool[];
    context: EngineeredContext;
    execution: PromptExecution;
  }> {
    this.emit('bmad:cycle:start', config);

    // Step 1: Skills Composition
    const skills: string[] = [];
    if (config.skillIds) {
      for (const skillId of config.skillIds) {
        if (this.skills.has(skillId)) {
          skills.push(skillId);
        }
      }
    }
    this.emit('bmad:skills:loaded', { count: skills.length });

    // Step 2: Tool Creation
    const tools = this.createToolsFromSkills();
    this.emit('bmad:tools:created', { count: tools.length });

    // Step 3: Context Engineering
    const context = this.engineerContext(config.contextPurpose, {
      agentId: config.agentId,
    });
    this.emit('bmad:context:engineered', {
      sources: context.sources.length,
      tokens: context.totalTokens,
    });

    // Step 4: Prompt Engineering
    const execution = await this.executePrompt(config.templateId, config.variables, context);
    this.emit('bmad:prompt:executed', execution);

    this.emit('bmad:cycle:complete', {
      skills: skills.length,
      tools: tools.length,
      contextTokens: context.totalTokens,
    });

    return { skills, tools, context, execution };
  }

  /**
   * Get orchestration statistics
   */
  getStatistics(): {
    skills: number;
    compositions: number;
    tools: number;
    contextSources: number;
    templates: number;
    executions: number;
    activeContextTokens: number;
  } {
    return {
      skills: this.skills.size,
      compositions: this.compositions.size,
      tools: this.tools.size,
      contextSources: this.contextSources.size,
      templates: this.templates.size,
      executions: this.executionHistory.length,
      activeContextTokens: this.activeContext?.totalTokens || 0,
    };
  }
}

export default BMADOrchestrationService;
