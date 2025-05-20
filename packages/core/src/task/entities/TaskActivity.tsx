import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn } from 'typeorm';
import { Task } from './Task.js';
import { User } from '../../user/entities/User.js';

export enum TaskActivityType {
  CREATED = 'created',
  UPDATED = 'updated',
  STATUS_CHANGED = 'status_changed',
  ASSIGNED = 'assigned',
  COMMENTED = 'commented',
  ATTACHMENT_ADDED = 'attachment_added',
  DELETED = 'deleted'
}

@Entity()
export class TaskActivity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Task, { onDelete: 'CASCADE' })
  task: Task;

  @Column()
  taskId: string;

  @ManyToOne(() => User)
  actor: User;

  @Column()
  actorId: string;

  @Column({
    type: 'enum',
    enum: TaskActivityType
  })
  type: TaskActivityType;

  @Column('jsonb')
  changes: Record<string, unknown>;

  @CreateDateColumn()
  createdAt: Date;
}