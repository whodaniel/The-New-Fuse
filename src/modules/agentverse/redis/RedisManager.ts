export class RedisManager {
  private readonly channels = {
    coordination: "AI_COORDINATION_CHANNEL",
    task: "AI_TASK_CHANNEL",
    result: "AI_RESULT_CHANNEL",
  };

  constructor(private redisService: RedisService) {
    this.initializeSubscriptions();
  }

  private async initializeSubscriptions() {
    for (const channel of Object.values(this.channels)) {
      await this.redisService.subscribe(channel, (message) => {
        this.handleRedisMessage(channel, message);
      });
    }
  }

  private async handleRedisMessage(channel: string, message: string) {
    const parsedMessage = JSON.parse(message);

    switch (channel) {
      case this.channels.coordination:
        await this.handleCoordinationMessage(parsedMessage);
        break;
      case this.channels.task:
        await this.handleTaskMessage(parsedMessage);
        break;
      case this.channels.result:
        await this.handleResultMessage(parsedMessage);
        break;
    }
  }

  async publishStateUpdate(state: any) {
    const message: AICoderMessage = {
      type: "sync",
      payload: state,
      timestamp: Date.now(),
      sender: "trae",
      receiver: "augment",
      messageId: crypto.randomUUID(),
    };

    await this.redisService.publishToChannel(
      this.channels.coordination,
      JSON.stringify(message),
    );
  }
}
