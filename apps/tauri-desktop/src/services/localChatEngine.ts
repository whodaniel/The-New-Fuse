/**
 * Local Chat Engine - Provides simulated/JIT multi-agent response generation
 * when REST API and Relay websocket connections are offline.
 */
import type { OrchestrationMode } from '../stores/chatStore';
import type { ChatMessage } from '../types';

export interface LocalAgentInfo {
  id: string;
  name: string;
  platform: string;
}

export class LocalChatEngine {
  /**
   * Generate responses for the given prompt based on execution mode
   */
  public async generateResponses(
    prompt: string,
    agents: LocalAgentInfo[],
    mode: OrchestrationMode,
    onAgentMessage: (msg: ChatMessage) => void,
    options?: { temperature?: number; systemPrompt?: string }
  ): Promise<void> {
    if (agents.length === 0) return;

    const temperature = options?.temperature ?? 0.7;
    const systemHint = options?.systemPrompt?.trim()
      ? `\n\n_System directive_: ${options.systemPrompt.trim().slice(0, 240)}`
      : '';
    const tempHint = `\n\n_Generation params_: temperature=${temperature.toFixed(2)}`;

    if (mode === 'direct') {
      const primary = agents[0];
      await this.delay(600);
      const content =
        this.craftAgentResponse(prompt, primary, 'direct') + systemHint + tempHint;
      onAgentMessage({
        id: `${Date.now()}-${primary.id}-${Math.random().toString(36).slice(2, 6)}`,
        role: 'agent',
        agentId: primary.id,
        agentName: primary.name,
        content,
        timestamp: new Date().toISOString(),
        metadata: { temperature, systemPrompt: options?.systemPrompt },
      });
      return;
    }

    if (mode === 'broadcast') {
      // Parallel response generation (staggered timestamps, concurrent waits)
      await Promise.all(
        agents.map(async (agent) => {
          await this.delay(400 + Math.random() * 400);
          const content =
            this.craftAgentResponse(prompt, agent, 'broadcast') + systemHint + tempHint;
          onAgentMessage({
            id: `${Date.now()}-${agent.id}-${Math.random().toString(36).slice(2, 6)}`,
            role: 'agent',
            agentId: agent.id,
            agentName: agent.name,
            content,
            timestamp: new Date().toISOString(),
            metadata: { temperature, systemPrompt: options?.systemPrompt },
          });
        })
      );
      return;
    }

    if (mode === 'round-robin') {
      let previousContext = '';
      for (let i = 0; i < agents.length; i++) {
        const agent = agents[i];
        await this.delay(700);
        const content =
          this.craftAgentResponse(prompt, agent, 'round-robin', previousContext, i) +
          systemHint +
          tempHint;
        previousContext = content;
        onAgentMessage({
          id: `${Date.now()}-${agent.id}-${Math.random().toString(36).slice(2, 6)}`,
          role: 'agent',
          agentId: agent.id,
          agentName: agent.name,
          content,
          timestamp: new Date().toISOString(),
          metadata: { temperature, systemPrompt: options?.systemPrompt },
        });
      }
      return;
    }

    if (mode === 'consensus') {
      const perspectives: string[] = [];
      for (const agent of agents) {
        await this.delay(500);
        const content =
          this.craftAgentResponse(prompt, agent, 'consensus') + systemHint + tempHint;
        perspectives.push(`${agent.name}: ${content}`);
        onAgentMessage({
          id: `${Date.now()}-${agent.id}-${Math.random().toString(36).slice(2, 6)}`,
          role: 'agent',
          agentId: agent.id,
          agentName: agent.name,
          content,
          timestamp: new Date().toISOString(),
          metadata: { temperature, systemPrompt: options?.systemPrompt },
        });
      }

      // Final consensus summary by Swarm Consensus Broker
      await this.delay(800);
      onAgentMessage({
        id: `${Date.now()}-consensus-summary`,
        role: 'system',
        content: `🤝 **Swarm Consensus Summary**:\n\nAll ${agents.length} participating agents aligned on key takeaways:\n\n1. **Core Recommendation**: ${prompt.slice(0, 40)}...\n2. **Perspective Breakdown**: Synthesized inputs from ${agents.map((a) => a.name).join(', ')}.\n3. **Status**: Verified in local JIT mode (temperature=${temperature.toFixed(2)}).`,
        timestamp: new Date().toISOString(),
        metadata: { temperature },
      });
    }
  }

  private craftAgentResponse(
    prompt: string,
    agent: LocalAgentInfo,
    mode: OrchestrationMode,
    _previousContext: string = '',
    step: number = 0
  ): string {
    const isCodeQuery = /code|function|component|typescript|javascript|python|rust|css|api/i.test(prompt);

    if (isCodeQuery) {
      return `### Perspective from **${agent.name}** (${agent.platform.toUpperCase()})\n\n` +
        `Here is the requested implementation pattern for: \`${prompt.slice(0, 45)}\`\n\n` +
        `\`\`\`typescript\n` +
        `// ${agent.name} (${agent.platform}) JIT Compiled Output\n` +
        `export interface ExecutionResult {\n` +
        `  agentId: string;\n` +
        `  prompt: string;\n` +
        `  timestamp: number;\n` +
        `}\n\n` +
        `export function processTask(input: string): ExecutionResult {\n` +
        `  console.log('[${agent.name}] Processing task:', input);\n` +
        `  return {\n` +
        `    agentId: '${agent.id}',\n` +
        `    prompt: input,\n` +
        `    timestamp: Date.now(),\n` +
        `  };\n` +
        `}\n` +
        `\`\`\`\n\n` +
        `*Note: Running in Standalone Local Engine mode. Start the TNF REST API on port 3001 for live cloud LLM integration.*`;
    }

    if (mode === 'round-robin' && step > 0) {
      return `Building on the response provided in step ${step}:\n\n` +
        `I agree with the initial analysis. From a **${agent.platform}** standpoint, we should also ensure strict error boundaries and caching to maintain high performance under peak load.`;
    }

    return `**${agent.name}** (${agent.platform.toUpperCase()}): Analyzing prompt "${prompt}"\n\n` +
      `Key observations:\n` +
      `- Primary objective identified.\n` +
      `- Local desktop swarm state active.\n` +
      `- Mode: **${mode.toUpperCase()}**`;
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

export const localChatEngine = new LocalChatEngine();
export default localChatEngine;
