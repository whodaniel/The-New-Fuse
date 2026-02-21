export interface AgentverseConfig {
  scenes: {
    algorithmicCore: SceneConfig;
    lexicalLabyrinth: SceneConfig;
    cogsmithCanals: SceneConfig;
    neuralNexus: SceneConfig;
  };
  rendering: {
    isometric: IsometricConfig;
    effects: EffectsConfig;
    performance: PerformanceConfig;
  };
}

export interface SceneConfig {
  id: string;
  name: string;
  theme: ThemeConfig;
  boundaries: Boundary;
  spawnPoints: SpawnPoint[];
  interactiveElements: InteractiveElement[];
}

export interface IsometricConfig {
  tileSize: number;
  tileHeight: number;
  gridSize: {
    width: number;
    height: number;
  };
}

export interface AgentData {
  id: string;
  type: AgentType;
  position: Vector3;
  state: AgentState;
  visualProperties: {
    sprite: string;
    animations: string[];
    effects: VisualEffect[];
  };
  taskData: {
    current: TaskInfo | null;
    history: TaskInfo[];
    performance: PerformanceMetrics;
  };
}
