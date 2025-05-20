import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { AgentLLMConfig } from '../types/llm.types.js';

@Entity()
export class Agent {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column()
    name!: string;

    @Column()
    description!: string;

    @Column('simple-array')
    capabilities!: string[];

    @Column('jsonb')
    config!: {
        llm: AgentLLMConfig;
        memory: {
            enabled: boolean;
            maxSize: number;
            ttl: number;
        };
        tools: {
            allowed: string[];
            config: Record<string, unknown>;
        };
    };

    @Column('jsonb', { nullable: true })
    state?: Record<string, unknown>;

    @Column('jsonb', { nullable: true })
    metrics?: {
        requests: number;
        tokensUsed: number;
        averageResponseTime: number;
        lastActive: Date;
    };

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;

    constructor(partial: Partial<Agent>) {
        Object.assign(this, partial);
    }
}
