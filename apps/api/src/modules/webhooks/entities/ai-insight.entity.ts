import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('ai_insights')
export class AiInsight {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'organization_id', type: 'uuid' })
  organizationId!: string;

  @Column({ type: 'varchar', length: 50 })
  type!: string;

  @Column({ type: 'decimal', precision: 3, scale: 2 })
  confidence!: number;

  @Column({ type: 'text' })
  description!: string;

  @Column({ type: 'jsonb' })
  data!: Record<string, any>;

  @Column({ type: 'text', array: true })
  recommendations!: string[];

  @Column({ type: 'varchar', length: 20 })
  impact!: string;

  @Column({ type: 'varchar', length: 20, default: 'active' })
  status!: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @Column({ name: 'expires_at', type: 'timestamp', nullable: true })
  expiresAt?: Date;
}
