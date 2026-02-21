export class AetherSystem {
  private scene: AgentverseScene;
  private aetherLevel: number = 100;
  private flows: Map<string, AetherFlow[]> = new Map();
  private disturbances: AetherDisturbance[] = [];
  private particleEmitters: Map<
    string,
    Phaser.GameObjects.Particles.ParticleEmitter
  > = new Map();

  constructor(scene: AgentverseScene) {
    this.scene = scene;
    this.initializeParticleSystems();
  }

  private initializeParticleSystems() {
    const zones = ["algorithmic", "lexical", "cogsmith", "neural"];

    zones.forEach((zone) => {
      this.particleEmitters.set(zone, this.createZoneEmitter(zone));
    });
  }

  private createZoneEmitter(
    zone: string,
  ): Phaser.GameObjects.Particles.ParticleEmitter {
    const config = this.getZoneParticleConfig(zone);
    return this.scene.add.particles(0, 0, config);
  }

  update(delta: number) {
    this.updateAetherFlows(delta);
    this.processDisturbances(delta);
    this.updateParticleSystems(delta);
  }

  private updateAetherFlows(delta: number) {
    this.flows.forEach((flows, zone) => {
      flows.forEach((flow) => {
        flow.intensity += Math.sin(this.scene.time.now / 1000) * 0.1;
        flow.intensity = Phaser.Math.Clamp(flow.intensity, 0, 1);

        this.updateFlowVisuals(zone, flow);
      });
    });
  }

  public getCurrentLevel(): number {
    return this.aetherLevel;
  }

  public getActiveEffects(): string[] {
    return this.disturbances.map((d) => d.effectType);
  }
}
