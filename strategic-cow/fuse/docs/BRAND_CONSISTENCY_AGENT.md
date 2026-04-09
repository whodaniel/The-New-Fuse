# Brand Consistency Self-Improving Agent

> An AI agent that maintains and improves visual consistency across The New Fuse
> platform

## Overview

The **BrandConsistencyGuardian** is a self-improving agent built on the TNF
Three Pillars architecture. It analyzes UI components for brand consistency and
evolves its detection capabilities over time.

## Features

### 🎨 Brand Analysis

- **Color Checking**: Detects non-brand hex colors
- **Typography Enforcement**: Flags non-Inter/Outfit fonts
- **Spacing Validation**: Ensures values are on 4px grid
- **Animation Standards**: Checks for 200ms transition durations
- **Pattern Compliance**: Enforces 0.5rem border radius

### 🧠 Self-Improvement

- Learns from analysis feedback
- Evolves its core prompt automatically
- Tracks detection accuracy and success rates
- Stores learnings persistently in the database

### 📊 Metrics & Reporting

- Consistency scores per component
- Issue severity classification
- Summary reports across codebase
- Brand CSS variable generation

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                 BRAND CONSISTENCY AGENT                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │                    AGENT CORE                            │   │
│   │  ┌──────────────┐ ┌────────────┐ ┌───────────────────┐  │   │
│   │  │ Brand Config │ │ Analyzers  │ │ Self-Improvement  │  │   │
│   │  │ (Tokens)     │ │ (Rules)    │ │ (Learning)        │  │   │
│   │  └──────────────┘ └────────────┘ └───────────────────┘  │   │
│   └─────────────────────────────────────────────────────────┘   │
│                              │                                   │
│   ┌──────────────────────────┴─────────────────────────────┐    │
│   │                    THREE PILLARS                        │    │
│   │  🏰 Orchestrator    💓 Heartbeat    📡 Message Broker  │    │
│   └─────────────────────────────────────────────────────────┘   │
│                              │                                   │
│   ┌──────────────────────────┴─────────────────────────────┐    │
│   │                    PERSISTENCE                          │    │
│   │  ┌────────────────┐            ┌───────────────────┐   │    │
│   │  │ Prompt Templates│            │ Analysis Cache    │   │    │
│   │  │ (PostgreSQL)   │            │ (In-Memory)       │   │    │
│   │  └────────────────┘            └───────────────────┘   │    │
│   └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

## Brand Tokens

| Token                      | Value     | Usage                    |
| -------------------------- | --------- | ------------------------ |
| `--tnf-primary`            | `#6366f1` | Primary actions, links   |
| `--tnf-secondary`          | `#8b5cf6` | Gradients, accents       |
| `--tnf-accent`             | `#06b6d4` | Highlights, focus states |
| `--tnf-background`         | `#0f172a` | Page/card backgrounds    |
| `--tnf-text`               | `#f8fafc` | Primary text color       |
| `--tnf-border-radius`      | `0.5rem`  | Consistent corners       |
| `--tnf-animation-duration` | `200ms`   | Standard transitions     |

## API Endpoints

| Method | Endpoint                                      | Description                   |
| ------ | --------------------------------------------- | ----------------------------- |
| GET    | `/api/agents/brand-consistency/info`          | Get agent info and state      |
| POST   | `/api/agents/brand-consistency/analyze`       | Analyze a single component    |
| POST   | `/api/agents/brand-consistency/analyze-batch` | Analyze multiple components   |
| POST   | `/api/agents/brand-consistency/feedback`      | Provide feedback for learning |
| GET    | `/api/agents/brand-consistency/summary`       | Get analysis summary          |
| GET    | `/api/agents/brand-consistency/brand-css`     | Get generated CSS variables   |
| POST   | `/api/agents/brand-consistency/demo`          | Run a demonstration           |

## Usage Example

### Analyze a Component

```bash
curl -X POST http://localhost:3001/api/agents/brand-consistency/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "componentPath": "src/components/Button.tsx",
    "componentCode": "export const Button = () => <button style={{background: \"#ff0000\"}}>Click</button>"
  }'
```

### Provide Feedback

```bash
curl -X POST http://localhost:3001/api/agents/brand-consistency/feedback \
  -H "Content-Type: application/json" \
  -d '{
    "issueType": "color",
    "wasHelpful": true,
    "learnedPattern": "Red buttons should use primary gradient"
  }'
```

## Self-Improvement Process

1. **Analysis** → Agent analyzes component for brand issues
2. **Detection** → Issues are categorized by type and severity
3. **Feedback** → Developer provides feedback on accuracy
4. **Learning** → Successful patterns are stored
5. **Evolution** → Every 5 patterns, the core prompt is updated
6. **Persistence** → New prompt version saved to database

## Demo Script

Run the standalone demonstration:

```bash
cd apps/api
npx tsx src/scripts/demo-brand-agent.ts
```

This will:

- Analyze 3 sample components
- Detect brand inconsistencies
- Learn new patterns
- Evolve the agent's prompt
- Generate brand CSS

## Integration with Three Pillars

### Orchestrator Integration

```typescript
// Register with swarm
await swarmService.registerAgent(agencyId, {
  name: 'BrandConsistencyGuardian',
  type: 'specialized',
  capabilities: ['brand-analysis', 'style-enforcement', 'self-improvement'],
  qualityScore: 0.95,
});
```

### Message Broker Integration

```typescript
// Subscribe to style tasks
await brokerService.subscribe({
  agentId: 'brand-consistency-agent',
  filter: { type: 'STYLE_CHECK_REQUEST' },
  callback: async (message) => {
    const analysis = await this.analyzeComponent(
      message.payload.path,
      message.payload.code
    );
    await brokerService.sendMessage({
      type: 'STYLE_CHECK_RESULT',
      to: message.from,
      payload: { analysis },
    });
  },
});
```

## Files

| File                                            | Description            |
| ----------------------------------------------- | ---------------------- |
| `src/agents/brand-consistency-agent.service.ts` | Main agent service     |
| `src/agents/brand-consistency-agent.module.ts`  | NestJS module          |
| `src/agents/brand-consistency.controller.ts`    | REST API controller    |
| `src/scripts/demo-brand-agent.ts`               | Standalone demo script |

---

_Last Updated: December 17, 2024_
