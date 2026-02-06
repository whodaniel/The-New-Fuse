import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Agent } from './agent.entity';
import { ChatRoom } from './chat-room.entity';
import { User } from './user.entity';

@Entity('messages')
export class Message {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('text')
  content!: string;

  @ManyToOne(() => User, (user) => user.messages)
  sender!: User;

  @ManyToOne(() => Agent, (agent) => agent.messages, { nullable: true })
  agent?: Agent;

  @ManyToOne(() => ChatRoom, (room) => room.messages)
  room!: ChatRoom;

  @ManyToOne(() => Message, (message) => message.replies, { nullable: true })
  parentMessage?: Message;

  @OneToMany(() => Message, (message) => message.parentMessage)
  replies!: Message[];

  @Column({ type: 'jsonb', nullable: true })
  metadata!: Record<string, any>;

  @Column('simple-array', { nullable: true })
  attachments?: string[];

  @CreateDateColumn()
  timestamp!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @Column({ default: false })
  isEdited!: boolean;

  @Column({ default: false })
  isDeleted!: boolean;

  @Column({ type: 'jsonb', nullable: true })
  reactions!: Record<string, string[]>;
}
