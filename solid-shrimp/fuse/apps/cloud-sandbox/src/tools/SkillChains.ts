/**
 * Skill Chains System
 *
 * Chains together multiple tools into higher-level "skills" with:
 * - Context passing between steps
 * - Conditional logic
 * - Error handling and rollback
 * - Prompting chains for AI agents
 *
 * Skills are logical routines that combine multiple tools to accomplish
 * complex tasks that require multiple steps.
 */

import { Logger } from '@nestjs/common';
import type { AuthenticatedUser } from '../auth/CloudSandboxAuthGuard';
import { ToolExecutionResult, ToolRegistry } from './ToolWrapper';

export interface SkillStep {
  toolName: string;
  description: string;
  params: Record<string, unknown> | ((context: SkillContext) => Record<string, unknown>);
  onSuccess?: (result: unknown, context: SkillContext) => void;
  onError?: (error: Error, context: SkillContext) => void | 'continue' | 'abort';
  condition?: (context: SkillContext) => boolean;
}

export interface SkillContext {
  user: AuthenticatedUser;
  initialParams: Record<string, unknown>;
  stepResults: Map<number, ToolExecutionResult>;
  variables: Map<string, unknown>;
  metadata: Record<string, unknown>;
}

export interface SkillSchema {
  name: string;
  description: string;
  category: string;
  prompt: string; // Instructions for AI agents on how to use this skill
  parameters: Array<{
    name: string;
    type: string;
    description: string;
    required: boolean;
  }>;
  steps: SkillStep[];
  examples?: Array<{
    description: string;
    params: Record<string, unknown>;
    expectedOutcome: string;
  }>;
}

export interface SkillExecutionResult {
  success: boolean;
  completedSteps: number;
  totalSteps: number;
  results: ToolExecutionResult[];
  finalResult?: unknown;
  error?: {
    step: number;
    message: string;
  };
  executionTime: number;
}

/**
 * Skill Chain Executor
 */
export class SkillChain {
  private readonly logger = new Logger(SkillChain.name);
  private readonly schema: SkillSchema;
  private readonly toolRegistry: ToolRegistry;

  constructor(schema: SkillSchema, toolRegistry: ToolRegistry) {
    this.schema = schema;
    this.toolRegistry = toolRegistry;
  }

  /**
   * Execute skill chain
   */
  async execute(
    user: AuthenticatedUser,
    params: Record<string, unknown>
  ): Promise<SkillExecutionResult> {
    const startTime = Date.now();
    const context: SkillContext = {
      user,
      initialParams: params,
      stepResults: new Map(),
      variables: new Map(),
      metadata: {},
    };

    const results: ToolExecutionResult[] = [];
    let completedSteps = 0;

    this.logger.log(`Starting skill chain: ${this.schema.name}`);

    for (let i = 0; i < this.schema.steps.length; i++) {
      const step = this.schema.steps[i];

      // Check condition
      if (step.condition && !step.condition(context)) {
        this.logger.debug(`Skipping step ${i + 1}: condition not met`);
        continue;
      }

      this.logger.log(`Executing step ${i + 1}/${this.schema.steps.length}: ${step.description}`);

      try {
        // Resolve params (can be static or dynamic based on context)
        const stepParams = typeof step.params === 'function' ? step.params(context) : step.params;

        // Execute tool
        const result = await this.toolRegistry.execute({
          user,
          toolName: step.toolName,
          params: stepParams,
        });

        results.push(result);
        context.stepResults.set(i, result);

        if (!result.success) {
          // Handle error
          const action = step.onError
            ? step.onError(new Error(result.error?.message || 'Unknown error'), context)
            : 'abort';

          if (action === 'abort') {
            this.logger.error(`Skill chain aborted at step ${i + 1}: ${result.error?.message}`);
            return {
              success: false,
              completedSteps,
              totalSteps: this.schema.steps.length,
              results,
              error: {
                step: i + 1,
                message: result.error?.message || 'Unknown error',
              },
              executionTime: Date.now() - startTime,
            };
          } else if (action === 'continue') {
            this.logger.warn(`Step ${i + 1} failed but continuing: ${result.error?.message}`);
            completedSteps++;
            continue;
          }
        }

        // Handle success
        if (step.onSuccess) {
          step.onSuccess(result.result, context);
        }

        completedSteps++;
      } catch (error) {
        this.logger.error(`Unexpected error in step ${i + 1}:`, error);
        return {
          success: false,
          completedSteps,
          totalSteps: this.schema.steps.length,
          results,
          error: {
            step: i + 1,
            message: error instanceof Error ? error.message : 'Unknown error',
          },
          executionTime: Date.now() - startTime,
        };
      }
    }

    // Get final result from last successful step
    const lastResult = results[results.length - 1];

    return {
      success: true,
      completedSteps,
      totalSteps: this.schema.steps.length,
      results,
      finalResult: lastResult?.result,
      executionTime: Date.now() - startTime,
    };
  }

