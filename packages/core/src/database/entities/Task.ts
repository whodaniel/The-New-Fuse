import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    JoinColumn
} from 'typeorm';
import { User } from './User.js';

@Entity('tasks')
export class Task {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ name: 'user_id' })
    userId!: string;

    @Column({ length: 255 })
    title!: string;

    @Column({ type: 'text', nullable: true })
    description!: string | null;

    @Column({ length: 20, default: 'pending' })
    status!: 'pending' | 'in_progress' | 'completed' | 'failed';

    @Column({ type: 'int', default: 1 })
    priority!: number;

    @CreateDateColumn({ name: 'created_at' })
    createdAt!: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt!: Date;

    @Column({ name: 'completed_at', type: 'timestamp', nullable: true })
    completedAt!: Date | null;

    @ManyToOne(() => User, (user: User) => user.tasks)
    @JoinColumn({ name: 'user_id' })
    user!: User;

    toJSON() {
        return {
            id: this.id,
            userId: this.userId,
            title: this.title,
            description: this.description,
            status: this.status,
            priority: this.priority,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt,
            completedAt: this.completedAt
        };
    }
}
