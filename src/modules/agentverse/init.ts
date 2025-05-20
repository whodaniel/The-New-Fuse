import { Agentverse } from './index.js';
import { AgentverseConfig } from './types.js';

export function initializeAgentverse(containerId: string): void {
  const config: AgentverseConfig = {
    scenes: {
      algorithmicCore: {
        id: "algo-core",
        name: "Algorithmic Core",
        theme: {
          primary: "#00ff87",
          secondary: "#001a33",
          ambient: ["dataFlow", "logicPulse"],
          effects: [],
        },
        boundaries: {
          minX: 0,
          maxX: 100,
          minY: 0,
          maxY: 100,
        },
        spawnPoints: [],
        interactiveElements: [],
      },
      lexicalLabyrinth: {
        // Similar configuration for other zones
      },
      cogsmithCanals: {
        // Configuration for Cogsmith Canals
      },
      neuralNexus: {
        // Configuration for Neural Nexus
      },
    },
    rendering: {
      isometric: {
        tileSize: 64,
        tileHeight: 32,
        gridSize: {
          width: 100,
          height: 100,
        },
      },
      effects: {
        particles: true,
        lighting: true,
        shadows: true,
        postProcessing: true,
      },
      performance: {
        maxAgents: 100,
        cullingDistance: 1000,
        effectsQuality: "high",
      },
    },
  };

  new Agentverse(containerId, config);
}
