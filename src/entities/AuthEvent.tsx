// filepath: src/entities/AuthEvent.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { User } from './User.js';

@Entity("auth_events")
export class AuthEvent {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @ManyToOne(() => User, (user) => user.authEvents)
  @JoinColumn( { name: "user_id" })
  user?: User;

  @Column({ name: "user_id", nullable: true })
  userId?: string;

  @Column()
  type: string;

  @Column( { nullable: true })
  ip?: string;

  @Column({ name: "user_agent", nullable: true })
  userAgent?: string;

  @CreateDateColumn( { name: "created_at" })
  createdAt: Date;

  @Column({ type: "jsonb", nullable: true })
  metadata?: Record<string, any>;
}
