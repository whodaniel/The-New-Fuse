import { EventEmitter } from 'events';
import { WorkflowNode, ExecutionContext, NodeExecutionResult } from '../workflow/types.js';

export interface PluginHooks {
  onBeforeStep?: (node: WorkflowNode, context: ExecutionContext) => void | Promise<void>;
  onAfterStep?: (node: WorkflowNode, context: ExecutionContext, result: NodeExecutionResult) => void | Promise<void>;
}

export class PluginManager extends EventEmitter {
  private hooks: PluginHooks[] = [];

  registerPlugin(hooks: PluginHooks): void {
    this.hooks.push(hooks);
  }

  async emitBeforeStep(node: WorkflowNode, context: ExecutionContext): Promise<void> {
    for (const hook of this.hooks) {
      if (hook.onBeforeStep) await hook.onBeforeStep(node, context);
    }
  }

  async emitAfterStep(node: WorkflowNode, context: ExecutionContext, result: NodeExecutionResult): Promise<void> {
    for (const hook of this.hooks) {
      if (hook.onAfterStep) await hook.onAfterStep(node, context, result);
    }
  }
}

export const pluginManager = new PluginManager();
export const registerPlugin = (hooks: PluginHooks) => pluginManager.registerPlugin(hooks);
