// filepath: src/entities/TaskExecution.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { User } from './User.js';
import { Task } from './Task.js';

@Entity("task_executions")
export class TaskExecution {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @ManyToOne(() => Task, (task) => task.executions)
  @JoinColumn( { name: "task_id" })
  task: Task;

  @Column({ name: "task_id" })
  taskId: string;

  @Column()
  status: string;

  @Column( { type: "text", nullable: true })
  result?: string;

  @Column({ name: "started_at", nullable: true })
  startedAt?: Date;

  @Column( { name: "completed_at", nullable: true })
  completedAt?: Date;

  @ManyToOne(() => User)
  @JoinColumn({ name: "executed_by" })
  executedByUser?: User;

  @Column({ name: "executed_by", nullable: true })
  executedBy?: string;

  @Column( { type: "jsonb", nullable: true })
  metadata?: Record<string, any>;

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;
}
