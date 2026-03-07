import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

@Entity('metrics')
@Index(['name', 'type', 'timestamp'])
export class Metric {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @Column({ type: 'varchar', length: 50 })
  type!: string; // e.g., 'gauge', 'counter', 'histogram'

  @Column('float')
  value!: number;

  @CreateDateColumn({ type: 'timestamptz' })
  timestamp!: Date;

  @Column('jsonb', { nullable: true })
  tags?: Record<string, any>;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;
}
