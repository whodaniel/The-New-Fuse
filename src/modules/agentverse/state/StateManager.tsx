export class StateManager {
  private durableObjectId: string;
  private redisClient: Redis;
  private stateCache: LRUCache<string, any>;

  constructor(private scene: AgentverseScene) {
    this.durableObjectId = crypto.randomUUID();
    this.stateCache = new LRUCache({
      max: 1000,
      maxAge: 1000 * 60 * 5, // 5 minutes
    });

    this.initializeRedis();
  }

  async saveState() {
    const state = this.scene.getSerializableState();

    // Save to Cloudflare Durable Objects
    await this.saveToDurableObject(state);

    // Publish state update
    await this.redisClient.publish("agentverse:state", {
      type: "STATE_UPDATE",
      timestamp: new Date().toISOString(),
      data: state,
    });
  }

  private async saveToDurableObject(state: any) {
    const durableObject = await getDurableObject(this.durableObjectId);
    await durableObject.put("state", state);
  }
}
