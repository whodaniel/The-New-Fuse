import { ProtocolHandler } from '../protocols/ProtocolHandler.js';
import { A2AMessage } from '../protocols/types.js';
import { ConfigurationManager } from '../config/A2AConfig.js';

export class TaskExecutionAgent {
    private protocolHandler: ProtocolHandler;
    private config: ConfigurationManager;
    private taskQueue: Array<A2AMessage>;

    constructor() {
        this.protocolHandler = new ProtocolHandler();
        this.config = ConfigurationManager.getInstance();
        this.taskQueue = [];
    }

    async initialize(): Promise<void> {
        await this.protocolHandler.initialize();
        await this.registerHandlers();
    }

    private async registerHandlers(): Promise<void> {
        this.protocolHandler.onMessage(async (message: A2AMessage) => {
            if (message.type === 'TASK_REQUEST') {
                await this.handleTaskRequest(message);
            }
        });
    }

    private async handleTaskRequest(message: A2AMessage): Promise<void> {
        this.taskQueue.push(message);
        await this.processNextTask();
    }

    private async processNextTask(): Promise<void> {
        if (this.taskQueue.length === 0) return;
        
        const task = this.taskQueue.shift();
        try {
            const result = await this.executeTask(task);
            await this.sendTaskResult(task, result);
        } catch (error) {
            await this.handleTaskError(task, error);
        }
    }

    private async executeTask(task: A2AMessage): Promise<any> {
        // Task execution logic
        return { status: 'completed', result: task.payload };
    }

    private async sendTaskResult(task: A2AMessage, result: any): Promise<void> {
        const response: A2AMessage = {
            type: 'TASK_RESULT',
            payload: result,
            metadata: {
                timestamp: Date.now(),
                sender: 'task-execution-agent',
                protocol_version: this.config.getConfig().protocolVersion
            }
        };
        await this.protocolHandler.sendMessage(task.metadata.sender, response);
    }

    private async handleTaskError(task: A2AMessage, error: any): Promise<void> {
        const errorResponse: A2AMessage = {
            type: 'TASK_ERROR',
            payload: { error: error.message },
            metadata: {
                timestamp: Date.now(),
                sender: 'task-execution-agent',
                protocol_version: this.config.getConfig().protocolVersion
            }
        };
        await this.protocolHandler.sendMessage(task.metadata.sender, errorResponse);
    }
}