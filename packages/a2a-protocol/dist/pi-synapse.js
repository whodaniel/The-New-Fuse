"use strict";
/**
 * TNF Pi-Synapse Adapter
 *
 * Part of the "Universal Assimilation & Deconstruction" directive.
 * This adapter allows a TNF agent to "possess" a Pi.dev Agent Core,
 * leveraging its low-latency tool loop and tiny-prompt efficiency.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.PiSynapseAdapter = exports.PiSynapseMetadata = void 0;
const pi_agent_core_1 = require("@mariozechner/pi-agent-core");
const pi_ai_1 = require("@mariozechner/pi-ai");
/**
 * PiSynapse Metadata - Extension of A2A Agent Card
 */
exports.PiSynapseMetadata = pi_ai_1.Type.Object({
    sleeveId: pi_ai_1.Type.String(),
    parentAgentId: pi_ai_1.Type.String(),
    tinyPromptTokens: pi_ai_1.Type.Number(),
    piCoreVersion: pi_ai_1.Type.String(),
});
/**
 * The Pi-Synapse Orchestrator
 * Maps TNF Synaptic Bus commands to Pi Agent Loop
 */
class PiSynapseAdapter {
    constructor(config) {
        this.piAgent = new pi_agent_core_1.Agent({
            initialState: {
                systemPrompt: 'You are a TNF high-performance execution sleeve. Execute tools with 100% precision.',
                model: (0, pi_ai_1.getModel)(config.modelProvider, config.modelName),
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
    async executeSleeveTask(prompt, onEvent) {
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
exports.PiSynapseAdapter = PiSynapseAdapter;
//# sourceMappingURL=pi-synapse.js.map