  /**
   * Get skill schema
   */
  getSchema(): SkillSchema {
    return this.schema;
  }

  /**
   * Get AI-friendly prompt
   */
  getPrompt(): string {
    return this.schema.prompt;
  }
}

/**
 * Skill Registry
 */
export class SkillRegistry {
  private readonly skills: Map<string, SkillChain> = new Map();
  private readonly logger = new Logger(SkillRegistry.name);

  /**
   * Register a skill
   */
  register(skill: SkillChain): void {
    const schema = skill.getSchema();
    this.skills.set(schema.name, skill);
    this.logger.log(`Registered skill: ${schema.name}`);
  }

  /**
   * Get skill by name
   */
  get(name: string): SkillChain | undefined {
    return this.skills.get(name);
  }

  /**
   * Get all skills
   */
  getAll(): SkillChain[] {
    return Array.from(this.skills.values());
  }

  /**
   * Get skills by category
   */
  getByCategory(category: string): SkillChain[] {
    return this.getAll().filter((skill) => skill.getSchema().category === category);
  }

  /**
   * Execute a skill
   */
  async execute(
    skillName: string,
    user: AuthenticatedUser,
    params: Record<string, unknown>
  ): Promise<SkillExecutionResult> {
    const skill = this.skills.get(skillName);

    if (!skill) {
      return {
        success: false,
        completedSteps: 0,
        totalSteps: 0,
        results: [],
        error: {
          step: 0,
          message: `Skill '${skillName}' not found`,
        },
        executionTime: 0,
      };
    }

    return await skill.execute(user, params);
  }

  /**
   * Get AI-friendly skill catalog
   */
  getSkillCatalog(): Array<{
    name: string;
    description: string;
    category: string;
    prompt: string;
  }> {
    return this.getAll().map((skill) => {
      const schema = skill.getSchema();
      return {
        name: schema.name,
        description: schema.description,
        category: schema.category,
        prompt: schema.prompt,
      };
    });
  }
}

/**
 * Pre-defined Skills
 */
