import * as Phaser from "phaser";
import { IsometricTileMap } from '../core/IsometricTileMap.js';
import { ZoneRenderer } from '../renderers/ZoneRenderer.js';

export class EnvironmentManager {
  private tileMap: IsometricTileMap;
  private scene: Phaser.Scene;
  private zoneRenderers: Map<string, ZoneRenderer> = new Map();

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.initializeTileMap();
    this.setupZoneRenderers();
  }

  private initializeTileMap(): void {
    const config = this.scene.game.registry.get("agentverseConfig");
    this.tileMap = new IsometricTileMap(this.scene, {
      tileWidth: config.rendering.isometric.tileSize,
      tileHeight: config.rendering.isometric.tileHeight,
      gridSize: config.rendering.isometric.gridSize,
    });
  }

  private setupZoneRenderers(): void {
    // Initialize renderers for different zones
    this.zoneRenderers.set("algorithmic", new ZoneRenderer("crystalline"));
    this.zoneRenderers.set("lexical", new ZoneRenderer("library"));
    this.zoneRenderers.set("cogsmith", new ZoneRenderer("steampunk"));
    this.zoneRenderers.set("neural", new ZoneRenderer("bioluminescent"));
  }

  update(delta: number): void {
    this.tileMap.update(delta);
    this.updateEnvironmentalEffects(delta);
  }

  private updateEnvironmentalEffects(delta: number): void {
    this.zoneRenderers.forEach((renderer) => renderer.update(delta));
  }

  handleUpdate(data: any): void {
    if (data.tiles) {
      this.updateTiles(data.tiles);
    }
    if (data.effects) {
      this.updateEffects(data.effects);
    }
  }

  private updateTiles(tiles: any[]): void {
    tiles.forEach((tile) => {
      this.tileMap.updateTile(tile.x, tile.y, tile.type, tile.properties);
    });
  }

  private updateEffects(effects: any[]): void {
    effects.forEach((effect) => {
      const renderer = this.zoneRenderers.get(effect.zone);
      if (renderer) {
        renderer.triggerEffect(effect.type, effect.parameters);
      }
    });
  }
}
