import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

@Entity('webhook_delivery_logs')
@Index('idx_webhook_delivery_config', ['webhookConfigId'])
@Index('idx_webhook_delivery_event', ['eventId']) 
@Index('idx_webhook_delivery_status', ['deliveryStatus'])
export class WebhookDeliveryLog {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'webhook_config_id', type: 'uuid' })
  webhookConfigId!: string;

  @Column({ name: 'event_id', type: 'uuid' })
  eventId!: string;

  @Column({ name: 'delivery_status', type: 'varchar', length: 20 })
  deliveryStatus!: string;

  @Column({ name: 'http_status', type: 'int', nullable: true })
  httpStatus?: number;

  @Column({ name: 'response_body', type: 'text', nullable: true })
  responseBody?: string;

  @Column({ name: 'error_message', type: 'text', nullable: true })
  errorMessage?: string;

  @Column({ name: 'attempt_count', type: 'int', default: 1 })
  attemptCount!: number;

  @Column({ name: 'delivered_at', type: 'timestamp', nullable: true })
  deliveredAt?: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}