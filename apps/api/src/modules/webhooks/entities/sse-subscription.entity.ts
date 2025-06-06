import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('sse_subscriptions')
export class SseSubscription {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'client_id', type: 'varchar', length: 255 })
  clientId: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @Column({ name: 'organization_id', type: 'uuid' })
  organizationId: string;

  @Column({ name: 'event_types', type: 'text', array: true })
  eventTypes: string[];

  @Column({ type: 'jsonb', nullable: true })
  filters?: Record<string, any>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @Column({ 
    name: 'last_heartbeat', 
    type: 'timestamp', 
    default: () => 'CURRENT_TIMESTAMP' 
  })
  lastHeartbeat: Date;
}