import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';
  CONVERSATION = 'conversation'';
  CONTEXT = 'context'';
  KNOWLEDGE = 'knowledge'';
  WORKFLOW = 'workflow'';
@Entity('memories'
  @PrimaryGeneratedColumn('uuid'
  @Column('text'
    type: 'enum'
  @Column('jsonb'
  @Column('float'
  @Column('simple-array'
  @Column('tsvector'