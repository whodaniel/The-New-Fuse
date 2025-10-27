import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

// Conflict 1 Resolution: Use the import from 'Incoming'
import { TaskStatus, TaskPriority } from '@the-new-fuse/types';

@Entity('tasks')
@Index(['status', 'priority'])
@Index(['type', 'status'])
@Index(['userId'])
export class Task {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 255 })
  type!: string;

  @Column({
    type: 'enum',
    enum: TaskStatus,
    default: TaskStatus.PENDING,
  })
  status!: TaskStatus;

  @Column({
    type: 'enum',
    enum: TaskPriority,
    default: TaskPriority.MEDIUM,
  })
  priority!: TaskPriority;

  // Conflict 2 Resolution: Merged fields from both branches

  // Keep 'userId' as optional (from 'Incoming')
  @Column({ type: 'varchar', length: 255, nullable: true })
  userId?: string;

  // Kept 'data' (from both)
  @Column('jsonb', { nullable: true })
  data?: any;

  // Keep detailed fields (from 'Current')
  @Column('jsonb', { nullable: true })
  result?: any;

  @Column('jsonb', { nullable: true })
  metadata?: any;

  @Column({ type: 'text', nullable: true })
  error?: string;

  @Column({ type: 'timestamp', nullable: true })
  startTime?: Date;

  @Column({ type: 'timestamp', nullable: true })
  endTime?: Date;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}