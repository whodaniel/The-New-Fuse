import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Agent } from './agent.entity';
import { Workflow } from './workflow.entity';

@Entity('workflow_steps')
export class WorkflowStep {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  name!: string;

  @Column()
  type!: string;

  @Column({ type: 'jsonb' })
  config!: Record<string, any>;

  @ManyToOne(() => Workflow, (workflow) => workflow.steps)
  workflow!: Workflow;

  @ManyToOne(() => Agent, (agent) => agent.workflowSteps, { nullable: true })
  agent?: Agent;

  @Column('simple-array')
  nextSteps!: string[];

  @Column({ type: 'jsonb', nullable: true })
  conditions!: Record<string, any>;

  @Column({ type: 'jsonb', nullable: true })
  transformations!: Record<string, any>;

  @Column({ type: 'jsonb', nullable: true })
  metadata!: Record<string, any>;

  @Column({ default: true })
  isActive!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @Column({ nullable: true })
  lastExecutedAt?: Date;

  @Column({ type: 'jsonb', nullable: true })
  statistics!: {
    averageExecutionTime?: number;
    successRate?: number;
    lastExecutionStatus?: string;
    errorCount?: number;
  };
}
