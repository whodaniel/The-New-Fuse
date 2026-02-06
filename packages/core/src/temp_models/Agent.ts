import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
@Entity('agents')
export class Agent {
  @PrimaryGeneratedColumn('uuid')
  id!: string;
  @Column({ type: 'varchar', length: 255 })
  name!: string;
  @Column({ type: 'text', nullable: true })
  description?: string;
  @Column({ type: 'jsonb', nullable: true })
  capabilities?: Record<string, any>;
  @Column({ type: 'varchar', length: 50, default: 'active' })
  status!: 'active' | 'inactive' | 'error';
  @CreateDateColumn({ type: 'timestamp' })
  createdAt!: Date;
  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt!: Date;
}
