import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Agent } from './agent.entity.js';
import { PromptTemplate } from './prompt.entity.js';

@Entity('agent_prompts')
export class AgentPrompt {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('uuid')
  agentId!: string;

  @ManyToOne(() => Agent, { nullable: false })
  @JoinColumn({ name: 'agentId' })
  agent!: Agent;

  @Column('uuid')
  promptId!: string;

  @ManyToOne(() => PromptTemplate, { nullable: false })
  @JoinColumn({ name: 'promptId' })
  prompt!: PromptTemplate;

  @Column({
    type: 'enum',
    enum: ['system', 'user', 'function', 'response'],
    default: 'user'
  })
  purpose!: 'system' | 'user' | 'function' | 'response';

  @Column('jsonb', { nullable: true })
  config?: Record<string, any>;

  @Column('jsonb', { nullable: true })
  formatOptions?: {
    format: 'text' | 'json' | 'markdown';
  };

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
