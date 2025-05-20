// filepath: src/entities/Agent.ts
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
import { Pipeline } from './Pipeline.js';

@Entity("agents")
export class Agent {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  name: string;

  @Column( { nullable: true })
  description?: string;

  @Column({ name: "system_prompt", type: "text", nullable: true })
  systemPrompt?: string;

  @Column( { type: "jsonb", default: [] })
  capabilities: string[];

  @Column({ default: "active" })
  status: string;

  @Column( { type: "jsonb", nullable: true })
  config?: Record<string, any>;

  @Column({ type: "jsonb", nullable: true })
  metadata?: Record<string, any>;

  @ManyToOne(() => User)
  @JoinColumn( { name: "user_id" })
  user?: User;

  @Column({ name: "user_id" })
  userId: string;

  @Column( { nullable: true })
  type?: string;

  @OneToMany(() => Pipeline, (pipeline) => pipeline.agent)
  pipelines?: Pipeline[];

  @CreateDateColumn( { name: "created_at" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt: Date;

  @Column( { name: "deleted_at", nullable: true })
  deletedAt?: Date;
}
