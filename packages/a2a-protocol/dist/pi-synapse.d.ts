/**
 * TNF Pi-Synapse Adapter
 *
 * Part of the "Universal Assimilation & Deconstruction" directive.
 * This adapter allows a TNF agent to "possess" a Pi.dev Agent Core,
 * leveraging its low-latency tool loop and tiny-prompt efficiency.
 */
import { AgentTool } from '@mariozechner/pi-agent-core';
import { Static, Type } from '@mariozechner/pi-ai';
/**
 * PiSynapse Metadata - Extension of A2A Agent Card
 */
export declare const PiSynapseMetadata: Type.TObject<{
    sleeveId: Type.TString;
    parentAgentId: Type.TString;
    tinyPromptTokens: Type.TNumber;
    piCoreVersion: Type.TString;
}>;
export type TPiSynapseMetadata = Static<typeof PiSynapseMetadata>;
/**
 * The Pi-Synapse Orchestrator
 * Maps TNF Synaptic Bus commands to Pi Agent Loop
 */
export declare class PiSynapseAdapter {
    private piAgent;
    private metadata;
    constructor(config: {
        sleeveId: string;
        parentAgentId: string;
        modelProvider: any;
        modelName: string;
        customTools: AgentTool<any>[];
    });
    /**
     * Execute a task using the Pi-Sleeve's high-speed loop
     */
    executeSleeveTask(prompt: string, onEvent?: (event: any) => void): Promise<void>;
    /**
     * Deconstruction Hook: Expose Pi's internal state for TNF Forge optimization
     */
    getInternalMetrics(): {
        sleeveId: string;
        parentAgentId: string;
        tinyPromptTokens: number;
        piCoreVersion: string;
        messageCount: number;
        lastUpdated: string;
    };
}
//# sourceMappingURL=pi-synapse.d.ts.map