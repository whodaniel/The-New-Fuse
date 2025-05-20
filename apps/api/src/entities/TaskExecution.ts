import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Task } from './Task.js';

@Entity()
export class TaskExecution {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  status: string;

  @Column({ type: 'jsonb', nullable: true })
  output: any;

  @Column({ nullable: true })
  error: string;

  @ManyToOne(() => Task, task => task.taskExecutions)
  task: Task;

  @Column()
  taskId: string;

  @Column({ nullable: true })
  startTime: Date;

  @Column({ nullable: true })
  endTime: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
