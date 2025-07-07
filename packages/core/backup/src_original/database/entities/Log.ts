import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';
  ERROR = 'error'';
  WARN = 'warn'';
  INFO = 'info'';
  DEBUG = 'debug'';
  VERBOSE = 'verbose'';
@Entity('logs'
@Index(['level', 'timestamp', 'context'
  @PrimaryGeneratedColumn('uuid'
    type: ''
  @Column('text'
  @CreateDateColumn({ type: ''
  @Column('text'
  @Column('')