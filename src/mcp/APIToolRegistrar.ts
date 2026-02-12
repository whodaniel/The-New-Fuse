export class APIToolRegistrar {
  private registrations = new Map<string, any>();

  async register(agentId: string, apiSpec: any): Promise<void> {
    console.log(`[APIToolRegistrar] Registering API for agent: ${agentId}`);
    this.registrations.set(agentId, apiSpec);
  }

  getSpec(agentId: string): any {
    return this.registrations.get(agentId);
  }
}
