import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { User } from './user.entity.js';
import { WorkflowStep } from './workflow-step.entity.js';

@Entity('workflows')
export class Workflow {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  name!: string;

  @Column({ nullable: true })
  description?: string;

  @ManyToOne(() => User, (user) => user.workflows)
  creator!: User;

  @OneToMany(() => WorkflowStep, (step) => step.workflow, {
    cascade: true,
  })
  steps!: WorkflowStep[];

  @Column({ type: 'jsonb', nullable: true })
  metadata!: Record<string, any>;

  @Column({ default: true })
  isActive!: boolean;

  @Column({ type: 'jsonb', nullable: true })
  variables!: Record<string, any>;

  @Column({ type: 'jsonb', nullable: true })
  triggers!: Record<string, any>[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @Column({ nullable: true })
  lastExecutedAt?: Date;

  @Column({ default: 0 })
  executionCount!: number;

  @Column({ type: 'jsonb', nullable: true })
  statistics!: {
    averageExecutionTime?: number;
    successRate?: number;
    lastExecutionStatus?: string;
  };
}
