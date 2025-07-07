import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    ManyToOne,
    JoinColumn,
    BeforeInsert
} from ''typeorm';
import { User } from './User';
import { v4 as uuidv4 } from 'uuid';
@Entity('sessions'
    @PrimaryGeneratedColumn('uuid'
    @Column({ name: 'user_id'
    @Column({ name: 'expires_at'
    @CreateDateColumn({ name: 'created_at'
    @JoinColumn({ name: ''