"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AgentProcessor = void 0;
const common_1 = require("@nestjs/common");
const common_2 = require("@the-new-fuse/api-types/src/common");
/**
 * Main processor for an agent instance.
 * Routes incoming messages to the appropriate specialized processor (Command, Task, Notification).
 */
class AgentProcessor {
    logger;
    agentId;
    constructor(agentId) {
        this.agentId = agentId;
        this.logger = new common_1.Logger(`AgentProcessor [${this.agentId}]);

    this.logger.log('AgentProcessor initialized.');
  }

  /**
   * Processes a single incoming message by routing it to the appropriate processor.
   * @param message The message to process.
   */
  async processMessage(message: unknown): Promise<void> {
    const typedMessage = message as Message;
`, this.logger.debug(`Processing message ${typedMessage.id}`, of, type, $, { typedMessage, : .type }));
        try {
            switch (typedMessage.type) {
                case common_2.MessageType.COMMAND:
                    // await this.commandProcessor.process(typedMessage);
                    break;
                case common_2.MessageType.TASK_ASSIGNMENT:
                    // await this.taskProcessor.process(typedMessage);
                    break;
                case common_2.MessageType.NOTIFICATION:
                    // await this.notificationProcessor.process(typedMessage);
                    break;
                default:
                    `
          this.logger.warn(`;
                    Received;
                    message;
                    $;
                    {
                        typedMessage.id;
                    }
                    ` with unhandled type: ${typedMessage.type});
          break;
      }
    } catch (error) {`;
                    this.logger.error(Unhandled, error, processing, message, $, { typedMessage, : .id } ` (Type: ${typedMessage.type}): ${error.message}`);
            }
        }
        /**
         * Starts the agent processor (e.g., connecting to message queues, starting listeners).
         */
        finally {
        }
        /**
         * Starts the agent processor (e.g., connecting to message queues, starting listeners).
         */
        async;
        start();
        Promise < void  > {
            this: .logger.log('Starting AgentProcessor...'),
            this: .logger.log('AgentProcessor started.')
        };
        /**
         * Stops the agent processor gracefully.
         */
        async;
        stop();
        Promise < void  > {
            this: .logger.log('Stopping AgentProcessor...'),
            this: .logger.log('AgentProcessor stopped.')
        };
    }
}
exports.AgentProcessor = AgentProcessor;
//# sourceMappingURL=AgentProcessor.js.map