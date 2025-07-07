import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

export enum MemoryType {
  CONVERSATION = 'conversation',
  CONTEXT = 'context',
  KNOWLEDGE = 'knowledge',
  WORKFLOW = 'workflow'
}

@Entity('memories')
@Index(['type', 'createdAt'])
@Index(['importance'])
export class Memory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('text')
  content: string;

  @Column({
    type: 'enum',
    enum: MemoryType,
    default: MemoryType.CONVERSATION
  })
  type: MemoryType;

  @Column('jsonb', { nullable: true })
  metadata: Record<string, any>;

  @Column('float', { default: 0.5 })
  importance: number;

  @Column('simple-array', { nullable: true })
  tags: string[];

  @Column('tsvector', { nullable: true })
  searchVector: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}