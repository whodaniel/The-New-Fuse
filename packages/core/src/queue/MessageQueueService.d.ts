import { RabbitMQService } from './RabbitMQService.js';
import { KafkaService } from './KafkaService.js';
export declare class MessageQueueService {
    private rabbitmq;
    private kafka;
    constructor(rabbitmq: RabbitMQService, kafka: KafkaService);
}
