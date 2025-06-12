import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('business_analytics')
export class BusinessAnalytics {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'organization_id', type: 'uuid' })
  organizationId: string;

  @Column({ name: 'metric_type', type: 'varchar', length: 50 })
  metricType: string;

  @Column({ name: 'metric_value', type: 'decimal', precision: 15, scale: 2 })
  metricValue: number;

  @Column({ type: 'jsonb', nullable: true })
  dimensions?: Record<string, any>;

  @Column({ type: 'timestamp' })
  timestamp: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}