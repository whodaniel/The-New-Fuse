import { Column, Entity, PrimaryColumn } from 'typeorm';
// import { AgentHierarchy } from './agent_hierarchy.js';
// import { Department } from './departments.js';
// import { Task } from './task.js';
// import { AgentAction } from './agent_action.js';
// import { APIModel } from './api_model.js';
import { ObjectType, Field, Int } from '@nestjs/graphql';

export enum AgentType {
    HUMAN = 'human',
    AI = 'ai',
}

export enum IntegrationLevel {
    STANDALONE = 'standalone',
    BASIC = 'basic',
    ADVANCED = 'advanced',
    FULL = 'full',
}

export enum AgentStatus {
    ACTIVE = 'active',
    IDLE = 'idle',
    BUSY = 'busy',
    OFFLINE = 'offline',
    LEARNING = 'learning',
}

@ObjectType()
@Entity()
export class Agent {
    @Field(() => String)
    @PrimaryColumn()
    id: string;

    @Field(() => String)
    @Column({ unique: true, nullable: false })
    name: string;

    @Field(() => String)
    @Column({ nullable: false })
    role: string;

    @Field(() => String, { nullable: true })
    @Column({ nullable: true })
    type: AgentType;

    @Field(() => String)
    @Column()
    channel: string;

    @Field(() => [String])
    @Column('json', { name: 'capabilities' })
    capabilities: string[];

    @Field(() => String)
    @Column({
        type: 'enum',
        enum: IntegrationLevel,
        default: IntegrationLevel.BASIC
    })
    integrationLevel: IntegrationLevel;

    @Field(() => String)
    @Column({
        type: 'enum',
        enum: AgentStatus,
        default: AgentStatus.IDLE
    })
    status: AgentStatus;

    @Field(() => Boolean)
    @Column({ default: true })
    isActive: boolean;

    @Field(() => String, { nullable: true })
    @Column({ nullable: true })
    lastSeen: Date;
    
    // @OneToMany(() => Task, task => task.agent)
    // tasks: Task[];

    // @OneToMany(() => AgentAction, action => action.agent)
    // actions: AgentAction[];

    // @ManyToOne(() => Department, department => department.agents)
    // @JoinColumn({ name: 'departmentId' })
    // department: Department;

    // @OneToMany(() => AgentHierarchy, hierarchy => hierarchy.parent)
    // children: AgentHierarchy[];

    // @OneToMany(() => AgentHierarchy, hierarchy => hierarchy.child)
    // parents: AgentHierarchy[];

    @Column({ nullable: true })
    departmentId?: string;

    @Field(() => Int)
    @Column({ default: 0 })
    taskCount: number;

    @Field(() => Int)
    @Column({ default: 0 })
    successCount: number;

    @Field(() => Int)
    @Column({ default: 0 })
    failureCount: number;

    @Field(() => String, { nullable: true })
    @Column({ nullable: true })
    apiKey?: string;

    // @ManyToOne(() => APIModel)
    // @JoinColumn({ name: 'modelId' })
    // model?: APIModel;

    @Column({ nullable: true })
    modelId?: string;

    @Field(() => Date)
    @Column()
    createdAt: Date;

    @Field(() => Date)
    @Column()
    updatedAt: Date;
}
