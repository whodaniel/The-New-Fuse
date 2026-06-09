import { Logger } from '../types/core.js';
import {
  AgentProcessor,
  type ProcessorRegistrationOptions,
  type ProcessorRuntimeProcessor,
} from './AgentProcessor.js';

export interface AgentHarnessContext {
  agentId: string;
  processor: AgentProcessor;
  logger: Logger;
}

export interface AgentHarnessExtension {
  id: string;
  name?: string;
  version?: string;
  processors?: ProcessorRuntimeProcessor[];
  canExtend?: (context: AgentHarnessContext) => boolean | Promise<boolean>;
  activate?: (context: AgentHarnessContext) => Promise<void> | void;
  deactivate?: (context: AgentHarnessContext) => Promise<void> | void;
}

export interface AgentHarnessExtensionRegistration {
  id?: string;
  processorOptions?: Record<string, ProcessorRegistrationOptions>;
  replace?: boolean;
}

interface RegisteredHarnessExtension {
  extension: AgentHarnessExtension;
  processorIds: string[];
}

export class AgentHarnessExtensionHost {
  private readonly extensions = new Map<string, RegisteredHarnessExtension>();
  private readonly logger: Logger;

  constructor(
    private readonly agentId: string,
    private readonly processor: AgentProcessor
  ) {
    this.logger = new Logger(`AgentHarnessExtensionHost [${agentId}]`);
  }

  async registerExtension(
    extension: AgentHarnessExtension,
    options: AgentHarnessExtensionRegistration = {}
  ): Promise<void> {
    const id = options.id || extension.id;
    if (!id) {
      throw new Error('Agent harness extension id is required');
    }

    if (this.extensions.has(id) && !options.replace) {
      throw new Error(`Agent harness extension already registered: ${id}`);
    }

    if (this.extensions.has(id)) {
      await this.unregisterExtension(id);
    }

    const context = this.createContext();
    if (extension.canExtend && !(await extension.canExtend(context))) {
      throw new Error(`Agent harness extension refused context: ${id}`);
    }

    const processorIds: string[] = [];
    for (const runtimeProcessor of extension.processors || []) {
      const processorOptions = options.processorOptions?.[runtimeProcessor.id || ''] || {};
      const registered = this.processor.registerProcessor(runtimeProcessor, {
        ...processorOptions,
        replace: options.replace || processorOptions.replace,
      });
      processorIds.push(registered.id);
    }

    if (extension.activate) {
      await extension.activate(context);
    }

    this.extensions.set(id, { extension, processorIds });
    this.logger.info(`Registered agent harness extension ${id}.`);
  }

  async unregisterExtension(id: string): Promise<boolean> {
    const registered = this.extensions.get(id);
    if (!registered) {
      return false;
    }

    const context = this.createContext();
    if (registered.extension.deactivate) {
      await registered.extension.deactivate(context);
    }

    for (const processorId of registered.processorIds) {
      this.processor.unregisterProcessor(processorId);
    }

    this.extensions.delete(id);
    this.logger.info(`Unregistered agent harness extension ${id}.`);
    return true;
  }

  listExtensions(): AgentHarnessExtension[] {
    return Array.from(this.extensions.values()).map((entry) => entry.extension);
  }

  private createContext(): AgentHarnessContext {
    return {
      agentId: this.agentId,
      processor: this.processor,
      logger: this.logger,
    };
  }
}
