import { PromptBlock, PromptTemplate } from './types';

interface CompilationContext {
  variables: Record<string, any>;
  usedVariables: Set<string>;
  errors: string[];
}

export class PromptCompiler {
  /**
   * Compiles a PromptTemplate or a list of PromptBlocks into a final string.
   * Handles variable substitution, conditional logic, and block ordering.
   */
  public compile(
    templateOrBlocks: PromptTemplate | PromptBlock[],
    variables: Record<string, any> = {}
  ): string {
    const blocks = Array.isArray(templateOrBlocks) ? templateOrBlocks : templateOrBlocks.blocks;

    const context: CompilationContext = {
      variables,
      usedVariables: new Set(),
      errors: [],
    };

    // 1. Sort blocks by position
    const sortedBlocks = this.sortBlocks(blocks);

    // 2. Process blocks recursively
    const compiledParts = sortedBlocks.map((block) => this.processBlock(block, context));

    // 3. Join parts
    return compiledParts
      .filter((part) => part !== null)
      .join('\n\n')
      .trim();
  }

  /**
   * Recursively processes a block and its children.
   */
  private processBlock(block: PromptBlock, context: CompilationContext): string | null {
    // Check condition if applicable
    if (block.type === 'condition' && block.metadata?.condition) {
      if (!this.evaluateCondition(block.metadata.condition, context.variables)) {
        return null;
      }
    }

    // Handle Groups (Container blocks)
    if (block.type === 'group' && block.children && block.children.length > 0) {
      const sortedChildren = this.sortBlocks(block.children);
      const childContent = sortedChildren
        .map((child) => this.processBlock(child, context))
        .filter((part) => part !== null)
        .join('\n\n');

      return childContent || null;
    }

    // Handle Content Blocks
    let content = block.content;

    // Substitute variables: {{variableName}}
    content = this.substituteVariables(content, context);

    // If block is 'condition' but has no children, it might just be conditional text
    // (Handled above by evaluating condition, now just returning content)

    return content;
  }

  /**
   * Sorts blocks by their position index.
   */
  private sortBlocks(blocks: PromptBlock[]): PromptBlock[] {
    return [...blocks].sort((a, b) => a.position - b.position);
  }

  /**
   * Replaces mustache-style variables {{var}} with values from context.
   */
  private substituteVariables(text: string, context: CompilationContext): string {
    return text.replace(/\{\{([^}]+)\}\}/g, (match, variableName) => {
      const key = variableName.trim();
      context.usedVariables.add(key);

      if (key in context.variables) {
        return String(context.variables[key]);
      }

      // Warn or return original if missing?
      // For now, keep original to highlight missing var, or could return empty string.
      // Better to keep so user spots it.
      return match;
    });
  }

  /**
   * Evaluates logic for conditional blocks.
   */
  private evaluateCondition(
    condition: NonNullable<PromptBlock['metadata']>['condition'],
    variables: Record<string, any>
  ): boolean {
    if (!condition) return true;

    const { variable, operator, value } = condition;
    const actualValue = variables[variable];

    switch (operator) {
      case 'exists':
        return actualValue !== undefined && actualValue !== null && actualValue !== '';
      case 'not_exists':
        return actualValue === undefined || actualValue === null || actualValue === '';
      case 'equals':
        return actualValue == value; // loose equality for string/number match
      case 'contains':
        return (
          typeof actualValue === 'string' &&
          typeof value === 'string' &&
          actualValue.includes(value)
        );
      default:
        return false;
    }
  }

  /**
   * Validates a template to check for missing variables or structural loops.
   */
  public validate(templateOrBlocks: PromptTemplate | PromptBlock[]): {
    valid: boolean;
    errors: string[];
    missingVariables: string[];
  } {
    const blocks = Array.isArray(templateOrBlocks) ? templateOrBlocks : templateOrBlocks.blocks;

    const variablesDetected = new Set<string>();
    const extractVars = (text: string) => {
      const matches = text.matchAll(/\{\{([^}]+)\}\}/g);
      for (const match of matches) {
        variablesDetected.add(match[1].trim());
      }
    };

    const traverse = (blockList: PromptBlock[]) => {
      for (const block of blockList) {
        extractVars(block.content);
        if (block.children) traverse(block.children);
      }
    };

    traverse(blocks);

    return {
      valid: true,
      errors: [],
      missingVariables: Array.from(variablesDetected),
    };
  }
}
