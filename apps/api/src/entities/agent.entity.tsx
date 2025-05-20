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
import { AgentType } from '../dtos/agent.dto.js';
import { Message } from './message.entity.js';
import { WorkflowStep } from './workflow-step.entity.js';

@Entity('agents')
export class Agent {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  name!: string;

  @Column({
    type: 'enum',
    enum: AgentType,
  })
  type!: AgentType;

  @Column({ type: 'jsonb', nullable: true })
  config!: Record<string, any>;

  @Column({ nullable: true })
  description?: string;

  @Column({ nullable: true })
  instanceId?: string;

  @Column({ default: true })
  isActive!: boolean;

  @ManyToOne(() => User, (user) => user.agents)
  owner!: User;

  @OneToMany(() => Message, (message) => message.agent)
  messages!: Message[];

  @OneToMany(() => WorkflowStep, (step) => step.agent)
  workflowSteps!: WorkflowStep[];

  @Column({ type: 'jsonb', nullable: true })
  capabilities!: string[];

  @Column({ type: 'jsonb', nullable: true })
  metadata!: Record<string, any>;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @Column({ nullable: true })
  lastActiveAt?: Date;
}
