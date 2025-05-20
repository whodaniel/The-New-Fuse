// filepath: src/entities/Pipeline.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from "typeorm";
import { User } from './User.js';
import { Agent } from './Agent.js';

@Entity("pipelines")
export class Pipeline {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  name: string;

  @Column( { type: "text", nullable: true })
  description?: string;

  @Column({ default: "active" })
  status: string;

  @Column( { type: "jsonb", nullable: true })
  config?: Record<string, any>;

  @ManyToOne(() => User, (user) => user.pipelines)
  @JoinColumn({ name: "user_id" })
  user?: User;

  @Column({ name: "user_id" })
  userId: string;

  @ManyToOne(() => Agent, (agent) => agent.pipelines)
  @JoinColumn( { name: "agent_id" })
  agent?: Agent;

  @Column({ name: "agent_id", nullable: true })
  agentId?: string;

  @CreateDateColumn( { name: "created_at" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt: Date;

  @Column( { name: "deleted_at", nullable: true })
  deletedAt?: Date;
}