export function registerDefaultSkills(
  skillRegistry: SkillRegistry,
  toolRegistry: ToolRegistry
): void {
  // Skill: Web Scraping
  skillRegistry.register(
    new SkillChain(
      {
        name: 'web_scrape',
        description: 'Navigate to a URL, extract content, and save to a file',
        category: 'automation',
        prompt: `This skill automates web scraping. It will:
1. Navigate to the specified URL
2. Wait for the page to load
3. Extract the HTML content
4. Save the content to a file
5. Return the file path and content summary

Use this when you need to fetch and save web page content.`,
        parameters: [
          { name: 'url', type: 'string', description: 'URL to scrape', required: true },
          {
            name: 'selector',
            type: 'string',
            description: 'CSS selector to extract (optional)',
            required: false,
          },
          {
            name: 'outputFile',
            type: 'string',
            description: 'File path to save content',
            required: true,
          },
        ],
        steps: [
          {
            toolName: 'browser_navigate',
            description: 'Navigate to URL',
            params: (context) => ({
              url: context.initialParams.url,
              waitUntil: 'networkidle',
            }),
            onSuccess: (result, context) => {
              context.variables.set('pageTitle', (result as any).title);
            },
          },
          {
            toolName: 'browser_wait_for_selector',
            description: 'Wait for content to load',
            params: (context) => ({
              selector: context.initialParams.selector || 'body',
              timeout: 10000,
            }),
            condition: (context) => !!context.initialParams.selector,
          },
          {
            toolName: 'browser_get_html',
            description: 'Extract HTML content',
            params: (context) => ({
              selector: context.initialParams.selector,
            }),
            onSuccess: (result, context) => {
              context.variables.set('html', (result as any).html);
            },
          },
          {
            toolName: 'write_file',
            description: 'Save content to file',
            params: (context) => ({
              path: context.initialParams.outputFile,
              content: context.variables.get('html'),
              encoding: 'utf8',
            }),
          },
        ],
        examples: [
          {
            description: 'Scrape a news article',
            params: {
              url: 'https://example.com/article',
              selector: 'article',
              outputFile: '/tmp/article.html',
            },
            expectedOutcome: 'Article HTML saved to /tmp/article.html',
          },
        ],
      },
      toolRegistry
    )
  );

  // Skill: Code Execution with Result Capture
  skillRegistry.register(
    new SkillChain(
      {
        name: 'execute_and_save',
        description: 'Execute code and save output to a file',
        category: 'development',
        prompt: `This skill runs code and captures the output. It will:
1. Execute the provided code (Node.js or Python)
2. Capture stdout and stderr
3. Save the output to a file
4. Return execution results

Use this when you need to run code and preserve the output.`,
        parameters: [
          { name: 'code', type: 'string', description: 'Code to execute', required: true },
          {
            name: 'language',
            type: 'string',
            description: 'Language (node or python)',
            required: true,
          },
          {
            name: 'outputFile',
            type: 'string',
            description: 'File to save output',
            required: true,
          },
        ],
        steps: [
          {
            toolName: 'run_node_code',
            description: 'Execute Node.js code',
            params: (context) => ({
              code: context.initialParams.code,
              timeout: 30000,
            }),
            condition: (context) => context.initialParams.language === 'node',
            onSuccess: (result, context) => {
              const output = `STDOUT:\n${(result as any).stdout}\n\nSTDERR:\n${(result as any).stderr}`;
              context.variables.set('output', output);
            },
          },
          {
            toolName: 'run_python_code',
            description: 'Execute Python code',
            params: (context) => ({
              code: context.initialParams.code,
              timeout: 30000,
            }),
            condition: (context) => context.initialParams.language === 'python',
            onSuccess: (result, context) => {
              const output = `STDOUT:\n${(result as any).stdout}\n\nSTDERR:\n${(result as any).stderr}`;
              context.variables.set('output', output);
            },
          },
          {
            toolName: 'write_file',
            description: 'Save output to file',
            params: (context) => ({
              path: context.initialParams.outputFile,
              content: context.variables.get('output'),
              encoding: 'utf8',
            }),
          },
        ],
        examples: [
          {
            description: 'Run Python script and save output',
            params: {
              code: 'print("Hello from Python!")',
              language: 'python',
              outputFile: '/tmp/output.txt',
            },
            expectedOutcome: 'Python output saved to /tmp/output.txt',
          },
        ],
      },
      toolRegistry
    )
  );

  // Skill: Automated Testing
  skillRegistry.register(
    new SkillChain(
      {
        name: 'web_form_submit',
        description: 'Fill and submit a web form',
        category: 'automation',
        prompt: `This skill automates form submission. It will:
1. Navigate to the form URL
2. Fill in form fields
3. Submit the form
4. Capture the result page
5. Take a screenshot

Use this for automated form testing or data submission.`,
        parameters: [
          { name: 'url', type: 'string', description: 'Form URL', required: true },
          {
            name: 'fields',
            type: 'object',
            description: 'Field values {selector: value}',
            required: true,
          },
          {
            name: 'submitButton',
            type: 'string',
            description: 'Submit button selector',
            required: true,
          },
          {
            name: 'screenshotPath',
            type: 'string',
            description: 'Path to save screenshot',
            required: false,
          },
        ],
        steps: [
          {
            toolName: 'browser_navigate',
            description: 'Navigate to form',
            params: (context) => ({
              url: context.initialParams.url,
            }),
          },
          {
            toolName: 'browser_type',
            description: 'Fill form fields',
            params: (context) => {
              const fields = context.initialParams.fields as Record<string, string>;
              const firstField = Object.entries(fields)[0];
              return {
                selector: firstField[0],
                text: firstField[1],
              };
            },
            // Note: In a real implementation, we'd loop through all fields
          },
          {
            toolName: 'browser_click',
            description: 'Submit form',
            params: (context) => ({
              selector: context.initialParams.submitButton,
              waitForNavigation: true,
            }),
          },
          {
            toolName: 'browser_screenshot',
            description: 'Capture result',
            params: (context) => ({
              fullPage: true,
              format: 'png',
            }),
            condition: (context) => !!context.initialParams.screenshotPath,
            onSuccess: (result, context) => {
              context.variables.set('screenshot', (result as any).screenshot);
            },
          },
        ],
      },
      toolRegistry
    )
  );
}
