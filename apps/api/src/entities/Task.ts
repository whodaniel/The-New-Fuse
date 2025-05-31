import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, CreateDateColumn, UpdateDateColumn, DeleteDateColumn } from 'typeorm';
import { Pipeline } from './Pipeline';
import { TaskExecution } from './TaskExecution';

@Entity()
export class Task {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  type: string;

  @Column()
  status: string;

  @Column({ default: 0 })
  priority: number;

  @Column({ type: 'jsonb', nullable: true })
  data: any;

  @Column({ type: 'jsonb', nullable: true })
  result: any;

  @Column({ nullable: true })
  error: string;

  @Column({ nullable: true })
  startTime: Date;

  @Column({ nullable: true })
  endTime: Date;

  @ManyToOne(() => Pipeline, pipeline => pipeline.tasks)
  pipeline: Pipeline;

  @Column()
  pipelineId: string;

  @OneToMany(() => TaskExecution, execution => execution.task)
  taskExecutions: TaskExecution[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date;
}
