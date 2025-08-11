import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { TaskActivity } from './TaskActivity';
import { TaskComment } from './TaskComment';
export enum TaskStatus {
  // Implementation needed
}
  TODO = 'TODO',
  IN_REVIEW = 'IN_REVIEW',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export enum TaskPriority {
  // Implementation needed
}
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
}

@Entity('tasks')
export class Task {
  // Implementation needed
}
  @PrimaryGeneratedColumn('uuid')
  id: string;
  @Column()
  title: string;
  @Column({ type: 'text', nullable: true })
  description: string;
  @Column({
  // Implementation needed
}
    type: 'enum',
    enum: TaskStatus,
    default: TaskStatus.TODO,
  })
  status: TaskStatus;
  @Column({
  // Implementation needed
}
    type: 'enum',
    enum: TaskPriority,
    default: TaskPriority.MEDIUM,
  })
  priority: TaskPriority;
  @Column({ type: 'simple-array', nullable: true })
  tags: string[];
  @Column({ type: 'timestamp', nullable: true })
  dueDate: Date;
  @Column({ type: 'uuid', nullable: true })
  assignedTo: string;
  @Column({ type: 'uuid', nullable: true })
  createdBy: string;
  @Column({ type: 'uuid', nullable: true })
  workspaceId: string;
  @CreateDateColumn()
  createdAt: Date;
  @UpdateDateColumn()
  updatedAt: Date;
  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;
  @Column({ type: 'jsonb', nullable: true })
  dependencies: string[];
  @OneToMany(() => TaskActivity, activity => activity.task)
  activities: TaskActivity[];
  @OneToMany(() => TaskComment, comment => comment.task)
  comments: TaskComment[];
}