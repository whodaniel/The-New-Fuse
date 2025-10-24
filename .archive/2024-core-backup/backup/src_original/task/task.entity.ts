import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum TaskStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled'
}

export enum TaskPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent'
}

export enum TaskType {
  DATA_PROCESSING = 'data_processing',
  COMMUNICATION = 'communication',
  ANALYSIS = 'analysis',
  WORKFLOW = 'workflow',
  SYSTEM = 'system'
}

@Entity('tasks')
@Index(['status', 'priority'])
@Index(['type', 'status'])
@Index(['createdAt'])
export class TaskEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({
    type: 'enum',
    enum: TaskType,
    default: TaskType.SYSTEM
  })
  type!: TaskType;

  @Column({
    type: 'enum',
    enum: TaskStatus,
    default: TaskStatus.PENDING
  })
  status!: TaskStatus;

  @Column({
    type: 'enum',
    enum: TaskPriority,
    default: TaskPriority.MEDIUM
  })
  priority!: TaskPriority;

  @Column({ type: 'varchar', length: 255 })
  title!: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column('jsonb', { nullable: true })
  payload?: any;

  @Column('jsonb', { nullable: true })
  metadata?: any;

  @Column('jsonb', { nullable: true })
  result?: any;

  @Column('jsonb', { nullable: true })
  configuration?: any;

  @Column({ type: 'uuid', nullable: true })
  assignedTo?: string;

  @Column({ type: 'uuid', nullable: true })
  createdBy?: string;

  @Column({ type: 'timestamp', nullable: true })
  scheduledAt?: Date;

  @Column({ type: 'timestamp', nullable: true })
  startedAt?: Date;

  @Column({ type: 'timestamp', nullable: true })
  completedAt?: Date;

  @Column({ type: 'int', default: 0 })
  retryCount!: number;

  @Column({ type: 'int', default: 3 })
  maxRetries!: number;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}