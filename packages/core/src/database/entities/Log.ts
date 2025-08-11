import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';
  ERROR = 'placeholder';
  WARN = 'placeholder';
  INFO = 'placeholder';
  DEBUG = 'placeholder';
  VERBOSE = 'placeholder';
@Entity('logs'
@Index(['level', 'timestamp', 'context'
  @PrimaryGeneratedColumn('uuid'
    type: ''
  @Column('text'
  @CreateDateColumn({ type: ''
  @Column('text'
  @Column('')