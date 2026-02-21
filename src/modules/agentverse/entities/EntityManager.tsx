export class EntityManager {
  private entities: Map<string, Entity>;
  private spatialIndex: SpatialHashGrid;
  private updateQueue: PriorityQueue<EntityUpdate>;

  constructor(private scene: AgentverseScene) {
    this.entities = new Map();
    this.spatialIndex = new SpatialHashGrid(64);
    this.updateQueue = new PriorityQueue();
  }

  addEntity(entity: Entity) {
    this.entities.set(entity.id, entity);
    this.spatialIndex.insert(entity);

    // Integration with The New Fuse's agent system
    if (entity.type === "agent") {
      this.registerWithAgentSystem(entity);
    }
  }

  private registerWithAgentSystem(entity: Entity) {
    const agentMessage: AgentMessage = {
      type: "AGENT_SPAWN",
      timestamp: new Date().toISOString(),
      metadata: {
        version: "1.0",
        priority: "medium",
        source: "agentverse",
      },
      details: {
        agentId: entity.id,
        position: entity.position,
        capabilities: entity.capabilities,
      },
    };

    // Use The New Fuse's Redis pub/sub system
    this.scene.client.publish("agent:broadcast", agentMessage);
  }

  update(delta: number) {
    while (!this.updateQueue.isEmpty()) {
      const update = this.updateQueue.dequeue();
      this.processEntityUpdate(update);
    }

    // Update visual representations
    for (const entity of this.entities.values()) {
      entity.sprite.setPosition(entity.position.x, entity.position.y);
      entity.updateEffects(delta);
    }
  }
}
