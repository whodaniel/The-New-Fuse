import * as Phaser from "phaser";
import { AgentManager } from '../managers/AgentManager.js';
import { EnvironmentManager } from '../managers/EnvironmentManager.js';
import { InteractionManager } from '../managers/InteractionManager.js';
import { IsometricPlugin } from '../plugins/IsometricPlugin.js';

export class AgentverseScene extends Phaser.Scene {
  private agentManager: AgentManager;
  private environmentManager: EnvironmentManager;
  private interactionManager: InteractionManager;
  private isometricPlugin: IsometricPlugin;

  constructor() {
    super({ key: "AgentverseScene" });
  }

  preload(): void {
    // Load assets for different zones
    this.load.atlas("tiles", "assets/tiles.png", "assets/tiles.json");
    this.load.atlas("agents", "assets/agents.png", "assets/agents.json");
    this.load.atlas("effects", "assets/effects.png", "assets/effects.json");
  }

  create(): void {
    // Initialize managers
    this.isometricPlugin = this.plugins.get("IsometricPlugin");
    this.environmentManager = new EnvironmentManager(this);
    this.agentManager = new AgentManager(this);
    this.interactionManager = new InteractionManager(this);

    // Initialize WebSocket connection
    this.initializeNetworking();

    // Setup camera
    this.cameras.main.setZoom(1);
    this.cameras.main.setBounds(0, 0, 2000, 2000);
  }

  update(time: number, delta: number): void {
    this.agentManager.update(delta);
    this.environmentManager.update(delta);
    this.interactionManager.update(delta);
  }

  private initializeNetworking(): void {
    const socket = this.game.registry.get("socket");

    socket.on("AGENT_UPDATE", (data: any) => {
      this.agentManager.updateAgent(data);
    });

    socket.on("ENVIRONMENT_UPDATE", (data: any) => {
      this.environmentManager.handleUpdate(data);
    });
  }
}
