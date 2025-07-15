import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Task } from './Task';

@Entity('task_comments')
export class TaskComment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Task, task => task.comments)
  @JoinColumn({ name: 'taskId' })
  task: Task;

  @Column()
  taskId: string;

  @Column({ type: 'text' })
  content: string;

  @Column({ type: 'uuid' })
  userId: string;

  @CreateDateColumn()
  createdAt: Date;

  @Column({ type: 'uuid', nullable: true })
  parentId: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;
}