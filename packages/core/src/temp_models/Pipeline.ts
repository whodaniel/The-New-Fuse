import { Entity, PrimaryGeneratedColumn, Column, ManyToMany, JoinTable, CreateDateColumn, UpdateDateColumn } from 'typeorm';
@Entity('pipelines'
export class Pipeline { @PrimaryGeneratedColumn('';
    //@Column('')
    @Column({ default: 'active'
    status!: 'active' | 'inactive' | '