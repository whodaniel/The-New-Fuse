import * as Phaser from "phaser";
import { Vector3 } from '../types/core.js';

export class InteractionManager {
  private scene: Phaser.Scene;
  private selectedTile: Vector3 | null = null;
  private selectedAgent: string | null = null;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.initializeInputHandlers();
  }

  private initializeInputHandlers(): void {
    this.scene.input.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
      const iso = this.scene.plugins.get("IsometricPlugin");
      const tilePos = iso.worldToTileXY(pointer.worldX, pointer.worldY);
      this.handleTileClick(tilePos);
    });

    this.scene.input.keyboard.on("keydown-SPACE", () => {
      this.togglePause();
    });
  }

  handleTileClick(position: Vector3): void {
    this.selectedTile = position;
    const agentId = this.findAgentAtTile(position);

    if (agentId) {
      this.selectedAgent = agentId;
      this.scene.events.emit("AGENT_SELECTED", agentId);
    } else {
      this.selectedAgent = null;
      this.scene.events.emit("TILE_SELECTED", position);
    }
  }

  private findAgentAtTile(position: Vector3): string | null {
    // Implementation to find agent at tile position
    return null;
  }

  private togglePause(): void {
    this.scene.scene.pause();
    this.scene.events.emit("GAME_PAUSED");
  }

  update(delta: number): void {
    // Update interaction states
    if (this.selectedAgent) {
      // Update selected agent highlighting
    }
    if (this.selectedTile) {
      // Update selected tile highlighting
    }
  }
}
