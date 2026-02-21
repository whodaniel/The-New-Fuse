// filepath: src/entities/AuthSession.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { User } from './User.js';

@Entity("auth_sessions")
export class AuthSession {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @ManyToOne(() => User, (user) => user.sessions)
  @JoinColumn( { name: "user_id" })
  user: User;

  @Column({ name: "user_id" })
  userId: string;

  @Column()
  token: string;

  @Column( { nullable: true })
  ip?: string;

  @Column({ name: "user_agent", nullable: true })
  userAgent?: string;

  @CreateDateColumn( { name: "created_at" })
  createdAt: Date;

  @Column({ name: "expires_at" })
  expiresAt: Date;

  @Column( { type: "jsonb", nullable: true })
  metadata?: Record<string, any>;
}
