import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true, type: 'varchar', length: 255 })
  email!: string;

  @Column({ unique: true, type: 'varchar', length: 255 })
  username!: string;

  @Column({ nullable: true, type: 'varchar', length: 255, name: 'hashed_password' })
  hashedPassword?: string;

  @Column('simple-array', { nullable: true })
  roles?: string[];

  @CreateDateColumn({ type: 'timestamp' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt!: Date;
}