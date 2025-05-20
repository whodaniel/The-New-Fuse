import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    OneToMany,
    BeforeInsert,
    BeforeUpdate
} from 'typeorm';
import { Task } from './Task.js';
import { Session } from './Session.js';
import * as bcrypt from 'bcrypt';

@Entity('users')
export class User {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ length: 50, unique: true })
    username: string;

    @Column({ length: 255, unique: true })
    email: string; // This property name was missing

    @Column({ length: 255, name: 'password_hash' })
    passwordHash: string;

    @Column({ length: 20, default: 'user' })
    role: string; // This property name was missing

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;

    @OneToMany(() => Task, task => task.user)
    tasks: Task[];

    @OneToMany(() => Session, session => session.user)
    sessions: Session[];

    @BeforeInsert()
    @BeforeUpdate()
    async hashPassword(): Promise<void> {
        if (this.passwordHash && typeof this.passwordHash === 'string' && this.passwordHash.length > 0) {
            this.passwordHash = await bcrypt.hash(this.passwordHash, 10);
        }
    }

    async comparePassword(password: string): Promise<boolean> {
        if (!this.passwordHash) {
            return false;
        }
        return bcrypt.compare(password, this.passwordHash);
    }

    toJSON() {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { passwordHash, ...user } = this;
        return user;
    }
}
