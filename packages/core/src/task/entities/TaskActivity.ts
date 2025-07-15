import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Task } from './Task';

export enum TaskActivityType {
  CREATED = 'created',
  UPDATED = 'updated',
  ASSIGNED = 'assigned',
  COMMENTED = 'commented',
  DELETED = 'deleted',
  STATUS_CHANGED = 'status_changed',
  PRIORITY_CHANGED = 'priority_changed',
}

@Entity('task_activities')
export class TaskActivity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Task, task => task.activities)
  @JoinColumn({ name: 'taskId' })
  task: Task;

  @Column()
  taskId: string;

  @Column({
    type: 'enum',
    enum: TaskActivityType,
  })
  type: TaskActivityType;

  @Column({ type: 'jsonb', nullable: true })
  data: Record<string, any>;

  @Column({ type: 'uuid', nullable: true })
  userId: string;

  @CreateDateColumn()
  createdAt: Date;

  @Column({ type: 'text', nullable: true })
  description: string;
}