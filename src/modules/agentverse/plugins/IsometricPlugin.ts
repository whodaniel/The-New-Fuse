import * as Phaser from "phaser";

export class IsometricPlugin extends Phaser.Plugins.ScenePlugin {
  private tileWidth: number = 64;
  private tileHeight: number = 32;

  constructor(
    scene: Phaser.Scene,
    pluginManager: Phaser.Plugins.PluginManager,
  ) {
    super(scene, pluginManager);
  }

  worldToTileXY(worldX: number, worldY: number): { x: number; y: number } {
    // Convert world coordinates to isometric tile coordinates
    const x = (worldX / this.tileWidth + worldY / this.tileHeight) / 2;
    const y = (worldY / this.tileHeight - worldX / this.tileWidth) / 2;

    return { x: Math.floor(x), y: Math.floor(y) };
  }

  tileToWorldXY(tileX: number, tileY: number): { x: number; y: number } {
    // Convert tile coordinates to world coordinates
    const x = (tileX - tileY) * this.tileWidth;
    const y = ((tileX + tileY) * this.tileHeight) / 2;

    return { x, y };
  }

  setTileSize(width: number, height: number): void {
    this.tileWidth = width;
    this.tileHeight = height;
  }
}
