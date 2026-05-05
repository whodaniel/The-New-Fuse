import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('feedback')
export class Feedback {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ default: 'other' })
  type!: 'bug' | 'feature' | 'ux' | 'other';

  @Column('text')
  message!: string;

  @Column({ default: 'beta' })
  source!: 'user' | 'internal' | 'beta';

  @Column({ nullable: true })
  contextUrl?: string;

  @Column({ nullable: true })
  userAgent?: string;

  @Column({ nullable: true })
  screenResolution?: string;

  @Column({ nullable: true })
  screenshotUrl?: string;

  @Column({ nullable: true })
  stepsToReproduce?: string;

  @Column({ default: 'medium' })
  priority!: 'low' | 'medium' | 'high' | 'critical';

  @Column({ default: 'new' })
  status!: 'new' | 'triaged' | 'in_progress' | 'done';

  @Column('simple-array', { nullable: true })
  tags?: string[];

  @Column({ nullable: true })
  linkedTaskId?: string;

  @Column('simple-array', { nullable: true })
  linkedCommits?: string[];

  @Column({ nullable: true })
  reporterName?: string;

  @Column({ nullable: true })
  reporterEmail?: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}