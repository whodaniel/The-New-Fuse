import { Message } from '../../types/communication.js';
import { AICoderMessage } from '../../websocket/types.js';

export class AIInteractionSystem {
  private activeAgents: Map<string, AIAgent>;
  private messageQueue: PriorityQueue<Message>;
  private readonly channels = {
    coordination: "AI_COORDINATION_CHANNEL",
    task: "AI_TASK_CHANNEL",
    result: "AI_RESULT_CHANNEL",
  };

  constructor(
    private redisService: RedisService,
    private monitoringService: MonitoringService,
  ) {
    this.activeAgents = new Map();
    this.messageQueue = new PriorityQueue();
    this.initializeChannels();
  }

  async handleAgentInteraction(message: Message) {
    const { header, body } = message;

    // Track metrics
    await this.monitoringService.trackTraeMetrics({
      responseTime: Date.now() - new Date(body.metadata.sent_at).getTime(),
      memoryUsage: process.memoryUsage().heapUsed,
      activeTasks: this.activeAgents.size,
      successRate: 1,
    });

    // Process based on message type
    switch (header.type) {
      case "TASK_ASSIGNMENT":
        await this.handleTaskAssignment(body.content);
        break;
      case "AGENT_COORDINATION":
        await this.coordinateAgents(body.content);
        break;
      case "KNOWLEDGE_SHARING":
        await this.shareKnowledge(body.content);
        break;
    }
  }

  private async coordinateAgents(content: any) {
    const aiCoderMessage: AICoderMessage = {
      type: "task",
      payload: {
        action: "coordinate",
        agents: Array.from(this.activeAgents.keys()),
        context: content,
      },
      timestamp: Date.now(),
      sender: "trae",
      receiver: "augment",
      messageId: crypto.randomUUID(),
    };

    await this.redisService.publishToChannel(
      this.channels.coordination,
      JSON.stringify(aiCoderMessage),
    );
  }

  private async shareKnowledge(content: any) {
    const affectedAgents = this.getAgentsInRange(content.source, content.range);

    for (const agent of affectedAgents) {
      await agent.processNewKnowledge({
        type: content.knowledgeType,
        data: content.knowledge,
        source: content.source,
        confidence: content.confidence,
        timestamp: Date.now(),
      });
    }
  }
}
