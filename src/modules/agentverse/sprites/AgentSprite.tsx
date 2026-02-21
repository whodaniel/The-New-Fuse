import * as Phaser from "phaser";
import { VisualEffect } from '../types/effects.js';

export class AgentSprite extends Phaser.GameObjects.Sprite {
  private effects: Map<string, Phaser.GameObjects.Particles.ParticleEmitter>;
  private currentTask: string | null = null;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    private visualProperties: {
      sprite: string;
      animations: string[];
      effects: VisualEffect[];
    },
  ) {
    super(scene, x, y, visualProperties.sprite);
    this.effects = new Map();
    this.initializeEffects();
    scene.add.existing(this);
  }

  showCodeCompilationEffect(): void {
    const emitter = this.effects.get("compilation");
    if (emitter) {
      emitter.start();
      this.scene.time.delayedCall(2000, () => emitter.stop());
    }
  }

  showDataFlowEffect(): void {
    const emitter = this.effects.get("dataFlow");
    if (emitter) {
      emitter.start();
      this.scene.time.delayedCall(1500, () => emitter.stop());
    }
  }

  private initializeEffects(): void {
    // Initialize particle effects
    const particles = this.scene.add.particles(0, 0, "effects");

    this.effects.set(
      "compilation",
      particles.createEmitter({
        frame: "code",
        lifespan: 1000,
        speed: { min: 50, max: 100 },
        scale: { start: 0.5, end: 0 },
        blendMode: "ADD",
      }),
    );

    this.effects.set(
      "dataFlow",
      particles.createEmitter({
        frame: "data",
        lifespan: 800,
        speed: { min: 30, max: 80 },
        scale: { start: 0.3, end: 0 },
        blendMode: "ADD",
      }),
    );
  }
}
