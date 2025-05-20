// Core types for Agentverse integration
// Note: The full AgentverseState interface is defined in state.ts
// This is just a reference to the core properties
export interface AgentverseState {
  agents: Map<string, AgentState>;
  world: WorldState;
  users: Map<string, UserState>;
  // Extended properties are defined in state.ts
}

export interface AgentState {
  id: string;
  position: Vector2D;
  status: AgentStatus;
  visualProperties: AgentVisualProperties;
  currentTask?: TaskReference;
}

export interface WorldState {
  zones: Map<string, ZoneState>;
  flows: Array<AetherFlow>;
  events: Array<WorldEvent>;
}

export interface ZoneState {
  type: ZoneType; // Algorithmic | Lexical | Cogsmith | Neural
  tiles: Array<TileState>;
  aetherLevel: number;
  activeEffects: Array<ZoneEffect>;
}

export interface Vector3 {
  x: number;
  y: number;
  z: number;
}

export interface Boundary {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

export interface SpawnPoint {
  position: Vector3;
  type: "agent" | "player";
}

export interface InteractiveElement {
  id: string;
  type: string;
  position: Vector3;
  properties: Record<string, unknown>;
}

export interface ThemeConfig {
  primary: string;
  secondary: string;
  ambient: string[];
  effects: EffectConfig[];
}

export interface EffectConfig {
  name: string;
  intensity: number;
  duration: number;
}

export interface PerformanceConfig {
  maxAgents: number;
  cullingDistance: number;
  effectsQuality: "low" | "medium" | "high";
}

export interface EffectsConfig {
  particles: boolean;
  lighting: boolean;
  shadows: boolean;
  postProcessing: boolean;
}
