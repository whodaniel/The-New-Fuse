# Multi-Agent Voice Routing via KWS Engine

## Architecture

The KWS (Keyword Spotting) engine in `audio-trigger-kws-mvp` can be repurposed
for agent routing by adding agent callsigns as lexicon terms.

## Implementation

### 1. Add Agent Keywords to Lexicon

Update `/apps/audio-trigger-kws-mvp/src/config/default-lexicon.ts`:

```typescript
import { LexiconTerm } from '../types/events';

export const defaultLexicon: LexiconTerm[] = [
  // Existing medical terms
  { termId: 'term_aspirin', surface: 'aspirin', groupId: 'drug', weight: 1 },
  {
    termId: 'term_ibuprofen',
    surface: 'ibuprofen',
    groupId: 'drug',
    weight: 1,
  },

  // Agent routing keywords
  { termId: 'agent_echo', surface: 'echo', groupId: 'agent_route', weight: 1 },
  {
    termId: 'agent_echo_alt',
    surface: 'kilo one',
    groupId: 'agent_route',
    weight: 1,
  },
  {
    termId: 'agent_pulse',
    surface: 'pulse',
    groupId: 'agent_route',
    weight: 1,
  },
  {
    termId: 'agent_pulse_alt',
    surface: 'kilo two',
    groupId: 'agent_route',
    weight: 1,
  },
  {
    termId: 'agent_all',
    surface: 'all stations',
    groupId: 'agent_route',
    weight: 1,
  },

  // Protocol keywords
  { termId: 'proto_over', surface: 'over', groupId: 'protocol', weight: 1 },
  { termId: 'proto_out', surface: 'out', groupId: 'protocol', weight: 1 },
];
```

### 2. Agent Router Service

Create `/apps/audio-trigger-kws-mvp/src/services/agent-router.ts`:

```typescript
import { EventEmitter } from 'node:events';
import { HitEvent } from '../types/events';

interface AgentConfig {
  name: string;
  tty?: string;
  keywords: string[];
}

export class AgentRouter extends EventEmitter {
  private agents: Map<string, AgentConfig> = new Map();
  private pendingMessage: string = '';
  private targetAgent: string | null = null;

  constructor() {
    super();

    this.agents.set('echo', {
      name: 'echo',
      tty: 'ttys095',
      keywords: ['echo', 'kilo one', 'agent alpha'],
    });

    this.agents.set('pulse', {
      name: 'pulse',
      tty: undefined,
      keywords: ['pulse', 'kilo two', 'agent beta'],
    });
  }

  processHit(hit: HitEvent, fullText: string): void {
    if (hit.groupId === 'agent_route') {
      const agent = this.detectAgent(hit.termId);
      if (agent) {
        this.targetAgent = agent;
        this.pendingMessage = fullText;
      }
    }

    if (hit.groupId === 'protocol') {
      if (hit.termId === 'proto_over' || hit.termId === 'proto_out') {
        if (this.targetAgent) {
          this.routeToAgent(this.targetAgent, this.pendingMessage);
          this.targetAgent = null;
          this.pendingMessage = '';
        }
      }
    }
  }

  private detectAgent(termId: string): string | null {
    if (termId.startsWith('agent_echo')) return 'echo';
    if (termId.startsWith('agent_pulse')) return 'pulse';
    if (termId === 'agent_all') return 'all';
    return null;
  }

  private routeToAgent(agent: string, message: string): void {
    console.log(`[ROUTER] Routing to ${agent}: ${message.slice(0, 60)}...`);

    if (agent === 'all') {
      this.broadcast(message);
    } else {
      const config = this.agents.get(agent);
      if (config?.tty) {
        this.injectToTty(config.tty, message);
      }
    }
  }

  private broadcast(message: string): void {
    for (const [name, config] of this.agents) {
      if (config.tty) {
        this.injectToTty(config.tty, `[BROADCAST] ${message}`);
      }
    }
  }

  private injectToTty(tty: string, message: string): void {
    const fs = require('fs');
    try {
      fs.writeFileSync(`/dev/${tty}`, message + '\n');
    } catch (err) {
      console.error(`Failed to inject to ${tty}:`, err);
    }
  }
}
```

### 3. Integration Point

Modify `/apps/audio-trigger-kws-mvp/src/runtime/audio-trigger-runtime.ts`:

```typescript
import { AgentRouter } from '../services/agent-router';

export class AudioTriggerRuntime {
  private agentRouter: AgentRouter;

  constructor() {
    this.agentRouter = new AgentRouter();

    this.kwsEngine.on('hit', (hit: HitEvent) => {
      this.agentRouter.processHit(hit, this.currentText);
    });
  }
}
```

## Flow

```
User speaks: "Echo, status report, over."
  ↓
Voice Server → KWS Gateway → audio-trigger-kws-mvp
  ↓
KWS Engine detects: "echo" (agent_route), "over" (protocol)
  ↓
Agent Router routes to Echo terminal (ttys095)
  ↓
Echo receives transcription, responds
```

## Benefits

1. **Reuse Existing Infrastructure**: KWS engine already optimized for keyword
   detection
2. **Unified Trigger System**: Agent routing uses same mechanism as medical
   triggers
3. **Confidence Scoring**: Built-in confidence levels for keyword matches
4. **Grouping**: Agent keywords can be grouped for alternative names
5. **Extensible**: Easy to add new agents by adding to lexicon

## Next Steps

1. Add agent keywords to default-lexicon.ts
2. Create agent-router.ts service
3. Integrate with audio-trigger-runtime.ts
4. Test routing with Echo terminal
5. Add Pulse terminal configuration
