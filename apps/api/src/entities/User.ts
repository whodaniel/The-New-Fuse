import { Entity, PrimaryGeneratedColumn, Column, OneToMany, CreateDateColumn, UpdateDateColumn, DeleteDateColumn } from 'typeorm';
import { Exclude } from 'class-transformer';
import { Agent } from './Agent';
import { Pipeline } from './Pipeline';
import { AuthSession } from './AuthSession';
import { LoginAttempt } from './LoginAttempt';
import { AuthEvent } from './AuthEvent';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  email: string;

  @Column()
  @Exclude()
  hashedPassword: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  name: string;

  @Column({ type: 'varchar', length: 50, default: 'user' })
  role: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  refreshToken: string | null;

  @OneToMany(() => Agent, agent => agent.user)
  agents: Agent[];

  @OneToMany(() => Pipeline, pipeline => pipeline.user)
  pipelines: Pipeline[];

  @OneToMany(() => AuthSession, session => session.user)
  authSessions: AuthSession[];

  @OneToMany(() => LoginAttempt, attempt => attempt.user)
  loginAttempts: LoginAttempt[];

  @OneToMany(() => AuthEvent, event => event.user)
  authEvents: AuthEvent[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date;
}
