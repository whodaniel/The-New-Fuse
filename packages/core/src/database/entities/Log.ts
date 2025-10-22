import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

export enum LogLevel {
  ERROR = 'error',
  WARN = 'warn',
  INFO = 'info',
  DEBUG = 'debug',
  VERBOSE = 'verbose',
}

@Entity('logs')
@Index(['level', 'timestamp', 'context'])
export class Log {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({
    type: 'varchar',
    length: 20,
  })
  level!: LogLevel;

  @Column('text')
  message!: string;

  @CreateDateColumn({ type: 'timestamptz' })
  timestamp!: Date;

  @Column('text', { nullable: true })
  context?: string;

  @Column('jsonb', { nullable: true })
  metadata?: Record<string, any>;
}
