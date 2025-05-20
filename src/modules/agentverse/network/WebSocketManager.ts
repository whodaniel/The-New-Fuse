export class WebSocketManager
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  private server: Server;
  private readonly logger = new Logger(WebSocketManager.name);

  constructor(
    private readonly redisService: RedisService,
    private readonly securityConfig: SecurityConfig,
    private readonly monitoringService: MonitoringService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      await this.authenticateClient(client);
      await this.initializeClientSession(client);
    } catch (error) {
      this.logger.error(`Connection failed: ${error.message}`);
      client.disconnect();
    }
  }

  @SubscribeMessage("agent:action")
  async handleAgentAction(
    @MessageBody() data: unknown,
    @ConnectedSocket() client: Socket,
  ) {
    const actionMetrics = {
      type: data.type,
      timestamp: Date.now(),
      success: true,
      context: {
        taskId: data.taskId,
        resourceType: data.resourceType,
        action: data.action,
      },
    };

    try {
      // Process agent action
      await this.processAgentAction(data);

      // Broadcast metrics
      this.server.emit("agent:metrics", actionMetrics);

      // Track metrics
      await this.monitoringService.trackTraeMetrics({
        responseTime: Date.now() - actionMetrics.timestamp,
        memoryUsage: process.memoryUsage().heapUsed,
        activeTasks: this.getActiveTasks(),
        successRate: 1,
      });
    } catch (error) {
      actionMetrics.success = false;
      this.handleError(error, client);
    }
  }

  @SubscribeMessage("task:update")
  async handleTaskUpdate(@MessageBody() data: TaskUpdate) {
    const message: AICoderMessage = {
      type: "task",
      payload: {
        taskId: data.taskId,
        status: data.status,
        progress: data.progress,
        metadata: data.metadata,
      },
      timestamp: Date.now(),
      sender: "trae",
      receiver: "augment",
      messageId: crypto.randomUUID(),
    };

    await this.redisService.publishToChannel(
      "ai-coordination",
      JSON.stringify(message),
    );
  }

  private async processAgentAction(data: any) {
    // Validate message structure
    if (!this.validateMessageStructure(data)) {
      throw new Error("Invalid message structure");
    }

    // Process based on action type
    switch (data.action) {
      case "MOVE":
        await this.handleAgentMove(data);
        break;
      case "INTERACT":
        await this.handleAgentInteraction(data);
        break;
      case "TASK_COMPLETE":
        await this.handleTaskCompletion(data);
        break;
    }
  }

  private async handleAgentMove(data: any) {
    const moveMessage = {
      type: "agent:moved",
      payload: {
        agentId: data.agentId,
        position: data.position,
        timestamp: Date.now(),
      },
    };

    this.server.emit("world:update", moveMessage);
  }

  private async handleAgentInteraction(data: any) {
    const interactionMessage = {
      type: "agentverse:interaction",
      payload: {
        sourceAgent: data.sourceAgent,
        targetAgent: data.targetAgent,
        interactionType: data.interactionType,
        context: data.context,
      },
    };

    this.server.emit("world:event", interactionMessage);
  }
}
