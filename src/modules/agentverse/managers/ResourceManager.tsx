export class ResourceManager {
  private scene: AgentverseScene;
  private resources: Map<string, ResourceNode>;
  private flowSimulation: LuminaFlowSimulation;

  constructor(scene: AgentverseScene) {
    this.scene = scene;
    this.resources = new Map();
    this.flowSimulation = new LuminaFlowSimulation({
      gridSize: 64,
      flowRate: 0.5,
      decayRate: 0.1,
    });
  }

  public spawnResource(
    type: ResourceType,
    position: Vector3,
    amount: number,
  ): void {
    const resourceId = `resource_${Date.now()}`;
    const resource = new ResourceNode(this.scene, {
      id: resourceId,
      type,
      position,
      amount,
      visualConfig: this.getResourceVisualConfig(type),
    });

    this.resources.set(resourceId, resource);
    this.updateResourceDistribution();
  }

  public harvestResource(resourceId: string, amount: number): number {
    const resource = this.resources.get(resourceId);
    if (resource) {
      return resource.harvest(amount);
    }
    return 0;
  }

  private getResourceVisualConfig(type: ResourceType): ResourceVisualConfig {
    switch (type) {
      case "aetherShard":
        return {
          sprite: "aether_crystal",
          particleEffect: "aether_glow",
          scale: 1.2,
        };
      case "dataCrystal":
        return {
          sprite: "data_crystal",
          particleEffect: "data_pulse",
          scale: 1.0,
        };
      case "luminaNode":
        return {
          sprite: "lumina_core",
          particleEffect: "lumina_flow",
          scale: 1.5,
        };
      default:
        return {
          sprite: "generic_resource",
          particleEffect: "generic_glow",
          scale: 1.0,
        };
    }
  }

  public update(delta: number): void {
    this.flowSimulation.update(delta);
    this.resources.forEach((resource) => resource.update(delta));
    this.updateResourceVisualization();
  }

  private updateResourceVisualization(): void {
    this.resources.forEach((resource) => {
      const flowIntensity = this.flowSimulation.getFlowAt(resource.position);
      resource.updateVisuals(flowIntensity);
    });
  }
}
