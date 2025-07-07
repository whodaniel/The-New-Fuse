import { Entity, PrimaryGeneratedColumn, Column, OneToMany, CreateDateColumn, UpdateDateColumn } from 'typeorm';
@Entity('users'
export class User { @PrimaryGeneratedColumn('uuid'
  @Column({ unique: true, type: 'varchar'
  @Column({ unique: true, type: 'varchar'
  @Column({ nullable: true, type: 'varchar', length: 255, name: 'hashed_password'
  @Column('simple-array'
  @CreateDateColumn({ type: 'timestamp'
  @UpdateDateColumn({ type: 'timestamp'