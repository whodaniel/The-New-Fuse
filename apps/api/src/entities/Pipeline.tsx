import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, CreateDateColumn, UpdateDateColumn, DeleteDateColumn } from 'typeorm';
import { User } from './User.js';
import { Agent } from './Agent.js';
import { Task } from './Task.js';

@Entity()
export class Pipeline {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  description: string;

  @Column({ type: 'jsonb', nullable: true })
  configuration: Record<string, any>;

  @ManyToOne(() => User, user => user.pipelines)
  user: User;

  @Column()
  userId: string;

  @ManyToOne(() => Agent, agent => agent.pipelines)
  agent: Agent;

  @Column()
  agentId: string;

  @OneToMany(() => Task, task => task.pipeline)
  tasks: Task[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date;
}
