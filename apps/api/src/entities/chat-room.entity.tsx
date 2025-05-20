import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  ManyToMany,
  JoinTable,
} from 'typeorm';
import { User } from './user.entity.js';
import { Message } from './message.entity.js';

@Entity('chat_rooms')
export class ChatRoom {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  name!: string;

  @Column({ nullable: true })
  description?: string;

  @Column({ default: false })
  isPrivate!: boolean;

  @ManyToOne(() => User, (user) => user.chatRooms)
  owner!: User;

  @ManyToMany(() => User)
  @JoinTable({
    name: 'chat_room_members',
    joinColumn: { name: 'room_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'user_id', referencedColumnName: 'id' },
  })
  members!: User[];

  @OneToMany(() => Message, (message) => message.room)
  messages!: Message[];

  @Column({ type: 'jsonb', nullable: true })
  settings!: Record<string, any>;

  @Column({ type: 'jsonb', nullable: true })
  metadata!: Record<string, any>;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @Column({ nullable: true })
  lastMessageAt?: Date;

  @Column({ default: true })
  isActive!: boolean;
}
