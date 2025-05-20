# System Integration Architecture

## Overview
This document describes how the core systems of The New Fuse are integrated within the AgentverseScene.

## Core Systems

### Entity Management
- `EntityManager`: Handles all agent entities in the scene
- `AgentAvatar`: Visual representation of agents
- Integration point: `AgentverseScene.entityManager`

### Resource System
- Manages resource spawning, harvesting, and Lumina flows
- Integration point: `AgentverseScene.resourceManager`
- Event handlers: `resource:spawn`, `resource:harvest`, `lumina:flow`

### Guild System
- Handles territory control and guild influence
- Integration point: `AgentverseScene.guildSystem`
- Event handlers: `guild:claim`, `guild:influence`

### Narrative System
- Manages Sage encounters and Guardian challenges
- Integration point: `AgentverseScene.narrativeManager`
- Event handlers: `sage:encounter`, `guardian:challenge`, `quest:progress`

## State Management

### Serialization
All systems implement state serialization through:
- `getSerializableState()`: Returns current state
- `loadState(state)`: Restores from saved state

### State Interfaces
```typescript
interface AgentverseState {
  currentZone: string;
  aetherLevel: number;
  activeEffects: Effect[];
  narrativeState: NarrativeState;
  resourceState: ResourceState;
  guildState: GuildState;
}
```

## Event System
Core game events are handled through Phaser's event system. Key events:
- Agent lifecycle: spawn, move, interact
- Resource management: spawn, harvest
- Guild activities: territory claims, influence changes
- Narrative progression: sage encounters, guardian challenges

## Integration Points
See `src/modules/agentverse/scene/AgentverseScene.ts` for implementation details.