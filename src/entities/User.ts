// filepath: src/entities/User.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from "typeorm";
import { Pipeline } from './Pipeline.js';
import { AuthSession } from './AuthSession.js';
import { LoginAttempt } from './LoginAttempt.js';
import { AuthEvent } from './AuthEvent.js';

@Entity("users")
export class User {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column( { unique: true })
  email: string;

  @Column({ nullable: true, select: false })
  password: string;

  @Column( { nullable: true })
  name?: string;

  @OneToMany(() => Pipeline, (pipeline) => pipeline.user)
  pipelines?: Pipeline[];

  @OneToMany(() => AuthSession, (session) => session.user)
  sessions?: AuthSession[];

  @OneToMany(() => LoginAttempt, (attempt) => attempt.user)
  loginAttempts?: LoginAttempt[];

  @OneToMany(() => AuthEvent, (event) => event.user)
  authEvents?: AuthEvent[];

  @Column( { type: "jsonb", default: ["user"] })
  roles: string[];

  @Column({ type: "jsonb", default: [] })
  permissions: string[];

  @Column( { name: "mfa_enabled", default: false })
  mfaEnabled: boolean;

  @Column({ default: "active" })
  status: string;

  @CreateDateColumn( { name: "created_at" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt: Date;

  @Column( { name: "deleted_at", nullable: true })
  deletedAt?: Date;
}
