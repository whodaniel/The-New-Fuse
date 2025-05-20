// filepath: src/entities/LoginAttempt.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { User } from './User.js';

@Entity("login_attempts")
export class LoginAttempt {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @ManyToOne(() => User, (user) => user.loginAttempts)
  @JoinColumn( { name: "user_id" })
  user?: User;

  @Column({ name: "user_id", nullable: true })
  userId?: string;

  @Column()
  email: string;

  @Column()
  success: boolean;

  @Column( { nullable: true })
  ip?: string;

  @Column({ name: "user_agent", nullable: true })
  userAgent?: string;

  @CreateDateColumn( { name: "created_at" })
  createdAt: Date;

  @Column({ type: "jsonb", nullable: true })
  metadata?: Record<string, any>;
}
