import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { UserRole } from '../types/user.types.js';
import { Agent } from './agent.entity.js';
import { ChatRoom } from './chat-room.entity.js';
import { Message } from './message.entity.js';
import { Workflow } from './workflow.entity.js';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  username!: string;

  @Column({ unique: true })
  email!: string;

  @Column()
  password!: string;

  @Column({ nullable: true })
  firstName?: string;

  @Column({ nullable: true })
  lastName?: string;

  @Column('simple-array')
  roles!: UserRole[];

  @Column({ default: true })
  isActive!: boolean;

  @Column({ nullable: true })
  lastLoginAt?: Date;

  @OneToMany(() => Agent, (agent) => agent.owner)
  agents!: Agent[];

  @OneToMany(() => ChatRoom, (chatRoom) => chatRoom.owner)
  chatRooms!: ChatRoom[];

  @OneToMany(() => Message, (message) => message.sender)
  messages!: Message[];

  @OneToMany(() => Workflow, (workflow) => workflow.creator)
  workflows!: Workflow[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @Column({ type: 'jsonb', nullable: true })
  preferences!: Record<string, any>;

  @Column({ type: 'jsonb', nullable: true })
  metadata!: Record<string, any>;
}
