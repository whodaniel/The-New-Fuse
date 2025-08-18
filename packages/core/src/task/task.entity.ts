import {
  // Implementation needed
}
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { TaskStatus, TaskPriority } from '../types/types';
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
  // Implementation needed
}
    type: 'enum',
    enum: TaskStatus,
    default: TaskStatus.PENDING
  })
  status!: TaskStatus;
  @Column({
  // Implementation needed
}
    type: 'enum',
    enum: TaskPriority,
    default: TaskPriority.MEDIUM
  })
  priority!: TaskPriority;
  @Column('jsonb', { nullable: true })
  data?: any;
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
  @Column({ type: 'uuid' })
  userId!: string;
  @CreateDateColumn()
  createdAt!: Date;
  @UpdateDateColumn()
  updatedAt!: Date;
}