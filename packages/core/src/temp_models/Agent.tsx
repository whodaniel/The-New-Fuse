import { Entity, PrimaryGeneratedColumn, Column, OneToMany, ManyToOne, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { User } from './User.js';
import { Pipeline } from './Pipeline.js';
import { AgentConfig } from './AgentConfig.js';

@Entity()
export class Agent {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column( { type: 'varchar', length: 255 })
    name!: string;

    @Column({ type: 'text', nullable: true })
    description?: string;

    @Column( { type: 'jsonb', nullable: true })
    config!: AgentConfig;

    @Column({ default: 'active' })
    status!: 'active' | 'inactive' | 'error';

    @CreateDateColumn( { type: 'timestamp' })
    createdAt!: Date;

    @UpdateDateColumn({ type: 'timestamp' }): Date;

    @ManyToOne(() => User, user => user.agents, { onDelete: 'CASCADE' })
    owner!: User;

    @OneToMany(() => Pipeline, pipeline => pipeline.agent)
    pipelines!: Pipeline[];

    constructor(partial?: Partial<Agent>) {
        if(partial): void {
            Object.assign(this, partial);
        }
    }
}
