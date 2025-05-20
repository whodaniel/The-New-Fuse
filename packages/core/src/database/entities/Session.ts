import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    ManyToOne,
    JoinColumn,
    BeforeInsert
} from 'typeorm';
import { User } from './User.js';
import { v4 as uuidv4 } from 'uuid';

@Entity('sessions')
export class Session {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ name: 'user_id' })
    userId: string;

    @Column({ length: 255, unique: true })
    token: string;

    @Column({ name: 'expires_at' })
    expiresAt: Date;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @ManyToOne(() => User, user => user.sessions)
    @JoinColumn({ name: 'user_id' })
    user: User;

    @BeforeInsert()
    generateToken() {
        this.token = uuidv4();
    }

    isExpired(): boolean {
        return new Date() > this.expiresAt;
    }

    toJSON() {
        return {
            id: this.id,
            userId: this.userId,
            token: this.token,
            expiresAt: this.expiresAt,
            createdAt: this.createdAt
        };
    }
}
