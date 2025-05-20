import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    Index
} from 'typeorm';
import { LogLevel } from '../../logging/types.js'; // Assuming LogLevel is defined here

@Entity('logs')
@Index(['level', 'timestamp', 'context']) // Add multi-column index
export class Log {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'varchar',
    length: 20,
    nullable: false,
    enum: LogLevel, // Use LogLevel enum for validation
    default: LogLevel.INFO, // Set a default value
  })
  level: LogLevel;

  @Column('text')
  message: string;

  @CreateDateColumn({ type: 'timestamp with time zone' }) // Ensure timezone is stored
  timestamp: Date;

  @Column({ nullable: true, length: 255 }) // Add length limit for context
  @Index() // Index for faster queries on context
  context?: string;

  @Column('text', { nullable: true })
  trace?: string;

  @Column('jsonb', { nullable: true }) // Use jsonb for better performance with JSON in PostgreSQL
  metadata?: Record<string, any>;

  // Optional: Add a constructor for easier instantiation
  constructor(partial: Partial<Log>) {
    Object.assign(this, partial);
  }
}
