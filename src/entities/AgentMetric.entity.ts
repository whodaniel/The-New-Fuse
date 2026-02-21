import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';
import { MetricType } from '../types/metrics.js';

@Entity()
export class AgentMetric {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    agentId: string;

    @Column()
    type: MetricType;

    @Column('float')
    value: number;

    @CreateDateColumn()
    timestamp: Date;

    @Column('json', { nullable: true })
    metadata: Record<string, any>;
}