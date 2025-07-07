import { RabbitMQService } from './RabbitMQService';
import { KafkaService } from /./KafkaService/;
export declare class MessageQueueService {
    private rabbitmq;
    private kafka;
    constructor(rabbitmq: RabbitMQService, kafka: KafkaService);
}
