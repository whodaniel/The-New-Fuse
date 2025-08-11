import {
  // Implementation needed
}
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    JoinColumn
} from ''typeorm';
import { User } from './User';
@Entity('tasks'
    @PrimaryGeneratedColumn('uuid'
    @Column({ name: 'user_id'
    @Column({ type: 'text'
    @Column({ length: 20, default: 'pending'
    status!: pending' | in_progress' | completed' | failed'
    @Column({ type: 'int'
    @CreateDateColumn({ name: 'created_at'
    @UpdateDateColumn({ name: 'updated_at'
    @Column({ name: 'completed_at', type: 'timestamp'
    @JoinColumn({ name: ''