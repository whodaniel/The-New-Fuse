# Agentverse Interaction System

## Overview
The Agentverse interaction system provides a rich set of features for users to interact with the environment and agents:

### Basic Interactions
- Left-click selection of agents and tiles
- Right-click context menus
- Drag and drop functionality
- Pinch-to-zoom (mobile support)
- Mouse wheel zoom
- Keyboard shortcuts

### Interaction Modes
- SELECT: Default mode for selecting and inspecting
- DRAG: For moving agents and objects
- PAINT: For modifying terrain and placing objects

### Context Menus
- Agent-specific actions (Inspect, Configure, Delete)
- Tile-specific actions (Place Agent, Modify Terrain)
- Custom action support through event system

## Usage Example

```typescript
// Initialize interaction manager
const interactionManager = new InteractionManager(scene);

// Switch interaction modes
interactionManager.setMode(InteractionMode.DRAG);

// Listen for selection events
scene.events.on('SELECTION_CHANGED', ({ agent, tile }) => {
  if (agent) {
    // Handle agent selection
  } else if (tile) {
    // Handle tile selection
  }
});
```

## Asset Loading System

### Structure
Assets are organized into categories:
- Zones (tiles, decorations, ambient effects)
- Agents (sprites, animations)
- Effects (particles, sprites)
- UI (icons, frames)

### Loading Process
1. Asset manifest defines all required resources
2. Asynchronous loading with progress tracking
3. Automatic animation creation
4. Event-based loading status updates

### Example Usage

```typescript
const assetLoader = new AssetLoader(scene);

// Load all assets
await assetLoader.loadAll();

// Track loading progress
scene.events.on('LOADING_PROGRESS', (progress) => {
  updateLoadingBar(progress);
});
```

## Best Practices
1. Always handle loading errors gracefully
2. Use appropriate interaction modes for different operations
3. Implement proper cleanup in your scene shutdown
4. Consider mobile-first interaction patterns
5. Maintain consistent feedback for user actions

## Performance Considerations
- Asset loading is chunked to prevent memory spikes
- Interaction handlers use event delegation
- Animations are created once and reused
- Context menus are created on-demand