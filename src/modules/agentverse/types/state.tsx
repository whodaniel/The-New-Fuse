export interface AgentverseState {
  // Core properties from core.ts
  agents: Map<string, AgentState>;
  world: WorldState;
  users: Map<string, UserState>;

  // Extended properties used in AgentverseScene
  aether: AetherState;
  currentZone: string;
  aetherLevel: number;
  activeEffects: Effect[];
  focusPoint: number;
  narrativeState: NarrativeState;
  resourceState: ResourceState;
  guildState: GuildState;
}

export interface AetherState {
  globalLevel: number;
  zoneFlows: Map<string, AetherFlow[]>;
  disturbances: AetherDisturbance[];
}

export interface NarrativeState {
  activeQuests: Quest[];
  sageLocations: Map<string, Vector3>;
  guardianStates: Map<string, GuardianState>;
}

export interface ZoneState {
  type: ZoneType;
  tiles: Array<TileState>;
  aetherLevel: number;
  activeEffects: Array<ZoneEffect>;
  controllingGuild?: string;
  resources: ResourceState;
}

export interface ResourceState {
  resources: ResourceNode[];
  luminaFlows: LuminaFlowData[];
  harvestPoints: HarvestPoint[];
}

export interface AgentVisualProperties {
  baseModel: string;
  accessories: string[];
  animations: Map<string, AnimationConfig>;
  effectsLayer: VisualEffect[];
}

export interface GuildState {
  territoryControl: [string, string][]; // [zoneId, guildId][]
  guildInfluence: InfluenceMapData;
  activeConflicts: TerritoryConflict[];
}

export interface Effect {
  id: string;
  type: string;
  duration: number;
  intensity: number;
}

export interface Vector3 {
  x: number;
  y: number;
  z: number;
}

export interface GuardianState {
  position: Vector3;
  currentChallenge: string | null;
  power: number;
}

export interface LuminaFlowData {
  position: Vector3;
  intensity: number;
  direction: Vector3;
}

export interface HarvestPoint {
  position: Vector3;
  resourceType: string;
  remainingAmount: number;
}

export interface InfluenceMapData {
  width: number;
  height: number;
  data: number[][];
}

export interface TerritoryConflict {
  zoneId: string;
  contestingGuilds: string[];
  influenceScores: Map<string, number>;
  timeRemaining: number;
}
