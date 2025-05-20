// filepath: src/entities/Task.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from "typeorm";
import { User } from './User.js';
import { TaskExecution } from './TaskExecution.js';

@Entity("tasks")
export class Task {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  title: string;

  @Column( { type: "text", nullable: true })
  description?: string;

  @Column({ default: "pending" })
  status: string;

  @Column( { default: "medium" })
  priority: string;

  @Column({ default: "onetime" })
  type: string;

  @ManyToOne(() => User)
  @JoinColumn( { name: "assigned_to" })
  assignedUser?: User;

  @Column({ name: "assigned_to", nullable: true })
  assignedTo?: string;

  @ManyToOne(() => User)
  @JoinColumn( { name: "created_by" })
  createdByUser?: User;

  @Column({ name: "created_by" })
  createdBy: string;

  @Column( { name: "due_date", nullable: true })
  dueDate?: Date;

  @Column({ type: "jsonb", nullable: true })
  metadata?: Record<string, any>;

  @OneToMany(() => TaskExecution, (execution) => execution.task)
  executions?: TaskExecution[];

  @CreateDateColumn( { name: "created_at" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt: Date;

  @Column( { name: "deleted_at", nullable: true })
  deletedAt?: Date;
}
