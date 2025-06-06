import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

@Entity('business_events')
@Index(['organizationId', 'type'], { name: 'idx_business_events_org_type' })
@Index(['processingStatus'], { name: 'idx_business_events_status' })
@Index(['createdAt'], { name: 'idx_business_events_created' })
@Index(['correlationId'], { name: 'idx_business_events_correlation' })
export class BusinessEvent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 50 })
  type: string;

  @Column({ type: 'varchar', length: 50 })
  source: string;

  @Column({ name: 'organization_id', type: 'uuid' })
  organizationId: string;

  @Column({ name: 'user_id', type: 'uuid', nullable: true })
  userId?: string;

  @Column({ name: 'correlation_id', type: 'varchar', length: 255, nullable: true })
  correlationId?: string;

  @Column({ type: 'jsonb' })
  data: Record<string, any>;

  @Column({ type: 'jsonb' })
  metadata: Record<string, any>;

  @Column({ 
    name: 'processing_status', 
    type: 'varchar', 
    length: 20, 
    default: 'pending' 
  })
  processingStatus: string;

  @Column({ name: 'retry_count', type: 'int', default: 0 })
  retryCount: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @Column({ name: 'processed_at', type: 'timestamp', nullable: true })
  processedAt?: Date;
}