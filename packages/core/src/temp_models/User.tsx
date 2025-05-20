import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { Agent } from './Agent.js';
import { Pipeline } from './Pipeline.js';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true, type: 'varchar', length: 255 })
  username!: string;

  @Column({ unique: true, type: 'varchar', length: 255 })
  email!: string;

  @Column({ nullable: true, type: 'varchar', length: 255, name: 'hashed_password' })
  hashedPassword?: string;

  @Column({ default: true, type: 'boolean' })
  isActive!: boolean;

  @Column({ default: false, type: 'boolean' })
  emailVerified!: boolean;

  @Column('simple-array', { nullable: true })
  roles?: string[];

  @CreateDateColumn({ type: 'timestamp' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt!: Date;

  @OneToMany(() => Agent, (agent) => agent.owner)
  agents!: Agent[];

  @OneToMany(() => Pipeline, (pipeline) => pipeline.user)
  pipelines!: Pipeline[];

  constructor(partial?: Partial<User>) {
    if (partial) {
      Object.assign(this, partial);
    }
  }

  hasRole(role: string): boolean {
    return this.roles?.includes(role) ?? false;
  }
}
