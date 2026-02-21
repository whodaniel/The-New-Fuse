import * as Phaser from "phaser";
import { TileType } from '../types/tiles.js';

interface TileMapConfig {
  tileWidth: number;
  tileHeight: number;
  gridSize: {
    width: number;
    height: number;
  };
}

export class IsometricTileMap {
  private tiles: Map<string, Phaser.GameObjects.Sprite> = new Map();
  private scene: Phaser.Scene;
  private config: TileMapConfig;

  constructor(scene: Phaser.Scene, config: TileMapConfig) {
    this.scene = scene;
    this.config = config;
    this.initialize();
  }

  private initialize(): void {
    for (let x = 0; x < this.config.gridSize.width; x++) {
      for (let y = 0; y < this.config.gridSize.height; y++) {
        this.createTile(x, y, "default");
      }
    }
  }

  private createTile(x: number, y: number, type: TileType): void {
    const iso = this.scene.plugins.get("IsometricPlugin");
    const worldPos = iso.tileToWorldXY(x, y);

    const tile = this.scene.add.sprite(worldPos.x, worldPos.y, `tile-${type}`);
    tile.setDepth(y + x);

    this.tiles.set(`${x},${y}`, tile);
  }

  updateTile(x: number, y: number, type: TileType, properties: any): void {
    const key = `${x},${y}`;
    const tile = this.tiles.get(key);

    if (tile) {
      tile.setTexture(`tile-${type}`);
      // Apply properties (tint, effects, etc.)
      if (properties.tint) {
        tile.setTint(properties.tint);
      }
    }
  }

  update(delta: number): void {
    // Update tile animations or effects
    this.tiles.forEach((tile) => {
      // Update tile-specific logic
    });
  }
}
