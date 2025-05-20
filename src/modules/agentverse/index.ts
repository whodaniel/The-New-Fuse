import * as Phaser from "phaser";
import { AgentverseScene } from './core/AgentverseScene.js';
import { IsometricPlugin } from './plugins/IsometricPlugin.js';
import { AgentverseConfig } from './types.js';

export class Agentverse {
  private game: Phaser.Game;
  private config: AgentverseConfig;

  constructor(containerId: string, config: AgentverseConfig) {
    this.config = config;

    const gameConfig: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      parent: containerId,
      width: 800,
      height: 600,
      scene: AgentverseScene,
      plugins: {
        scene: [
          {
            key: "IsometricPlugin",
            plugin: IsometricPlugin,
            mapping: "iso",
          },
        ],
      },
      physics: {
        default: "arcade",
        arcade: {
          gravity: { y: 0 },
          debug: process.env.NODE_ENV === "development",
        },
      },
    };

    this.game = new Phaser.Game(gameConfig);
    this.game.registry.set("agentverseConfig", config);
  }

  destroy(): void {
    this.game.destroy(true);
  }
}

export * from './types.js';
