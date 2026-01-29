---
id: moe-topk-routing
name: MOE Top-K Routing Pattern
category: routing
complexity: moderate
tech_stack: [kimi-orchestrator, mcp, relay]
mermaid_supported: true
multimodal_compatible: true
created: 2026-01-29
version: 1.0.0
related_patterns: ['agent-pool-management', 'load-balancer-auxiliary-loss']
---

# MOE Top-K Routing Pattern

## Overview

Implements Mixture-of-Experts (MOE) style routing for multi-agent systems.
Routes tasks to only the top-K most capable agents (typically K=1 or 2),
enabling sparse activation and improved efficiency.

## Use Cases

- **Large agent pools**: When managing 50+ specialized agents
- **Efficiency requirements**: Minimize token usage by activating only relevant
  agents
- **Load balancing**: Prevent "favorite agent" collapse through noise injection
- **Specialized tasks**: Route to domain experts automatically

## Architecture

```mermaid
%%{init: {'theme': 'base', 'themeVariables': { 'primaryColor': '#e1f5fe', 'primaryTextColor': '#01579b'}}}%%
flowchart TD
    Start([Task Received]) --> Analyze[Analyze Task Requirements]
    Analyze --> Score[Calculate Agent Scores]
    Score --> Noise[Inject Noise<br/>Prevents Collapse]
    Noise --> TopK{Select Top-K}
    TopK -->|K=1| Expert1[Expert A<br/>Highest Score]
    TopK -->|K=2| Expert2[Expert B<br/>Second Highest]
    Expert1 --> Capacity1{Check Capacity}
    Expert2 --> Capacity2{Check Capacity}
    Capacity1 -->|Available| Exec1[Execute Task]
    Capacity2 -->|Available| Exec2[Execute Task]
    Capacity1 -->|Full| Overflow1[Overflow Handler]
    Capacity2 -->|Full| Overflow2[Overflow Handler]
    Exec1 --> Combine[Weighted Combine]
    Exec2 --> Combine
    Overflow1 --> Combine
    Overflow2 --> Combine
    Combine --> Result([Task Result])

    style Start fill:#e1f5fe,stroke:#01579b,stroke-width:3px
    style Result fill:#e1f5fe,stroke:#01579b,stroke-width:3px
    style TopK fill:#fff3e0,stroke:#e65100,stroke-width:2px
    style Capacity1 fill:#fff3e0,stroke:#e65100,stroke-width:2px
    style Capacity2 fill:#fff3e0,stroke:#e65100,stroke-width:2px
    style Expert1 fill:#e8f5e9,stroke:#2e7d32,stroke-width:2px
    style Expert2 fill:#e8f5e9,stroke:#2e7d32,stroke-width:2px
```

## Mathematical Foundation

### Noisy Top-K Gating

```
H(x)i = (x · Wg)i + StandardNormal() · Softplus((x · Wnoise)i)
G(x) = Softmax(KeepTopK(H(x), k))
```

Where:

- `x` = task embedding
- `Wg` = gating network weights
- `Wnoise` = noise generation weights
- `k` = number of experts to activate (typically 1-2)

## Implementation

### TypeScript Example

```typescript
// Reference implementation in packages/kimi-orchestrator/src/

class MoEAgentRouter {
  async routeTask(task: Task): Promise<AgentAssignment> {
    // 1. Calculate routing scores for all agents
    const scores = await this.calculateRoutingScores(task);

    // 2. Add noise for load balancing (prevents collapse)
    const noisyScores = this.noiseInjector.addNoise(scores);

    // 3. Select top-k agents (k=1 or 2 typically)
    const topK = this.selectTopK(noisyScores, this.config.topK);

    // 4. Check capacity constraints
    const availableAgents = topK.filter((agent) =>
      this.capacityManager.canAcceptTask(agent.id)
    );

    // 5. Handle overflow if needed
    if (availableAgents.length === 0) {
      return this.handleCapacityOverflow(task, topK);
    }

    // 6. Return weighted assignment
    return this.createWeightedAssignment(task, availableAgents);
  }
}
```

### Key Components

| Component         | Purpose                    | Implementation        |
| ----------------- | -------------------------- | --------------------- |
| `GatingNetwork`   | Score agents by capability | ML model or heuristic |
| `NoiseInjector`   | Prevent routing collapse   | Gaussian noise        |
| `TopKSelector`    | Choose best K agents       | Argmax/ArgTopK        |
| `CapacityManager` | Check agent availability   | Counter/semaphore     |
| `OverflowHandler` | Handle saturated agents    | Reroute/residual      |

## Load Balancing

### Auxiliary Loss

Prevents "favorite agent" collapse by penalizing uneven distribution:

```typescript
function calculateAuxiliaryLoss(
  expertLoads: Map<string, number>,
  totalTokens: number
): number {
  const idealLoad = totalTokens / expertLoads.size;
  let loss = 0;

  for (const [expertId, load] of expertLoads) {
    const deviation = (load - idealLoad) / idealLoad;
    loss += Math.pow(deviation, 2);
  }

  return loss / expertLoads.size;
}
```

### Capacity Factor

```typescript
interface CapacityConfig {
  // Capacity factor determines max tokens per expert
  // CF = 1.0 → max capacity = (total_tokens / num_experts)
  // CF = 1.25 → 25% buffer for uneven distribution
  capacityFactor: number;

  // Overflow handling strategy
  overflowStrategy: 'residual' | 'drop' | 'reroute';
}
```

## Performance Characteristics

| Metric           | Dense Routing | MOE Top-K |
| ---------------- | ------------- | --------- |
| Agents Activated | 100%          | 10-20%    |
| Latency          | O(n)          | O(1)      |
| Token Usage      | High          | Low       |
| Load Balance     | Poor          | Excellent |
| Accuracy         | Baseline      | +5-10%    |

## Related Patterns

- **Agent Pool Management**
  ([`../agent-pool-management/`](../agent-pool-management/)) - Base pattern for
  agent lifecycle
- **Load Balancer Auxiliary Loss**
  ([`../load-balancer-auxiliary-loss/`](../load-balancer-auxiliary-loss/)) -
  Mathematical foundation
- **Sparse Activation** ([`../sparse-activation/`](../sparse-activation/)) -
  General sparse routing principles

## References

1. Shazeer et al. (2017) - "Outrageously Large Neural Networks"
2. Fedus et al. (2021) - "Switch Transformers"
3. TNF KIMI Orchestrator -
   [`packages/kimi-orchestrator/`](../../../../packages/kimi-orchestrator/)

## Changelog

- **v1.0.0** (2026-01-29) - Initial pattern documentation based on KIMI K2.5 MOE
  research
