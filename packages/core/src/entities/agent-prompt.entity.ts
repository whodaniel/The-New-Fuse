import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Agent } from './agent.entity.js';
import { PromptTemplate } from './prompt.entity.js';
import { AgentPromptTemplate as IAgentPromptTemplate } from '../types/prompt.types.js';

@Entity()
export class AgentPromptTemplate extends PromptTemplate implements IAgentPromptTemplate {
    @Column('uuid')
    agentId!: string;

    @ManyToOne(() => Agent)
    @JoinColumn({ name: 'agentId' })
    agent!: Agent;

    @Column()
    purpose!: 'system' | 'user' | 'function' | 'response';

    @Column('jsonb', { nullable: true })
    contextRequirements?: {
        needsHistory?: boolean;
        needsMemory?: boolean;
        needsTools?: boolean;
        needsState?: boolean;
    };

    @Column('jsonb', { nullable: true })
    expectedResponse?: {
        format: 'text' | 'json' | 'markdown' | 'code';
        schema?: object;
    };
}
