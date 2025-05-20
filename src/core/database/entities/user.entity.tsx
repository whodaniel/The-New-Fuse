import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column( { unique: true })
  email: string;

  @Column()
  password: string;

  @Column( { nullable: true })
  firstName?: string;

  @Column({ nullable: true })
  lastName?: string;

  @Column( { default: false })
  isVerified: boolean;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
