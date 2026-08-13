import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
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
    default: 'user',
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

  compileWithXML(instructions: string, context: string, tools: string): string {
    return `<instructions>\n${instructions}\n</instructions>\n\n<context>\n${context}\n</context>\n\n<tools>\n${tools}\n</tools>`;
  }
}

export class ContextBudgetManager {
  static enforceBudget(history: string[], maxTokens: number = 4096): string[] {
    let currentTokens = 0;
    const prunedHistory: string[] = [];
    // Start from the most recent messages (end of array)
    for (let i = history.length - 1; i >= 0; i--) {
      const msg = history[i];
      const estimatedTokens = msg.length / 4;
      if (currentTokens + estimatedTokens <= maxTokens) {
        prunedHistory.unshift(msg);
        currentTokens += estimatedTokens;
      } else {
        // If we hit the budget, optionally add a summary block instead of just cutting off
        prunedHistory.unshift('<system>Previous context pruned due to budget constraints</system>');
        break;
      }
    }
    return prunedHistory;
  }
}
