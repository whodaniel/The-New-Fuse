/**
 * TNF Pi-Synapse Adapter
 *
 * Part of the "Universal Assimilation & Deconstruction" directive.
 * This adapter allows a TNF agent to "possess" a Pi.dev Agent Core,
 * leveraging its low-latency tool loop and tiny-prompt efficiency.
 */

import { Agent, AgentTool } from '@mariozechner/pi-agent-core';
import { getModel, Static, Type } from '@mariozechner/pi-ai';

/**
 * PiSynapse Metadata - Extension of A2A Agent Card
 */
export const PiSynapseMetadata = Type.Object({
  sleeveId: Type.String(),
  parentAgentId: Type.String(),
  tinyPromptTokens: Type.Number(),
  piCoreVersion: Type.String(),
});

export type TPiSynapseMetadata = Static<typeof PiSynapseMetadata>;

/**
 * The Pi-Synapse Orchestrator
 * Maps TNF Synaptic Bus commands to Pi Agent Loop
 */
export class PiSynapseAdapter {
  private piAgent: Agent;
  private metadata: TPiSynapseMetadata;

  constructor(config: {
    sleeveId: string;
    parentAgentId: string;
    modelProvider: any; // KnownProvider from @mariozechner/pi-ai
    modelName: string;
    customTools: AgentTool<any>[];
  }) {
    this.piAgent = new Agent({
      initialState: {
        systemPrompt:
          'You are a TNF high-performance execution sleeve. Execute tools with 100% precision.',
        model: getModel(config.modelProvider, config.modelName),
        tools: config.customTools,
        messages: [],
      },
    });

    this.metadata = {
      sleeveId: config.sleeveId,
      parentAgentId: config.parentAgentId,
      tinyPromptTokens: 850, // Pi's default target
      piCoreVersion: '1.0.0-assimilated',
    };
  }

  /**
   * Execute a task using the Pi-Sleeve's high-speed loop
   */
  async executeSleeveTask(prompt: string, onEvent?: (event: any) => void) {
    if (onEvent) {
      this.piAgent.subscribe(onEvent);
    }

    console.log(`[Pi-Synapse] Ingesting task into sleeve: ${this.metadata.sleeveId}`);
    return await this.piAgent.prompt(prompt);
  }

  /**
   * Deconstruction Hook: Expose Pi's internal state for TNF Forge optimization
   */
  getInternalMetrics() {
    return {
      messageCount: this.piAgent.state.messages.length,
      lastUpdated: new Date().toISOString(),
      ...this.metadata,
    };
  }
}
