import * as Phaser from "phaser";
import { AgentSprite } from '../sprites/AgentSprite.js';
import { Vector3 } from '../types/core.js';

export class AgentManager {
  private agents: Map<string, AgentSprite> = new Map();
  private scene: Phaser.Scene;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  createAgent(id: string, position: Vector3, properties: any): AgentSprite {
    const { x, y } = this.scene.plugins
      .get("IsometricPlugin")
      .tileToWorldXY(position.x, position.y);
    const agent = new AgentSprite(this.scene, x, y, properties);
    this.agents.set(id, agent);
    return agent;
  }

  updateAgent(data: any): void {
    const agent = this.agents.get(data.id);
    if (agent) {
      const { x, y } = this.scene.plugins
        .get("IsometricPlugin")
        .tileToWorldXY(data.position.x, data.position.y);
      agent.setPosition(x, y);
      if (data.state) {
        agent.setState(data.state);
      }
    }
  }

  update(delta: number): void {
    this.agents.forEach((agent) => agent.update(delta));
  }
}
